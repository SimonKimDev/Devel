---
# Shared by pr-review.md (automatic) and pr-review-command.md (/review comment).
# A lead agent runs two independent reviewers on different models, cross-checks
# what only one of them found, and posts the merged result.

tools:
  github:
    toolsets: [pull_requests, repos]

safe-outputs:
  create-pull-request-review-comment:
    max: 15
    side: "RIGHT"
  submit-pull-request-review:
    max: 1
  messages:
    footer: "> Reviewed by [{workflow_name}]({run_url}). Comment `/review` to run it again."

---

## Your role

You lead the review. You don't review the code first yourself: two reviewers on different models do that independently, and you merge, verify and publish their findings. The review criteria, priorities and tone are in `.github/agents/pr-reviewer.agent.md`, and the project context is in `.github/copilot-instructions.md`. Read both before starting; every comment you publish must follow them.

## Steps

### 1. Independent reviews

Invoke the `claude-reviewer` and `gpt-reviewer` sub-agents with the same task: "Review pull request #<number> in <repo>." Run both before looking at either result in detail, so neither influences the other. If a sub-agent fails or returns nothing usable, retry it once. If it fails again, continue with the other reviewer and record it as unavailable.

### 2. Merge

Combine the two finding lists. Treat findings as duplicates when they point at the same file, roughly the same lines and the same root cause, even if worded differently. For each merged finding, note which reviewers raised it.

### 3. Cross-check

For every finding raised by only one reviewer, ask the other reviewer to assess it. Batch them into one request per reviewer: "For each finding below, reply agree or disagree with one sentence of reasoning, after reading the code it refers to." Then decide each finding:

- **Kept:** raised by both, or raised by one and the other agrees.
- **Disputed:** one raised it, the other disagrees. Read the code yourself and decide. Keep it only if you can confirm the problem from the code; record the dispute either way.
- **Dropped:** anything you can't confirm from the code, anything outside the PR's changed lines that isn't caused by the change, and pure style nits.

### 4. Publish

- Post each kept finding as one inline review comment on the changed line it's about, written per the pr-reviewer guidelines. Highest severity first; at most 15. Don't repeat feedback that's already on the PR and still applies.
- Submit one review with event `COMMENT` (never approve or request changes). Its body contains the summary described in the pr-reviewer guidelines, followed by this collapsed table:

```
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
| Published | <n> |
| Consensus reached | <True if there are no disputed findings, else False> |
| Review confidence | <0-100> |

</details>
```

  Base the confidence on how complete and consistent the round was: lower it when a reviewer was unavailable, when disputes remain, or when the diff was too large to review fully. If a reviewer was unavailable, start the summary with "⚠️ Only one reviewer completed this round; comment `/review` to retry."

If neither reviewer found anything worth publishing, submit a short review saying so, still with the table.

## agent: `claude-reviewer`

---
description: Independent PR reviewer running on a Claude model.
model: claude-opus-5.5
---

Read `.github/workflows/shared/pr-reviewer-subagent.md` first and follow it exactly: it defines your task, what to read and the JSON format to return.

## end agent: `claude-reviewer`

## agent: `gpt-reviewer`

---
description: Independent PR reviewer running on a GPT model.
model: gpt-6.1-sol
---

Read `.github/workflows/shared/pr-reviewer-subagent.md` first and follow it exactly: it defines your task, what to read and the JSON format to return.

## end agent: `gpt-reviewer`
