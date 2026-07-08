# Brampton L2/L3 Verification Workplan

Date: 2026-07-08
Status: six L2 upgrades applied locally; Ste. Louise promoted L1; production sync pending bounded apply

## Guardrails

- Do not promote new Brampton records without L1 approval.
- Do not infer missing facts.
- Do not duplicate broad Ontario/Canada canonical services as Brampton-local records.
- Do not raise a record to L2 or L3 without evidence that matches the verification level.
- Keep public relationship claims separate from source review.

Detailed L2 source review: `data/drafts/brampton-on/reviews/2026-07-08-l2-verification-review.md`

## Verification Definitions

| Level | Meaning            | Minimum Evidence                                                                                                                                        |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1    | Basic verification | Current official/public source confirms existence, service purpose, intake/contact path, and coverage.                                                  |
| L2    | Vetted             | Reviewer completes provider contact or stronger cross-source verification resolving key service details such as intake, eligibility, hours, or address. |
| L3    | Provider confirmed | Provider or authorized representative confirms the record, or a formal approved provider relationship supports the record.                              |

## Promoted Seven-Record Follow-Up

| Record                                                | Current Level | Next Target | Required Work                                                                                                                                        | Done When                                                                                                      |
| ----------------------------------------------------- | ------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Peel Centralized Shelter Intake                       | L2            | monitor     | Recheck after material Peel shelter-page or 211 updates.                                                                                             | Public facts remain aligned with Peel Region and 211.                                                          |
| Wilkinson Road Shelter                                | L2            | monitor     | Recheck central intake versus site-office display after any Peel shelter update.                                                                     | Intake phone remains Central Intake; site office is not exposed as primary intake.                             |
| Victim Services of Peel                               | L2            | L3 gated    | Do not claim provider-confirmed status without authorized provider confirmation.                                                                     | Provider confirmation or formal approved provider relationship is recorded.                                    |
| Safe Centre of Peel                                   | L2            | monitor     | Recheck if partner-specific programs are split into separate cards.                                                                                  | Hub record and any split program records have distinct sourced intake paths.                                   |
| Region of Peel Ontario Works and Emergency Assistance | L2            | monitor     | Recheck if office-level walk-in details are added later.                                                                                             | Office-specific facts remain omitted unless sourced.                                                           |
| Regeneration Marketplace Food Bank                    | L2            | monitor     | Recheck appointment/walk-in wording before changing public intake text.                                                                              | Intake wording remains aligned with provider and 211 sources.                                                  |
| Knights Table Food Bank and Meal Programs             | L1            | L2 gated    | Resolve official 73 Hale Road source against 211 287 Glidden Road pantry/meal records, then decide whether meal and pantry programs should be split. | Address conflict and program split decision are documented; public facts align with the selected source basis. |
| Ste. Louise Outreach Centre of Peel Food Bank         | L1            | L2 gated    | Recheck official registration workflow, 211 in-person registration wording, and hours before L2.                                                     | Registration and hours are verified without conflicting intake instructions.                                   |

## Deferred L1 Candidates

| Candidate                                       | Current State    | Next Target | Required Work                                                                                                             | Done When                                                                    |
| ----------------------------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Ste. Louise Outreach Centre of Peel             | Promoted live L1 | L2 review   | Recheck current registration workflow and hours before any L2 upgrade.                                                    | Registration and hours are verified without conflicting intake instructions. |
| Brampton Multicultural Community Centre         | Draft-only       | L1 decision | Identify specific emergency/core programs rather than creating a broad organization record.                               | Program-level candidate shape is selected or deferral remains documented.    |
| Catholic Crosscultural Services Brampton Office | Draft-only       | L1 decision | Verify office details, program scope, intake path, language-access notes, and whether office-level record is appropriate. | Office/program canonical decision is documented before any promotion.        |
| Punjabi Community Health Services               | Draft-only       | L1 decision | Verify Brampton location/program details, intake, eligibility, and whether narrower program records are needed.           | Program-specific or organization-level decision is documented with sources.  |

## Broad Canonical Reuse

Keep these as broad Ontario/Canada records unless a distinct Brampton program with a separate intake path is verified:

- 988
- ConnexOntario
- Kids Help Phone
- Health811
- 211 Ontario
- Ontario Victim Support Line

Production broad-record reuse in Brampton selected-place results depends on the separate approved broad coverage correction in `docs/launch/brampton-broad-coverage-correction-approval.md`.

## Review Sequence

1. Complete broad coverage correction decision before using production Brampton search results as evidence of broad canonical reuse.
2. Upgrade promoted launch records toward L2 only where source/contact evidence resolves key details.
3. Resolve Knights Table address and program split before any L2 claim.
4. Review deferred candidates one at a time through the L1 template in `docs/data/brampton-l1-review-template.md`; use `data/drafts/brampton-on/reviews/2026-07-08-deferred-candidate-research.md` for the current deferred-candidate research packet.
5. Promote no additional live records until human approval is recorded.

## Definition Of Done

- [x] Each promoted record has an L2 target question or monitoring condition assigned.
- [x] Each deferred candidate has an L1 next action.
- [x] Broad services are not duplicated locally.
- [x] Address, phone, intake, hours, eligibility, and coverage facts are sourced or omitted.
- [x] Human approval is recorded before live data promotion or verification-level increase.
- [ ] Production Supabase is synced with the bounded approved Brampton record set after deploy/rollback evidence is ready.
