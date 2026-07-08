# Brampton L2 Verification Review

Date: 2026-07-08
Status: live-data updates approved/applied locally; production sync requires the bounded Brampton sync path

## Summary

Six of the original seven Brampton launch records have enough current public-source evidence for L2 under the CareConnect standard: official source plus stronger cross-source verification resolving key service details. Knights Table remains L1 because its official site and 211 records currently disagree on the active program address. Ste. Louise is promoted as an approved L1 food-bank record and should be reviewed for L2 after the registration workflow is rechecked.

No record is L3. No provider or authorized representative has confirmed these records directly, and no formal provider relationship has been approved.

## L2 Decisions

| Record                                                | Decision      | Source Basis                                                                                                                                                                                                                                                  | Remaining Caveat                                                                                                   |
| ----------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Peel Centralized Shelter Intake and Homeless Supports | Upgrade to L2 | Peel Region shelter page confirms the 905-450-1996 intake line, Peel shelter access, and regional shelter context. 211 Ontario confirms 24/7 intake, street helpline, address, eligibility, and Peel service area.                                            | Street outreach remains contextual unless split into its own reviewed record.                                      |
| Wilkinson Road Shelter                                | Upgrade to L2 | Peel Region shelter page names Wilkinson Shelter for adult men 25 years or older in Brampton and directs shelter seekers to Central Intake. 211 Central confirms screening before intake, address, 24/7 shelter hours, site office, and Peel service area.    | Keep Central Intake as the primary public phone; site office is not the intake phone.                              |
| Victim Services of Peel                               | Upgrade to L2 | Provider site confirms 24/7 crisis line, Brampton mailing address, administration phone, and service purpose. ONVSP and Peel Police public references align on provider identity and crisis phone.                                                            | Do not describe this as a partnership or L3 provider-confirmed record.                                             |
| Safe Centre of Peel                                   | Upgrade to L2 | Provider contact page confirms Brampton location, 905-450-4650, urgent after-hours route, and safety messaging. 211 Central confirms service description, eligibility, hours, crisis routing, address, and Peel service area.                                 | Partner-specific services remain represented inside the hub record unless separately reviewed.                     |
| Region of Peel Ontario Works and Emergency Assistance | Upgrade to L2 | Peel Region page resolves Ontario Works and emergency-assistance eligibility, online/phone application paths, Brampton/Mississauga phone, toll-free line, and application-status routing. Directory sources align on regional Human Services contact details. | No office-level walk-in record is added.                                                                           |
| Regeneration Marketplace Food Bank                    | Upgrade to L2 | Provider marketplace page and 211 Central align on food-bank purpose, 253 Queen St E location, marketplace phone extension, email, hours, ID requirement, and food-bank coverage.                                                                             | Provider page and 211 differ on whether appointment language should be emphasized; live copy remains conservative. |

## Retained L1

| Record                                        | Decision           | Reason                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Knights Table Food Bank and Meal Programs     | Keep L1            | Official provider contact page and move notice list 73 Hale Road. 211 Central and 211 Ontario continue to list pantry, meal, and agency records at 287 Glidden Road, Unit 4. This needs direct provider/directory correction review before L2 or a program split. |
| Ste. Louise Outreach Centre of Peel Food Bank | Promote to live L1 | Official contact/registration pages and 211 Central align on core food-bank facts. Registration workflow still needs a final recheck before any L2 upgrade because the official page emphasizes emailed documents while 211 says register in person.              |

## Source URLs

- Peel Region shelters: https://peelregion.ca/housing-social-support/homeless-support/shelters
- Peel Centralized Shelter Intake, 211 Ontario: https://211ontario.ca/service/78231605/peel-region-housing-and-shelter-peel-centralized-shelter-intake-and-homeless-supports/
- Wilkinson Road Shelter, 211 Central: https://211central.ca/record/73523437/
- Victim Services of Peel: https://www.vspeel.org/
- ONVSP Victim Services of Peel: https://victimservicesontario.ca/store/victim-services-of-peel/
- Peel Police Victim Services: https://www.peelpolice.ca/community-safety/victim-services/
- Safe Centre of Peel contact: https://scopeel.org/contact-us/
- Safe Centre of Peel, 211 Central: https://211central.ca/record/69808419/
- Region of Peel Ontario Works and Emergency Assistance: https://peelregion.ca/services/ontario-works-or-emergency-assistance
- Regeneration Marketplace: https://regenbrampton.com/service/marketplace/
- Regeneration Marketplace, 211 Central: https://211central.ca/record/71891572/
- Knights Table contact: https://knightstable.org/contact-us/
- Knights Table Our Pantry, 211 Central: https://211central.ca/record/71926537/
- Ste. Louise contact: https://stelouisefoodbank.ca/contact-us
- Ste. Louise registration: https://stelouisefoodbank.ca/registration
- Ste. Louise Food Bank, 211 Central: https://211central.ca/record/69807287/

## Production Sync Scope

When production is synced, the exact approved Brampton live set is:

1. `brampton-peel-centralized-shelter-intake`
2. `brampton-wilkinson-road-shelter`
3. `brampton-victim-services-of-peel`
4. `brampton-safe-centre-of-peel`
5. `brampton-peel-ontario-works-emergency-assistance`
6. `brampton-regeneration-marketplace-food-bank`
7. `brampton-knights-table-food-bank-meals`
8. `brampton-ste-louise-food-bank`

Definition of done for production: the bounded sync writes only these IDs, all have `primary_place_id = 'brampton-on'`, all have explicit `coverage`, all have embeddings, and any rollback SQL is prepared before a rollback is executed.
