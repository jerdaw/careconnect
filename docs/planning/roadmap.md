---
status: stable
last_updated: 2026-08-12
owner: jer
tags: [planning, roadmap, governance, retirement]
---

# CareConnect: Product Roadmap

> **Current decision:** controlled public-service retirement approved in principle
>
> **Execution status:** evidence screen closed; retirement release prepared in a draft change; live preflight and approval pending
>
> **Public state:** the directory remains available until a separately approved live change
>
> **Active product work:** none

## Executive Status

| Area                  | Current state                                                                                                                                                                                                                                                                                                                | Authority or evidence                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Strategic disposition | Retire the actionable public directory unless the bounded screen credibly demonstrates meaningful recurring human use and an accountable steward accepts the service obligations                                                                                                                                             | [Retirement disposition](../implementation/careconnect-public-service-retirement-disposition-2026-08-12.md)      |
| Service inventory     | The governed snapshot contains 204 records; the dated 2026-08-12 freshness check identifies 8 visible records and 196 stale/hidden records                                                                                                                                                                                   | Reproducible local staleness check; no service record was changed                                                |
| Crisis stewardship    | Two visible crisis records are due under the 30-day crisis cadence. Any record change is a separate approval-gated action                                                                                                                                                                                                    | Existing freshness policy and dated staleness check                                                              |
| Use evidence          | CC-2B was closed without a query because the allowed aggregate contract could not establish people, referrals, outcomes, or public benefit; 116 screen minutes remain unused                                                                                                                                                 | [Retirement disposition](../implementation/careconnect-public-service-retirement-disposition-2026-08-12.md)      |
| Prepared transition   | A reversible retirement surface and rollback packet are present only in the draft change; no live service, data, workflow, keepalive, redirect, or deployment state has changed                                                                                                                                              | [Transition and rollback packet](../implementation/careconnect-retirement-transition-and-rollback-2026-08-12.md) |
| Shared operations     | The unchanged Actions workflow queries both CareConnect and VisitBrief Supabase Data APIs directly and is independent of the CareConnect frontend. The latest eight checked scheduled runs (2026-08-05 through 2026-08-12) succeeded. Keep the workflow, repository, Actions, required secrets, and Supabase projects intact | Public keepalive workflow contract plus private/shared operations source of truth                                |
| Recovery boundary     | Live release, backup, rollback, shared-host, and environment details remain outside this public repository                                                                                                                                                                                                                   | [ADR-022](../adr/022-public-documentation-boundary.md)                                                           |

## Ordered Work

### CC-1 — Documentation truth

Completed in the draft change. Canonical public status, navigation, roadmap,
and the decision record now distinguish the approved disposition, the closed
screen, the draft transition, and the still-live public service.

### CC-2 — Bounded evidence screen

Closed after CC-2A used 4 of 120 minutes. CC-2B was not pursued because the
available browser session was unauthenticated and the allowed aggregate
endpoint contract could not establish people, referrals, outcomes, or benefit.
Production SQL, raw logs, personal data, and credential extraction remained
out of scope. The unused 116 minutes do not carry into a broader search.

The screen may establish activity consistent with recurring human use, but
aggregate requests alone do not prove unique users, referrals, outcomes, or
benefit. If meaningful use is credibly corroborated, require a fixed-deadline
stewardship decision. Without both corroborated benefit and an accountable
steward, continue toward controlled retirement.

### CC-3 — Reversible artifact preservation

Completed for the current local packet: source/history, a dated public visual
baseline with hashes, and a reproducible retirement release remain preserved.
No real actionable listing is retained as a public demo solely for optionality.

### CC-4 — Approval-gated transition

The reversible surface and public-safe
[transition/rollback packet](../implementation/careconnect-retirement-transition-and-rollback-2026-08-12.md)
are prepared in a draft change. Execute public retirement only after the applicable
recovery and cross-project dependency preflights pass and the owner explicitly
approves the exact live action. Service-record changes, Supabase changes,
workflow or shared-keepalive changes, redirects, and deployment remain distinct
approval gates.

## Allowed Before a Live-Change Approval

1. Canonical public documentation updates.
2. Public `GET` checks and inspection of existing aggregate-only evidence.
3. Local, reversible artifact-preservation work that does not expose secrets or
   actionable stale listings.
4. Documentation, reference, lint, type, and targeted local validation.
5. Critical security or data-loss containment within separately approved scope.

## Blocked by Default

- Corpus restoration, optionality reverification, data expansion, and regional
  expansion.
- Product-led outreach, partner pitches, pilot execution, research conversion,
  and new evaluation instrumentation.
- Production SQL, credential extraction, raw-log or personal-data access, and
  live Supabase or schema changes.
- Changes to crisis records, GitHub workflows, VisitBrief keepalive coverage,
  shared infrastructure, redirects, or deployments.

## Reopening Gate

Service implementation or evaluation may reopen only when all of the following
are present:

1. An independently supported service need.
2. An accountable operational steward that owns record freshness.
3. Institutional ownership of governance, privacy, safety, and any required
   ethics or QI pathway.
4. A bounded evaluation or implementation decision with explicit success and
   stop criteria.
5. Evidence that the proposed service is preferable to 211, a simple process or
   spreadsheet, or doing nothing.

A problem-first needs assessment does not require the public directory to remain
online and does not by itself reopen implementation.

## Historical Authority

The July 2026 limited-public-directory disposition and the v19-v22 pilot,
launch, and external-validation plans are superseded as active authority. They
remain in the repository as historical evidence; their checklists and queues do
not authorize current execution.

- [Superseded limited-public-directory disposition](../implementation/v22-0-limited-public-directory-pilot-risk-disposition-2026-07-02.md)
- [Historical v22 decision plan](v22-0-non-duplicate-value-decision-plan.md)
- [Historical v21 external-validation plan](v21-external-validation-plan.md)
- [Historical planning archive](archive/README.md)

## Documentation-Platform Boundary

CareConnect remains on the current MkDocs 1.x/Material stack. Do not start a
documentation-platform migration during the retirement transition; any shared
migration wave requires separate cross-project approval.

## Historical Anchor Compatibility

The headings below preserve links from completed technical records. Their work
is historical and does not reopen an active roadmap lane.

<a id="v200-technical-excellence--testing-high-priority---before-production"></a>

### v20.0: Technical Excellence & Testing (High Priority - Before Production)

Superseded by the current retirement disposition. See the
[v20 autonomous backlog closeout](archive/2026-03-12-v20-0-autonomous-backlog-closeout.md)
for the completed historical record.

<a id="category-b-test-coverage-60h--largest-gap"></a>

### Category B: Test Coverage (60h) — Largest Gap

Superseded as an active estimate. Current validation is limited to checks
required for approved maintenance, preservation, and transition work.
