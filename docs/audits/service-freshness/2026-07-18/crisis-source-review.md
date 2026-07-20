---
status: draft
last_updated: 2026-07-18
owner: jer
tags: [audit, data-quality, verification, crisis-services]
---

# Crisis Service Public-Source Review

## Purpose

This packet records a public-source review of the 42 Crisis records that were
stale in the 2026-07-13 freshness snapshot. It is a preparation artifact for
manual reverification, not evidence that a service was reached.

No phone calls, provider emails, or partner confirmations were made during this
review. No service facts, verification dates, verification levels, or provenance
were changed. The two fresh Brampton Crisis records are outside this queue.

## Review Labels

- **Public source aligned**: the provider or responsible public authority still
  publishes the record's core phone and availability facts. Manual L1 completion
  is still required under the verification protocol.
- **Correction candidate**: a current public source conflicts with a material
  record fact. Confirm the proposed correction through the governed workflow
  before editing `data/services.json`.
- **Direct confirmation required**: current public evidence is incomplete,
  internally inconsistent, or does not establish that the listed service remains
  reachable as described.
- **Duplicate review**: the facts may be current, but the record overlaps another
  record and should be reconciled to prevent confusing search results.

## Priority Correction Candidates

| Priority | Record                                           | Public-source finding                                                                                                                                                                                                                                                     | Governed next action                                                                                                                                                                             |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0       | `dawn-house-shelter`                             | Dawn House now identifies Walnut View Emergency Shelter at 2320 Princess Street and publishes 613-766-6222 / 613-929-3440 for shelter access. The record points to 965 Milford Drive and 613-545-1379, which the provider associates with transitional/permanent housing. | Call the provider, confirm the current emergency-shelter access path and hours, then correct the phone, address, description, structured hours, URL, and provenance together.                    |
| P0       | `crisis-poison-control`                          | Ontario Poison Centre publishes 1-844-764-7669 for the public. The record's 1-800-268-9017 is identified by the Centre as a health-care-provider number.                                                                                                                  | Confirm the public number and whether the professional number should be retained in access notes; then correct the primary phone.                                                                |
| P0       | `ontario-lgbt-youthline`                         | YouthLine currently offers text and chat Sunday-Friday, 4:00-9:30 PM ET, says the HelpLine does not take phone calls, and says volunteers are not trained for crisis intervention. The record lists a phone number and is categorized as Crisis.                          | Confirm the current channels, remove the obsolete helpline phone, and review whether the record belongs in Community or Health instead of Crisis. Do not present it as immediate crisis support. |
| P1       | `crisis-trans-lifeline`, `trans-lifeline-canada` | Trans Lifeline publishes Monday-Friday, 10:00 AM-6:00 PM Pacific (1:00-9:00 PM Eastern). Both records say 2:00-10:00 PM ET and contain older structured hours.                                                                                                            | Confirm the current schedule, update both records consistently, and complete the duplicate review.                                                                                               |
| P1       | `coast-mental-health`                            | AMHS-KFLA confirms the crisis line is 24/7, but publishes mobile-crisis response hours of Monday-Friday 8:00 AM-midnight and weekends/holidays 8:00 AM-8:00 PM. The record can be read as saying mobile dispatch itself is 24/7.                                          | Confirm COAST dispatch coverage and distinguish line availability from mobile-team hours in both structured and plain-language hours.                                                            |
| P1       | `ontario-metis-crisis-line`                      | The MNO's current mental-health page no longer publishes the listed 1-877-767-7572 crisis line and instead presents program intake plus 9-8-8 and Hope for Wellness. Other Ontario public-sector pages still list the legacy number.                                      | Directly confirm the line with MNO before retaining, replacing, or retiring the record. Do not refresh its date from web evidence alone.                                                         |
| P2       | `ontario-nors`                                   | NORS currently publishes call/text access at 1-888-688-6677, but its public site does not establish the record's 24/7 claim.                                                                                                                                              | Confirm hours directly and retain the record as stale until availability is established.                                                                                                         |
| P2       | `crisis-talk-suicide-canada`                     | Current federal pages inconsistently continue to mention 1-833-456-4566, while 9-8-8 is now the primary national suicide crisis service. The record also overlaps `crisis-988`.                                                                                           | Confirm whether the legacy line remains an independently supported access path and reconcile the duplicate/supersession relationship.                                                            |

## Record-by-Record Matrix

| Record                             | Result                                         | Current public evidence and follow-up                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `amhs-kfla-crisis-line`            | Public source aligned                          | AMHS-KFLA publishes 613-544-4229, 1-866-616-6005, and 24/7 crisis-line availability.                                                                                           |
| `assaulted-womens-helpline`        | Public source aligned; duplicate review        | AWHL publishes 1-866-863-0511, #SAFE, TTY access, and 24/7 availability. Reconcile with `crisis-assaulted-womens-helpline`.                                                    |
| `coast-mental-health`              | Correction candidate                           | Crisis-line number is aligned; mobile-response hours need separate wording and confirmation.                                                                                   |
| `crisis-988`                       | Public source aligned                          | 9-8-8 publishes call and text service 24/7/365.                                                                                                                                |
| `crisis-assaulted-womens-helpline` | Public source aligned; duplicate review        | Core facts align with AWHL; reconcile with `assaulted-womens-helpline`.                                                                                                        |
| `crisis-connex-ontario`            | Public source aligned                          | ConnexOntario publishes 1-866-531-2600 and 24/7/365 phone, chat, text, and email access.                                                                                       |
| `crisis-good2talk`                 | Public source aligned                          | Good2Talk publishes 1-866-925-5454 and text access for Ontario post-secondary students, 24/7.                                                                                  |
| `crisis-hope-for-wellness`         | Public source aligned; duplicate review        | Hope for Wellness publishes 1-855-242-3310 and 24/7 phone/chat access. Reconcile with `hope-for-wellness-helpline`.                                                            |
| `crisis-kids-help-phone`           | Public source aligned; duplicate review        | Phone and text facts align. The provider's current page contains conflicting live-chat-hour copy, so chat hours require direct confirmation. Reconcile with `kids-help-phone`. |
| `crisis-ontario-gambling`          | Public source aligned; duplicate review        | ConnexOntario publishes the listed line and 24/7 availability; reconcile the overlapping ConnexOntario records without losing the gambling-specific intent.                    |
| `crisis-poison-control`            | Correction candidate                           | Public and health-care-provider phone numbers are reversed in the current record context.                                                                                      |
| `crisis-talk4healing`              | Public source aligned                          | Beendigen publishes call/text 1-855-554-4325 and 24/7 service. Do not confuse it with Beendigen's separate crisis-response line.                                               |
| `crisis-talk-suicide-canada`       | Direct confirmation required; duplicate review | Legacy number remains on some federal pages, but 9-8-8 is the current primary service. Confirm routing and lifecycle.                                                          |
| `crisis-text-line`                 | Public source aligned; duplicate review        | Kids Help Phone publishes 686868 for 24/7 text support. Reconcile overlap with the Kids Help Phone records.                                                                    |
| `crisis-trans-lifeline`            | Correction candidate; duplicate review         | Phone aligns; hours are outdated. Reconcile with `trans-lifeline-canada`.                                                                                                      |
| `dawn-house-shelter`               | Correction candidate                           | Emergency-shelter phone and location conflict with the provider's current site.                                                                                                |
| `hope-for-wellness-helpline`       | Public source aligned; duplicate review        | Core facts align; reconcile with `crisis-hope-for-wellness`.                                                                                                                   |
| `kids-help-phone`                  | Public source aligned; duplicate review        | Phone/text align; live-chat hours require confirmation. Reconcile with `crisis-kids-help-phone` and `crisis-text-line`.                                                        |
| `kingston-detox-centre`            | Public source aligned                          | KHSC publishes 240 Brock Street, 613-549-6461, and 24/7 operation.                                                                                                             |
| `kingston-interval-house`          | Public source aligned                          | Provider publishes 613-546-1777 and 1-800-267-9445 for 24-hour crisis support. Consider adding the toll-free access path after confirmation.                                   |
| `ontario-211-ontario`              | Public source aligned                          | 211 Ontario publishes 211 and 1-877-330-3213 for 24/7 phone/text access; live-chat hours are channel-specific.                                                                 |
| `ontario-black-youth-helpline`     | Public source aligned                          | Provider publishes 1-833-294-8650 and daily 9:00 AM-10:00 PM availability.                                                                                                     |
| `ontario-boots-on-the-ground`      | Public source aligned                          | Provider publishes 1-833-677-2668 as a 24/7 peer-support line for first responders.                                                                                            |
| `ontario-farmer-wellness`          | Public source aligned                          | Agriculture Wellness Ontario publishes 1-866-267-6255 with 24/7 intake and immediate support.                                                                                  |
| `ontario-femaide`                  | Public source aligned                          | Fem'aide publishes 1-877-336-2433 and 24/7 phone, SMS, and chat access.                                                                                                        |
| `ontario-irs-crisis-line`          | Public source aligned                          | Indigenous Services Canada publishes 1-866-925-4419 with 24/7 availability.                                                                                                    |
| `ontario-lgbt-youthline`           | Correction candidate                           | Channel, category, and crisis-positioning changes are required if direct confirmation agrees with the current provider site.                                                   |
| `ontario-male-survivors`           | Public source aligned; scope review            | Ontario publishes 1-866-887-0015 and 24/7 access. Review the program's current inclusive eligibility and name before refreshing descriptive copy.                              |
| `ontario-metis-crisis-line`        | Direct confirmation required                   | Provider and public-sector sources conflict about whether the listed line remains current.                                                                                     |
| `ontario-mmiwg-crisis-line`        | Public source aligned                          | Canada publishes 1-844-413-6649 and 24/7 support.                                                                                                                              |
| `ontario-naseeha`                  | Public source aligned                          | Naseeha currently publishes 1-866-627-3342 and 24/7 access.                                                                                                                    |
| `ontario-nors`                     | Direct confirmation required                   | Current phone/text access is supported; 24/7 availability is not established by the current provider site.                                                                     |
| `ontario-ontx-distress`            | Public source substantially aligned            | Ontario public-sector and distress-centre sources publish text 258258 and 2:00 PM-2:00 AM service. Confirm the canonical provider URL and keyword before refreshing.           |
| `ontario-sadv-navigation`          | Public source aligned                          | SADV Treatment Centres publish 1-855-628-7238 and 24/7 navigation.                                                                                                             |
| `ontario-seniors-safety-line`      | Public source aligned                          | Elder Abuse Prevention Ontario publishes 1-866-299-1011 and 24/7 access.                                                                                                       |
| `ontario-vac-assistance`           | Public source aligned                          | Veterans Affairs Canada publishes 1-800-268-7708 and 24/7/365 access.                                                                                                          |
| `ontario-victim-support-line`      | Public source aligned                          | Ontario publishes 1-888-579-2888 and 24/7 service; retain channel-specific chat hours separately.                                                                              |
| `sack-sexual-assault-centre`       | Public source aligned; duplicate review        | SACK publishes 613-544-6424 / 1-877-544-6424 and 24-hour crisis support. Reconcile with `sexual-assault-centre-kingston`.                                                      |
| `sexual-assault-centre-kingston`   | Public source aligned; duplicate review        | Core facts align; reconcile with `sack-sexual-assault-centre`. Confirm chat/text hours directly before refreshing them.                                                        |
| `telephone-aid-line-kingston-talk` | Public source aligned                          | TALK publishes 613-544-1771 and daily 6:00 PM-2:00 AM availability.                                                                                                            |
| `trans-lifeline-canada`            | Correction candidate; duplicate review         | Phone aligns; hours are outdated. Reconcile with `crisis-trans-lifeline`.                                                                                                      |
| `victim-services-kingston`         | Public source aligned                          | Provider publishes 613-548-4834, weekday office hours, and after-hours emergency access through emergency services or appointment.                                             |

## Primary and Public-Authority Sources

- AMHS-KFLA: <https://amhs-kfla.ca/contact/location-hours/>
- Assaulted Women's Helpline: <https://www.awhl.org/home>
- 9-8-8: <https://988.ca/get-help/help-right-now>
- ConnexOntario: <https://connexontario.ca/about-us/>
- Good2Talk: <https://good2talk.ca/ontario/contact-us/>
- Hope for Wellness: <https://www.hopeforwellness.ca/>
- Kids Help Phone: <https://kidshelpphone.ca/urgent-help>
- Ontario Poison Centre: <https://www.ontariopoisoncentre.ca/get-help/get-help-now-landing/get-help-now/>
- Talk4Healing: <https://www.beendigen.com/programs/talk4healing/>
- Trans Lifeline: <https://translifeline.org/hotline/>
- Dawn House: <https://www.dawnhouse.ca/apply-for-housing>
- KHSC Detoxification Centre: <https://www.kingstonhsc.ca/programs-and-departments/detoxification-centre>
- Kingston Interval House: <https://kingstonintervalhouse.com/contact-us/>
- 211 Ontario: <https://211ontario.ca/contact/>
- Black Youth Helpline: <https://blackyouth.ca/>
- Boots on the Ground: <https://www.bootsontheground.ca/>
- Agriculture Wellness Ontario: <https://agriculturewellnessontario.ca/farmer-wellness-initiative/>
- Fem'aide: <https://femaide.ca/>
- Indigenous Services Canada: <https://www.sac-isc.gc.ca/eng/1581971225188/1581971250953>
- YouthLine: <https://www.youthline.ca/helpline/peer-support-helpline/>
- Ontario survivor supports: <https://www.ontario.ca/page/connect-supports-survivors-violence>
- MNO mental health and addictions: <https://www.metisnation.org/programs-and-services/community-wellbeing/mental-health-and-addictions-services/>
- MMIWG support: <https://www.canada.ca/en/crown-indigenous-relations-northern-affairs/news/2025/06/support-available-for-those-affected-by-the-missing-and-murdered-indigenous-women-and-girls-crisis.html>
- Naseeha: <https://www.naseeha.org/home>
- NORS: <https://www.nors.ca/>
- Ontario Human Rights Commission support list: <https://www3.ohrc.on.ca/en/survey-experiences-indigenous-specific-discrimination-healthcare-ontario-list-supports>
- SADV Treatment Centres: <https://www.sadvtreatmentcentres.ca/navigation-sa/dvtc-treatmentcentre.html>
- Seniors Safety Line: <https://eapon.ca/seniors-safety-line/>
- Veterans Affairs Canada: <https://veterans.gc.ca/en/contact-us/talk-mental-health-professional>
- Ontario Victim Support Line: <https://www.ontario.ca/page/office-victims-crime>
- Sexual Assault Centre Kingston: <https://www.sackingston.com/>
- Telephone Aid Line Kingston: <https://www.telephoneaidlinekingston.com/get-help>
- Victim Services Kingston and Frontenac: <https://victimserviceskingston.ca/contact/>

## Manual Verification Sequence

1. Handle the P0 correction candidates first because they affect how a person
   reaches urgent help.
2. Record date, channel, staff role or source owner, facts confirmed, and the
   exact source URLs in the verification worksheet.
3. Resolve duplicate pairs before refreshing dates so search does not present
   redundant or conflicting access paths.
4. Update all related facts atomically: phone, URL, address, structured hours,
   `hours_text`, description, access script, provenance, and verification date.
5. Run `npm run validate-data`, `npm run check-staleness`, targeted search QA,
   and the normal lint/type-check gates after approved data edits.
