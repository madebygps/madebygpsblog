---
title: "L2C Dev Log: Making Verification Alerts Actionable"
description: "How we audited Learn to Cloud's Azure alerts, improved health checks and smoke testing, and made verification telemetry easier to trust."
pubDate: 2026-08-23
tags: ["learntocloud", "azure"]
---

I want to start sharing more of the day-to-day work that goes into building and maintaining Learn to Cloud. These posts will be less like tutorials and more like development logs: what broke, what we learned, and what changed.

Today started with an email alert from Azure Monitor.

The problem was that I could not tell exactly what the error was. All I knew was that it was related to the verification system. That alone told me the alert needed work. An alert should help you understand what requires attention, not send you searching for the reason it exists.

Using the Azure MCP, we found that the same alert had fired three times in the previous 24 hours. Each firing was related to Azure Functions host or lifecycle events. They produced errors, but none were caused by our application code.

So we asked a simple question: should those events have caused a Sev1 alert?

No.

## Auditing every alert

We used the opportunity to audit all of our alerts. We started with nine. Some were useful, some were redundant, and some needed to be changed.

Our first pass brought the total down to six.

One of the alerts fired only when the verification system was missing an environment variable or another required configuration value. Let's be honest: that should be caught by our CI and deployment process, not discovered later through a production alert.

We added stricter startup validation for required environment variables, including the verification Functions base URL and token scope.

The token scope tells Entra, "Issue a token to the API that is intended for the Function app." The API's managed identity and assigned permissions determine whether it is authorized to receive and use that token.

This startup validation replaced the configuration alert.

## Giving each health check one job

In Terraform, we changed the Container App's startup and readiness probes from `/health` to `/ready`.

These endpoints answer different questions:

- `/health` tells us the API process is alive and returning a successful response.
- `/ready` checks that PostgreSQL is reachable and that the database is at the migration version expected by the application.

The startup and readiness probes now call `/ready`. The liveness probe and Azure Monitor availability test still call `/health`.

We also created `/internal/smoke/verification`, a smoke test endpoint that runs only the verification submission-preparation code hosted in the Container App. It:

- loads the curriculum;
- selects a requirement;
- reads the relevant database state;
- checks phase requirements; and
- runs the submission-value parsing code.

It stops before creating a verification attempt or invoking Durable Functions, so it does not run a full verification.

Our `deploy.yml` workflow now calls `/ready` and the smoke endpoint. It does not call `/health`. The Container Apps liveness probe and Azure Monitor availability test remain responsible for `/health`.

## Untangling verification alerts

We then looked more closely at the three alerts focused on the verification system:

1. Functions HTTP 5xx errors.
2. Verification system errors.
3. Other Azure Functions exceptions that did not fall into either of the first two alerts.

As I tried to make sense of them, I realized I could not. There was too much redundancy and overlap without a clear reason for it.

We dug into the code and found that our telemetry did not correlate outcomes well. A verification attempt's authoritative result is stored in PostgreSQL's `verification_attempts` table, while structured diagnostic telemetry is sent by the Python logger to Application Insights. Connecting the two was harder than it should have been.

In a series of stacked PRs, we made sure `attempt_id` is included in the structured diagnostic telemetry. We can now correlate that telemetry with the authoritative outcome stored in PostgreSQL.

We also gave the alerts clearer, outcome-based names and reduced the verification alerts from three to two.

The separate Functions HTTP alert was no longer needed. A system problem that prevents us from returning a normal success or failure result to the learner should either:

- save a `server_error` outcome; or
- leave the attempt unfinished long enough to trigger the stuck-attempt alert.

Normal learner validation failures are expected outcomes. They should not trigger either system alert.

## Rolling out the replacements safely

We first deployed the two new alerts without notifications. This let us observe their behavior while the old alerts remained active.

After confirming that they worked correctly, we merged the cleanup PR. It removed the three old verification alerts and enabled notifications for the two replacements.

We now have five alerts in total:

1. Availability.
2. API 5xx errors.
3. Database schema drift.
4. Verification system errors.
5. Stuck verification attempts.

I am now confident in the verification system's telemetry and alerting. Tomorrow, I will do a follow-up deep dive into the API alerts and telemetry. I am tracking that work in [Learn to Cloud issue #767](https://github.com/learntocloud/learn-to-cloud-app/issues/767).
