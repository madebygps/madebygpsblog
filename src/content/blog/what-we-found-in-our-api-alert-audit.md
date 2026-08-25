---
title: "Azure Monitor Alert Audit: Improving API Alerts and Telemetry"
description: "A closer look at Learn to Cloud's API alerts, the telemetry gaps we found, and the changes that made the remaining alerts more trustworthy."
pubDate: 2026-08-24
tags: ["learntocloud", "azure"]
---

Learn to Cloud's API is the main application boundary. It serves the app's requests, reads and writes its data, and coordinates the work behind the learner experience.

The verification system is one part of that API. When a learner submits work for verification, the API prepares the submission and starts the verification flow. That flow can call Azure Functions and records the outcome of the verification attempt.

The verification alerts are covered in [Azure Monitor Alert Audit: Improving Verification Alerts](https://www.madebygps.com/blog/l2c-dev-log-making-verification-alerts-actionable/). This post focuses on everything outside that boundary: API availability, API errors, telemetry, and database schema drift.

Yesterday, we reviewed all of our Azure Monitor alerts and brought the total down to five. Two cover the verification system. The other three cover the rest of the API.

I wrote about the verification work in [Making Verification Alerts Actionable](https://www.madebygps.com/blog/l2c-dev-log-making-verification-alerts-actionable/).

Today, we focused on the three API alerts: availability, API 5xx errors, and database schema drift.

## Using a canvas to audit the alerts

We created another canvas for the work. I really love canvases for gathering context and building a deep understanding before changing anything.

We went through several rounds of auditing each alert. The canvas let me see:

- what the alert queries;
- which code in the API emits the data it depends on;
- what the alert actually covers; and
- whether we should keep, modify, or remove it.

This is my favorite way to work through something like alerting. Skills and MCP servers can keep bringing real information into the canvas, while the canvas gives us one place to understand what it means and move toward an informed solution.

## What the audit found

The audit uncovered a few important things.

Our availability test only used two locations. Our schema drift alert had two blind spots. Our HTTP 5xx alert excluded routes, which felt like a code smell. Our telemetry setup could fail while the app kept running without telling us, which meant we could lose telemetry silently.

We also could not tell which Container App revision produced an application error. Finally, our telemetry tests only checked that telemetry was emitted. They did not check that the emitted data matched the queries our alerts rely on.

That last point matters a lot. An alert can look correct in Terraform while quietly becoming useless if the telemetry shape changes underneath it.

## What the work cost and what we learned

The original alert work cost **3,672.74 AI credits, or $36.73**, across 701 model calls and 97.7 million processed tokens.

| Work | Cost |
| --- | --- |
| Audit and planning | $28.12 |
| PR #770 | $5.04 |
| PR #771 | $0.85 |
| PR #772 | $0.39 |
| PR #773 correction | $2.33 |

The audit alone used **76.6%** of the total. The avoidable cost mostly came from four places:

1. We mistakenly created repository canvas PR #769 instead of a session-only canvas.
2. We repeatedly reread one large canvas and conversation.
3. We mixed evidence gathering, decisions, implementation planning, and deployment coordination in one long session.
4. An ambiguous telemetry contract led to the corrective PR #773.

If I did this again, I would use one read-only audit session with parallel evidence gathering. I would keep the facts in `facts.json`, decisions in a compact `decisions.md`, and each audit round in its own append-only file. The canvas would render only the active round and approved-decision summary.

I would also write one explicit implementation contract covering startup configuration, runtime exporter failures, tests, alert queries, and deployment gates. Each deployment boundary would get its own implementation session. Deployments would stay sequential only where production evidence needs to gate the next PR.

That approach likely would have cut the AI usage roughly in half or better. More sessions would have helped only at clear context boundaries. More simultaneous implementation sessions would not have helped, because PR #771 safely depended on validating PR #770 in production.

The current five-session total, including later retrospective activity, is approximately **$37.02**. That excludes ongoing Azure Monitor and Log Analytics charges, which need Azure Cost Management and ingestion-volume data.

GitHub's [AI credits and model pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing) says one AI credit is $0.01.

## Making API telemetry easier to trust

[PR #770](https://github.com/learntocloud/learn-to-cloud-app/pull/770) added the Container App revision to API telemetry through an OpenTelemetry Resource. Now, when an error happens, we can see the revision it came from.

We also moved the `global_exception_handler` to FastAPI's `@app.exception_handler` decorator. This is the catch-all handler for errors that are not handled anywhere else.

That gave us a clear `unhandled.exception` signal to alert on. We added a separate telemetry-pipeline alert for failures while setting up or exporting telemetry, too.

We added a runbook for responding to these alerts and tests for the alert contracts. The contract tests verify not only that telemetry exists, but that its fields match what the alert queries expect.

## Removing the broad 5xx alerts

[PR #771](https://github.com/learntocloud/learn-to-cloud-app/pull/771) removed the broad 5xx alerts we no longer needed.

The old alerts used route exclusions to avoid noise. That made the alert behavior harder to reason about and left us asking whether an error was really being covered. The new alert design is more intentional and easier to understand.

[PR #772](https://github.com/learntocloud/learn-to-cloud-app/pull/772) then cleaned up the runbook so it only refers to current alerts.

## Keeping the API running when telemetry fails

After reviewing the changes, I realized that [PR #770](https://github.com/learntocloud/learn-to-cloud-app/pull/770) had added `fail_on_azure_error=true`. That would stop the API from starting if telemetry could not be configured.

That is not what we want.

If telemetry has a problem, the API should keep working. We still need logs in the Azure Container Apps console, and the telemetry-pipeline alert should tell us that we need to investigate telemetry.

[PR #773](https://github.com/learntocloud/learn-to-cloud-app/pull/773) fixes this. It keeps the API available while making telemetry failures visible.

While working on that change, we found another problem. If the Azure Monitor connection string was missing, our logging configuration could fall back to plain text. That would make the telemetry-pipeline alert unreliable because it could not query the same fields everywhere.

PR #773 removes that conditional behavior. Logs are now always JSON, both locally and in Azure Container Apps.

This work left us with fewer alerts, but more importantly, alerts we can explain, test, and act on.
