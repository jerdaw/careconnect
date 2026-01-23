# v17.5 AI Output Ingestion — Evidence Spot-Check (2026-01-22)

- Generated: `2026-01-23T00:05:35.498274+00:00`
- Source: `docs/audits/v17-5/ai-results/reports/research_sources_chatgpt_prompt3.json` (prompt3 only; other prompts have non-uniform evidence)
- Spot-check size: **15** URLs

## Results

|   # | service id                           | url                               | status | final url                                                    | title                                                                            | ok  |
| --: | ------------------------------------ | --------------------------------- | -----: | ------------------------------------------------------------ | -------------------------------------------------------------------------------- | --- |
|   1 | `kingston-pregnancy-care`            | https://meacentre.ca              |    200 | https://meacentre.ca                                         | Mea Pregnancy Support Services, Abortion, Adoption, Parenting, Kingston, Ontario | ✅  |
|   2 | `hospice-kingston`                   | https://providencecare.ca         |    200 | https://providencecare.ca                                    | Providence Care - Kingston ON                                                    | ✅  |
|   3 | `student-food-bank-queens`           | https://amsfoodbank.ca            |    200 | https://www.amsfoodbank.ca/                                  | Welcome to the Queen's AMS Food Bank!                                            | ✅  |
|   4 | `st-lawrence-food-pantry`            | https://slc.me                    |    403 | https://stlawrencecollege.sharepoint.com/sites/slcmeredirect |                                                                                  | ⚠️  |
|   5 | `community-harvest-market`           | https://kchc.ca/community-harvest |    404 | https://kchc.ca/community-harvest                            |                                                                                  | ⚠️  |
|   6 | `memorial-centre-market`             | https://www.cityofkingston.ca     |    200 | https://www.cityofkingston.ca                                | Home \| City of Kingston                                                         | ✅  |
|   7 | `kfl-public-health-vaccine`          | https://kflaph.ca                 |    200 | https://www.kflaph.ca/en/index.aspx                          | KFL&A Public Health                                                              | ✅  |
|   8 | `kfl-public-health-sexual`           | https://kflaph.news.esolg.ca      |    200 | https://kflaph.news.esolg.ca/en                              | News - KFL&A Public Health                                                       | ✅  |
|   9 | `sexual-assault-centre-kingston`     | https://resourceconnect.com       |    200 | https://www.resourceconnect.com/                             | ResourceConnect                                                                  | ✅  |
|  10 | `kingston-general-hospital`          | https://kingstonhsc.ca            |    200 | https://kingstonhsc.ca                                       | KHSC Kingston Health Sciences Centre                                             | ✅  |
|  11 | `kingston-military-family-resource`  | https://cfmws.ca                  |    200 | https://cfmws.ca                                             | Canadian Forces Morale and Welfare Services \| CFMWS                             | ✅  |
|  12 | `tnet-kingston`                      | https://transfamilykingston.com   |    200 | https://transfamilykingston.com                              | TransFamily Kingston                                                             | ✅  |
|  13 | `rural-frontenac-community-services` | https://victimsupportdirectory.ca |    200 | https://victimsupportdirectory.ca                            | Search \| Victim Support Directory \| Victim Support Directory                   | ✅  |
|  14 | `south-frontenac-community-services` | https://sfcsc.ca                  |    200 | https://www.sfcsc.ca/                                        | Southern Frontenac Community Services Corporation - SFCSC                        | ✅  |
|  15 | `earlyon-cosy`                       | https://southeasthealthline.ca    |    200 | https://southeasthealthline.ca                               | Health Services for South East - southeasthealthline.ca                          | ✅  |

## Notes

- This is an **availability + basic plausibility** check. It does not guarantee that the page supports specific hour values.
- Any `404` or repeated redirects should be handled in Phase 6 governance QA by updating the service URL or selecting a more stable official source.
