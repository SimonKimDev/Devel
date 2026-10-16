---
description: Reviews each new pull request with two reviewers on different models and posts inline review comments.

on:
  pull_request:
    types: [opened, reopened, ready_for_review]

# Drafts and Dependabot PRs never start a run. Dependabot runs get no secrets, so they
# would fail; /review still works on a draft when you want feedback early.
if: github.event.pull_request.draft == false && github.event.pull_request.user.login != 'dependabot[bot]'

permissions:
  contents: read
  pull-requests: read

engine:
  id: copilot
  # The lead merges and verifies; the reviewers' models are set in shared/pr-review.md.
  model: claude-sonnet-5.5

imports:
  - shared/pr-review.md

timeout-minutes: 40
---

# PR review

Review pull request #${{ github.event.pull_request.number }} in ${{ github.repository }}, following the steps below.
