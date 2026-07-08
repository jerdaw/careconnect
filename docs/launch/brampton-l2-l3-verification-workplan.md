# Brampton L2/L3 Verification Workplan

Date: 2026-07-08
Status: draft-only workplan; no live data changes

## Guardrails

- Do not promote new Brampton records without L1 approval.
- Do not infer missing facts.
- Do not duplicate broad Ontario/Canada canonical services as Brampton-local records.
- Do not raise a record to L2 or L3 without evidence that matches the verification level.
- Keep public relationship claims separate from source review.

## Verification Definitions

| Level | Meaning            | Minimum Evidence                                                                                                                                        |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1    | Basic verification | Current official/public source confirms existence, service purpose, intake/contact path, and coverage.                                                  |
| L2    | Vetted             | Reviewer completes provider contact or stronger cross-source verification resolving key service details such as intake, eligibility, hours, or address. |
| L3    | Provider confirmed | Provider or authorized representative confirms the record, or a formal approved provider relationship supports the record.                              |

## Promoted Seven-Record Follow-Up

| Record                                                | Current Level | Next Target | Required Work                                                                                                                                                   | Done When                                                                                                             |
| ----------------------------------------------------- | ------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Peel Centralized Shelter Intake                       | L1            | L2          | Confirm current intake flow, street-outreach relationship, and whether any Brampton-specific access note is needed.                                             | Provider/reviewer evidence records current intake and coverage; unresolved fields are removed or explicitly deferred. |
| Wilkinson Road Shelter                                | L1            | L2          | Confirm central intake versus site office phone, current referral path, population restrictions, and whether the shelter card should expose both phone numbers. | Intake/referral path and phone display decision are documented.                                                       |
| Victim Services of Peel                               | L1            | L2          | Confirm crisis contact path, regional coverage wording, and whether any administration contact should remain omitted.                                           | Crisis contact and regional coverage are documented with reviewer evidence.                                           |
| Safe Centre of Peel                                   | L1            | L2          | Confirm intake path, urgent after-hours routing, regional coverage wording, and whether partner-specific programs need separate cards.                          | Intake and urgent routing are documented; split-program decision is recorded.                                         |
| Region of Peel Ontario Works and Emergency Assistance | L1            | L2          | Confirm emergency assistance intake steps, Ontario Works application path, and whether office-specific details should be added or omitted.                      | Public card has a documented intake path and office-specific decision.                                                |
| Regeneration Marketplace Food Bank                    | L1            | L2          | Confirm food-bank intake, hours, eligibility, and whether structured hours should replace or supplement `hours_text`.                                           | Current intake, hours, and eligibility are verified without inference.                                                |
| Knights Table Food Bank and Meal Programs             | L1            | L2          | Recheck official 73 Hale Road source against the older 211 Ontario pantry address, then decide whether meal and pantry programs should be split.                | Address conflict and program split decision are documented; public facts align with the selected source basis.        |

## Deferred L1 Candidates

| Candidate                                       | Current State | Next Target | Required Work                                                                                                             | Done When                                                                                                                                                               |
| ----------------------------------------------- | ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ste. Louise Outreach Centre of Peel             | Draft-only    | L1 decision | Verify current program scope, intake, address, food/community-service details, and duplicate risk.                        | L1 packet lists official source, secondary source if available, phone/intake, address if sourced, coverage, duplicate decision, unresolved fields, and approval status. |
| Brampton Multicultural Community Centre         | Draft-only    | L1 decision | Identify specific emergency/core programs rather than creating a broad organization record.                               | Program-level candidate shape is selected or deferral remains documented.                                                                                               |
| Catholic Crosscultural Services Brampton Office | Draft-only    | L1 decision | Verify office details, program scope, intake path, language-access notes, and whether office-level record is appropriate. | Office/program canonical decision is documented before any promotion.                                                                                                   |
| Punjabi Community Health Services               | Draft-only    | L1 decision | Verify Brampton location/program details, intake, eligibility, and whether narrower program records are needed.           | Program-specific or organization-level decision is documented with sources.                                                                                             |

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
2. Upgrade promoted seven-record launch set toward L2 where contact/reviewer capacity exists.
3. Resolve Knights Table address and program split before any L2 claim.
4. Review deferred candidates one at a time through the L1 template in `docs/data/brampton-l1-review-template.md`.
5. Promote no additional live records until human approval is recorded.

## Definition Of Done

- [ ] Each promoted record has an L2 target question assigned.
- [ ] Each deferred candidate has an L1 next action.
- [ ] Broad services are not duplicated locally.
- [ ] Address, phone, intake, hours, eligibility, and coverage facts are sourced or omitted.
- [ ] Human approval is recorded before any live data promotion or verification-level increase.
