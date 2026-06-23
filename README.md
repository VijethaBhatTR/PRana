# PR Velocity Intelligence POC

Browser-only proof of concept for an AI-powered PR velocity dashboard.

## What it shows

- Pull request delay-risk scoring from PR age, size, review activity, CI status, and reviewer load.
- Bottleneck labels for reviewer overload, failed or flaky CI, oversized PRs, stale reviews, and review churn.
- Simulated GitHub and Azure DevOps event ingestion.
- Recommended corrective actions such as reviewer nudges, backup reviewer routing, CI reruns, author passes, and PR splitting.
- GitHub source loading for public org/user/repo URLs, with a transparent DummyGitRepos fallback when the public API is blocked.

## Run it

Open `index.html` in a browser. No install step is required.

## POC scope

This version uses mock data in `app.js`. A production version would replace the sample state with GitHub or Azure DevOps API/webhook ingestion and persist recommendations, audit events, and team policies.
