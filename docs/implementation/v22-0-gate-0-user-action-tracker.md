---
status: draft
last_updated: 2026-03-24
owner: jer
tags: [implementation, v22.0, gate-0, actions, governance]
---

# v22.0 Gate 0 User Action Tracker

This document tracks user-owned blockers for Gate 0 exit.

Update cadence:

1. Gate-event updates only.
2. Update this file when evidence is added, blocker status changes, or a blocker closes.

Related:

1. [v22.0 Gate 0 Exit Checklist (Decision Control)](v22-0-gate-0-exit-checklist.md)
2. [v22.0 Gate 0 Evidence Status (2026-03-09)](v22-0-gate-0-evidence-status-2026-03-09.md)
3. [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md)
4. [v22.0 Approval Checklist](../planning/v22-0-approval-checklist.md)
5. [v22.0 Gate 0 Evidence Intake Pack](v22-0-gate-0-evidence-intake-pack.md)

## User-Owned Blockers

| Action ID | Gate Check                               | Owner | Required Evidence                                                                                                   | Current Status (`pending` \| `in_progress` \| `complete`) | Due Date   | Last Update | Blocking If Missing (`yes` \| `no`) | Notes                                                                                                                                                      |
| --------- | ---------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------- | ----------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UA-1      | G0-3 (C1 legal clause review)            | jer   | Candidate partner legal/API terms attached + clause-level redline notes for C1-1..C1-4 + final legal recommendation | pending                                                   | 2026-03-21 | 2026-03-24  | yes                                 | Evidence workspace prepared at `docs/implementation/v22-0-evidence/c1-partner-terms/`; C1-3 still unresolved until partner terms are attached and reviewed |
| UA-2      | G0-4 (C2 retention mapping approval)     | jer   | Field-level retention windows, deletion procedure (trigger + executor), and privacy sign-off memo                   | pending                                                   | 2026-03-21 | 2026-03-24  | yes                                 | Draft policy + runbook now exist in-repo; privacy sign-off and dated verification evidence are still required                                              |
| UA-3      | G0-8 (D4 partner ops execution evidence) | jer   | Named pilot partner list, outreach owner assignment, and dated outreach execution evidence bundle                   | pending                                                   | 2026-03-21 | 2026-03-24  | yes                                 | Evidence workspace prepared at `docs/implementation/v22-0-evidence/d4-partner-ops/`; execution evidence is still missing                                   |

## Ready For Agent Once Evidence Is Provided

- [ ] Update C1 status and evidence table in [v22.0 Control C1 Legal Review](v22-0-control-c1-legal-review.md).
- [ ] Update C2 status and evidence table in [v22.0 Control C2 Privacy Retention Mapping](v22-0-control-c2-retention-mapping.md).
- [ ] Update D4 execution references in [v22.0 Approval Checklist](../planning/v22-0-approval-checklist.md).
- [ ] Sync control statuses in [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md).
- [ ] Sync evidence matrix in [v22.0 Gate 0 Evidence Status (2026-03-09)](v22-0-gate-0-evidence-status-2026-03-09.md).
- [ ] Re-evaluate required checks and decision in [v22.0 Gate 0 Exit Checklist (Decision Control)](v22-0-gate-0-exit-checklist.md).
- [ ] Re-run CI guard: `npm run check:v22-gate0`.

## Synchronization Order (When UA Status Changes)

1. Update this tracker row (`status`, `last update`, and notes).
2. Update the corresponding source doc:
   - `UA-1` -> [v22.0 Control C1 Legal Review](v22-0-control-c1-legal-review.md)
   - `UA-2` -> [v22.0 Control C2 Privacy Retention Mapping](v22-0-control-c2-retention-mapping.md)
   - `UA-3` -> [v22.0 Approval Checklist](../planning/v22-0-approval-checklist.md)
3. Update [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md) control tracker.
4. Update [v22.0 Gate 0 Evidence Status (2026-03-09)](v22-0-gate-0-evidence-status-2026-03-09.md).
5. Re-evaluate [v22.0 Gate 0 Exit Checklist (Decision Control)](v22-0-gate-0-exit-checklist.md) and run `npm run check:v22-gate0`.

## Change Log

| Date       | Event               | Update                                                                                   |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------- |
| 2026-03-09 | Tracker initialized | Added UA-1, UA-2, UA-3 with gate-event update protocol and required evidence definitions |
| 2026-03-24 | Autonomous prep     | Added evidence workspace scaffolding and a draft C2 retention/deletion policy artifact   |
