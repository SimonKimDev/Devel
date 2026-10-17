---
# Imported by pr-review.md (runs when someone comments /review).
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
    # Fails closed: if the agent never calls this (the job is then skipped), threat detection
    # didn't pass, or the PR moved past the reviewed commit, the status stays pending.
    set-review-verdict:
      description: "Record the review verdict as the pr-review commit status, which gates merging."
      runs-on: ubuntu-latest
      output: "Verdict recorded."
      permissions:
        statuses: write
        pull-requests: read
      inputs:
        verdict:
          description: "ready (can merge) or needs-changes"
          required: true
          type: string
        readiness:
          description: "Merge readiness from 0 to 100 (how clean the code is)"
          required: true
          type: string
        reliability:
          description: "Review reliability from 0 to 100 (how much to trust this review)"
          required: true
          type: string
        reviewed_sha:
          description: "Full SHA of the PR head commit the reviewers reviewed"
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
              // The job only runs when the agent called the tool, so items is non-empty here.
              const { verdict, readiness, reliability, reviewed_sha: reviewedSha } = items[items.length - 1] ?? {};
              const clamp = v => Math.max(0, Math.min(100, parseInt(v, 10) || 0));
              const readinessScore = clamp(readiness);
              const reliabilityScore = clamp(reliability);
              // Enforce the reliability floor here too; the prompt alone isn't a guarantee.
              const ready = verdict === 'ready' && reliabilityScore >= 60;

              const prNumber = context.payload.pull_request?.number ?? context.payload.issue?.number;
              const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: prNumber });
              const sha = pr.head.sha;

              // Only mark the commit that was actually reviewed: the head must still be the
              // commit the agent reviewed and, on pull_request runs, the commit the event named.
              // SHA comparison doesn't depend on timing, gate ordering or re-runs.
              const eventSha = context.payload.pull_request?.head?.sha;
              const stale = reviewedSha !== sha || (eventSha !== undefined && eventSha !== sha);
              if (stale) {
                core.warning(`PR #${prNumber} head is ${sha}, but the review covered ${reviewedSha || 'an unknown commit'}; leaving pr-review pending for the newer run.`);
                return;
              }

              const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
              await github.rest.repos.createCommitStatus({
                ...context.repo,
                sha,
                context: 'pr-review',
                state: ready ? 'success' : 'failure',
                description: `${ready ? 'Ready to merge' : 'Needs changes'} · readiness ${readinessScore}/100 · reliability ${reliabilityScore}/100`,
                target_url: runUrl,
              });
              core.info(`pr-review: ${ready ? 'success' : 'failure'} on ${sha} (readiness ${readinessScore}, reliability ${reliabilityScore})`);

---

## Your role

You lead the review. You don't review the code first yourself: two reviewers on different models do that independently, and you merge, verify and publish their findings. The review criteria, priorities and tone are in `.github/agents/pr-reviewer.agent.md`, and the project context is in `.github/copilot-instructions.md`. Read both before starting; every comment you publish must follow them.

## Steps

### 1. Independent reviews

First read the PR and note its full head SHA; that's the `reviewed_sha` you'll report. Invoke the `claude-reviewer` and `gpt-reviewer` sub-agents with the same task: "Review pull request #<number> in <repo> at head commit <sha>." Run both before looking at either result in detail, so neither influences the other. If a sub-agent fails or returns nothing usable, retry it once. If it fails again, continue with the other reviewer and record it as unavailable. A reviewer that returns `[{"unavailable": true, ...}]` is also unavailable (no retry); note the missing file in the table. Only a bare `[]` means "no findings".

### 2. Merge

Combine the two finding lists. Treat findings as duplicates when they point at the same file, roughly the same lines and the same root cause, even if worded differently. For each merged finding, note which reviewers raised it.

### 3. Cross-check

For every finding raised by only one reviewer, ask the other reviewer to assess it. Batch them into one request per reviewer: "For each finding below, reply agree or disagree with one sentence of reasoning, after reading the code it refers to." Then decide each finding:

- **Kept:** raised by both, or raised by one and the other agrees.
- **Disputed:** one raised it, the other disagrees. Read the code yourself and decide. Keep it only if you can confirm the problem from the code; record the dispute either way.
- **Dropped:** anything you can't confirm from the code, anything outside the PR's changed lines that isn't caused by the change, pure style nits, and anything the pr-reviewer guidelines exclude (wording-only findings, threats that need a hostile collaborator or fork, hypotheticals, and contradictions of earlier comments on unchanged code). Check each kept finding's severity against the guidelines' definitions, and lower it if the impact doesn't match.

### 4. Decide the verdict

Compute two scores with these rubrics, not by judgment.

**Readiness** (0–100) measures how clean the code is, from the published findings: start at 100, subtract 40 per high, 15 per medium and 3 per low finding, floor at 0. Show it as, for example, `79/100 (100 − 15×1 medium − 3×2 low)`.

**Reliability** (0–100) measures how much to trust this round of review, not how good the code is:

1. Start at 100.
2. Subtract 10 for each disputed finding (one reviewer raised it, the other disagreed), whether you kept or dropped it.
3. Subtract 5 for each kept finding that both reviewers raised with different severities.
4. Subtract 20 if any changed file couldn't be reviewed in full (for example, the diff was truncated or too large).
5. Floor at 0. Finally, if a reviewer was unavailable, cap at 40.

Show the arithmetic in the table, for example `85/100 (100 − 10 disputed − 5 severity mismatch)`.

The verdict is **ready** only when all of these hold; otherwise it's **needs-changes**:
- no published finding has severity high or medium (low findings alone don't block),
- both reviewers completed,
- reliability is at least 60.

### 5. Publish

- Post each kept finding as one inline review comment on the changed line it's about, written per the pr-reviewer guidelines. Highest severity first; at most 15. Don't repeat feedback that's already on the PR and still applies.
- Submit one review with event `COMMENT` (never approve or request changes). Its body starts with the verdict line, then the summary described in the pr-reviewer guidelines, then this collapsed table:

```
**Verdict: ✅ Ready to merge** · Readiness <n>/100 · Reliability <n>/100
(or **Verdict: ❌ Needs changes** · Readiness <n>/100 · Reliability <n>/100, followed by one line saying what blocks it)

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
| Merge readiness | <n>/100 (<the readiness arithmetic>) |
| Review reliability | <n>/100 (<the reliability arithmetic>) |

</details>
```

  If a reviewer was unavailable, put "⚠️ Only one reviewer completed this round; comment `/review` to retry." right after the verdict line.
- If neither reviewer found anything worth publishing, still submit the review with the verdict line and the table.
- Finally, call the `set_review_verdict` tool exactly once with the same verdict (`ready` or `needs-changes`), the readiness and reliability scores, and `reviewed_sha`: the full head SHA of the PR as you read it at the start of the review. This sets the `pr-review` status that gates merging, so never skip it, and make sure it matches the verdict line.

## agent: `claude-reviewer`

---
description: Independent PR reviewer running on a Claude model.
model: claude-opus-5.5
tools: ["view", "grep", "glob", "github-pull_request_read", "github-get_file_contents", "github-get_commit", "github-list_commits", "github-search_code"]
---

Read `.github/workflows/shared/pr-reviewer-subagent.md` first and follow it exactly: it defines your task, what to read and the JSON format to return.

## end agent: `claude-reviewer`

## agent: `gpt-reviewer`

---
description: Independent PR reviewer running on a GPT model.
model: gpt-6.1-sol
tools: ["view", "grep", "glob", "github-pull_request_read", "github-get_file_contents", "github-get_commit", "github-list_commits", "github-search_code"]
---

Read `.github/workflows/shared/pr-reviewer-subagent.md` first and follow it exactly: it defines your task, what to read and the JSON format to return.

## end agent: `gpt-reviewer`
