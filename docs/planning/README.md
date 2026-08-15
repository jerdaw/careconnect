---
status: stable
last_updated: 2026-08-12
owner: jer
tags: [planning, roadmap, governance, public-docs]
---

# Planning Documents

CareConnect is in a controlled public-service retirement transition. Retirement
is approved in principle, the bounded evidence screen is closed, and a
reversible retirement release is prepared in a draft change. The public directory is
still available, so draft implementation status must not be mistaken for a
completed live change.

## Start Here

1. [Current Roadmap](roadmap.md) — active priorities, gates, and stop rules.
2. [Public-Service Retirement Disposition](../implementation/careconnect-public-service-retirement-disposition-2026-08-12.md)
   — owner decision, evidence boundary, and reopening requirements.
3. [Retirement Transition and Rollback Packet](../implementation/careconnect-retirement-transition-and-rollback-2026-08-12.md)
   — public-safe live preflight, acceptance, rollback, and evidence contract.

These two documents are the current planning authority. Detailed v19-v22 plans,
checklists, and implementation records remain useful historical evidence, but
they no longer authorize pilot execution, corpus reverification, partner
outreach, expansion, or feature work.

## Active Work

| Order | Work                                         | Boundary                                                                                                               | Completion condition                                                              |
| ----- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| CC-1  | Reconcile canonical public documentation     | Complete in draft PR; no live state changed                                                                            | Canonical navigation and status surfaces agree                                    |
| CC-2  | Close the bounded evidence screen            | Closed at 4 of 120 minutes; CC-2B not pursued; no new tracking, SQL, raw logs, or credentials                          | The disposition records why allowed evidence cannot satisfy the continuation gate |
| CC-3  | Preserve a reproducible non-service artifact | Complete in draft PR; source/history and dated visual baseline retained                                                | Code/history, hashes, screenshots, and local validation are recoverable           |
| CC-4  | Execute the selected public transition       | Reversible release prepared in a draft change; recovery/dependency preflight and explicit live approval still required | Public state matches the approved disposition and rollback evidence is preserved  |

## Stop Rules

1. Do not restore or reverify the corpus for optionality.
2. Do not start a pilot, partner pitch, housing workflow, research conversion,
   feature expansion, or new instrumentation.
3. Do not treat aggregate traffic as proof of unique people, referrals,
   outcomes, or public benefit.
4. Do not alter crisis records, Supabase, shared keepalive behavior, workflows,
   or the public deployment without the applicable explicit approval and
   recovery preflight.
5. Keep public rationale limited to project stewardship, safety, evidence, and
   operations; retain private operations details in their existing source of
   truth.

## Historical Plans

The following documents are retained for traceability and are not active
execution authority:

- [v22.0 Non-Duplicate Value Decision Plan](v22-0-non-duplicate-value-decision-plan.md)
- [v22.0 Approval Checklist](v22-0-approval-checklist.md)
- [Superseded v22 Limited Public Directory Pilot Risk Disposition](../implementation/v22-0-limited-public-directory-pilot-risk-disposition-2026-07-02.md)
- [v21.0 External Validation Plan](v21-external-validation-plan.md)
- [v19.0 Launch Preparation Plan](v19-0-launch-preparation.md)
- [Planning Archive](archive/README.md)

Historical note: archived documents may use earlier project names or describe
work that was valid in an earlier phase. Current guidance uses the CareConnect
name and the disposition linked above.
