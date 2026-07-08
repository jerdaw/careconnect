# Brampton Next Verification Queue

Date: 2026-07-07
Status: updated after 2026-07-08 L2/Ste. Louise decisions

Detailed L2/L3 workplan: `docs/launch/brampton-l2-l3-verification-workplan.md`
Detailed L2 source review: `data/drafts/brampton-on/reviews/2026-07-08-l2-verification-review.md`

## Guardrails

- Do not promote any record from this queue to `data/services.json` without L1 approval.
- Do not infer missing phone, address, hours, eligibility, or service area facts.
- Prefer program-level records over broad organization records when the public source supports a specific program.
- Reuse existing broad Ontario/Canada canonical records instead of duplicating them for Brampton.

## L2 Follow-Up For Promoted Records

| Record                                                | Current Status | Next Question                                                                               |
| ----------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| Peel Centralized Shelter Intake                       | upgraded to L2 | Recheck only after material Peel shelter-page or 211 changes.                               |
| Wilkinson Road Shelter                                | upgraded to L2 | Recheck central intake versus site-office display after any Peel shelter update.            |
| Victim Services of Peel                               | upgraded to L2 | Recheck before any L3/provider-confirmed claim.                                             |
| Safe Centre of Peel                                   | upgraded to L2 | Recheck if partner-specific programs are split into separate cards.                         |
| Region of Peel Ontario Works and Emergency Assistance | upgraded to L2 | Recheck if office-level walk-in details are added later.                                    |
| Regeneration Marketplace Food Bank                    | upgraded to L2 | Recheck appointment/walk-in wording before changing public intake text.                     |
| Knights Table Food Bank and Meal Programs             | retained at L1 | Resolve official 73 Hale Road source versus 211 287 Glidden Road program records before L2. |
| Ste. Louise Outreach Centre of Peel Food Bank         | promoted L1    | Recheck current registration workflow before L2.                                            |

## Deferred Candidates

| Candidate                                       | Reason Deferred                                                                        | Next Safe Action                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ste. Louise Outreach Centre of Peel             | promoted as live L1 after owner approval                                               | Recheck current registration workflow before L2.                                                   |
| Brampton Multicultural Community Centre         | broad organization candidate; may need narrower program records                        | Identify specific emergency/core programs before creating draft service records.                   |
| Catholic Crosscultural Services Brampton Office | newcomer support is useful but outside first emergency/core launch set                 | Verify office details, program scope, intake path, and language-access notes.                      |
| Punjabi Community Health Services               | useful community health/wellness candidate but outside first emergency/core launch set | Verify Brampton location/program details and decide whether the record should be program-specific. |

## Canonical Reuse Watchlist

Detailed deferred-candidate source review: `data/drafts/brampton-on/reviews/2026-07-08-deferred-candidate-research.md`

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
