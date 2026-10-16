---
description: Re-reviews a pull request with the pr-reviewer agent when someone comments /review on it.

on:
  slash_command:
    name: review
    events: [pull_request_comment]

permissions:
  contents: read
  pull-requests: read

engine: copilot

imports:
  - shared/pr-review.md

timeout-minutes: 20
---

# Review pull request #${{ github.event.issue.number }}

Review pull request #${{ github.event.issue.number }} in ${{ github.repository }} again, following the pr-reviewer instructions and the steps below. It has probably changed since the last review: focus on what's new, and don't repeat earlier comments that were already addressed.
