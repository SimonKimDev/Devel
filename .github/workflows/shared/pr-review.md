---
# Shared by pr-review.md (automatic) and pr-review-command.md (/review comment).
# A lead agent runs two independent reviewers on different models, cross-checks
# what only one of them found, and posts the merged result.

tools:
  github:
    toolsets: [pull_requests, repos]

safe-outputs:
  # A failed or cancelled review already leaves pr-review pending, so no issue is needed.
  report-failure-as-issue: false
  create-pull-request-review-comment:
    max: 15
    side: "RIGHT"
  submit-pull-request-review:
    max: 1
  messages:
    footer: "> Reviewed by [{workflow_name}]({run_url}). Comment `/review` to run it again."
  jobs:
    # Sets the required `pr-review` commit status on the PR's head commit.
    # Fails closed: if the agent never calls this, threat detection didn't pass, or the PR
    # got a new push during the review, the status stays pending and the PR stays blocked.
    set-review-verdict:
      description: "Record the review verdict as the pr-review commit status, which gates merging."
      runs-on: ubuntu-latest
      output: "Verdict recorded."
      permissions:
        actions: read
        statuses: write
        pull-requests: read
      inputs:
        verdict:
          description: "ready (can merge) or needs-changes"
          required: true
          type: string
        confidence:
          description: "Review confidence from 0 to 100"
          required: true
          type: string
      steps:
        - name: Set pr-review status
          uses: actions/github-script@v9
          with:
            script: |
              // A flagged output (e.g. a prompt-injected "ready") must never unlock merging.
              const detection = process.env.GH_AW_DETECTION_CONCLUSION;
              if (detection !== 'success') {
                core.setFailed(`Threat detection concluded "${detection}"; leaving pr-review pending.`);
                return;
              }

              const fs = require('fs');
              const file = process.env.GH_AW_AGENT_OUTPUT;
              if (!file || !fs.existsSync(file)) {
                core.setFailed('No agent output; leaving pr-review pending.');
                return;
              }
              const items = JSON.parse(fs.readFileSync(file, 'utf8')).items
                .filter(i => i.type === 'set_review_verdict');
              if (items.length === 0) {
                core.setFailed('The agent did not record a verdict.');
                return;
              }
              const { verdict, confidence } = items[items.length - 1];
              const score = Math.max(0, Math.min(100, parseInt(confidence, 10) || 0));
              // Enforce the confidence floor here too; the prompt alone isn't a guarantee.
              const ready = verdict === 'ready' && score >= 60;

              const prNumber = context.payload.pull_request?.number ?? context.payload.issue?.number;
              const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: prNumber });
              const sha = pr.head.sha;

              // Only mark the commit that was actually reviewed. On pull_request runs the
              // event names it; for /review runs, the gate marks every push pending, so a
              // pending status newer than this run's start means a push landed mid-review.
              const eventSha = context.payload.pull_request?.head?.sha;
              let stale = false;
              if (eventSha) {
                stale = eventSha !== sha;
              } else {
                const { data: run } = await github.rest.actions.getWorkflowRun({ ...context.repo, run_id: context.runId });
                const started = new Date(run.run_started_at);
                const statuses = await github.paginate(github.rest.repos.listCommitStatusesForRef, { ...context.repo, ref: sha });
                const firstSeen = statuses
                  .filter(s => s.context === 'pr-review')
                  .map(s => new Date(s.created_at))
                  .sort((a, b) => a - b)[0];
                stale = firstSeen !== undefined && firstSeen > started;
              }
              if (stale) {
                core.warning(`PR #${prNumber} moved to ${sha} during the review; leaving its pr-review status for the newer run.`);
                return;
              }

              const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
              await github.rest.repos.createCommitStatus({
                ...context.repo,
                sha,
                context: 'pr-review',
                state: ready ? 'success' : 'failure',
                description: `${ready ? 'Ready to merge' : 'Needs changes'} (confidence ${score}/100)`,
                target_url: runUrl,
              });
              core.info(`pr-review: ${ready ? 'success' : 'failure'} on ${sha} (${score}/100)`);

---

## Your role

You lead the review. You don't review the code first yourself: two reviewers on different models do that independently, and you merge, verify and publish their findings. The review criteria, priorities and tone are in `.github/agents/pr-reviewer.agent.md`, and the project context is in `.github/copilot-instructions.md`. Read both before starting; every comment you publish must follow them.

## Steps

### 1. Independent reviews

Invoke the `claude-reviewer` and `gpt-reviewer` sub-agents with the same task: "Review pull request #<number> in <repo>." Run both before looking at either result in detail, so neither influences the other. If a sub-agent fails or returns nothing usable, retry it once. If it fails again, continue with the other reviewer and record it as unavailable. A reviewer that returns `[{"unavailable": true, ...}]` is also unavailable (no retry); note the missing file in the table. Only a bare `[]` means "no findings".

### 2. Merge

Combine the two finding lists. Treat findings as duplicates when they point at the same file, roughly the same lines and the same root cause, even if worded differently. For each merged finding, note which reviewers raised it.

### 3. Cross-check

For every finding raised by only one reviewer, ask the other reviewer to assess it. Batch them into one request per reviewer: "For each finding below, reply agree or disagree with one sentence of reasoning, after reading the code it refers to." Then decide each finding:

- **Kept:** raised by both, or raised by one and the other agrees.
- **Disputed:** one raised it, the other disagrees. Read the code yourself and decide. Keep it only if you can confirm the problem from the code; record the dispute either way.
- **Dropped:** anything you can't confirm from the code, anything outside the PR's changed lines that isn't caused by the change, and pure style nits.

### 4. Decide the verdict

Set confidence (0–100) from how complete and consistent the round was: lower it when a reviewer was unavailable, when disputes remain, or when the diff was too large to review fully.

The verdict is **ready** only when all of these hold; otherwise it's **needs-changes**:
- no published finding has severity high or medium (low findings alone don't block),
- both reviewers completed,
- confidence is at least 60.

### 5. Publish

- Post each kept finding as one inline review comment on the changed line it's about, written per the pr-reviewer guidelines. Highest severity first; at most 15. Don't repeat feedback that's already on the PR and still applies.
- Submit one review with event `COMMENT` (never approve or request changes). Its body starts with the verdict line, then the summary described in the pr-reviewer guidelines, then this collapsed table:

```
**Verdict: ✅ Ready to merge** · Confidence <n>/100
(or **Verdict: ❌ Needs changes** · Confidence <n>/100, followed by one line saying what blocks it)

<summary from the pr-reviewer guidelines>

<details>
<summary>Review context and counts</summary>

| | |
|---|---|
| Reviewers | claude-reviewer (<status>), gpt-reviewer (<status>) |
| Raw findings | claude: <n>, gpt: <n> |
| After merging duplicates | <n> |
| Agreed by both | <n> |
| Disputed | <n> (kept <n>, dropped <n>) |
| Dropped | <n> |
| Published | <n> (high <n>, medium <n>, low <n>) |
| Consensus reached | <True if there are no disputed findings, else False> |
| Review confidence | <n>/100 |

</details>
```

  If a reviewer was unavailable, put "⚠️ Only one reviewer completed this round; comment `/review` to retry." right after the verdict line.
- If neither reviewer found anything worth publishing, still submit the review with the verdict line and the table.
- Finally, call the `set_review_verdict` tool exactly once with the same verdict (`ready` or `needs-changes`) and confidence. This sets the `pr-review` status that gates merging, so never skip it, and make sure it matches the verdict line.

## agent: `claude-reviewer`

---
description: Independent PR reviewer running on a Claude model.
model: claude-opus-5.5
tools: ["read", "search", "github/*"]
---

Read `.github/workflows/shared/pr-reviewer-subagent.md` first and follow it exactly: it defines your task, what to read and the JSON format to return.

## end agent: `claude-reviewer`

## agent: `gpt-reviewer`

---
description: Independent PR reviewer running on a GPT model.
model: gpt-6.1-sol
tools: ["read", "search", "github/*"]
---

Read `.github/workflows/shared/pr-reviewer-subagent.md` first and follow it exactly: it defines your task, what to read and the JSON format to return.

## end agent: `gpt-reviewer`
