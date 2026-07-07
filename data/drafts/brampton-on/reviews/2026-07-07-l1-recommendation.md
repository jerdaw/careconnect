# Brampton L1 Recommendation

Date: 2026-07-07
Status: recommended set approved and promoted to live L1 data on 2026-07-07

This review narrows the Brampton launch candidates into a small first-launch set. The recommended set was approved by the project owner on 2026-07-07 and promoted to `data/services.json` as L1 records. The draft files remain as review artifacts and provenance support.

## Recommended First Launch Set

| Candidate                                             | Draft Record                                       | Category  | Coverage Decision | Approval Status |
| ----------------------------------------------------- | -------------------------------------------------- | --------- | ----------------- | --------------- |
| Peel Centralized Shelter Intake                       | `brampton-peel-centralized-shelter-intake`         | Housing   | Regional, Peel    | promoted L1     |
| Wilkinson Road Shelter                                | `brampton-wilkinson-road-shelter`                  | Housing   | Local, Brampton   | promoted L1     |
| Victim Services of Peel                               | `brampton-victim-services-of-peel`                 | Crisis    | Regional, Peel    | promoted L1     |
| Safe Centre of Peel                                   | `brampton-safe-centre-of-peel`                     | Crisis    | Regional, Peel    | promoted L1     |
| Region of Peel Ontario Works and Emergency Assistance | `brampton-peel-ontario-works-emergency-assistance` | Financial | Regional, Peel    | promoted L1     |
| Regeneration Marketplace Food Bank                    | `brampton-regeneration-marketplace-food-bank`      | Food      | Local, Brampton   | promoted L1     |
| Knights Table Food Bank and Meal Programs             | `brampton-knights-table-food-bank-meals`           | Food      | Local, Brampton   | promoted L1     |

## Deferred Set

| Candidate                               | Reason For Deferral                                                                                             | Approval Status |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------- |
| Ste. Louise Outreach Centre of Peel     | Useful food/community candidate, but lower priority than the initial shelter, crisis, assistance, and food set. | deferred        |
| Brampton Multicultural Community Centre | Newcomer/community support is important, but program granularity and intake path need more review.              | deferred        |
| Catholic Crosscultural Services         | Newcomer support is important, but office-level versus program-level canonical shape needs review.              | deferred        |
| Punjabi Community Health Services       | Likely better represented as narrower program records after program-specific L1 review.                         | deferred        |

## Candidate Details

### Peel Centralized Shelter Intake

- Official source: https://peelregion.ca/housing-social-support/homeless-support/shelters
- Secondary source: https://211ontario.ca/service/78231605/peel-region-housing-and-shelter-peel-centralized-shelter-intake-and-homeless-supports/
- Phone/intake: `905-450-1996`
- Address if sourced: `10 Peel Centre Dr, Suite A and B, Brampton, ON L6T 4B9`
- Coverage decision: regional Peel record with `placeIds: ["brampton-on"]` and `regionIds: ["peel-region"]`
- Duplicate decision: create a new regional Peel intake record; do not duplicate broad 211/Ontario crisis records.
- Unresolved fields: final eligibility wording, whether street outreach should be separate, and whether any non-phone path should be highlighted.
- Approval status: approved and promoted to live L1 on 2026-07-07.

### Wilkinson Road Shelter

- Official source: https://peelregion.ca/housing-social-support/homeless-support/shelters
- Secondary source: https://211central.ca/record/73523437/
- Phone/intake: `905-450-1996` central intake; `905-452-1335` office listed by 211 Central
- Address if sourced: `15 Wilkinson Road, Brampton, ON L6T 4M3`
- Coverage decision: local Brampton record.
- Duplicate decision: create a new Brampton shelter record only if human L1 confirms it should sit alongside the centralized intake record.
- Unresolved fields: whether the public card should expose only central intake or also office phone; exact eligibility wording.
- Approval status: approved and promoted to live L1 on 2026-07-07.

### Victim Services of Peel

- Official source: https://www.vspeel.org/
- Secondary source: https://victimservicesontario.ca/store/victim-services-of-peel/
- Phone/intake: `905-568-1068` crisis line
- Address if sourced: `7750 Hurontario Street, Brampton, ON L6V 3W6`
- Coverage decision: regional Peel record.
- Duplicate decision: create a new Peel record; keep `ontario-victim-support-line` as the broad Ontario canonical record.
- Unresolved fields: any referral constraints, program limits, and whether administration phone should be omitted from the public card.
- Approval status: approved and promoted to live L1 on 2026-07-07.

### Safe Centre of Peel

- Official source: https://scopeel.org/contact-us/
- Secondary source: https://211ontario.ca/service/69808419/safe-centre-of-peel-safe-centre-of-peel/
- Phone/intake: `905-450-4650`; source also points urgent after-hours needs to Victim Services of Peel at `905-568-1068`
- Address if sourced: `60 West Drive, Suite 110, Brampton, ON L6T 3T6`
- Coverage decision: regional Peel record with Brampton primary place.
- Duplicate decision: create a new record; no same provider, phone, URL, or address exists in live data.
- Unresolved fields: whether to list crisis extension details, exact program eligibility, and whether any partner-specific programs require separate cards.
- Approval status: approved and promoted to live L1 on 2026-07-07.

### Region of Peel Ontario Works and Emergency Assistance

- Official source: https://peelregion.ca/services/ontario-works-or-emergency-assistance
- Secondary source: https://peelregion.ca/housing-social-support/financial-social-support
- Phone/intake: `905-793-9200` for Brampton and Mississauga; Ontario application phone path also exists and needs final copy review.
- Address if sourced: none selected for draft record.
- Coverage decision: regional Peel record.
- Duplicate decision: create a new Peel delivery-agent record; do not reuse Kingston Ontario Works records.
- Unresolved fields: whether Ontario Works and emergency assistance should be split into separate records; exact application copy.
- Approval status: approved and promoted to live L1 on 2026-07-07.

### Regeneration Marketplace Food Bank

- Official source: https://regenbrampton.com/service/marketplace/
- Secondary source: https://regenbrampton.com/location/regeneration-marketplace/
- Phone/intake: `905-796-5888 ext. 4000`
- Address if sourced: `253 Queen Street East, Brampton, ON L6W 2B8`
- Coverage decision: local Brampton record.
- Duplicate decision: create a new Brampton food record; no matching provider, URL, phone, or address exists in live data.
- Unresolved fields: whether to include split hours as structured data or keep `hours_text`; final wording for registration and ID requirements.
- Approval status: approved and promoted to live L1 on 2026-07-07.

### Knights Table Food Bank and Meal Programs

- Official source: https://knightstable.org/contact-us/
- Secondary source: https://211ontario.ca/service/71926537/knights-table-our-pantry/
- Phone/intake: `905-454-8725`
- Address if sourced: `73 Hale Road, Brampton, ON L6W 3J9`. Additional 2026-07-07 research found the official provider contact page and move notice list 73 Hale Road; 211 Ontario still lists `287 Glidden Rd, Unit 4`.
- Coverage decision: local Brampton record. Use the official provider address for L1, and preserve the 211 address mismatch as a follow-up note before L2.
- Duplicate decision: create one Brampton food record for launch; reassess whether meals and pantry need separate records during later program-level review.
- Unresolved fields: whether meals and pantry need separate records, current intake process, and whether 211 pantry hours are still authoritative after the provider move.
- Approval status: approved and promoted to live L1 on 2026-07-07.

## Live Data Guard

- Draft records are stored under `data/drafts/brampton-on/services/`.
- Draft records remain review artifacts; `data/services.json` is the live search source of truth.
- The seven recommended records were promoted to `data/services.json` after project-owner approval.
- `data/embeddings.json` must be regenerated and committed with promoted live records.

## Human Approval Checklist

- [x] Confirm each source URL still loads at review time.
- [x] Confirm phone/intake path and any crisis routing at L1.
- [x] Confirm address when address is included at L1.
- [x] Resolve Knights Table address conflict for L1 using the official provider contact page.
- [ ] Confirm whether broad organization records should be split into program-specific records.
- [ ] Confirm public copy does not imply endorsement, partnership, or official affiliation.
- [x] Approve selected records for `data/services.json`.
