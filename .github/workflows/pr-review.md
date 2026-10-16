---
description: Reviews each new pull request with the pr-reviewer agent and posts inline review comments.

on:
  pull_request:
    types: [opened, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: read

engine: copilot

imports:
  - shared/pr-review.md

timeout-minutes: 20
---

# Review pull request #${{ github.event.pull_request.number }}

Review pull request #${{ github.event.pull_request.number }} in ${{ github.repository }}, following the pr-reviewer instructions and the steps below.
