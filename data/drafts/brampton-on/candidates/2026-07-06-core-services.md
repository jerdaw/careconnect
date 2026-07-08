# Brampton Core Services Draft Candidates

Date: 2026-07-06
Status: draft research only

These candidates are not live CareConnect service records. They require L1 review before any record can be added to `data/services.json`.

## Candidate Summary

| Candidate                                             | Category                     | Coverage Guess                         | Confidence  | L1 Status       | Duplicate Risk                                                                                   |
| ----------------------------------------------------- | ---------------------------- | -------------------------------------- | ----------- | --------------- | ------------------------------------------------------------------------------------------------ |
| Peel Centralized Shelter Intake                       | Housing / Crisis             | Regional, Peel Region serving Brampton | High        | needs_l1_review | Low; no existing Peel shelter intake record found                                                |
| Wilkinson Road Shelter                                | Housing                      | Local, Brampton                        | High        | needs_l1_review | Low; no existing Brampton shelter record found                                                   |
| Victim Services of Peel                               | Crisis                       | Regional, Peel Region serving Brampton | High        | needs_l1_review | Medium; same service type as existing Kingston victim-services record, different provider/region |
| Safe Centre of Peel                                   | Crisis / Legal / Community   | Local or regional, Brampton/Peel       | High        | needs_l1_review | Low; no existing Safe Centre of Peel record found                                                |
| Region of Peel Ontario Works and Emergency Assistance | Financial / Housing          | Regional, Peel Region serving Brampton | High        | needs_l1_review | Medium; same program type as Kingston Ontario Works, different municipal delivery agent          |
| Regeneration Marketplace Food Bank                    | Food                         | Local, Brampton                        | High        | needs_l1_review | Low; no existing Regeneration record found                                                       |
| Knights Table Food Bank and Meal Programs             | Food                         | Local, Brampton                        | High        | needs_l1_review | Low; no existing Knights Table record found                                                      |
| Ste. Louise Outreach Centre of Peel                   | Food / Community             | Local, Brampton                        | Medium-high | needs_l1_review | Low; no existing Ste. Louise record found                                                        |
| Brampton Multicultural Community Centre               | Newcomer / Community         | Local, Brampton                        | Medium-high | needs_l1_review | Low; no existing BMCC record found                                                               |
| Catholic Crosscultural Services Brampton Office       | Newcomer / Community         | Local, Brampton                        | High        | needs_l1_review | Low; no existing CCS Brampton record found                                                       |
| Punjabi Community Health Services                     | Health / Wellness / Newcomer | Local or regional, Brampton/Peel       | Medium-high | needs_l1_review | Low; no existing PCHS record found                                                               |

## Existing Broad Records To Reuse, Not Duplicate

The existing directory already includes broad records that appear relevant to a Brampton launch:

- `crisis-988` / `988 Suicide Crisis Helpline`
- `crisis-connex-ontario` / `ConnexOntario`
- `crisis-kids-help-phone` and `kids-help-phone` / `Kids Help Phone`
- `crisis-telehealth-ontario` / `Health811`
- `crisis-211-ontario` and `ontario-211-ontario` / `211 Ontario`
- `ontario-victim-support-line` / `Victim Support Line`

These should be reused or canonicalized rather than duplicated as Brampton-local services.

## Candidates

### Peel Centralized Shelter Intake

- Category: Housing / Crisis
- Candidate service/program: Centralized shelter intake and homelessness support access
- Provider: Region of Peel
- Coverage draft:

```json
[
  {
    "kind": "regional",
    "placeIds": ["brampton-on"],
    "regionIds": ["peel-region"],
    "label": "Peel Region"
  }
]
```

- Why core: Emergency shelter intake is a core first-launch path for someone in Brampton without a safe place to stay.
- Evidence summary: Region/211 sources describe a centralized Peel shelter access path and Peel-region shelter system used by people seeking emergency housing support, including Brampton residents.
- Known contact:
  - Phone: `905-450-1996`
  - URL: `https://peelregion.ca/housing-social-support/help-housing`
  - Address: `UNKNOWN`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: `UNKNOWN`
  - Access process: Call the centralized shelter intake path; L1 reviewer must confirm the current intake wording and hours.
- Source URLs:
  - https://peelregion.ca/housing-social-support/help-housing
  - https://211ontario.ca/service/65655888/centralized-shelter-intake-peel-region/
- Possible duplicates:
  - No existing Peel shelter intake record found in `data/services.json`.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Wilkinson Road Shelter

- Category: Housing
- Candidate service/program: Wilkinson Road Shelter
- Provider: Region of Peel / Peel shelter system
- Coverage draft:

```json
[
  {
    "kind": "local",
    "placeIds": ["brampton-on"],
    "label": "Brampton"
  }
]
```

- Why core: A Brampton emergency shelter record is important for the initial housing-crisis launch set.
- Evidence summary: Public shelter listings identify Wilkinson Road Shelter as a Brampton emergency shelter connected to the Peel shelter system.
- Known contact:
  - Phone: `905-450-1996`
  - URL: `https://peelregion.ca/business/housing-development/wilkinson-shelter`
  - Address: `15 Wilkinson Road, Brampton, ON`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: `UNKNOWN`
  - Access process: L1 reviewer should confirm whether access goes through centralized shelter intake or direct shelter contact.
- Source URLs:
  - https://peelregion.ca/business/housing-development/wilkinson-shelter
  - https://211ontario.ca/service/65655913/wilkinson-road-shelter-emergency-shelter/
- Possible duplicates:
  - No existing Brampton shelter record found in `data/services.json`.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Victim Services of Peel

- Category: Crisis
- Candidate service/program: Victim crisis support and referrals
- Provider: Victim Services of Peel
- Coverage draft:

```json
[
  {
    "kind": "regional",
    "placeIds": ["brampton-on"],
    "regionIds": ["peel-region"],
    "label": "Peel Region"
  }
]
```

- Why core: Victim crisis support is a high-priority safety service for people experiencing violence, crime, trauma, or sudden crisis.
- Evidence summary: The provider presents itself as serving Peel and lists a 24-hour crisis line, with a public office in Brampton/Mississauga-area Peel service context.
- Known contact:
  - Phone: `905-568-1068`
  - URL: `https://vspeel.org/`
  - Address: `7750 Hurontario Street, Brampton, ON L6V 3W6`
- Known access:
  - Hours: 24-hour crisis line listed by provider; office hours require L1 confirmation.
  - Eligibility: People affected by crime, tragedy, or trauma in Peel; L1 reviewer must confirm wording.
  - Access process: Call the crisis line or use provider contact paths.
- Source URLs:
  - https://vspeel.org/
  - https://vspeel.org/contact/
- Possible duplicates:
  - Similar service type to `victim-services-kingston`; different provider, phone, URL, and service area.
  - Broad `ontario-victim-support-line` exists and should remain canonical for Ontario-wide support.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Safe Centre of Peel

- Category: Crisis / Legal / Community
- Candidate service/program: Safe Centre of Peel
- Provider: Safe Centre of Peel
- Coverage draft:

```json
[
  {
    "kind": "regional",
    "placeIds": ["brampton-on"],
    "regionIds": ["peel-region"],
    "label": "Peel Region"
  }
]
```

- Why core: A family-violence and safety-navigation hub is a core crisis-adjacent service for a small Brampton launch set.
- Evidence summary: Public sources identify Safe Centre of Peel as a Brampton-based service hub for people experiencing violence and abuse, with multi-agency support.
- Known contact:
  - Phone: `905-450-4650`
  - URL: `https://scopeel.org/`
  - Address: `60 West Drive, Suite 110, Brampton, ON`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: People experiencing abuse or violence in Peel; L1 reviewer must confirm exact public wording.
  - Access process: Call or use provider contact paths; L1 reviewer should confirm crisis/intake extension details.
- Source URLs:
  - https://scopeel.org/
  - https://scopeel.org/contact-us/
  - https://211ontario.ca/service/69808419/safe-centre-of-peel-safe-centre-of-peel/
- Possible duplicates:
  - No existing Safe Centre of Peel record found in `data/services.json`.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Region of Peel Ontario Works and Emergency Assistance

- Category: Financial / Housing
- Candidate service/program: Ontario Works and emergency assistance
- Provider: Region of Peel
- Coverage draft:

```json
[
  {
    "kind": "regional",
    "placeIds": ["brampton-on"],
    "regionIds": ["peel-region"],
    "label": "Peel Region"
  }
]
```

- Why core: Income support and emergency assistance are core navigation needs for people in financial crisis.
- Evidence summary: Region of Peel public pages describe Ontario Works financial assistance and emergency assistance access for Peel residents.
- Known contact:
  - Phone: `905-793-9200`
  - URL: `https://peelregion.ca/services/ontario-works-or-emergency-assistance`
  - Address: `UNKNOWN`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: Peel residents seeking Ontario Works or emergency assistance; L1 reviewer must confirm exact eligibility wording.
  - Access process: Use Region of Peel application/contact paths; L1 reviewer should confirm current application steps.
- Source URLs:
  - https://peelregion.ca/services/ontario-works-or-emergency-assistance
  - https://peelregion.ca/housing-social-support/financial-social-support
  - https://peelregion.ca/services/social-assistance-information-updates
- Possible duplicates:
  - Same program type as `ontario-works-kingston` and `ontario-works-kb`, but different municipal/regional delivery agent and contact path.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Regeneration Marketplace Food Bank

- Category: Food
- Candidate service/program: Regeneration Marketplace Food Bank
- Provider: Regeneration Outreach Community
- Coverage draft:

```json
[
  {
    "kind": "local",
    "placeIds": ["brampton-on"],
    "label": "Brampton"
  }
]
```

- Why core: Food access is one of the minimum launch categories, and this appears to be a Brampton-local food support path.
- Evidence summary: Provider pages identify Regeneration Outreach Community as a Brampton organization and describe Marketplace Food Bank food support.
- Known contact:
  - Phone: `905-796-5888 ext. 4000`
  - URL: `https://regenbrampton.com/`
  - Address: `253 Queen Street East, Brampton, ON L6W 2B8`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: `UNKNOWN`
  - Access process: L1 reviewer should confirm current food bank registration, hours, and whether service is appointment-based.
- Source URLs:
  - https://regenbrampton.com/
  - https://regenbrampton.com/service/marketplace/
  - https://regenbrampton.com/location/regeneration-marketplace/
- Possible duplicates:
  - No existing Regeneration record found in `data/services.json`.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Knights Table Food Bank and Meal Programs

- Category: Food
- Candidate service/program: Food bank and meal programs
- Provider: Knights Table
- Coverage draft:

```json
[
  {
    "kind": "local",
    "placeIds": ["brampton-on"],
    "label": "Brampton"
  }
]
```

- Why core: A Brampton food bank and meal program belongs in the first small launch set if current access details are confirmed.
- Evidence summary: Provider and health-directory sources identify Knights Table as a Brampton organization offering food bank and meal supports.
- Known contact:
  - Phone: `905-454-8725`
  - URL: `https://knightstable.org/`
  - Address: `287 Glidden Road, Unit 4, Brampton, ON`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: `UNKNOWN`
  - Access process: L1 reviewer should confirm current food bank registration and meal access process.
- Source URLs:
  - https://knightstable.org/
  - https://www.centralwesthealthline.ca/displayservice.aspx?id=61127
- Possible duplicates:
  - No existing Knights Table record found in `data/services.json`.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Ste. Louise Outreach Centre of Peel

- Category: Food / Community
- Candidate service/program: Food bank and outreach supports
- Provider: Ste. Louise Outreach Centre of Peel
- Coverage draft:

```json
[
  {
    "kind": "local",
    "placeIds": ["brampton-on"],
    "label": "Brampton"
  }
]
```

- Why core: Local food and material-support access is a priority for Brampton's first reviewed dataset.
- Evidence summary: Public sources identify Ste. Louise Outreach Centre of Peel as a Brampton-based outreach and food bank provider.
- Known contact:
  - Phone: `905-454-2144`
  - URL: `https://stelouisefoodbank.ca/`
  - Address: `32 Haggert Avenue North, Brampton, ON`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: `UNKNOWN`
  - Access process: L1 reviewer should confirm current food bank registration and distribution hours.
- Source URLs:
  - https://stelouisefoodbank.ca/
  - https://211ontario.ca/service/69498952/ste-louise-outreach-centre-of-peel-food-bank/
- Possible duplicates:
  - No existing Ste. Louise record found in `data/services.json`.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Brampton Multicultural Community Centre

- Category: Newcomer / Community
- Candidate service/program: Settlement and community supports
- Provider: Brampton Multicultural Community Centre
- Coverage draft:

```json
[
  {
    "kind": "local",
    "placeIds": ["brampton-on"],
    "label": "Brampton"
  }
]
```

- Why core: Newcomer and settlement support is part of the approved first Brampton launch scope.
- Evidence summary: Public sources identify BMCC as a Brampton community organization offering newcomer and settlement-related supports.
- Known contact:
  - Phone: `905-790-8482`
  - URL: `https://bmccentre.org/`
  - Address: `263 Queen Street East, Unit 10, Brampton, ON`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: Newcomer/settlement eligibility requires L1 confirmation from current source pages.
  - Access process: L1 reviewer should confirm current intake paths and office/service hours.
- Source URLs:
  - https://bmccentre.org/
  - https://www.centralwesthealthline.ca/displayservice.aspx?id=60751
  - https://211ontario.ca/service/69807602/agency/building-multicultural-communities/
- Possible duplicates:
  - No existing BMCC record found in `data/services.json`.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

### Catholic Crosscultural Services Brampton Office

- Category: Newcomer / Community
- Candidate service/program: Settlement and newcomer services
- Provider: Catholic Crosscultural Services
- Coverage draft:

```json
[
  {
    "kind": "local",
    "placeIds": ["brampton-on"],
    "label": "Brampton"
  }
]
```

- Why core: Settlement and newcomer support is part of the approved first Brampton launch scope, and this is a directly listed Brampton office.
- Evidence summary: 211 Ontario and settlement-directory sources identify a Catholic Crosscultural Services Brampton office with public contact details and newcomer/settlement service context.
- Known contact:
  - Phone: `905-457-7740`
  - URL: `https://www.ccscan.ca/`
  - Address: `164 Queen Street East, Suite 306, Brampton, ON L6V 1B4`
- Known access:
  - Hours: 211 Ontario lists weekday office hours; L1 reviewer should confirm current hours on the provider or 211 page before live entry.
  - Eligibility: Newcomer/settlement eligibility requires L1 confirmation from current source pages.
  - Access process: Call or use provider intake/contact paths; L1 reviewer should confirm whether program-specific records are needed.
- Source URLs:
  - https://211ontario.ca/service/69794614/catholic-crosscultural-services-catholic-crosscultural-services-brampton-office/
  - https://211ontario.ca/service/69794612/site/
  - https://services.settlement.org/en/peel/finding-a-job/catholic-crosscultural-services-catholic-crosscultural-services-brampton-office/
  - https://www.ccscan.ca/
- Possible duplicates:
  - No existing CCS Brampton record found in `data/services.json`.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm whether a single office record or narrower program records are appropriate

### Punjabi Community Health Services

- Category: Health / Wellness / Newcomer
- Candidate service/program: Community health, mental health, addictions, and settlement supports
- Provider: Punjabi Community Health Services
- Coverage draft:

```json
[
  {
    "kind": "regional",
    "placeIds": ["brampton-on"],
    "regionIds": ["peel-region"],
    "label": "Peel Region"
  }
]
```

- Why core: PCHS appears relevant to mental health, addictions, newcomer, and culturally responsive support needs in Brampton/Peel.
- Evidence summary: Provider and public-directory sources identify PCHS as delivering community health and support services with a Brampton presence.
- Known contact:
  - Phone: `905-677-0889`
  - URL: `https://pchs4u.com/`
  - Address: `60 West Drive, Brampton, ON`
- Known access:
  - Hours: `UNKNOWN`
  - Eligibility: Program-specific eligibility varies and requires L1 confirmation.
  - Access process: L1 reviewer should identify the specific public program page before converting this into one or more live service records.
- Source URLs:
  - https://pchs4u.com/
  - https://pchs4u.com/location.php
  - https://211ontario.ca/service/80460330/pchs-pchs-brampton/
- Possible duplicates:
  - No existing PCHS record found in `data/services.json`.
  - This may need multiple narrower records if programs have distinct intake paths.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm whether a single organization-level record or multiple program records are appropriate
