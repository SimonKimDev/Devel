---
description: Reviews each pull request on open and on every push with two reviewers on different models and posts inline review comments.

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

# Drafts and Dependabot's own pushes never start a run (Dependabot runs get no secrets,
# so they'd fail). Your own pushes to a Dependabot PR are reviewed. /review still works
# on a draft when you want feedback early.
if: github.event.pull_request.draft == false && github.actor != 'dependabot[bot]'

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
