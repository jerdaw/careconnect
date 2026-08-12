---
status: stable
last_updated: 2026-08-12
owner: jer
tags: [planning, roadmap, governance, public-docs]
---

# Planning Documents

CareConnect is in a controlled public-service retirement transition. Retirement
is approved in principle; the bounded evidence screen and any separately
approved implementation remain pending. The public directory is still
available, so documentation status must not be mistaken for a completed live
change.

## Start Here

1. [Current Roadmap](roadmap.md) — active priorities, gates, and stop rules.
2. [Public-Service Retirement Disposition](../implementation/careconnect-public-service-retirement-disposition-2026-08-12.md)
   — owner decision, evidence boundary, and reopening requirements.

These two documents are the current planning authority. Detailed v19-v22 plans,
checklists, and implementation records remain useful historical evidence, but
they no longer authorize pilot execution, corpus reverification, partner
outreach, expansion, or feature work.

## Active Work

| Order | Work                                         | Boundary                                                                                                        | Completion condition                                                                |
| ----- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| CC-1  | Reconcile canonical public documentation     | Documentation only; no service, workflow, database, or deployment changes                                       | Canonical navigation and status surfaces agree                                      |
| CC-2  | Complete the bounded evidence screen         | Two hours total; existing aggregate-only evidence and public/read-only state; no new tracking or production SQL | A dated decision record identifies retire, steward, or a documented evidence gap    |
| CC-3  | Preserve a reproducible non-service artifact | Local and reversible until separately approved                                                                  | Code/history plus dated screenshots or video and technical evidence are recoverable |
| CC-4  | Execute the selected public transition       | Explicit approval required for every live, data, workflow, database, redirect, or deployment change             | Public state matches the approved disposition and rollback evidence is preserved    |

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
