---
# Shared by pr-review.md (automatic) and pr-review-command.md (/review comment).
imports:
  - .github/agents/pr-reviewer.agent.md

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

## Steps

1. Use the GitHub tools to read the PR, its description, the changed files and the diff. Read existing review comments too, and don't repeat feedback that's already there and still applies.
2. Read the surrounding code in the checked-out repository where you need context.
3. Post each finding as an inline review comment on the changed line it's about.
4. Finish by submitting one review with the summary. Use `COMMENT` as the event; never approve or request changes, because the author decides.

If the PR is a draft, submit nothing.
