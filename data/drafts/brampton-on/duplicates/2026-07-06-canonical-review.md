# Brampton Canonical And Duplicate Review

Date: 2026-07-06
Status: draft analysis only

This review compares `data/drafts/brampton-on/candidates/2026-07-06-core-services.md` against current `data/services.json` identifiers, names, phone numbers, URLs, legacy scope, and primary place values. It does not approve live data entry.

## Decision Summary

| Candidate                                             | Decision                                                                               | Existing Match                                            | Reason                                                                                         | Human Approval Needed |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------- |
| Peel Centralized Shelter Intake                       | New regional Peel record, if L1 confirms current intake path                           | None found                                                | No same provider, phone, URL, or shelter-intake record exists                                  | Yes                   |
| Wilkinson Road Shelter                                | New local Brampton record, if L1 confirms current access path                          | None found                                                | No same shelter, address, phone, or URL exists                                                 | Yes                   |
| Victim Services of Peel                               | New regional Peel record, if L1 confirms service area and crisis path                  | `victim-services-kingston`, `ontario-victim-support-line` | Similar domain only; provider, phone, URL, and service area differ                             | Yes                   |
| Safe Centre of Peel                                   | New regional Peel or local Brampton record, if L1 confirms intake path                 | None found                                                | No same provider, phone, URL, or address exists                                                | Yes                   |
| Region of Peel Ontario Works and Emergency Assistance | New regional Peel record, if L1 confirms access path                                   | `ontario-works-kingston`, `ontario-works-kb`              | Same Ontario Works program type, but municipal/regional delivery agent and contact path differ | Yes                   |
| Regeneration Marketplace Food Bank                    | New local Brampton record, if L1 confirms current hours/access                         | None found                                                | No same provider, phone, URL, or address exists                                                | Yes                   |
| Knights Table Food Bank and Meal Programs             | New local Brampton record, if L1 confirms current hours/access                         | None found                                                | No same provider, phone, URL, or address exists                                                | Yes                   |
| Ste. Louise Outreach Centre of Peel                   | New local Brampton record, if L1 confirms current hours/access                         | None found                                                | No same provider, phone, URL, or address exists                                                | Yes                   |
| Brampton Multicultural Community Centre               | New local Brampton record or narrower program records, if L1 confirms services         | None found                                                | No same provider, phone, URL, or address exists                                                | Yes                   |
| Catholic Crosscultural Services Brampton Office       | New local Brampton record or narrower program records, if L1 confirms services         | None found                                                | No same Brampton office, phone, URL, or address exists                                         | Yes                   |
| Punjabi Community Health Services                     | Likely multiple narrower program records or one regional intake record after L1 review | None found                                                | No same provider, phone, URL, or address exists; program granularity unresolved                | Yes                   |

## Existing Broad Records To Reuse

Do not create Brampton-local duplicates for these existing records unless their source data changes and human approval confirms a different canonical model:

- `crisis-988` / `988 Suicide Crisis Helpline`
- `crisis-connex-ontario` / `ConnexOntario`
- `crisis-kids-help-phone` and `kids-help-phone` / `Kids Help Phone`
- `crisis-telehealth-ontario` / `Health811`
- `crisis-211-ontario` and `ontario-211-ontario` / `211 Ontario`
- `ontario-victim-support-line` / `Victim Support Line`

## Candidate Reviews

### Peel Centralized Shelter Intake

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#peel-centralized-shelter-intake`
- Duplicate signals:
  - Same provider: no existing Region of Peel shelter-intake record found.
  - Same phone: no existing `905-450-1996` record found.
  - Same URL/domain: no existing `peelregion.ca/housing-social-support/help-housing` record found.
  - Same address: no address in draft candidate.
  - Same service area: no existing Peel shelter-intake service area found.
- Recommended canonical decision: new regional Peel record.
- Required human check before live data: confirm current centralized intake phone, current access process, hours, eligibility, and whether shelter access should be represented as one intake record, separate shelter records, or both.

### Wilkinson Road Shelter

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#wilkinson-road-shelter`
- Duplicate signals:
  - Same provider: no matching Brampton shelter record found.
  - Same phone: no existing `905-450-1996` record found.
  - Same URL/domain: no existing Region of Peel shelter page record found.
  - Same address: no existing `15 Wilkinson Road` record found.
  - Same service area: no existing Brampton-local shelter record found.
- Recommended canonical decision: new local Brampton record if L1 confirms direct listing and access path.
- Required human check before live data: confirm whether users should call centralized intake rather than the shelter; avoid duplicating an intake record with a shelter record unless both are useful and clearly distinct.

### Victim Services of Peel

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#victim-services-of-peel`
- Duplicate signals:
  - Same provider: no; existing `victim-services-kingston` is a different provider.
  - Same phone: no existing `905-568-1068` record found.
  - Same URL/domain: no existing `vspeel.org` record found.
  - Same address: no existing `7750 Hurontario Street` record found.
  - Same service area: existing `ontario-victim-support-line` is province-wide and should remain a separate broad record.
- Recommended canonical decision: new regional Peel record.
- Required human check before live data: confirm the public service-area statement, whether the 24-hour crisis line is current, and whether any police-referral constraints apply.

### Safe Centre of Peel

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#safe-centre-of-peel`
- Duplicate signals:
  - Same provider: no existing Safe Centre of Peel record found.
  - Same phone: no existing `905-450-4650` record found.
  - Same URL/domain: no existing `scopeel.org` record found.
  - Same address: no existing `60 West Drive, Suite 110` Safe Centre record found.
  - Same service area: no existing Peel family-violence hub record found.
- Recommended canonical decision: new regional Peel record, or local Brampton record if L1 source evidence frames the service primarily as Brampton-based.
- Required human check before live data: confirm intake phone, crisis extension if any, office hours, and program-level scope.

### Region of Peel Ontario Works and Emergency Assistance

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#region-of-peel-ontario-works-and-emergency-assistance`
- Duplicate signals:
  - Same provider: no; existing `ontario-works-kingston` and `ontario-works-kb` are Kingston delivery-agent records.
  - Same phone: no existing `905-793-9200` record found.
  - Same URL/domain: no existing Peel Ontario Works URL found.
  - Same address: no address in draft candidate.
  - Same service area: same program type, different municipal/regional delivery agent.
- Recommended canonical decision: new regional Peel record.
- Required human check before live data: confirm phone, application path, emergency assistance route, and whether Ontario Works and emergency assistance should be separate records.

### Regeneration Marketplace Food Bank

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#regeneration-marketplace-food-bank`
- Duplicate signals:
  - Same provider: no existing Regeneration record found.
  - Same phone: no existing `905-796-5888` record found.
  - Same URL/domain: no existing `regenbrampton.com` record found.
  - Same address: no existing `253 Queen Street East` record found.
  - Same service area: no existing Brampton-local food bank record found.
- Recommended canonical decision: new local Brampton record.
- Required human check before live data: confirm current food bank hours, intake process, eligibility, and whether address/contact details differ by program.

### Knights Table Food Bank and Meal Programs

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#knights-table-food-bank-and-meal-programs`
- Duplicate signals:
  - Same provider: no existing Knights Table record found.
  - Same phone: no existing `905-454-8725` record found.
  - Same URL/domain: no existing `knightstable.org` record found.
  - Same address: no existing `287 Glidden Road` record found.
  - Same service area: no existing Brampton-local Knights Table or equivalent record found.
- Recommended canonical decision: new local Brampton record.
- Required human check before live data: confirm current food bank and meal program hours, registration requirements, and whether separate records are needed for different access paths.

### Ste. Louise Outreach Centre of Peel

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#ste-louise-outreach-centre-of-peel`
- Duplicate signals:
  - Same provider: no existing Ste. Louise record found.
  - Same phone: no existing `905-454-2144` record found.
  - Same URL/domain: no existing `stelouisefoodbank.ca` record found.
  - Same address: no existing `32 Haggert Avenue North` record found.
  - Same service area: no existing Brampton-local Ste. Louise or equivalent record found.
- Recommended canonical decision: new local Brampton record.
- Required human check before live data: confirm current food bank/service hours, intake rules, eligibility, and public source freshness.

### Brampton Multicultural Community Centre

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#brampton-multicultural-community-centre`
- Duplicate signals:
  - Same provider: no existing BMCC record found.
  - Same phone: no existing `905-790-8482` record found.
  - Same URL/domain: no existing `bmccentre.org` record found.
  - Same address: no existing `263 Queen Street East, Unit 10` record found.
  - Same service area: no existing Brampton newcomer/community record found for this provider.
- Recommended canonical decision: new local Brampton record or narrower program records after L1 determines the user-facing access path.
- Required human check before live data: confirm current programs, intake path, office/service hours, and whether one organization-level record would be too broad for CareConnect search.

### Catholic Crosscultural Services Brampton Office

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#catholic-crosscultural-services-brampton-office`
- Duplicate signals:
  - Same provider: no existing Catholic Crosscultural Services Brampton record found.
  - Same phone: no existing `905-457-7740` record found.
  - Same URL/domain: no existing `ccscan.ca` or Catholic Crosscultural Services Brampton URL found.
  - Same address: no existing `164 Queen Street East, Suite 306` record found.
  - Same service area: no existing Brampton CCS newcomer/settlement service area found.
- Recommended canonical decision: new local Brampton record or narrower program records after L1 determines the user-facing access path.
- Required human check before live data: confirm current program scope, phone, hours, intake path, and whether the office listing should be split into specific settlement, employment, or language-service records.

### Punjabi Community Health Services

- Draft candidate source: `data/drafts/brampton-on/candidates/2026-07-06-core-services.md#punjabi-community-health-services`
- Duplicate signals:
  - Same provider: no existing PCHS record found.
  - Same phone: no existing `905-677-0889` record found.
  - Same URL/domain: no existing `pchs4u.com` record found.
  - Same address: no existing `60 West Drive` PCHS record found.
  - Same service area: no existing Brampton/Peel PCHS service area found.
- Recommended canonical decision: likely multiple narrower records if public program pages have distinct intake paths; otherwise one regional access/navigation record.
- Required human check before live data: identify specific public program pages, confirm program-specific eligibility, and avoid an overly broad organization record if users need a specific service path.

## Live Data Guard

No changes were made to `data/services.json` or `data/embeddings.json` during this duplicate review.
