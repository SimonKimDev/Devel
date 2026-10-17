Every pull request on this repo now gets reviewed by two AI models before I merge it. Getting there taught me more about GitHub Actions than any tutorial.

## The setup

A GitHub Agentic Workflow runs on each PR. A lead agent hands the change to two reviewers on different models, has each one check what only the other found, and posts the findings that survive as inline comments.

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
```

## What went wrong first

- The GPT reviewer kept failing with a 400. The fix was running the engine in *SDK mode*, so each model talks to its own API.
- A tool allow-list I added for safety used the wrong tool names, so both reviewers could suddenly read nothing.
- The confidence score looked like a code-quality score. It's now split into **readiness** (how clean the code is) and **reliability** (how much to trust the review).

## The lesson

An automated reviewer is only useful if it reports real problems. Arguing about wording is noise, so the next round of tuning is about impact, not pedantry.