---
status: stable
last_updated: 2026-04-04
owner: jer
tags: [planning, admissions, v21.0, pilot, governance]
---

# v21.0: Admissions Portfolio & External Validation Plan

**Status**: PARKED behind v22 Gate 0 / Gate 1, but now fully triaged as an admissions evidence backlog  
**Priority**: Strategic, but subordinate to v22.0 non-duplicate-value proof  
**Time Horizon**: 12 weeks once v22 allows external execution  
**Last Updated**: 2026-04-04

---

## Why This Plan Exists

This document is the admissions-focused roadmap for turning CareConnect from a technically strong pilot into something that reads as serious leadership, community impact, and professional execution on OMSAS ABS / CanMEDS without exaggeration.

The core rule is unchanged:

1. Do not over-package weak evidence.
2. Do not prioritize style/polish over real implementation, governance, or adoption.
3. Do the work that creates defensible external artifacts first.

---

## Current State

- CareConnect is live at `https://careconnect.ing` and has unusually strong technical/governance scaffolding for a student-led project.
- The main unresolved question is no longer "can it ship?" but "does it create non-duplicate real-world value relative to 211?"
- The highest-value gap is external execution: named pilot partners, real workflow use, measurable outcomes, provider-confirmed records, and external validation.
- The repo already contains significant pilot, governance, privacy, accessibility, and observability infrastructure.
- The admissions story will improve most by producing real pilot evidence, not by adding more product breadth or cosmetic polish.

---

## Triage Rules

Use these rules whenever two backlog items compete:

1. Work that directly closes v22 blockers outranks everything else.
2. Work that produces real-world outcome evidence outranks packaging or presentation work.
3. Work that strengthens safety, governance, verification, or pilot reliability outranks broadening the feature set.
4. Public claims must lag evidence, not lead it.
5. Optional prestige work (applications, incorporation framing, publications) only makes sense after core pilot evidence exists.

---

## Tracking Conventions

Use these status labels when turning this plan into active execution tracking:

- `pending`: accepted backlog item, not yet started
- `active`: currently in execution
- `blocked`: cannot progress because a named dependency is still unresolved
- `complete`: artifact exists and is strong enough to cite honestly
- `dropped`: intentionally removed because the evidence case became weak or redundant

Default assumption today:

1. Tier 0 items are `pending` unless they have already been completed elsewhere in v22 tracking.
2. Tier 1+ items are effectively `blocked` by the current v22 gate state unless they can be executed in a tightly bounded way without violating current roadmap rules.

---

## Tier 0 Status Snapshot (2026-04-01)

- `A1`: `blocked` pending user-owned Gate 0 evidence (`UA-1`, `UA-3`).
- `A3`: `complete` via extended pilot metric-source schema, recompute-to-snapshot flow, docs alignment, and passing focused tests.
- `A11`: `complete` via public claim/placeholder hardening on active repo-facing surfaces.
- `A22`: `complete` via focused pilot/privacy route coverage and updated schema/metric tests.
- `A6`: `active` in bounded mode because scoped readiness audit/export tooling now exists, but no real verification cycle artifact has been executed yet.
- `A16`: `active` in bounded mode because scoped readiness reporting now exists, but pilot-scope data fixes are still pending.

Implication:

1. The remaining near-term Tier 0 execution is `A1` plus any bounded `A6` / `A16` follow-through that materially improves pilot readiness.
2. `A3`, `A11`, and `A22` should now be treated as baseline capability, not open backlog.

---

## Priority Tiers

### Tier 0: Do Now Only If It Directly Supports v22

These are the only admissions-relevant items that should move before v22 Gate 0 / Gate 1 evidence exists:

1. `A1` Close v22 Gate 0 with named pilot partners and clause-level legal/API evidence.
2. `A6` Run a bounded verification/freshness cycle if it directly supports partner trust or pilot readiness.
3. `A16` Close pilot-scope data quality gaps if they affect real pilot reliability.

Completed Tier 0 groundwork now already in place:

1. `A3` pilot metric computability
2. `A11` claim / placeholder hardening
3. `A22` focused pilot/privacy test hardening

### Tier 1: First Work Immediately After Gate 0 Exit

These are the first execution items once external pilot activity is allowed:

1. `A2` Run a small real-world pilot in one defined referral workflow.
2. `A14` Run a formal crisis-safety validation protocol with provider review.
3. `A8` Conduct structured professional usability / fitness-for-referral sessions.
4. `A23` Create partner/referrer collateral to support adoption.
5. `A13` Formalize the CareConnect-to-211 boundary and handoff workflow.
6. `A7` Start targeted L3 provider-confirmation outreach.
7. `A9` Recruit the first advisory reviewers and hold an initial meeting.
8. `A27` Add a quick-exit / safe-leave flow for violence-sensitive browsing contexts.
9. `A28` Expose referral-critical logistics already present in the data model, such as service area, virtual delivery, languages, and transit notes.
10. `A29` Build shortlist / compare / multi-print referral workflows for referrers and partner staff.

### Tier 2: First 2-6 Weeks of Live Pilot Evidence

These are the highest-value "this is real" proof artifacts:

1. `A4` Publish the first baseline-to-pilot scorecard and decision memo.
2. `A5` Secure at least one factual support / endorsement letter.
3. `A12` Publish a verification/freshness/transparency page.
4. `A21` Run a public status page and archive monthly operational snapshots.
5. `A20` Complete an incident-response drill and short post-mortem.
6. `A15` Perform manual accessibility testing with assistive-tech users.
7. `A17` Complete human-reviewed French/plain-language support for sensitive services.
8. `A18` Run the evidence-based identity/equity tagging pass.

### Tier 3: Evidence Packaging After Initial Pilot Proof Exists

These are valuable, but they should follow actual pilot evidence:

1. `A10` Obtain an external privacy / AI safety review.
2. `A24` Make leadership/collaboration visible with named roles and real governance ownership.
3. `A26` Present to community or professional audiences.
4. `A25` Publish a case study, poster, or preprint.

### Tier 4: Conditional / Context-Dependent Work

These are only worth doing if the surrounding context is real and timely:

1. `A19` Obtain an institutional QI / REB / privacy classification.
2. `A25` Formal dissemination, if the pilot data is strong enough to support it.
3. `A26` Formal external presentations, if there is an audience with actual relevance.

---

## 12-Week Artifact Stack

If the goal is for CareConnect to look like a serious, audited, adopted project within 12 weeks, these are the target artifacts to create in order:

1. Dated Gate 0 closure evidence bundle.
2. Pilot protocol with named scope, partner, workflow, and safeguards.
3. Computable pilot metric stack with passing tests.
4. Verification cycle log and pilot-scope data-quality delta report.
5. Crisis validation report and professional usability summary.
6. First pilot scorecard and decision memo.
7. First L3 confirmations and at least one support letter.
8. Advisory review minutes and external privacy/AI review memo.
9. Transparency page, status page, and monthly ops snapshot.
10. Referrer brief, demo asset, and either a presentation deck or case study.

---

## Comprehensive Improvement Register

| ID    | Improvement                                                                         | Current Priority | Earliest Window                          | Why It Matters Most                                                        | Key Artifact(s)                                                                | Dependencies / Notes                                              |
| ----- | ----------------------------------------------------------------------------------- | ---------------- | ---------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `A1`  | Close v22 Gate 0 with named pilot partners and clause-level legal/API evidence      | Tier 0           | Now                                      | Converts this from a strong repo into a governed external initiative       | Redlined terms, partner list, outreach evidence bundle, updated gate checklist | Directly blocked on `UA-1` and `UA-3`                             |
| `A2`  | Run a small real-world pilot inside one actual referral workflow                    | Tier 1           | After Gate 0 exit                        | Creates the strongest possible shift from prototype to real implementation | Pilot protocol, workflow map, partner confirmation, pilot log                  | Requires permission to run external pilot activity                |
| `A3`  | Finish pilot instrumentation so M2/M4/M5/M6/M7 are computable                       | Tier 0           | Now                                      | Outcome evidence is stronger than feature breadth                          | Schema/docs updates, passing tests, non-null pilot scorecard fields            | Must preserve privacy guardrails                                  |
| `A4`  | Publish the first baseline-to-pilot scorecard and decision memo                     | Tier 2           | After initial pilot data                 | This is the highest-value scholarship artifact in the backlog              | Scorecard, dated memo, threshold review                                        | Depends on `A2` and `A3`                                          |
| `A5`  | Secure one or more factual support / endorsement letters                            | Tier 2           | After external review or early pilot use | Independent validation matters more than self-description                  | Letter on letterhead or official email                                         | Best requested after concrete use/review                          |
| `A6`  | Execute a recurring verification cycle and publish the results                      | Tier 0           | Now if it supports pilot readiness       | Operationalizes the strongest governance claim: accuracy over breadth      | Verification log, correction summary, updated freshness stats                  | Safe to start early if bounded to pilot relevance                 |
| `A7`  | Achieve the first real L3 provider-confirmed services                               | Tier 1           | After Gate 0 exit                        | Proves the governance model is functioning in the real world               | Confirmation emails, updated verification counts, screenshots                  | Outreach should follow claim-flow testing and partner readiness   |
| `A8`  | Conduct structured professional usability / fitness-for-referral sessions           | Tier 1           | After Gate 0 exit                        | Demonstrates evidence-based iteration with credible users                  | Session protocol, notes, findings summary, resulting fixes                     | Needs access to front-line professionals                          |
| `A9`  | Recruit advisory reviewers and hold the first meeting with minutes                  | Tier 1           | After Gate 0 exit                        | Shows real oversight, not just drafted governance                          | Named members, meeting agenda, minutes, action tracker                         | Start with bounded asks, then formalize                           |
| `A10` | Obtain an external privacy / AI safety review                                       | Tier 3           | After initial pilot proof                | External ethical scrutiny is much stronger than internal audit alone       | Review memo/email, response log, updated public summary                        | Better after pilot scope is concrete                              |
| `A11` | Audit public claims, placeholders, and stale messaging                              | Tier 0           | Now                                      | Unsupported claims erode credibility faster than missing features          | Claim-evidence matrix, updated pages, before/after screenshots                 | Includes placeholders in acknowledgments and partner-facing pages |
| `A12` | Publish a transparency page for verification, freshness, corrections, and limits    | Tier 2           | After first executed ops cycle           | Shows humility, accountability, and safety culture                         | Public transparency page, dated snapshots                                      | Stronger after `A6` and early pilot evidence                      |
| `A13` | Formalize CareConnect’s boundary with 211 and build the handoff workflow            | Tier 1           | After Gate 0 exit                        | Demonstrates system judgment and reduces overreach risk                    | Boundary statement, UX copy, handoff flow, partner feedback                    | Should align with v22 positioning work                            |
| `A14` | Run a formal crisis-safety validation protocol with provider review                 | Tier 1           | After Gate 0 exit                        | Addresses the highest-risk user pathway directly                           | Crisis scenario sheet, screenshots, issue log, reviewer sign-off               | High ethical priority                                             |
| `A15` | Do manual accessibility testing with real assistive-tech users                      | Tier 2           | During early pilot                       | Real accessibility evidence is stronger than automated checks alone        | Manual test report, fixed issues, updated accessibility statement              | Needs tester access                                               |
| `A16` | Run a pilot-scope data completeness sprint                                          | Tier 0           | Now if pilot-critical                    | Missing coordinates/hours/email/freshness weakens real-world reliability   | Before/after completeness report, updated audit outputs                        | Scope to pilot services first, not repo-wide polish               |
| `A17` | Complete human-reviewed French/plain-language support for sensitive services        | Tier 2           | Early pilot                              | Strengthens the equity claim in a concrete way                             | Completed fields, reviewer note, bilingual/plain-language gap report           | Focus on crisis/shelter/DV/high-risk services first               |
| `A18` | Run an evidence-based identity/equity tagging pass                                  | Tier 2           | Early pilot                              | Shows ethical rigor and avoids performative tagging                        | Evidence table, updated records, audit summary                                 | No vibe-based tagging                                             |
| `A19` | Obtain an institutional QI / REB / privacy classification                           | Tier 4           | When human-subject boundary becomes real | Demonstrates ethical process awareness                                     | Determination email or approval letter                                         | Needs clarification on institution / oversight body               |
| `A20` | Run an incident-response drill and publish a short post-mortem                      | Tier 2           | Early pilot                              | Shows operational maturity and safety rehearsal                            | Drill report, post-mortem, runbook updates                                     | Can be simulated without waiting for a real failure               |
| `A21` | Add a public status page and monthly ops snapshots                                  | Tier 2           | Early pilot                              | Signals accountable stewardship and continuous monitoring                  | Status page, archived monthly snapshots, uptime screenshots                    | Best once there is a pilot audience to serve                      |
| `A22` | Harden automated tests around crisis, pilot, privacy, and claim-critical flows      | Tier 0           | Now                                      | Improves core reliability rather than surface polish                       | Targeted tests, CI evidence, focused coverage gains                            | Keep scope on highest-risk flows                                  |
| `A23` | Build partner/referrer collateral that makes adoption easy                          | Tier 1           | After Gate 0 exit                        | Helps external professionals evaluate and actually use the tool            | One-page brief, demo asset, onboarding pack, LOI/MOU template                  | Should reflect true current state only                            |
| `A24` | Make leadership and collaboration visible, not implied                              | Tier 3           | After first real collaborators exist     | Leadership is stronger when it is documented and shared                    | Updated roles page, contributor/governance ownership matrix, meeting cadence   | Do not fabricate team scale                                       |
| `A25` | Publish a case study, poster, or preprint                                           | Tier 3 / 4       | After real pilot data exists             | Converts implementation into scholarship                                   | Poster, abstract, preprint, slide deck                                         | Needs clarification on venue and authorship                       |
| `A26` | Present CareConnect to community or professional audiences and archive the feedback | Tier 3 / 4       | After initial proof artifacts exist      | Demonstrates communication and stakeholder engagement                      | Invitation, slides, attendance note, feedback summary                          | Needs clarification on audience access                            |
| `A27` | Add a quick-exit / safe-leave flow for violence-sensitive browsing                  | Tier 1           | After Gate 0 exit                        | Reduces harm for users who may be searching in unsafe environments         | Quick-exit UX, copy review, crisis-safety validation notes                     | Align with `A14`; keep behavior discreet and keyboard-accessible  |
| `A28` | Expose referral-critical logistics on public service pages                          | Tier 1           | After Gate 0 exit                        | Referrers care about access constraints as much as descriptions            | Updated detail UI, professional-usability findings, before/after screenshots   | Align with `A8`; use existing vetted fields only                  |
| `A29` | Build shortlist / compare / multi-print workflows for referrers                     | Tier 1           | After Gate 0 exit                        | Makes partner adoption easier in real referral settings                    | Shortlist UX, printable packet flow, partner/referrer feedback                 | Align with `A23`; only build what pilot users actually need       |

---

## Immediate Sequencing Recommendation

If the project wants the highest admissions value without getting ahead of itself, the execution order should be:

1. `A1`, then bounded `A6` / `A16`.
2. `A2`, `A14`, `A8`, `A23`, `A13`, `A27`, `A28`, `A29`, `A7`, `A9`.
3. `A4`, `A5`, `A12`, `A21`, `A20`, `A15`, `A17`, `A18`.
4. `A10`, `A24`, `A26`, `A25`.
5. `A19` only if the external oversight question becomes real.

This sequence deliberately avoids polishing-first work and keeps the strongest admissions gains tied to governance closure, actual use, and measurable outcomes.

### If Working On This Today

Do not pick randomly from the register. Use this order:

1. `A1` if external evidence needed for Gate 0 is available to process.
2. `A6` and `A16` only where they improve pilot trust/readiness, not as generic cleanup.
3. Otherwise, hold the admissions backlog until Gate 0 permits Tier 1 execution.

---

## Success Markers

This backlog is working if it produces:

- one real pilot scope with named ownership,
- one outcome scorecard with non-null values,
- one verification log,
- first L3 confirmations,
- one external support letter,
- one advisory/external review artifact,
- one public transparency surface,
- one status / ops evidence surface,
- and one dissemination artifact grounded in real results.

---

## Related Documents

- [Roadmap](roadmap.md)
- [v22.0 Non-Duplicate Value Decision Plan](v22-0-non-duplicate-value-decision-plan.md)
- [v22.0 Approval Checklist](v22-0-approval-checklist.md)
- [v22.0 Gate 0 User Action Tracker](../implementation/v22-0-gate-0-user-action-tracker.md)
- [Governance Standards](../governance/standards.md)
- [Advisory Board Charter](../governance/advisory_board_charter.md)
- [Verification Protocol](../governance/verification-protocol.md)
- [Privacy Impact Assessment](../audits/2026-01-03-privacy-impact-assessment.md)
- [Beta Testing Plan](../operations/beta-testing-plan.md)
