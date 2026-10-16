---
description: Reviews each new pull request with the pr-reviewer agent and posts inline review comments.

on:
  pull_request:
    types: [opened, reopened, ready_for_review]

# Drafts and Dependabot PRs never start a run. Dependabot runs get no secrets, so they
# would fail; /review still works on a draft when you want feedback early.
if: github.event.pull_request.draft == false && github.event.pull_request.user.login != 'dependabot[bot]'

permissions:
  contents: read
  pull-requests: read

engine: copilot

imports:
  - shared/pr-review.md

timeout-minutes: 20
---

# PR review

Review pull request #${{ github.event.pull_request.number }} in ${{ github.repository }}, following the pr-reviewer instructions and the steps below.
