# Brampton Next Verification Queue

Date: 2026-07-07
Status: draft-only; no live data changes

Detailed L2/L3 workplan: `docs/launch/brampton-l2-l3-verification-workplan.md`

## Guardrails

- Do not promote any record from this queue to `data/services.json` without L1 approval.
- Do not infer missing phone, address, hours, eligibility, or service area facts.
- Prefer program-level records over broad organization records when the public source supports a specific program.
- Reuse existing broad Ontario/Canada canonical records instead of duplicating them for Brampton.

## L2 Follow-Up For Promoted Records

| Record                                                | Current L1 Status | L2 Question                                                                                          |
| ----------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| Peel Centralized Shelter Intake                       | promoted L1       | Confirm current intake flow and whether any Brampton-specific access notes should be added.          |
| Wilkinson Road Shelter                                | promoted L1       | Confirm current intake/referral path and any population restrictions.                                |
| Victim Services of Peel                               | promoted L1       | Confirm current crisis contact path and regional coverage wording.                                   |
| Safe Centre of Peel                                   | promoted L1       | Confirm current intake path and whether Brampton should use site-level or regional coverage wording. |
| Region of Peel Ontario Works and Emergency Assistance | promoted L1       | Confirm emergency assistance intake steps and whether office-specific details should be added.       |
| Regeneration Marketplace Food Bank                    | promoted L1       | Confirm current food-bank intake, hours, and eligibility.                                            |
| Knights Table Food Bank and Meal Programs             | promoted L1       | Recheck official address against older 211 Ontario pantry address before L2.                         |

## Deferred Candidates

| Candidate                                       | Reason Deferred                                                                        | Next Safe Action                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ste. Louise Outreach Centre of Peel             | needs stronger program/source clarity before live record                               | Verify current program scope, intake, address, and duplicate risk.                                 |
| Brampton Multicultural Community Centre         | broad organization candidate; may need narrower program records                        | Identify specific emergency/core programs before creating draft service records.                   |
| Catholic Crosscultural Services Brampton Office | newcomer support is useful but outside first emergency/core launch set                 | Verify office details, program scope, intake path, and language-access notes.                      |
| Punjabi Community Health Services               | useful community health/wellness candidate but outside first emergency/core launch set | Verify Brampton location/program details and decide whether the record should be program-specific. |

## Canonical Reuse Watchlist

- Keep using existing 988, ConnexOntario, Kids Help Phone, Health811, 211 Ontario, and Ontario Victim Support Line records as broad services.
- Do not create Brampton-local duplicates for broad phone lines unless there is a distinct Brampton program with a separate intake path.

## Approval Checklist For Any Future Promotion

- [ ] Official source reviewed.
- [ ] Secondary source reviewed when available.
- [ ] Phone or intake path verified.
- [ ] Address omitted unless sourced.
- [ ] Coverage decision documented.
- [ ] Duplicate/canonical decision documented.
- [ ] Unresolved fields explicitly listed.
- [ ] Human L1 approval recorded.
