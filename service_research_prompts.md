# Deep Research Prompts

Use these prompts to have an AI researcher verify the Kingston Care Connect service data.

## Master Instructions (Include this preamble with every batch)

**Role**: You are a meticulous Data Verification Specialist for "Kingston Care Connect", a directory of community services in Kingston, Ontario.

**Objective**: Conduct a deep research sweep to verify and update the details for the list of services provided below. Your goal is to confirm 100% of the details for every single resource.

**Required Information to Verify (The "Categories of Info"):**
For EACH service, you must verify or find the following data points:

1. **Status**: current operational status (Active, Permanently Closed, Temporarily Closed).
2. **Official Name**: The correct, full legal name of the organization or program (English and French).
3. **Contact Information**:
   - **Website**: Direct URL to the specific program/service (avoid generic homepages if a specific page exists).
   - **Phone**: Main intake or public contact number.
   - **Email**: Public inquiry email (if available).
   - **Address**: Physical location for visits (include postal code). if multiple locations, list the main one in Kingston.
4. **Description**:
   - **English**: A concise 2-3 sentence summary of what the service actively provides.
   - **French**: (If available) The French version of the description.
5. **Operational Details**:
   - **Hours**: Exact operating/open hours for every day of the week.
   - **Eligibility**: Specific criteria (Age range, Income level, Residency requirements, specific conditions like "pregnant", "homeless", etc.).
   - **Application/Access Process**: How to get help? (Drop-in, Call first, Online application, Professional referral only?).
   - **Fees**: Cost structure (Free, Sliding scale, Fixed fee).
   - **Documents Required**: ID, proof of income, etc.

**Output Format:**
Please provide the results as a **JSON array** matching the requested structure.
Include a field called `verification_notes` for each entry to flag any discrepancies you found (e.g., "Phone number changed from provided data", "Location moved").

**Deep Research Strategy:**

- **Primary Source**: The organization"s official website.
- **Secondary Sources**: Official social media pages (Facebook is common for local charities), government directories (211 Ontario), or Google Maps for recent reviews/hours.
- **Conflict Resolution**: If sources conflict, prioritize the "latest update" timestamp or the official site.
- **Completeness**: If a piece of info is missing (e.g., no email found), explicitly state "Not Publicly Listed" rather than leaving it blank.

**The Data List:**
See the JSON batch below.

## Service Batches

Copy and paste the Master Instructions above, followed by one of the batches below, into your AI research tool.

### Batch 1 Data

```json
[
  {
    "id": "kids-help-phone",
    "name": "Kids Help Phone",
    "url": "https://kidshelpphone.ca",
    "phone": "1-800-668-6868"
  },
  {
    "id": "trans-lifeline-canada",
    "name": "Trans Lifeline",
    "url": "https://translifeline.org",
    "phone": "1-877-330-6366"
  },
  {
    "id": "hope-for-wellness-helpline",
    "name": "Hope for Wellness Helpline",
    "url": "https://www.hopeforwellness.ca",
    "phone": "1-855-242-3310"
  },
  {
    "id": "assaulted-womens-helpline",
    "name": "Assaulted Women's Helpline",
    "url": "https://www.awhl.org",
    "phone": "1-866-863-0511"
  },
  {
    "id": "iska-newcomer-support",
    "name": "Immigrant Services Kingston & Area (ISKA)",
    "url": "https://kchc.ca/weller-avenue/immigrant-services/",
    "address": "837 Princess St, Unit 201, Kingston, ON K7L 1G9",
    "phone": "613-544-4661"
  },
  {
    "id": "trellis-hiv-community-care",
    "name": "Trellis HIV & Community Care",
    "url": "https://trellishiv.ca",
    "address": "844a Princess St, Kingston, ON K7L 1G5",
    "phone": "613-545-3698"
  },
  {
    "id": "one-roof-youth-hub",
    "name": "One Roof Kingston Youth Hub",
    "url": "https://kingstonhomebase.ca/one-roof/",
    "address": "620 Princess St, Kingston, ON K7L 1E3",
    "phone": "613-542-6672"
  },
  {
    "id": "victim-services-kingston",
    "name": "Victim Services of Kingston and Frontenac",
    "url": "https://www.victimserviceskingston.ca",
    "phone": "613-548-4834"
  },
  {
    "id": "hotel-dieu-urgent-care",
    "name": "Hotel Dieu Hospital Urgent Care Centre",
    "url": "https://kingstonhsc.ca",
    "address": "144 Brock Street, Kingston, ON K7L 5G2",
    "phone": "613-546-1240"
  },
  {
    "id": "kgh-emergency-department",
    "name": "Kingston General Hospital (KGH) Emergency",
    "url": "https://kingstonhsc.ca/emergency-care",
    "address": "41 King Street West, Kingston, ON K7L 2V7",
    "phone": "613-548-2333"
  },
  {
    "id": "kfla-public-health-dental",
    "name": "KFL&A Public Health Dental Services",
    "url": "https://www.kflaph.ca/en/health-topics/dental-health.aspx",
    "address": "221 Portsmouth Avenue, Kingston, ON K7M 1V5",
    "phone": "613-549-1232"
  },
  {
    "id": "community-legal-clinic-kingston",
    "name": "Kingston Community Legal Clinic",
    "url": "https://kclc.ca",
    "address": "345 Bagot Street, Kingston, ON K7K 6T8",
    "phone": "613-541-0777"
  },
  {
    "id": "salvation-army-housing-help",
    "name": "Salvation Army Housing Help Centre",
    "url": "https://sacfs.ca",
    "address": "540 Montreal Street, Kingston, ON K7K 3H9",
    "phone": "613-548-4411"
  },
  {
    "id": "kchc-transgender-health-care",
    "name": "KCHC Transgender Health Care",
    "url": "https://kchc.ca/programs/transgender-health-program/",
    "address": "263 Weller Ave, Kingston, ON K7K 2V2",
    "phone": "613-542-2949"
  },
  {
    "id": "street-health-centre",
    "name": "Street Health Centre",
    "url": "https://kchc.ca/barrack-street/street-health-centre/",
    "address": "115 Barrack St, Kingston, ON K7K 1G2",
    "phone": "613-549-1440"
  },
  {
    "id": "kingston-interval-house",
    "name": "Kingston Interval House (Crisis & Shelter)",
    "url": "https://kingstonintervalhouse.com",
    "phone": "613-546-1777"
  },
  {
    "id": "telephone-aid-line-kingston-talk",
    "name": "Telephone Aid Line Kingston (TALK)",
    "url": "https://telephoneaidlinekingston.com",
    "phone": "613-544-1771"
  },
  {
    "id": "elizabeth-fry-society-kingston",
    "name": "Elizabeth Fry Society (Housing Support)",
    "url": "https://efrykingston.ca",
    "address": "127 Charles St, Kingston, ON K7K 1V8",
    "phone": "613-544-1744"
  },
  {
    "id": "st-vincent-de-paul-kingston",
    "name": "St. Vincent de Paul Society (WearHouse & Pantry)",
    "url": "https://www.svdpkingston.com",
    "address": "85 Stephen St, Kingston, ON K7K 2C5",
    "phone": "613-766-8432"
  },
  {
    "id": "lunch-by-george",
    "name": "Lunch by George",
    "url": "http://www.lunchbygeorge.ca"
  },
  {
    "id": "salvation-army-rideau-heights",
    "name": "Salvation Army Rideau Heights Food Bank",
    "url": "https://salvationarmy.ca/",
    "address": "183 Weller Ave, Kingston, ON K7K 2V2",
    "phone": "613-541-3947"
  },
  {
    "id": "partners-in-mission-food-bank",
    "name": "Partners in Mission Food Bank",
    "url": "https://kingstonfoodbank.ca",
    "address": "4 Harvey Street, Kingston, ON, K7K 5B9",
    "phone": "613.544.4100"
  },
  {
    "id": "marthas-table-kingston",
    "name": "Martha's Table",
    "url": "https://marthastable.ca",
    "address": "629 Princess Street, Kingston, ON",
    "phone": "613-546-0320"
  },
  {
    "id": "good-food-box-kingston",
    "name": "The Good Food Box",
    "url": "https://goodfoodboxkingston.com",
    "address": "263 Weller Ave., Kingston, ON K7K 2V2",
    "phone": "613-530-2239"
  },
  {
    "id": "amhs-kfla-crisis-line",
    "name": "AMHS-KFLA 24/7 Crisis Line",
    "url": "https://amhs-kfla.ca",
    "address": "552 Princess Street, Kingston, ON K7L 1C7",
    "phone": "613-544-4229"
  },
  {
    "id": "kingston-detox-centre",
    "name": "Kingston Detoxification Centre",
    "url": "https://kingstonhsc.ca/programs-and-departments/detoxification-centre",
    "address": "240 Brock St, Kingston, ON K7L 5G2",
    "phone": "613-549-6461"
  },
  {
    "id": "kingston-youth-shelter",
    "name": "Kingston Youth Shelter",
    "url": "https://kingstonyouthshelter.com",
    "address": "234 Brock St, Kingston, ON K7L 1S4",
    "phone": "613-549-4236"
  },
  {
    "id": "sack-sexual-assault-centre",
    "name": "Sexual Assault Centre Kingston (SACK)",
    "url": "https://www.sackingston.com",
    "address": "400 Elliott Avenue, Unit 1, Kingston, ON K7K 6M9",
    "phone": "613-544-6424"
  },
  {
    "id": "maltby-centre-mental-health",
    "name": "Maltby Centre",
    "url": "https://maltbycentre.ca",
    "address": "31 Hyperion Court, Suite 100, Kingston, ON K7K 7G3",
    "phone": "613-546-8535"
  },
  {
    "id": "resolve-counselling",
    "name": "Resolve Counselling Services",
    "url": "https://resolvecounselling.org",
    "address": "417 Bagot Street, Kingston, ON K7K 3C1",
    "phone": "613-549-7850"
  },
  {
    "id": "kingston-home-base-housing",
    "name": "Kingston Home Base Housing",
    "url": "https://kingstonhomebase.ca",
    "phone": "613-542-6672"
  },
  {
    "id": "ryandale-shelter",
    "name": "Ryandale Shelter",
    "url": "https://ryandale.ca",
    "address": "494 Fieldstone Drive, Kingston, ON",
    "phone": "613-766-1925"
  },
  {
    "id": "dawn-house-womens-shelter",
    "name": "Dawn House",
    "url": "https://dawnhouse.ca",
    "address": "965 Milford Drive, Kingston, ON",
    "phone": "613-545-1379"
  },
  {
    "id": "kchc-weller-clinic",
    "name": "Kingston Community Health Centres (KCHC) - Weller Clinic",
    "url": "https://kchc.ca/weller-avenue/weller-clinic/",
    "address": "263 Weller Ave, Kingston, ON K7K 2V2",
    "phone": "613-542-2949"
  },
  {
    "id": "kfla-sexual-health-clinic",
    "name": "KFL&A Public Health: Sexual Health Clinic",
    "url": "https://www.kflaph.ca",
    "address": "221 Portsmouth Ave, Kingston, ON",
    "phone": "613-549-1232"
  },
  {
    "id": "cdk-family-medicine-walk-in",
    "name": "CDK Family Medicine Walk-In Clinic",
    "url": "https://cdkmd.com",
    "address": "175 Princess St, Kingston, ON K7L 1A9",
    "phone": "613-766-0318"
  },
  {
    "id": "queens-legal-aid",
    "name": "Queen's Legal Aid",
    "url": "https://queenslawclinics.ca/queens-legal-aid",
    "address": "303 Bagot Street, Suite 500, Kingston, ON K7K 5W7",
    "phone": "613-533-2102"
  },
  {
    "id": "ontario-works-kingston",
    "name": "Ontario Works Kingston",
    "url": "https://www.cityofkingston.ca/community-supports/ontario-works-financial-assistance/",
    "address": "362 Montreal St, Kingston, ON",
    "phone": "613-546-2695"
  },
  {
    "id": "kfpl-central-branch",
    "name": "Kingston Frontenac Public Library (Central Branch)",
    "url": "https://www.kfpl.ca",
    "address": "130 Johnson St, Kingston, ON K7L 1X8",
    "phone": "613-549-8888"
  },
  {
    "id": "keys-job-centre",
    "name": "KEYS Job Centre",
    "url": "https://keys.ca",
    "address": "182 Sydenham St, Kingston, ON K7K 3M2",
    "phone": "613-546-5559"
  },
  {
    "id": "seniors-association-kingston",
    "name": "Seniors Association Kingston Region",
    "url": "https://seniorskingston.ca",
    "address": "56 Francis St, Kingston, ON K7M 1L7",
    "phone": "613-548-7810"
  },
  {
    "id": "community-living-kingston",
    "name": "Community Living Kingston and District",
    "url": "https://myclkd.ca",
    "address": "541 Days Rd, Unit 6, Kingston, ON K7M 3R8",
    "phone": "613-546-6613"
  },
  {
    "id": "restart-kingston",
    "name": "ReStart Kingston",
    "url": "https://restartnow.ca",
    "address": "900 Montreal St, Kingston, ON K7K 3J9",
    "phone": "613-542-7373"
  },
  {
    "id": "acfomi-kingston",
    "name": "ACFOMI",
    "url": "https://acfomi.ca",
    "address": "760 Highway 15, Unit 11, Kingston, ON K7L 0C3",
    "phone": "613-546-7863"
  },
  {
    "id": "ymca-eastern-ontario",
    "name": "YMCA of Eastern Ontario",
    "url": "https://eo.ymca.ca",
    "address": "100 Wright Crescent, Kingston, ON K7L 4T9",
    "phone": "613-546-2647"
  },
  {
    "id": "bgc-south-east",
    "name": "BGC South East (Boys and Girls Club)",
    "url": "https://www.bgcsoutheast.ca",
    "address": "1300 Bath Rd, Kingston, ON K7M 4X4",
    "phone": "613-507-3306"
  },
  {
    "id": "hart-centre",
    "name": "H'art Centre",
    "url": "https://www.hartcentre.ca",
    "address": "1200 Princess St, Kingston, ON K7M 3C9",
    "phone": "613-545-1392"
  },
  {
    "id": "loving-spoonful",
    "name": "Loving Spoonful",
    "url": "https://www.lovingspoonful.org",
    "address": "263 Weller Ave, Kingston, ON K7K 2V4",
    "phone": "613-507-8848"
  },
  {
    "id": "ongwanada",
    "name": "Ongwanada",
    "url": "https://www.ongwanada.com",
    "address": "191 Portsmouth Ave, Kingston, ON K7M 8A6",
    "phone": "613-548-4417"
  },
  {
    "id": "kmfrc",
    "name": "Kingston Military Family Resource Centre (KMFRC)",
    "url": "https://kmfrc.com",
    "address": "32 Lundy's Lane, Kingston, ON K7K 5G2",
    "phone": "613-541-5010"
  }
]
```

---

### Batch 2 Data

```json
[
  {
    "id": "earlyon-kchc",
    "name": "EarlyON Child and Family Centre (KCHC)",
    "url": "https://kchc.ca/weller-avenue/earlyon/",
    "address": "263 Weller Ave, Kingston, ON K7K 2V4",
    "phone": "613-542-2949"
  },
  {
    "id": "habitat-restore-kingston",
    "name": "Habitat for Humanity Kingston ReStore",
    "url": "https://habitatkingston.com/restore/",
    "address": "607 Gardiners Rd, Kingston, ON K7M 3Y4",
    "phone": "613-547-4111"
  },
  {
    "id": "kingston-access-bus",
    "name": "Kingston Access Services (Access Bus)",
    "url": "https://kingstonaccessbus.com",
    "address": "751 Dalton Ave, Kingston, ON K7M 8N6",
    "phone": "613-542-2512"
  },
  {
    "id": "integrated-care-hub",
    "name": "Integrated Care Hub (ICH)",
    "url": "https://integratedcarehub.ca",
    "address": "661 Montreal St, Kingston, ON K7K 3J4",
    "phone": "613-329-6417"
  },
  {
    "id": "marthas-table",
    "name": "Martha's Table",
    "url": "https://marthastable.ca",
    "address": "629 Princess St, Kingston, ON K7L 1E2",
    "phone": "613-546-0320"
  },
  {
    "id": "dawn-house-shelter",
    "name": "Dawn House Women's Shelter",
    "url": "https://dawnhouse.ca",
    "address": "2320 Princess St, Kingston, ON K7M 3G4",
    "phone": "613-766-6222"
  },
  {
    "id": "kiln-language-nest",
    "name": "Kingston Indigenous Languages Nest (KILN)",
    "url": "https://kncln.ca",
    "address": "218 Concession St, Kingston, ON K7K 2B5",
    "phone": "613-544-3065"
  },
  {
    "id": "kchc-iipct",
    "name": "Indigenous Interprofessional Primary Care Team (IIPCT)",
    "url": "https://kchc.ca/weller-avenue/iipct/",
    "address": "730 Front Rd, Unit 7, Kingston, ON K7M 6P7",
    "phone": "343-477-0256"
  },
  {
    "id": "metis-nation-ontario-kingston",
    "name": "Métis Nation of Ontario (Kingston Office)",
    "url": "https://www.metisnation.org",
    "address": "107-61 Hyperion Ct, Kingston, ON K7K 7K7",
    "phone": "613-549-1674"
  },
  {
    "id": "st-marys-cathedral-drop-in",
    "name": "St. Mary's Cathedral Drop-In Centre",
    "url": "https://stmaryscathedral.ca",
    "address": "260 Brock St, Kingston, ON K7L 1S3",
    "phone": "613-546-5521"
  },
  {
    "id": "salvation-army-cfs",
    "name": "Salvation Army Community & Family Services",
    "url": "https://sacfs.ca",
    "address": "342 Patrick St, Kingston, ON K7K 6R6",
    "phone": "613-548-4411"
  },
  {
    "id": "crisis-988",
    "name": "988 Suicide Crisis Helpline",
    "url": "https://988.ca",
    "phone": "988"
  },
  {
    "id": "crisis-connex-ontario",
    "name": "ConnexOntario",
    "url": "https://connexontario.ca",
    "phone": "1-866-531-2600"
  },
  {
    "id": "crisis-talk-suicide-canada",
    "name": "Talk Suicide Canada",
    "url": "https://talksuicide.ca",
    "phone": "1-833-456-4566"
  },
  {
    "id": "crisis-kids-help-phone",
    "name": "Kids Help Phone",
    "url": "https://kidshelpphone.ca",
    "phone": "1-800-668-6868"
  },
  {
    "id": "crisis-good2talk",
    "name": "Good2Talk",
    "url": "https://good2talk.ca",
    "phone": "1-866-925-5454"
  },
  {
    "id": "crisis-hope-for-wellness",
    "name": "Hope for Wellness Helpline",
    "url": "https://www.hopeforwellness.ca",
    "phone": "1-855-242-3310"
  },
  {
    "id": "crisis-talk4healing",
    "name": "Talk4Healing",
    "url": "https://www.talk4healing.com",
    "phone": "1-855-554-4325"
  },
  {
    "id": "crisis-trans-lifeline",
    "name": "Trans Lifeline",
    "url": "https://translifeline.org",
    "phone": "1-877-330-6366"
  },
  {
    "id": "crisis-assaulted-womens-helpline",
    "name": "Assaulted Women's Helpline",
    "url": "https://www.awhl.org",
    "phone": "1-866-863-0511"
  },
  {
    "id": "crisis-ontario-gambling",
    "name": "Ontario Problem Gambling Helpline",
    "url": "https://www.problemgamblinghelpline.ca",
    "phone": "1-888-230-3505"
  },
  {
    "id": "crisis-telehealth-ontario",
    "name": "Telehealth Ontario",
    "url": "https://www.ontario.ca/page/get-medical-advice-telehealth-ontario",
    "phone": "811"
  },
  {
    "id": "crisis-poison-control",
    "name": "Ontario Poison Centre",
    "url": "https://www.ontariopoisoncentre.ca",
    "phone": "1-800-268-9017"
  },
  {
    "id": "crisis-eating-disorders",
    "name": "National Eating Disorder Information Centre",
    "url": "https://nedic.ca",
    "phone": "1-866-633-4220"
  },
  {
    "id": "crisis-pflag-canada",
    "name": "PFLAG Canada",
    "url": "https://pflagcanada.ca",
    "phone": "1-888-530-6777"
  },
  {
    "id": "crisis-text-line",
    "name": "Crisis Text Line",
    "url": "https://www.crisistextline.ca",
    "phone": "686868"
  },
  {
    "id": "crisis-211-ontario",
    "name": "211 Ontario",
    "url": "https://211ontario.ca",
    "phone": "211"
  },
  {
    "id": "four-directions-indigenous-centre",
    "name": "Four Directions Indigenous Student Centre",
    "url": "https://www.queensu.ca/fourdirections/",
    "address": "146 Barrie Street, Kingston, ON",
    "phone": "613-533-6970"
  },
  {
    "id": "kfla-indigenous-health-team",
    "name": "KFL&A Indigenous Primary Health Care Team",
    "url": "https://www.kchc.ca/indigenous-health-care-team/",
    "address": "263 Weller Avenue, Kingston, ON",
    "phone": "613-507-7037"
  },
  {
    "id": "kingston-indigenous-friendship-centre",
    "name": "Kingston Native Friendship Centre",
    "url": "https://kingstonnativecentre.com/",
    "address": "21 Rideau Street, Kingston, ON",
    "phone": "613-548-1500"
  },
  {
    "id": "kingston-literacy-skills",
    "name": "Kingston Literacy & Skills",
    "url": "https://www.klsread.ca/",
    "address": "835 Princess Street, Kingston, ON",
    "phone": "613-547-2012"
  },
  {
    "id": "slc-academic-upgrading",
    "name": "St. Lawrence College Academic Upgrading",
    "url": "https://www.stlawrencecollege.ca/programs/career-college-preparatory-program/part-time/kingston",
    "address": "100 Portsmouth Avenue, Kingston, ON",
    "phone": "613-544-5400"
  },
  {
    "id": "kfpl-learning-programs",
    "name": "Kingston Frontenac Public Library Learning Programs",
    "url": "https://www.kfpl.ca/programs",
    "address": "130 Johnson Street, Kingston, ON",
    "phone": "613-549-8888"
  },
  {
    "id": "kingston-transit-mfap",
    "name": "Kingston Transit Affordable Pass (MFAP)",
    "url": "https://www.cityofkingston.ca/residents/community-services/fee-assistance",
    "phone": "613-546-4291"
  },
  {
    "id": "von-transportation-kingston",
    "name": "VON Transportation Services",
    "url": "https://www.von.ca/en/site/kingston",
    "phone": "613-634-0130"
  },
  {
    "id": "lionhearts-fresh-food-market",
    "name": "Lionhearts Fresh Food Market",
    "url": "https://lionhearts.ca",
    "phone": "613-766-0664"
  },
  {
    "id": "in-from-the-cold",
    "name": "In From the Cold",
    "url": "https://kingstonhomebase.ca"
  },
  {
    "id": "legal-aid-ontario-kingston",
    "name": "Legal Aid Ontario",
    "url": "https://www.legalaid.on.ca"
  },
  {
    "id": "pro-bono-ontario",
    "name": "Pro Bono Ontario",
    "url": "https://www.probonoontario.org"
  },
  {
    "id": "cleo-community-legal-education",
    "name": "CLEO (Community Legal Education Ontario)",
    "url": "https://www.cleo.on.ca"
  },
  {
    "id": "arch-disability-law",
    "name": "ARCH Disability Law Centre",
    "url": "https://archdisabilitylaw.ca"
  },
  {
    "id": "justice-for-children-youth",
    "name": "Justice for Children and Youth (JFCY)",
    "url": "https://jfcy.org"
  },
  {
    "id": "jobwell-kingston",
    "name": "Jobwell",
    "url": "https://jobwell.ca"
  },
  {
    "id": "health-811-ontario",
    "name": "Health811 (Telehealth Ontario)",
    "url": "https://health811.ontario.ca"
  },
  {
    "id": "rideau-heights-community-centre",
    "name": "Rideau Heights Community Centre",
    "url": "https://www.cityofkingston.ca"
  },
  {
    "id": "artillery-park-aquatic-centre",
    "name": "Artillery Park Aquatic Centre",
    "url": "https://www.cityofkingston.ca"
  },
  {
    "id": "invista-centre",
    "name": "INVISTA Centre",
    "url": "https://www.cityofkingston.ca"
  },
  {
    "id": "kfpl-calvin-park",
    "name": "KFPL - Calvin Park Branch",
    "url": "https://www.kfpl.ca"
  },
  {
    "id": "kfpl-isabel-turner",
    "name": "KFPL - Isabel Turner Branch",
    "url": "https://www.kfpl.ca"
  },
  {
    "id": "kfpl-pittsburgh",
    "name": "KFPL - Pittsburgh Branch",
    "url": "https://www.kfpl.ca"
  }
]
```

---

### Batch 3 Data

```json
[
  {
    "id": "kfpl-rideau-heights",
    "name": "KFPL - Rideau Heights Branch",
    "url": "https://www.kfpl.ca"
  },
  {
    "id": "kingston-pregnancy-care",
    "name": "Kingston Pregnancy Care Centre",
    "url": "https://kingstonpcc.com"
  },
  {
    "id": "hospice-kingston",
    "name": "Hospice Kingston",
    "url": "https://hospicekingston.ca"
  },
  {
    "id": "alzheimer-society-kfla",
    "name": "Alzheimer Society KFL&A",
    "url": "https://alzheimer.ca/kfla"
  },
  {
    "id": "stroke-network-sneo",
    "name": "Stroke Network of SEO",
    "url": "https://strokenetworkseo.ca"
  },
  {
    "id": "autism-ontario-east",
    "name": "Autism Ontario (East Region)",
    "url": "https://www.autismontario.com"
  },
  {
    "id": "cnib-kingston",
    "name": "CNIB Foundation Kingston",
    "url": "https://cnib.ca"
  },
  {
    "id": "march-of-dimes-kingston",
    "name": "March of Dimes Canada",
    "url": "https://www.marchofdimes.ca"
  },
  {
    "id": "student-food-bank-queens",
    "name": "AMS Food Bank (Queen's)",
    "url": "https://ams.queensu.ca"
  },
  {
    "id": "st-lawrence-food-pantry",
    "name": "SLC Food Pantry",
    "url": "https://www.stlawrencecollege.ca"
  },
  {
    "id": "community-harvest-market",
    "name": "Community Harvest Kingston",
    "url": "https://www.kchc.ca"
  },
  {
    "id": "memorial-centre-market",
    "name": "Memorial Centre Farmers Market",
    "url": "https://www.memorialcentrefarmersmarket.ca"
  },
  {
    "id": "legal-clinic-queens",
    "name": "Queen's Legal Aid (Student Clinic)",
    "url": "https://queenslawclinics.ca"
  },
  {
    "id": "kfl-public-health-vaccine",
    "name": "KFL&A Public Health - Immunization",
    "url": "https://www.kflaph.ca"
  },
  {
    "id": "kfl-public-health-sexual",
    "name": "KFL&A Sexual Health Clinic",
    "url": "https://www.kflaph.ca"
  },
  {
    "id": "sexual-assault-centre-kingston",
    "name": "SACK (Sexual Assault Centre Kingston)",
    "url": "https://sackingston.com"
  },
  {
    "id": "kingston-general-hospital",
    "name": "Kingston General Hospital (KHSC)",
    "url": "https://kingstonhsc.ca"
  },
  {
    "id": "hotel-dieu-site",
    "name": "Hotel Dieu Hospital (KHSC)",
    "url": "https://kingstonhsc.ca"
  },
  {
    "id": "providence-care-hospital",
    "name": "Providence Care Hospital",
    "url": "https://providencecare.ca"
  },
  {
    "id": "kingston-military-family-resource",
    "name": "Kingston Military Family Resource Centre",
    "url": "https://kmfrc.com"
  },
  {
    "id": "tnet-kingston",
    "name": "Transgender Network Kingston (TNet)",
    "url": "https://transfamilykingston.com"
  },
  {
    "id": "kfla-children-services",
    "name": "KFL&A Children's Services",
    "url": "https://www.cityofkingston.ca"
  },
  {
    "id": "rural-frontenac-community-services",
    "name": "Rural Frontenac Community Services",
    "url": "https://rfcs.ca"
  },
  {
    "id": "south-frontenac-community-services",
    "name": "South Frontenac Community Services",
    "url": "https://sfcsc.ca"
  },
  {
    "id": "kingston-east-community-centre",
    "name": "Kingston East Community Centre",
    "url": "https://www.cityofkingston.ca"
  },
  {
    "id": "earlyon-cosy",
    "name": "EarlyON Child and Family Centre",
    "url": "https://www.kchc.ca"
  },
  {
    "id": "boys-girls-club-kingston",
    "name": "BGC South East (Boys & Girls Club)",
    "url": "https://www.bgcsoutheast.ca"
  },
  {
    "id": "ymca-kingston",
    "name": "YMCA of Eastern Ontario",
    "url": "https://eo.ymca.ca"
  },
  {
    "id": "kingston-humane-society",
    "name": "Kingston Humane Society",
    "url": "https://kingstonhumanesociety.ca"
  },
  {
    "id": "st-john-ambulance-kingston",
    "name": "St. John Ambulance",
    "url": "https://www.sja.ca"
  },
  {
    "id": "red-cross-kingston",
    "name": "Canadian Red Cross - Kingston",
    "url": "https://www.redcross.ca"
  },
  {
    "id": "united-way-kfla-office",
    "name": "United Way KFL&A",
    "url": "https://www.unitedwaykfla.ca"
  },
  {
    "id": "community-foundation-kingston",
    "name": "Community Foundation for Kingston & Area",
    "url": "https://cfka.org"
  },
  {
    "id": "habitat-for-humanity-kingston",
    "name": "Habitat for Humanity Kingston",
    "url": "https://habitatkingston.com"
  },
  {
    "id": "kingston-literacy-skills-2",
    "name": "Kingston Literacy & Skills",
    "url": "https://klsread.ca"
  },
  {
    "id": "keys-job-centre-2",
    "name": "KEYS Job Centre",
    "url": "https://keys.ca"
  },
  {
    "id": "acls-kingston",
    "name": "ACFOMI Employment Services",
    "url": "https://acfomi.ca"
  },
  {
    "id": "re-start-employment",
    "name": "ReStart Employment Services",
    "url": "https://restartnow.ca"
  },
  {
    "id": "slc-employment-service",
    "name": "Employment Service (SLC)",
    "url": "https://employmentservice.sl.on.ca"
  },
  {
    "id": "ontario-works-kb",
    "name": "Ontario Works (Kingston)",
    "url": "https://www.cityofkingston.ca"
  },
  {
    "id": "odsp-kingston",
    "name": "ODSP Kingston Office",
    "url": "https://www.ontario.ca"
  },
  {
    "id": "service-canada-kingston",
    "name": "Service Canada Centre",
    "url": "https://www.canada.ca"
  },
  {
    "id": "service-ontario-kingston",
    "name": "ServiceOntario",
    "url": "https://www.ontario.ca"
  },
  {
    "id": "kingston-police-non-emerg",
    "name": "Kingston Police (Non-Emergency)",
    "url": "https://www.kpf.ca"
  },
  {
    "id": "opp-frontenac",
    "name": "OPP Frontenac Detachment",
    "url": "https://www.opp.ca"
  },
  {
    "id": "coast-mental-health",
    "name": "COAST (Crisis Outreach)",
    "url": "https://amhs-kfla.ca"
  },
  {
    "id": "maltby-centre-autism",
    "name": "Maltby Centre - Autism Services",
    "url": "https://maltbycentre.ca"
  },
  {
    "id": "pathways-for-children-youth",
    "name": "Pathways for Children and Youth",
    "url": "https://maltbycentre.ca"
  },
  {
    "id": "geneva-centre-autism",
    "name": "Geneva Centre for Autism (Virtual)",
    "url": "https://www.autism.net"
  }
]
```

---
