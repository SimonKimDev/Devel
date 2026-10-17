---
description: Reviews a pull request with two reviewers on different models when someone with write access comments /review on it.

# On demand only: an automatic review on every push burned through the Copilot rate limit.
on:
  slash_command:
    name: review
    events: [pull_request_comment]

permissions:
  contents: read
  pull-requests: read

engine:
  id: copilot
  # SDK mode gives each model its own wire API, so a Responses-only GPT sub-agent
  # can run under the Claude lead (CLI mode forces one API for the whole session).
  copilot-sdk: true
  # The lead merges and verifies; the reviewers' models are set in shared/pr-review.md.
  model: claude-sonnet-5.5

imports:
  - shared/pr-review.md

timeout-minutes: 40
---

# PR review

Review pull request #${{ github.event.issue.number }} in ${{ github.repository }}, following the steps below. If earlier reviews exist on this PR, focus on what changed since the last one, and don't repeat comments that were already addressed.