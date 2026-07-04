---
status: archived
last_updated: 2026-07-04
owner: jer
tags: [audit, data-quality, verification, closeout-prep]
---

# Service Verification Workplan - 2026-06-27

> [!NOTE]
> Superseded by the 2026-07-04 service freshness audit under
> `docs/audits/service-freshness/2026-07-04/`. This file remains as the
> historical queue snapshot from 2026-06-27, before many records crossed the
> 180-day visibility threshold.

This workplan organizes the current manual verification queue. It does not update service facts, verification dates, or provenance.

## Summary

- Total services in data/services.json: 196
- Services due for verification: 196
- Services stale over 180 days: 0
- Unknown verification date: 0
- First lane: Crisis services
- Governance boundary: update data/services.json only after manual verification evidence is recorded.

## Commands

```bash
npm run check-staleness
npm run validate-data
npm run audit:data
```

## Review Procedure

1. Start with the Crisis lane and issue #13.
2. Confirm phone, URL, hours, eligibility, address, fees, access script, and French content as applicable.
3. Record the evidence source and reviewer.
4. Only then update service facts and provenance in a separate data-change commit.
5. Re-run validation and search QA after any service-data change.

## Crisis (42)

| Priority        | Service ID                         | Service                                             | Current age | Notes                                         |
| --------------- | ---------------------------------- | --------------------------------------------------- | ----------- | --------------------------------------------- |
| 1 - crisis lane | `ontario-211-ontario`              | 211 Ontario                                         | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-988`                       | 9-8-8 Suicide Crisis Helpline                       | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `amhs-kfla-crisis-line`            | AMHS-KFLA 24/7 Crisis Line                          | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `assaulted-womens-helpline`        | Assaulted Women's Helpline (AWHL)                   | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-assaulted-womens-helpline` | Assaulted Women's Helpline (AWHL)                   | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-black-youth-helpline`     | Black Youth Helpline                                | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-boots-on-the-ground`      | Boots on the Ground                                 | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `coast-mental-health`              | COAST (Crisis Outreach)                             | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-connex-ontario`            | ConnexOntario                                       | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-text-line`                 | Crisis Text Line                                    | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `dawn-house-shelter`               | Dawn House Services and Housing for Women           | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-farmer-wellness`          | Farmer Wellness Initiative                          | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-femaide`                  | Fem'aide                                            | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-good2talk`                 | Good2Talk                                           | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `hope-for-wellness-helpline`       | Hope for Wellness Helpline                          | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-hope-for-wellness`         | Hope for Wellness Helpline                          | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-irs-crisis-line`          | Indian Residential Schools Crisis Line              | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `kids-help-phone`                  | Kids Help Phone                                     | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-kids-help-phone`           | Kids Help Phone                                     | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `kingston-detox-centre`            | Kingston Detoxification Centre (KHSC)               | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `kingston-interval-house`          | Kingston Interval House                             | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-lgbt-youthline`           | LGBT YouthLine                                      | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-metis-crisis-line`        | Métis Nation of Ontario Crisis Line                 | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-mmiwg-crisis-line`        | MMIWG Crisis Line                                   | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-naseeha`                  | Naseeha Mental Health                               | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-nors`                     | National Overdose Response Service (NORS)           | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-poison-control`            | Ontario Poison Centre                               | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-ontario-gambling`          | Ontario Problem Gambling Helpline                   | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-ontx-distress`            | ONTX - Ontario Online & Text Crisis Services        | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-seniors-safety-line`      | Seniors Safety Line                                 | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `sack-sexual-assault-centre`       | Sexual Assault Centre Kingston (SACK)               | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `sexual-assault-centre-kingston`   | Sexual Assault Centre Kingston (SACK)               | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-sadv-navigation`          | Sexual Assault/Domestic Violence Navigation Line    | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-male-survivors`           | Support Services for Male Survivors of Sexual Abuse | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-talk-suicide-canada`       | Talk Suicide Canada                                 | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-talk4healing`              | Talk4Healing                                        | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `telephone-aid-line-kingston-talk` | Telephone Aid Line Kingston (TALK)                  | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `trans-lifeline-canada`            | Trans Lifeline                                      | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `crisis-trans-lifeline`            | Trans Lifeline                                      | 175 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-vac-assistance`           | VAC Assistance Service                              | 169 days    | Verify manually before updating service facts |
| 1 - crisis lane | `victim-services-kingston`         | Victim Services of Kingston and Frontenac           | 174 days    | Verify manually before updating service facts |
| 1 - crisis lane | `ontario-victim-support-line`      | Victim Support Line (VSL)                           | 169 days    | Verify manually before updating service facts |

## Housing (9)

| Priority           | Service ID                       | Service                                | Current age | Notes                                         |
| ------------------ | -------------------------------- | -------------------------------------- | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `dawn-house-womens-shelter`      | Dawn House                             | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `elizabeth-fry-society-kingston` | Elizabeth Fry Society of Kingston      | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `habitat-for-humanity-kingston`  | Habitat for Humanity Kingston          | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `habitat-restore-kingston`       | Habitat for Humanity Kingston ReStore  | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `in-from-the-cold`               | In From the Cold Emergency Shelter     | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-home-base-housing`     | Kingston Home Base Non-Profit Housing  | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-youth-shelter`         | Kingston Youth Shelter                 | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `ryandale-shelter`               | Ryandale Transitional Housing          | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `salvation-army-housing-help`    | Salvation Army Housing Resource Centre | 174 days    | Verify manually before updating service facts |

## Food (15)

| Priority           | Service ID                      | Service                                          | Current age | Notes                                         |
| ------------------ | ------------------------------- | ------------------------------------------------ | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `student-food-bank-queens`      | AMS Food Bank (Queen's)                          | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `community-harvest-market`      | Community Harvest Market (Rideau Heights)        | 155 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `lionhearts-fresh-food-market`  | Lionhearts Fresh Food Market                     | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `loving-spoonful`               | Loving Spoonful                                  | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `lunch-by-george`               | Lunch by George (Outreach St. George's Kingston) | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `marthas-table-kingston`        | Martha's Table                                   | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `marthas-table`                 | Martha's Table                                   | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `memorial-centre-market`        | Memorial Centre Farmers Market                   | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `partners-in-mission-food-bank` | Partners in Mission Food Bank                    | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `salvation-army-cfs`            | Salvation Army Community & Family Services       | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `salvation-army-rideau-heights` | Salvation Army Rideau Heights Corps              | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `st-lawrence-food-pantry`       | SLC Food Pantry                                  | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `st-marys-cathedral-drop-in`    | St. Mary's Cathedral Drop-In Centre              | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `st-vincent-de-paul-kingston`   | St. Vincent de Paul Society of Kingston          | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `good-food-box-kingston`        | The Good Food Box Kingston                       | 174 days    | Verify manually before updating service facts |

## Health (41)

| Priority           | Service ID                              | Service                                                  | Current age | Notes                                                          |
| ------------------ | --------------------------------------- | -------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| 2 - quarterly lane | `alzheimer-society-kfla`                | Alzheimer Society KFL&A                                  | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `arthritis-society-canada`              | Arthritis Society Canada                                 | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `autism-ontario-east`                   | Autism Ontario (East Region)                             | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `bounceback-ontario`                    | BounceBack Ontario                                       | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `cancer-information-helpline`           | Cancer Information Helpline                              | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `cdk-family-medicine-walk-in`           | CDK Family Medicine and Walk-In Clinic                   | 174 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `cnib-kingston`                         | CNIB Foundation Kingston                                 | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `diabetes-canada-information-support`   | Diabetes Canada Information & Support                    | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `crisis-telehealth-ontario`             | Health811 (formerly Telehealth Ontario)                  | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `heart-and-stroke-foundation`           | Heart and Stroke Foundation                              | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `hospice-kingston`                      | Hospice Kingston (Providence Care)                       | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `hospice-palliative-care-ontario-hpco-` | Hospice Palliative Care Ontario (HPCO)                   | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `hotel-dieu-urgent-care`                | Hotel Dieu Hospital Urgent Care Centre (KHSC)            | 174 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `hotel-dieu-site`                       | Hotel Dieu Hospital Urgent Care Centre (KHSC)            | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kchc-iipct`                            | Indigenous Interprofessional Primary Care Team (IIPCT)   | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `integrated-care-hub`                   | Integrated Care Hub (ICH)                                | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `jordan-s-principle-call-centre`        | Jordan's Principle Call Centre                           | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kfl-public-health-vaccine`             | KFL&A Public Health - Immunization                       | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kfla-public-health-dental`             | KFL&A Public Health Dental Services                      | 174 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kfla-sexual-health-clinic`             | KFL&A Public Health: Sexual Health Clinic                | 174 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kfl-public-health-sexual`              | KFL&A Public Health: Sexual Health Clinic                | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kchc-weller-clinic`                    | Kingston Community Health Centres (KCHC) - Weller Clinic | 174 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kgh-emergency-department`              | Kingston General Hospital (KGH) Emergency Department     | 174 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kingston-general-hospital`             | Kingston General Hospital (KGH) Emergency Department     | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kingston-pregnancy-care`               | Kingston Pregnancy Care Centre                           | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `lung-health-line`                      | Lung Health Line                                         | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `maltby-centre-autism`                  | Maltby Centre                                            | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `march-of-dimes-kingston`               | March of Dimes Canada - Employment Services              | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `ms-knowledge-network-ms-canada-`       | MS Knowledge Network (MS Canada)                         | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `crisis-eating-disorders`               | National Eating Disorder Information Centre (NEDIC)      | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `ontario-caregiver-helpline`            | Ontario Caregiver Helpline                               | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `parkinson-canada`                      | Parkinson Canada                                         | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `pathways-for-children-youth`           | Pathways for Children and Youth (Merged)                 | 175 days    | Inactive/permanently closed; confirm archive status separately |
| 2 - quarterly lane | `providence-care-hospital`              | Providence Care Hospital                                 | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `sexual-health-infoline-ontario-shilo-` | Sexual Health Infoline Ontario (SHILO)                   | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `st-john-ambulance-kingston`            | St. John Ambulance                                       | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `street-health-centre`                  | Street Health Centre (KCHC)                              | 174 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `stroke-network-sneo`                   | Stroke Network of Southeastern Ontario                   | 175 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `talk-tobacco`                          | Talk Tobacco                                             | 169 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `kchc-transgender-health-care`          | Transgender Health Program (KCHC)                        | 174 days    | Verify manually before updating service facts                  |
| 2 - quarterly lane | `trellis-hiv-community-care`            | Trellis HIV & Community Care                             | 175 days    | Verify manually before updating service facts                  |

## Legal (26)

| Priority           | Service ID                                    | Service                                      | Current age | Notes                                         |
| ------------------ | --------------------------------------------- | -------------------------------------------- | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `aboriginal-legal-services-als-`              | Aboriginal Legal Services (ALS)              | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `advocacy-centre-for-the-elderly-ace-`        | Advocacy Centre for the Elderly (ACE)        | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `arch-disability-law`                         | ARCH Disability Law Centre                   | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `cleo-community-legal-education`              | CLEO (Community Legal Education Ontario)     | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `consumer-protection-ontario`                 | Consumer Protection Ontario                  | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `employment-standards-information-centre`     | Employment Standards Information Centre      | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `hiv-aids-legal-clinic-ontario-halco-`        | HIV & AIDS Legal Clinic Ontario (HALCO)      | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `human-rights-legal-support-centre-hrlsc-`    | Human Rights Legal Support Centre (HRLSC)    | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `injured-workers-community-legal-clinic-iwc-` | Injured Workers Community Legal Clinic (IWC) | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `justice-for-children-youth`                  | Justice for Children and Youth (JFCY)        | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `justice-for-children-and-youth-jfcy-`        | Justice for Children and Youth (JFCY)        | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `community-legal-clinic-kingston`             | Kingston Community Legal Clinic              | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `legal-aid-ontario-kingston`                  | Kingston Community Legal Clinic              | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `landlord-and-tenant-board-contact-centre`    | Landlord and Tenant Board Contact Centre     | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `landlord-s-self-help-centre`                 | Landlord's Self-Help Centre                  | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `law-society-referral-service`                | Law Society Referral Service                 | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `legal-aid-ontario`                           | Legal Aid Ontario                            | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `nishnawbe-aski-legal-services-nalsc-`        | Nishnawbe-Aski Legal Services (NALSC)        | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `office-of-the-worker-adviser-owa-`           | Office of the Worker Adviser (OWA)           | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `ontario-legal-information-centre`            | Ontario Legal Information Centre             | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `pro-bono-ontario`                            | Pro Bono Ontario                             | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `queens-legal-aid`                            | Queen's Legal Aid                            | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `legal-clinic-queens`                         | Queen's Legal Aid                            | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `steps-to-justice`                            | Steps to Justice                             | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `workers-health-safety-legal-clinic`          | Workers Health & Safety Legal Clinic         | 169 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `wsib-workplace-safety-insurance-board-`      | WSIB (Workplace Safety & Insurance Board)    | 169 days    | Verify manually before updating service facts |

## Financial (4)

| Priority           | Service ID                | Service                                                        | Current age | Notes                                         |
| ------------------ | ------------------------- | -------------------------------------------------------------- | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `ontario-works-kingston`  | City of Kingston - Housing and Social Services (Ontario Works) | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `ontario-works-kb`        | City of Kingston - Housing and Social Services (Ontario Works) | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `odsp-kingston`           | ODSP Kingston Office                                           | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `service-canada-kingston` | Service Canada Centre                                          | 175 days    | Verify manually before updating service facts |

## Employment (8)

| Priority           | Service ID               | Service                                                | Current age | Notes                                         |
| ------------------ | ------------------------ | ------------------------------------------------------ | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `acls-kingston`          | ACFOMI                                                 | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `acfomi-kingston`        | ACFOMI (Association canadienne-française de l'Ontario) | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `jobwell-kingston`       | Jobwell                                                | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `keys-job-centre`        | KEYS Job Centre                                        | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `keys-job-centre-2`      | KEYS Job Centre                                        | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `restart-kingston`       | ReStart Employment Services                            | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `re-start-employment`    | ReStart Employment Services                            | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `slc-employment-service` | St. Lawrence College Employment Service                | 175 days    | Verify manually before updating service facts |

## Indigenous (3)

| Priority           | Service ID                              | Service                                          | Current age | Notes                                         |
| ------------------ | --------------------------------------- | ------------------------------------------------ | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `four-directions-indigenous-centre`     | Four Directions Indigenous Student Centre        | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kfla-indigenous-health-team`           | KFL&A Indigenous Primary Health Care Team        | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-indigenous-friendship-centre` | Kingston Native Centre and Language Nest (KNCLN) | 175 days    | Verify manually before updating service facts |

## Transport (2)

| Priority           | Service ID                    | Service                                 | Current age | Notes                                         |
| ------------------ | ----------------------------- | --------------------------------------- | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `kingston-transit-mfap`       | Kingston Transit Affordable Pass (MFAP) | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `von-transportation-kingston` | VON Transportation Services             | 175 days    | Verify manually before updating service facts |

## Education (5)

| Priority           | Service ID                   | Service                                 | Current age | Notes                                         |
| ------------------ | ---------------------------- | --------------------------------------- | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `geneva-centre-autism`       | Geneva Centre for Autism (Virtual)      | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kfpl-learning-programs`     | KFPL Learning Programs                  | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-literacy-skills`   | Kingston Literacy & Skills              | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-literacy-skills-2` | Kingston Literacy & Skills              | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `slc-academic-upgrading`     | St. Lawrence College Academic Upgrading | 175 days    | Verify manually before updating service facts |

## Community (34)

| Priority           | Service ID                           | Service                                            | Current age | Notes                                         |
| ------------------ | ------------------------------------ | -------------------------------------------------- | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `crisis-211-ontario`                 | 211 Ontario                                        | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `bgc-south-east`                     | BGC South East                                     | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `boys-girls-club-kingston`           | BGC South East (Boys & Girls Club)                 | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `red-cross-kingston`                 | Canadian Red Cross - Kingston                      | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `community-foundation-kingston`      | Community Foundation for Kingston & Area           | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `community-living-kingston`          | Community Living Kingston and District             | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `earlyon-cosy`                       | EarlyON Child and Family Centre                    | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `earlyon-kchc`                       | EarlyON Child and Family Centre (KCHC)             | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `hart-centre`                        | H'art Centre                                       | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kfla-children-services`             | KFL&A Children's Services                          | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kfpl-calvin-park`                   | KFPL - Calvin Park Branch                          | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kfpl-isabel-turner`                 | KFPL - Isabel Turner Branch                        | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kfpl-pittsburgh`                    | KFPL - Pittsburgh Branch                           | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kfpl-rideau-heights`                | KFPL - Rideau Heights Branch                       | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-access-bus`                | Kingston Access Services (Access Bus)              | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kfpl-central-branch`                | Kingston Frontenac Public Library - Central Branch | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-humane-society`            | Kingston Humane Society                            | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kmfrc`                              | Kingston Military Family Resource Centre (KMFRC)   | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-military-family-resource`  | Kingston Military Family Resource Centre (KMFRC)   | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kiln-language-nest`                 | Kingston Native Centre and Language Nest (KNCLN)   | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-police-non-emerg`          | Kingston Police (Non-Emergency)                    | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `metis-nation-ontario-kingston`      | Métis Nation of Ontario (Kingston Office)          | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `one-roof-youth-hub`                 | One Roof Kingston Youth Hub                        | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `ongwanada`                          | Ongwanada                                          | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `opp-frontenac`                      | OPP Frontenac Detachment                           | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `crisis-pflag-canada`                | PFLAG Canada                                       | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `rideau-heights-community-centre`    | Rideau Heights Community Centre                    | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `rural-frontenac-community-services` | Rural Frontenac Community Services                 | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `seniors-association-kingston`       | Seniors Association Kingston Region                | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `service-ontario-kingston`           | ServiceOntario                                     | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `south-frontenac-community-services` | Southern Frontenac Community Services              | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `tnet-kingston`                      | TransFamily Kingston                               | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `iska-newcomer-support`              | Trellis HIV & Community Care                       | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `united-way-kfla-office`             | United Way KFL&A                                   | 175 days    | Verify manually before updating service facts |

## Wellness (7)

| Priority           | Service ID                       | Service                             | Current age | Notes                                         |
| ------------------ | -------------------------------- | ----------------------------------- | ----------- | --------------------------------------------- |
| 2 - quarterly lane | `artillery-park-aquatic-centre`  | Artillery Park Aquatic Centre       | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `invista-centre`                 | INVISTA Centre                      | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `kingston-east-community-centre` | Kingston East Community Centre      | 175 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `maltby-centre-mental-health`    | Maltby Centre                       | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `resolve-counselling`            | Resolve Counselling Services Canada | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `ymca-eastern-ontario`           | YMCA of Eastern Ontario - Kingston  | 174 days    | Verify manually before updating service facts |
| 2 - quarterly lane | `ymca-kingston`                  | YMCA of Eastern Ontario - Kingston  | 175 days    | Verify manually before updating service facts |
