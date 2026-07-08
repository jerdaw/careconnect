# Brampton Deferred Candidate Research

Date: 2026-07-08
Status: Ste. Louise approved/promoted; remaining candidates deferred

## Decision Summary

| Candidate                                       | Decision                                                                                                                         | Next Safe Action                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Ste. Louise Outreach Centre of Peel Food Bank   | Approved and promoted as a live L1 food-bank record. Official and 211 sources align on core food-bank facts.                     | Recheck current registration workflow before any L2 upgrade.                                             |
| Brampton Multicultural Community Centre         | Keep deferred. Sources identify broad organization/program families, not one emergency/core card.                                | Pick a program-level canonical shape before any service JSON or live record is created.                  |
| Catholic Crosscultural Services Brampton Office | Keep deferred. Strong office/service evidence exists, but newcomer settlement is outside the next emergency/core food follow-up. | Decide office-level versus program-level record, then complete L1 if newcomer support is selected next.  |
| Punjabi Community Health Services               | Keep deferred. Sources show multiple Brampton locations and programs, making one broad card risky.                               | Choose a specific program record, such as settlement, mental health, geriatrics, or HART Hub, before L1. |

## Ste. Louise Outreach Centre of Peel

- Recommended artifact: `data/drafts/brampton-on/services/brampton-ste-louise-food-bank.json`
- Live record: `brampton-ste-louise-food-bank` in `data/services.json`
- Official source: https://stelouisefoodbank.ca/
- Official contact source: https://stelouisefoodbank.ca/contact-us
- Official registration source: https://stelouisefoodbank.ca/registration
- Secondary source: https://211central.ca/record/69807287/
- Secondary agency source: https://211ontario.ca/service/69807284/agency/ste-louise-outreach-centre-of-peel/
- Phone/intake: `905-454-2144` for client registration information.
- Address if sourced: `32 Haggert Avenue North, Brampton, ON L6X 1Y3`.
- Coverage decision: local Brampton record with `primary_place_id: "brampton-on"` and local Brampton coverage.
- Duplicate decision: no matching provider, URL, phone, or address found in live data during the earlier duplicate review; draft ID is new and should not duplicate broad Ontario food-directory records.
- Unresolved fields: current registration workflow, final hours wording, whether the record should mention material supports beyond food, and whether any eligibility wording should be exposed.
- Approval status: approved and promoted to `data/services.json` as L1 on 2026-07-08.

## Brampton Multicultural Community Centre

- Official source: https://bmccentre.org/
- Secondary source: https://www.centralwesthealthline.ca/displayservice.aspx?id=60751
- Secondary source: https://211ontario.ca/service/69807602/agency/building-multicultural-communities/
- Evidence summary: The official site lists multiple service families, including settlement, employment, community connections, youth, mental health, and seniors services. It also lists public contact paths and office hours.
- Coverage decision: likely local Brampton for selected programs, but no single program-level record selected.
- Duplicate decision: no existing BMCC record found; still defer to avoid a broad organization card that blurs unrelated programs.
- Unresolved fields: selected program, intake path, eligibility, office/site choice, and whether the current first launch scope should include newcomer/community programs yet.
- Approval status: deferred.

## Catholic Crosscultural Services Brampton Office

- Official source: https://ccscan.ca/
- Official appointment source: https://ccscan.ca/get-started/request-appointment/
- Secondary source: https://211ontario.ca/service/69794614/catholic-crosscultural-services-catholic-crosscultural-services-brampton-office/
- Secondary source: https://www.centralwesthealthline.ca/displayservice.aspx?id=168575
- Evidence summary: Public sources identify a Brampton office, phone, address, settlement services, multilingual access, and an appointment form. The provider site presents a broader multi-location settlement organization.
- Coverage decision: likely local Brampton office or regional settlement-service record, depending on selected canonical shape.
- Duplicate decision: no existing Catholic Crosscultural Services Brampton record found; defer until office-level versus program-level shape is selected.
- Unresolved fields: exact Brampton office/public intake path, whether to use the appointment form or office phone as primary intake, and whether a newcomer-service record belongs in the next Brampton wave.
- Approval status: deferred.

## Punjabi Community Health Services

- Official source: https://pchs4u.com/
- Official location source: https://pchs4u.com/location.php
- Official program index: https://pchs4u.com/services.php
- Secondary source: https://211ontario.ca/service/80460330/pchs-pchs-brampton/
- Secondary source: https://www.centralwesthealthline.ca/displayService.aspx?id=151984
- Evidence summary: Public sources identify PCHS as offering culturally appropriate mental health, addiction, violence prevention, settlement, geriatric, youth/family, and community services, with multiple Brampton locations.
- Coverage decision: likely regional Peel or program-specific local Brampton, depending on the selected service.
- Duplicate decision: no existing PCHS record found; defer to avoid one broad card that combines distinct programs and intake paths.
- Unresolved fields: specific program, intake path, location, eligibility, and whether HART Hub Brampton should be reviewed separately.
- Approval status: deferred.

## Definition Of Done For Future Promotion

- [ ] Official/source URL still loads at promotion time.
- [ ] Secondary source is rechecked when available.
- [ ] Phone or intake path is verified.
- [ ] Address is omitted unless sourced.
- [ ] Coverage decision is explicit.
- [ ] Duplicate/canonical decision is recorded.
- [ ] Unresolved fields are listed or removed from the record.
- [ ] Human L1 approval is recorded before editing `data/services.json`.
