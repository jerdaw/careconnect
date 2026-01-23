# **Operational Audit and Data Architecture of Social Service Infrastructure in Kingston, Ontario (2025-2026)**

## **1\. Executive Context and Methodological Framework**

The social safety net in Kingston, Ontario, operates as a complex, multi-layered ecosystem involving municipal governance, provincial health mandates, and non-profit service delivery. As of early 2026, this infrastructure is undergoing significant transformation, characterized by administrative mergers, post-pandemic operational shifts, and the digitization of intake procedures. This report provides an exhaustive operational analysis of key service entities within the Kingston, Frontenac, Lennox & Addington (KFL\&A) region, specifically designed to support data engineering workflows and the creation of a unified, machine-mergeable service directory.  
The analysis is grounded in a rigorous verification methodology that prioritizes official administrative data points to resolve conflicting information regarding operating hours, physical locations, and eligibility criteria. The landscape is defined by high inter-agency dependency, where a client’s journey often requires navigating multiple distinct intake systems—from the "first-come, first-served" model of emergency shelters to the rigid "appointment-only" protocols of food banks and primary care clinics.

### **1.1 The Operational Environment: 2025-2026**

The operational environment in Kingston is currently defined by three macro-trends that impact data accuracy and service accessibility:

1. **Administrative Consolidation:** The merger of KFL\&A Public Health into the broader **Southeast Public Health (SEPH)** entity represents a massive shift in regional governance. While the legal transition occurred on January 1, 2025, the operational reality involves a dual-branding phase where legacy "KFL\&A" terminology persists alongside the new SEPH identity.1 This creates a specific challenge for data enrichment, requiring systems to recognize both entities as synonymous to prevent duplication or user confusion.
2. **The "Lunch Gap" Phenomenon:** A granular analysis of operating hours reveals a systemic synchronization of service closures between 12:00 PM and 1:00 PM across major providers, including Kingston Community Health Centres (KCHC), Public Health, and the Street Health Centre.2 This synchronization creates a localized "service blackout" that disproportionately affects working-poor individuals who may only have the midday hour to access support.
3. **Digital Gating of Essential Services:** There is an accelerating trend toward "digital-first" or "phone-first" intake models. Services that were historically accessible via drop-in (such as certain food supports or general counseling) now require pre-registration via web portals or telephone triage. For example, the Transgender Health Program has moved exclusively to the Ocean eReferral Network, eliminating faxed referrals 3, while EarlyON programs mandate registration via keyon.ca.

### **1.2 Data Verification Methodology**

To construct the enriched dataset, a hierarchical source validation framework was employed. This framework accounts for the "data decay" observed in legacy directories and prioritizes timestamped updates from late 2025 and 2026\.

| Priority Level | Source Type                               | Rationale                                                                                                                                                                                                               |
| :------------- | :---------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1**     | Official Entity Websites & Press Releases | Considered the "Source of Truth" for programmatic mandates, current physical addresses, and primary contact channels.1                                                                                                  |
| **Tier 2**     | Municipal & Provincial Databases          | Sources such as the City of Kingston’s municipal support pages and the 211 Ontario database provide standardized metadata, often capturing nuances like specific "closed for lunch" hours that promotional sites miss.5 |
| **Tier 3**     | Cross-Referenced Snippets                 | Utilization of news updates and third-party reports to resolve historical conflicts, such as the relocation history of the Kingston Youth Shelter.7                                                                     |

## **2\. The Hub Model: Kingston Community Health Centres (KCHC)**

Kingston Community Health Centres (KCHC) serves as the "Super-Node" of the North Kingston social support network. Far more than a medical clinic, KCHC operates as a federated service hub that integrates primary healthcare, dental services, social work, education, and food security initiatives under a single administrative umbrella. The operational core is located at the **Weller Site**, but the agency’s footprint extends to Napanee and various satellite locations, creating a complex web of service hours and eligibility requirements that must be accurately mapped.

### **2.1 The Weller Site: Operational Dynamics**

The Weller Site (263 Weller Ave., Unit 4\) acts as the central nervous system for KCHC operations. Its schedule reflects a deliberate attempt to balance standard administrative availability with accessibility for working populations.  
**Weekly Schedule Analysis:** The facility operates on a bifurcated schedule. On Mondays, Tuesdays, Thursdays, and Fridays, the site maintains standard business hours from **08:00 to 16:00**. However, Wednesdays feature a significant extension of service, with the facility remaining open until **19:30**.3 This mid-week extension is a critical accessibility feature, designed to accommodate clients who cannot attend appointments during standard day shifts.  
**The 12:00-13:00 Closure:** A critical operational detail for data enrichment is the daily closure from 12:00 PM to 1:00 PM. This is not merely a reduction in staffing but a total cessation of public-facing services for lunch.3 This closure is enforced across almost all sub-programs housed at the Weller Site, including the Dental Clinic, Foot Care, and the primary reception. Failure to encode this "negative hour" block in the dataset would result in erroneous access scripts advising clients to visit during a lockout period.  
**Intake Status and "Unattached" Patients:** The Primary Care service (Weller Clinic) is currently operating at maximum capacity. The intake protocol is highly restrictive: the clinic is **not** accepting general new patients, nor is it accepting children under five years of age—a demographic that was previously prioritized.3 The sole exception to this freeze is for "unattached patients" (individuals without a family doctor) who are currently pregnant. These individuals are eligible for prenatal care intake, illustrating a triage model that prioritizes immediate maternal health needs over general family practice.3

### **2.2 Integrated Programmatic Architecture**

KCHC houses a diverse array of specialized programs, each with distinct operational rules that deviate from the main clinic's parameters.

#### **2.2.1 Transgender Health Program**

This program represents a regional center of excellence for South East Ontario, providing gender-affirming medical care, hormone therapy initiation, and surgical planning.

- **Staffing Structure:** The program is clinical-social in nature, staffed by a full-time Nurse Practitioner and a Social Worker.
- **Referral Modernization:** As of January 1, 2025, the intake mechanism underwent a radical digitization. The program ceased accepting faxed referrals—a standard in medical administration for decades—and moved exclusively to the **Ocean eReferral Network**.3 This shift imposes a technical requirement on referring physicians to be onboarded to the Ocean platform.
- **Waitlist Dynamics:** The demand for these services far outstrips supply, resulting in an estimated wait time of **6 to 10+ months**. To manage this gap, KCHC has implemented a "waiting room" strategy, providing interim resource lists for virtual and community support to clients pending intake.
- **Service Scope:** Crucially, this is a consultative service. It does not provide primary care or long-term family medicine management; clients are returned to their primary providers for ongoing maintenance once stabilization is achieved.3

#### **2.2.2 Dental Services**

Operating under a service agreement with Public Health, the KCHC Dental program is a safety-net service for low-income populations.

- **Eligibility:** The program is strictly means-tested, targeting families and individuals with low income who lack private dental insurance.
- **Service Limitations:** The clinical scope is limited to basic dental services—examinations, radiographs, cleanings, fillings, and extractions. It does not cover cosmetic or complex restorative work, aligning with the "Healthy Smiles Ontario" provincial framework.
- **Operational Footprint:** Services are available at both the Weller Site in Kingston and the Napanee Area Community Health Centre, requiring distinct location mapping in the output JSON.8

#### **2.2.3 Pathways to Education**

This program serves as a localized educational intervention, geographically bounded to the North Kingston catchment area.

- **Geofencing:** Eligibility is determined by strict street boundaries: North to Conacher Drive, South to Raglan Road, West to Division Street, and East to the Cataraqui River.3
- **Incentive Structure:** The program utilizes a "conditional cash transfer" model to drive engagement. Students receive immediate financial supports (grocery gift cards) and long-term financial incentives (post-secondary scholarships of up to $2,000) contingent on participation in tutoring and mentoring activities.

#### **2.2.4 EarlyON Child and Family Centres**

These centers focus on early childhood development (ages 0-6) and parent support.

- **Access Mechanism:** The program utilizes a centralized digital gatekeeper. Pre-registration is **mandatory** via keyon.ca.3 Drop-ins are generally not accommodated without a prior account setup, which may present a barrier to families with limited digital literacy or internet access.
- **Schedule Alignment:** The EarlyON schedule aligns with the main Weller Site hours, including the Wednesday evening extension and the daily lunch closure.

#### **2.2.5 Harm Reduction Services**

KCHC operates a confidential harm reduction program designed to lower barriers for substance users.

- **Inventory:** The service provides sterile injection and inhalation equipment (strictly for one-time use) and nasal Naloxone.
- **Privacy Protocol:** Unlike the Primary Care intake, which requires extensive documentation, the harm reduction service emphasizes confidentiality and anonymity to encourage utilization by marginalized populations.3

### **2.3 Food Security Initiatives at KCHC**

KCHC administers two primary food programs that function on fundamentally different operational models: the "Good Food Box" (Market Model) and the "Seniors Food Box" (Charity Model).  
**The Good Food Box:**  
This initiative is a non-profit produce purchasing program. It is **not** a food bank; it is a bulk-buying collective.

- **Mechanism:** It operates on a pre-order system. Clients must pay for their boxes at the beginning of the month.
- **Distribution:** Pickup occurs on the **3rd Thursday** of the month.
- **Accessibility:** Participation is universal; there is no means testing. Boxes range in price from $6 to $17, and payments can be made online or in-person at the Weller reception.3

**Seniors Food Box:**

- **Target:** Seniors aged 55+ who are financially struggling.
- **Model:** Free monthly delivery of fresh produce and dry goods directly to the client's home.
- **Status:** The program currently maintains a waitlist, indicating that demand exceeds the logistical capacity for delivery and procurement.3

## **3\. The Crisis Ecosystem: Youth Shelter and Mental Health Response**

The crisis response infrastructure in Kingston is characterized by a bifurcation between immediate, 24/7 emergency services and scheduled, business-hour support systems. Navigating this ecosystem requires precise data regarding physical locations, which have been subject to significant flux in recent years.

### **3.1 Kingston Youth Shelter: A Study in Location Dynamics**

The Kingston Youth Shelter (KYS) serves a vulnerable demographic aged 16 to 24\. The organization’s physical footprint has been unstable over the past five years due to pandemic-related displacements and facility renovations, creating a "data trail" of conflicting addresses that must be resolved.  
**Chronology of Displacement:** Historical data tracks the shelter's movement from **113 Lower Union Street** to **805 Ridley Drive** (a former retirement home utilized for social distancing during COVID-19).7 Subsequent reports indicated a return to **234 Brock Street**. However, the most current and corroborated data for late 2025/2026 establishes a new primary configuration:

1. **Emergency Shelter Hub (365 Nelson Street):**
   - This is the primary intake point for emergency overnight stays.
   - **Operational Hours:** Open **24/7**.10
   - **Intake Model:** "First come, first served." Unlike the appointment-based food banks, the shelter does not maintain a waitlist, prioritizing immediate safety.12
2. **Transitional Housing (Kingston Youth Transitions):**
   - The **234 Brock Street** location remains active in the dataset but appears to function as a transitional housing site or administrative annex rather than the primary emergency intake.10
   - **Access:** Transitional housing requires a formal application submitted via email, distinct from the walk-in nature of the emergency shelter.13

**Family Mediation Services:** Recognizing that family conflict is a primary driver of youth homelessness, KYS operates a "Family Mediation Program" and a "Family Reunite Program." These preventative services aim to resolve underlying domestic issues to prevent the need for shelter intake.10

### **3.2 Addiction & Mental Health Services (AMHS-KFLA)**

AMHS-KFLA acts as the regional lead for crisis intervention. Its operational architecture is divided into two distinct counties—Kingston/Frontenac and Lennox & Addington—each served by specific crisis infrastructure.  
**Crisis Line Architecture:**  
To ensure accurate routing of emergency calls, data enrichment must distinguish between the two dedicated crisis lines:

- **Kingston & Frontenac:** 613-544-4229 (24/7).14
- **Lennox & Addington:** 613-354-7388 (24/7).15
- **Toll-Free Redundancy:** Both lines are supported by toll-free numbers (1-866-616-6005 for K\&F; 1-800-267-7877 for L\&A) to ensure access for rural residents without long-distance plans.

**Mobile Crisis Response Teams (MCRRT):**  
AMHS-KFLA operates integrated mobile teams that function in partnership with law enforcement and as independent community units.

- **MCRRT (Police Partnership):** This unit pairs a mental health worker with a police officer to respond to 911 calls involving mental health crises.
- **Community Mobile Crisis:** This non-police unit provides in-person support in homes or community settings.
  - **Kingston Hours:** Mon-Fri 08:00–Midnight; Sat-Sun 08:00–20:00.16
  - **Napanee Hours:** Mon-Fri 08:30–15:30.16

**Walk-In Crisis Services:**  
For individuals who prefer to seek help in person, AMHS maintains physical "Walk-In" clinics that do not require appointments.

- **Kingston Location:** 552 Princess St.
- **Napanee Location:** 70 Dundas St E.
- **Hours:** Mon-Fri 08:30 – 15:30. This schedule notably ends earlier than the standard 4:30 PM administrative close, a detail that must be flagged in access scripts.16

## **4\. Food Security Logistics: Partners in Mission Food Bank**

Partners in Mission acts as the central food security agency for Kingston, functioning both as a direct service provider to clients and as a distribution warehouse for other regional meal programs. The operational data reveals a strict, process-heavy model designed to manage inventory and client flow efficiently.

### **4.1 The "Appointment-Only" Paradigm**

Unlike the "market" model of the Good Food Box or the "drop-in" nature of some soup kitchens, the Food Bank operates on a rigid appointment-only basis.

- **Intake for New Clients:** First-time users cannot book online; they must call **613-544-4100** to schedule an initial intake interview.
- **Booking for Returning Clients:** Established clients must also call ahead to reserve a hamper. The booking window is strictly defined as **08:30–12:00** and **13:00–16:00**.17
- **The Consequence of Unannounced Visits:** Clients who arrive without an appointment are generally not served, making the "Call First" instruction the single most critical component of the access script.

### **4.2 Distribution vs. Administration**

The facility maintains split hours for administration (booking) and distribution (pickup).

- **Distribution Hours:** Hampers are dispensed Monday to Friday from **14:00 to 16:00** (2:00 PM \- 4:00 PM).18
- **Administrative Hours:**
  - Mon-Thu: 08:30–12:00 and 13:30–16:30.
  - Fri: 08:30–12:00 and 13:30–16:00.
  - **Lunch Closure:** The administrative office closes from 12:00 to 13:30, a 90-minute blackout period that is longer than the standard one-hour closure observed at KCHC.18

### **4.3 Documentation and Eligibility**

The eligibility criteria are geographically and administratively strict.

- **Residency:** Service is limited to residents of **Kingston** and **Loyalist Township**. Residents of Napanee or other surrounding areas are referred to their local agencies.17
- **ID Requirements:** Proof of identity is mandatory for **every** member of the household, not just the applicant. Accepted formats include paper or electronic copies.
- **Privacy Assurance:** The agency explicitly states that they do not photocopy documents, a policy likely intended to build trust with undocumented or privacy-conscious clients.17

## **5\. Public Health Transformation: The Southeast Merger**

The public health landscape in Kingston underwent a tectonic shift on January 1, 2025, with the amalgamation of **KFL\&A Public Health**, **Hastings Prince Edward Public Health**, and the **Leeds, Grenville and Lanark District Health Unit**. The resulting entity, **Southeast Public Health (SEPH)**, represents a consolidation of resources across a vast geographic area.1

### **5.1 Transitional Branding and Identity**

While the legal entity is now SEPH, the operational reality involves significant legacy inertia. The "KFL\&A Public Health" brand remains in active use on signage, documentation, and digital properties during the transition period. The merger has not immediately altered the physical location of the Kingston office, which remains at **221 Portsmouth Ave**.19 However, the data enrichment process must account for dual-branding to ensure that searches for either "KFL\&A" or "Southeast Public Health" route to the correct service record.

### **5.2 Kingston Office Operations**

- **Standard Hours:** Mon-Fri 08:30 – 16:30.
- **Lunch Closure:** Consistent with the regional pattern, the office closes daily from **12:00 to 13:00**.20
- **Contact Channels:**
  - General Line: 613-549-1232.
  - Toll-Free: 1-800-267-7875.

### **5.3 Clinical Service Portfolios**

Public Health continues to deliver direct clinical services, primarily focused on preventative care and vulnerable populations.

- **Immunization Clinics:** These are held weekly:
  - **Tuesdays:** Open to all ages.
  - **Wednesdays:** Restricted to ages 0-18.
  - **Access:** Appointments are required, with a focus on newcomers to Canada and individuals without a primary care provider.21
- **Sexual Health:** Provides confidential testing and contraception counseling.
- **Dental Screening:** Administers the "Healthy Smiles Ontario" program for eligible children and emergency dental for seniors.
- **Parenting Support:** A dedicated "Parenting in KFL\&A" phone line (613-549-1154) connects parents directly with public health nurses for advice on prenatal care, breastfeeding, and child development.22

## **6\. Municipal Safety Net: Ontario Works**

The City of Kingston acts as the Delivery Agent for the **Ontario Works** (social assistance) program, administering the service not only for the city but for the entire County of Frontenac. This centralized administration creates a high-volume processing environment characterized by strict regulatory compliance and documentation standards.

### **6.1 Physical and Remote Access Points**

- **Primary Administrative Hub:** 362 Montreal St, 2nd Floor, Kingston, ON, K7K 3H5.
- **Satellite Offices:** To serve the rural population of Frontenac County, a case management office is maintained at Rural Frontenac Community Services in Sharbot Lake, with weekly on-site services in Sydenham.23
- **Operational Hours:** The primary office operates Mon-Fri 08:30 – 16:30. While one source indicated extended Tuesday hours 24, the preponderance of official data (Tier 1 sources) confirms a standard 08:30-16:30 schedule.25

### **6.2 The Bureaucracy of Intake**

Accessing Ontario Works is a multi-step process involving rigorous means testing.

- **Application Channels:**
  1. **Online:** Via the provincial social assistance portal.
  2. **Phone:** 1-888-999-1142 (Provincial intake line).
  3. **Local Triage:** The local number (613-546-2695) is primarily for rescheduling appointments or connecting with case managers, rather than initial intake.26
- **Eligibility Framework:** Applicants must demonstrate:
  - Residency in Ontario.
  - Immediate financial need (assets and income below provincial thresholds).
  - Willingness to participate in "life stabilization" or employment assistance activities.25
- **Documentation Burden:** The "proof of need" requirement is extensive. Applicants must produce:
  - Social Insurance Number (SIN).
  - OHIP Card.
  - Proof of Birth/Identity.
  - Verification of Shelter Costs (rent receipts, lease).
  - Banking/Asset Statements (30-60 days).
  - Employment History.
  - Immigration Status.26 This documentation list represents a significant barrier for individuals in crisis who may have lost personal records due to homelessness or displacement.

## **7\. Systemic Gap Analysis**

Synthesizing the data across these key entities reveals localized systemic frictions that impact service delivery.

### **7.1 The "Closed for Lunch" Synchronization**

There is a near-universal closure of social service front desks between 12:00 PM and 1:00 PM. KCHC, Public Health, Street Health, and the Food Bank (Admin) all cease operations during this window. This synchronization creates a functional "blackout" for services in Kingston during the midday hour. For the working poor, this eliminates the possibility of accessing multiple services during a lunch break, forcing them to take time off work to attend appointments.

### **7.2 Geographic Concentration vs. Rural Need**

The majority of critical services are clustered in two zones: **North Kingston** (Weller Ave, Montreal St) and the **Downtown/Inner Harbour** (Princess St, Brock St, Barrack St).

- **North Kingston Hub:** KCHC, Partners in Mission Food Bank.
- **Downtown Hub:** Youth Shelter, AMHS-KFLA, Street Health, Public Health.  
  While this colocation facilitates referrals between downtown agencies, it highlights the importance of the rural satellite offices (e.g., Sharbot Lake for Ontario Works, Napanee for AMHS) for residents of Frontenac and Lennox & Addington counties who face transportation barriers.

### **7.3 The Shift to Digital Gating**

The transition to digital intake (Ocean eReferral, KeyON, Online OW Applications) improves administrative efficiency but raises the barrier to entry for clients with limited digital literacy or data access. The reliance on "self-referral" often masks a complex administrative process that requires the client to act as their own case manager, navigating web portals and phone trees to secure basic support.

## **8\. Data Enrichment Output**

The following JSON output represents the synthesized, verified operational data for the specified entities, formatted strictly for automated merging into the master service directory.

JSON

\[  
 {  
 "id": "",  
 "hours": {  
 "monday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "tuesday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "wednesday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "thursday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "friday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "notes": "Closed daily 12:00-13:00. KFL\&A Public Health (Southeast Public Health) Kingston office."  
 },  
 "access_script": "Call 613-549-1232 or visit 221 Portsmouth Ave. Services include immunization, sexual health, and dental screening. For parenting support, call the Parenting in KFL\&A line at 613-549-1154."  
 },  
 {  
 "id": "",  
 "hours": {  
 "monday": {  
 "open": "08:00",  
 "close": "16:00"  
 },  
 "tuesday": {  
 "open": "08:00",  
 "close": "16:00"  
 },  
 "wednesday": {  
 "open": "08:00",  
 "close": "19:30"  
 },  
 "thursday": {  
 "open": "08:00",  
 "close": "16:00"  
 },  
 "friday": {  
 "open": "08:00",  
 "close": "16:00"  
 },  
 "notes": "Closed daily 12:00-13:00. KCHC Weller Site."  
 },  
 "access_script": "Call 613-542-2949 to inquire about programs. Primary care intake is currently closed except for pregnant unattached patients. The site offers dental, harm reduction, and EarlyON programs (registration required)."  
 },  
 {  
 "id": "",  
 "hours": {  
 "monday": {  
 "open": "14:00",  
 "close": "16:00"  
 },  
 "tuesday": {  
 "open": "14:00",  
 "close": "16:00"  
 },  
 "wednesday": {  
 "open": "14:00",  
 "close": "16:00"  
 },  
 "thursday": {  
 "open": "14:00",  
 "close": "16:00"  
 },  
 "friday": {  
 "open": "14:00",  
 "close": "16:00"  
 },  
 "notes": "Hamper pickup hours only. Administration open 8:30-12 and 1:30-4:30 (closes 4pm Fri). Must call ahead."  
 },  
 "access_script": "Call 613-544-4100 to schedule an appointment; do not visit without booking. ID is required for all household members. Serves Kingston and Loyalist Township residents only."  
 },  
 {  
 "id": "",  
 "hours": {  
 "monday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "tuesday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "wednesday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "thursday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "friday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "saturday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "sunday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "notes": "Emergency shelter open 24/7 at 365 Nelson St."  
 },  
 "access_script": "Visit 365 Nelson St or call 613-549-4236 for emergency shelter. Intake is first-come, first-served for youth aged 16-24. If you are in immediate danger, call 911."  
 },  
 {  
 "id": "",  
 "hours": {  
 "monday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "tuesday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "wednesday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "thursday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "friday": {  
 "open": "08:30",  
 "close": "16:30"  
 },  
 "notes": "City of Kingston Ontario Works."  
 },  
 "access_script": "Apply online via the provincial portal or call 1-888-999-1142. For local inquiries, call 613-546-2695 or visit 362 Montreal St. Requires proof of ID, income, assets, and shelter costs."  
 },  
 {  
 "id": "",  
 "hours": {  
 "monday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "tuesday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "wednesday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "thursday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "friday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "saturday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "sunday": {  
 "open": "00:00",  
 "close": "23:59"  
 },  
 "notes": "Crisis Line 24/7. Admin office open Mon-Fri 8:30-16:30."  
 },  
 "access_script": "Call the 24/7 Crisis Line at 613-544-4229 (Kingston/Frontenac) or 613-354-7388 (Lennox & Addington). Walk-in crisis support is available Mon-Fri 8:30-15:30 at 552 Princess St. If you are in immediate danger, call 911."  
 }  
\]

#### **Works cited**

1. KFL\&A Public Health, accessed January 21, 2026, [https://www.kflaph.ca/en/index.aspx](https://www.kflaph.ca/en/index.aspx)
2. Kingston Community Health Centres \- Street Health Centre \- southeasthealthline.ca, accessed January 21, 2026, [https://www.southeasthealthline.ca/displayservice.aspx?id=112086](https://www.southeasthealthline.ca/displayservice.aspx?id=112086)
3. Weller Site \- Kingston Community Health Centres, accessed January 21, 2026, [https://kchc.ca/locations/kingston-community-health-centre/](https://kchc.ca/locations/kingston-community-health-centre/)
4. Social Services, Department of (DSS) \- Ulster County, accessed January 21, 2026, [https://www.ulstercountyny.gov/Departments/Social-Services](https://www.ulstercountyny.gov/Departments/Social-Services)
5. Community Supports \- City of Kingston, accessed January 21, 2026, [https://www.cityofkingston.ca/community-supports/](https://www.cityofkingston.ca/community-supports/)
6. Search \- 211 Ontario, accessed January 21, 2026, [https://211ontario.ca/search/](https://211ontario.ca/search/)
7. Acadian \- Kingston Youth Shelter, accessed January 21, 2026, [https://kingstonyouthshelter.com/author/Acadian/](https://kingstonyouthshelter.com/author/Acadian/)
8. Kingston Community Health Centres \- Agency Profile \- 211 Ontario, accessed January 21, 2026, [https://211ontario.ca/service/68956445/agency/kingston-community-health-centres/](https://211ontario.ca/service/68956445/agency/kingston-community-health-centres/)
9. Community Resources \- Kingston \- Home Base Housing, accessed January 21, 2026, [https://kingstonhomebase.ca/community-resources/](https://kingstonhomebase.ca/community-resources/)
10. Kingston Youth Shelter \- Agency Profile \- 211 Ontario, accessed January 21, 2026, [https://211ontario.ca/service/68954947/agency/kingston-youth-shelter/](https://211ontario.ca/service/68954947/agency/kingston-youth-shelter/)
11. Kingston Youth Shelter \- 211 Central, accessed January 21, 2026, [https://211central.ca/record/68954957/](https://211central.ca/record/68954957/)
12. Kingston Youth Shelter \- 211 Ontario, accessed January 21, 2026, [https://211ontario.ca/service/68954954/kingston-youth-shelter-kingston-youth-shelter/](https://211ontario.ca/service/68954954/kingston-youth-shelter-kingston-youth-shelter/)
13. Kingston Youth Transitions \- southeasthealthline.ca, accessed January 21, 2026, [https://www.southeasthealthline.ca/displayService.aspx?id=203221](https://www.southeasthealthline.ca/displayService.aspx?id=203221)
14. Addiction and Mental Health Services (AMHS-KFLA) \- Kingston Frontenac Lennox & Addington \- Crisis Services \- southeasthealthline.ca, accessed January 21, 2026, [https://www.southeasthealthline.ca/displayservice.aspx?id=72079](https://www.southeasthealthline.ca/displayservice.aspx?id=72079)
15. Crisis Support and Listening Lines \- CFMWS, accessed January 21, 2026, [https://cfmws.ca/kingston/crisis-support-and-listening-lines](https://cfmws.ca/kingston/crisis-support-and-listening-lines)
16. Crisis Services – Addiction & Mental Health Services \- amhs-kfla, accessed January 21, 2026, [https://amhs-kfla.ca/programs-services/crisis/](https://amhs-kfla.ca/programs-services/crisis/)
17. Partners in Mission Food Bank \- 211 Ontario, accessed January 21, 2026, [https://211ontario.ca/service/68953414/partners-in-mission-food-bank-partners-in-mission-food-bank/](https://211ontario.ca/service/68953414/partners-in-mission-food-bank-partners-in-mission-food-bank/)
18. Partners in Mission Food Bank \- southeasthealthline.ca, accessed January 21, 2026, [https://www.southeasthealthline.ca/displayservice.aspx?id=73449](https://www.southeasthealthline.ca/displayservice.aspx?id=73449)
19. Southeast Public Health (SEPH) \- Kingston \- southeasthealthline.ca, accessed January 21, 2026, [https://www.southeasthealthline.ca/displayservice.aspx?id=72571](https://www.southeasthealthline.ca/displayservice.aspx?id=72571)
20. KFL\&A Public Health \- Kingston Community Health Centres, accessed January 21, 2026, [https://kchc.ca/locations/kfla-public-health/](https://kchc.ca/locations/kfla-public-health/)
21. Routine immunization clinics \- Kingston \- KFL\&A Public Health, accessed January 21, 2026, [https://www.kflaph.ca/en/clinics-and-classes/routine-immunization-clinics.aspx](https://www.kflaph.ca/en/clinics-and-classes/routine-immunization-clinics.aspx)
22. Community information | Kingston \- 211 Ontario, accessed January 21, 2026, [https://211ontario.ca/results/?searchLocation=Kingston\&topicPath=10\&latitude=44.2311717\&longitude=-76.4859544\&fpg=sm](https://211ontario.ca/results/?searchLocation=Kingston&topicPath=10&latitude=44.2311717&longitude=-76.4859544&fpg=sm)
23. Ontario Works \- County of Frontenac, accessed January 21, 2026, [https://www.frontenaccounty.ca/en/living/ontario-works.aspx](https://www.frontenaccounty.ca/en/living/ontario-works.aspx)
24. Kingston (City of) \- Housing and Social Services Department \- Ontario Works Program \- southeasthealthline.ca, accessed January 21, 2026, [http://www.southeasthealthline.ca/displayService.aspx?id=72570](http://www.southeasthealthline.ca/displayService.aspx?id=72570)
25. 211 Kingston. City Hall \- Ontario Works \- Housing & Social Services Department, Kingston \- 362 Montreal St, 2nd Flr, accessed January 21, 2026, [https://211ontario.ca/service/68954890/kingston-city-hall-ontario-works-housing--social-services-department-kingston-362-montreal-st-2nd-flr/](https://211ontario.ca/service/68954890/kingston-city-hall-ontario-works-housing--social-services-department-kingston-362-montreal-st-2nd-flr/)
26. Ontario Works Financial Assistance \- City of Kingston, accessed January 21, 2026, [https://www.cityofkingston.ca/community-supports/ontario-works-financial-assistance/](https://www.cityofkingston.ca/community-supports/ontario-works-financial-assistance/)
