---
title: "L2C Dev Log: Making Verification Alerts Actionable"
description: "How Azure MCP and canvases helped us audit Learn to Cloud's alerts, improve deployment checks, and redesign verification telemetry."
pubDate: 2026-08-23
tags: ["learntocloud", "azure"]
---

I got an email alert from Azure Monitor. I could not tell exactly what the error was, so I knew we needed to improve the alert. All I could tell was that it was related to the verification system.

We used the Azure MCP to figure out that the same alert had fired three times in the previous 24 hours. Each firing was related to Azure Functions host or lifecycle events. They caused errors, but none were caused by our application code.

So we asked a simple question: should those events have caused a Sev1 alert?

No.

## Using canvases to understand the alerts

We used an Azure Exception Anatomy canvas to break down the alert and the three exceptions behind it. This helped us understand the difference between the alert's Sev1 priority and Application Insights' telemetry severity. It also showed that the exceptions came from Azure Functions host and lifecycle behavior rather than our verification code.

We then used an Alert Audit Workbench canvas to review every alert. This gave us one place to compare each alert's query, severity, purpose, recent production evidence, and our decision to keep, modify, replace, or remove it.

<figure>
  <img src="/images/l2c-dev-log/alert-audit-workbench.png" alt="Alert Audit Workbench canvas with the original alert groups and their keep or modify decisions" loading="lazy" />
  <figcaption>Alert Audit Workbench showing the decisions for the original alerts.</figcaption>
</figure>

The canvases were useful because they turned the raw Azure telemetry and Terraform configuration into something we could inspect and reason about. Azure MCP provided the live production evidence, while the canvases helped us organize and understand it.

## Auditing the original alerts

We used the opportunity to audit all of our alerts. We started with nine. Some were useful, some were redundant, and some needed to be changed.

Our first pass brought the total down to six.

One of the alerts fired only when the verification system was missing an environment variable or another required configuration value. Let's be honest: that should be caught by our CI and deployment process, not discovered later through a production alert.

First, we added stricter startup validation for required environment variables, including the verification Functions base URL and token scope.

```python
if not self.verification_functions.base_url:
    raise ValueError(
        "VERIFICATION_FUNCTIONS__BASE_URL must be set "
        "when ENVIRONMENT=production."
    )

if not self.verification_functions.token_scope:
    raise ValueError(
        "VERIFICATION_FUNCTIONS__TOKEN_SCOPE must be set "
        "when ENVIRONMENT=production."
    )
```

The base URL tells the API where the Function app is. The token scope tells Entra to issue the API a token intended for the Function app. The API's managed identity and assigned permissions determine whether it is authorized to receive and use that token.

This startup validation, rather than the smoke endpoint, replaced the configuration alert.

## Improving health and readiness checks

In Terraform, we changed the startup probe and readiness probe to `/ready`. Both were previously using `/health`, which only tells us that the API process is alive and returning 200.

```hcl
liveness_probe {
  transport = "HTTP"
  path      = "/health"
  port      = 8000
}

readiness_probe {
  transport = "HTTP"
  path      = "/ready"
  port      = 8000
}

startup_probe {
  transport = "HTTP"
  path      = "/ready"
  port      = 8000
}
```

`/ready` checks that PostgreSQL is reachable and that the database is at the migration version expected by the application. The liveness probe and Azure Monitor availability test still use `/health`.

`deploy.yml` calls `/ready`. It does not call `/health`. Container Apps runs the liveness, readiness, and startup probes automatically.

## Adding the verification smoke test

We also created the smoke test endpoint, `/internal/smoke/verification`. This runs only the verification submission-preparation code hosted in the Container App.

It loads the curriculum, selects a requirement, reads the relevant database state, checks phase requirements, and runs the submission-value parsing code. It stops before creating a verification attempt or invoking Durable Functions, so it does not run a full verification.

```python
ctx = await _check_submission_preconditions(
    session_maker,
    user_id=_SMOKE_USER_ID,
    requirement_slug=requirement.slug,
)

try:
    SubmittedValue.from_raw(ctx.requirement, "smoke-test")
except ValueError:
    pass
```

The smoke test is valuable because `/ready` can succeed when PostgreSQL is reachable and migrations are current, while real submission code could still fail because the application and database schema do not work together correctly.

`deploy.yml` calls `/ready` first and then calls the smoke endpoint using a short-lived Entra token obtained through GitHub OIDC.

## Redesigning verification telemetry and alerts

Then we dove further into the three alerts focused on the verification system:

1. Functions HTTP 5xx errors.
2. Verification system errors.
3. Other Azure Functions exceptions that did not fall into either of the first two alerts.

As I tried to make sense of them, I realized that I could not because there seemed to be redundancy and overlap for no reason.

We dug into the code and realized that our telemetry did not correlate outcomes well. The result of a verification attempt is stored in PostgreSQL's `verification_attempts` table, while the Python logger sends structured diagnostic telemetry to Application Insights.

In stacked PRs, we made sure `attempt_id` is included in the structured diagnostic telemetry so that it can be correlated with the authoritative outcome saved in PostgreSQL.

```python
attributes={
    "verification.attempt.id": str(attempt_id),
}
```

This means we can now take an error or diagnostic event from Application Insights and connect it to the exact verification attempt and outcome stored in PostgreSQL.

We also created clearer, outcome-based names for the alerts and reduced the verification system alerts from three to two.

<figure>
  <img src="/images/l2c-dev-log/verification-alert-design.png" alt="Verification alert design canvas comparing the overlapping current flow with the two-path ideal flow" loading="lazy" />
  <figcaption>The verification alert canvas helped us move from overlapping alerts to two clear, outcome-based paths.</figcaption>
</figure>

The separate Functions HTTP alert was no longer needed. A system problem that prevents us from returning a normal success or failure result to the learner should either:

- save a `server_error` outcome; or
- leave the attempt unfinished long enough to trigger the stuck-attempt alert.

Normal learner validation failures are expected outcomes and should not trigger either system alert.

We first deployed the two new alerts without notifications. This let us observe their behavior while the old alerts remained active.

After confirming that they worked correctly, we merged the cleanup PR. It removed the three old verification alerts and enabled notifications for the two replacements.

## Final alert design

We now have five alerts in total:

1. Availability.
2. API 5xx errors.
3. Database schema drift.
4. Verification system errors.
5. Stuck verification attempts.

I am now confident in the verification system's telemetry and alerting. Tomorrow, I will do a follow-up deep dive into the API alerts and telemetry. I am tracking that work in [Learn to Cloud issue #767](https://github.com/learntocloud/learn-to-cloud-app/issues/767).
