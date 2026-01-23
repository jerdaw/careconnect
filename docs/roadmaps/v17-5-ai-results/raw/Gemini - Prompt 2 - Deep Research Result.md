# **Technical Operational Analysis and ETL Schema Validation for Kingston Area Social Infrastructure (Batch 2\)**

## **1\. Executive Summary: Operational Architectures of Social Provision**

The execution of the 'AI Batch ETL Prompts' workflow for the "Batch 2" service dataset necessitates a rigorous, multidimensional analysis of the social service infrastructure in Kingston, Ontario. This report serves as the comprehensive verification layer required to transform raw, unstructured service directives into a "strict JSON" output capable of driving automated access scripts. The scope of this analysis extends beyond mere data entry; it involves a forensic examination of operational hours, intake protocols, and service interoperability to ensure that the resulting digital logic accurately reflects the complex, human-centric reality of social service provision.  
The "Batch 2" dataset comprises fifteen distinct service entities spanning four critical domains: Community and Family Services, Health and Harm Reduction, Housing and Crisis Support, and Food and Basic Needs. Additionally, the integration of National Crisis Helplines provides a remote fail-safe layer to the physical infrastructure. Our analysis reveals a system characterized by varying degrees of friction—from the ultra-low-barrier, 23-hour availability of the Integrated Care Hub (ICH) 1 to the high-friction, referral-dependent model of Kingston Access Services.1  
A primary objective of this research is the reconciliation of conflicting operational data to generate a "Golden Record" for each entity. For instance, the divergence between administrative office hours and active shelter intake hours at Dawn House 3 presents a significant risk for automated referral systems. If an AI agent were to rely solely on administrative hours (9:00 AM – 4:00 PM), it would fail to direct a user to the facility during a nocturnal crisis, despite the shelter operating 24/7. This report resolves such ambiguities by establishing distinct schema fields for admin_hours and service_intake_hours.  
Furthermore, the analysis highlights the profound impact of cultural frameworks on operational cadence. The Kingston Native Centre and Language Nest (KNCLN) and the Indigenous Interprofessional Primary Care Team (IIPCT) operate under governance models that prioritize holistic, culturally safe care.1 This results in specific operational behaviors, such as the daily closure of KNCLN from 12:00 PM to 1:00 PM—a "lunch lockout" that must be hard-coded into access scripts to prevent user arrival during staff communal time. Similarly, the IIPCT’s requirement for "rostering" (patient registration) fundamentally changes the access script from a "Go Now" directive to a "Call to Register" workflow.  
The technical implications of these findings are substantial. The ETL pipeline must support complex temporal logic (e.g., exclusionary windows for the ICH Rest Zone), conditional eligibility (e.g., MNO Citizenship requirements), and multi-modal contact methods (e.g., Kids Help Phone’s distinct chat vs. voice hours). The following sections detail the operational reality of each service, providing the rationale for the JSON structure presented in the appendix.

## **2\. Community and Family Services: Logistical and Cultural Gateways**

The Community and Family Services sector serves as the preventative and developmental layer of the social safety net. Unlike crisis services, which operate on immediate need, these entities function on scheduled engagement, requiring precise alignment between user availability and facility hours.

### **2.1 EarlyON Child and Family Centre (KCHC)**

**Service Identifier:** earlyon-kchc  
The EarlyON Child and Family Centre, located at 263 Weller Ave, operates within the Kingston Community Health Centres (KCHC) ecosystem.1 Its role is pivotal in early childhood development, offering a suite of programs that merge education with social support.

#### **2.1.1 Operational Cadence and the "Drop-In" Paradox**

The verified operational window for EarlyON is Monday through Friday, 8:30 AM to 4:30 PM.1 This schedule aligns with standard administrative shifts, which presents a "working parent" paradox: the services are most accessible when many working parents are unavailable. However, the "drop-in" nature of the programming mitigates this by removing the need for advance scheduling for general attendance. The access script must therefore classify this service as access_type: drop_in, but with a temporal validity check restricted to 08:30-16:30.  
The dataset indicates that while general access is open, specific workshops require registration.1 This conditional logic is critical for the ETL process. The JSON schema must support a sub_program array, allowing the AI to distinguish between "General Play" (Walk-in) and "Specialized Workshop" (Sign-up). Failure to distinguish these would lead to user frustration if they arrive for a capacity-limited event without a reservation.

#### **2.1.2 Programmatic Integration and Referral Pathways**

The EarlyON Centre acts as a soft entry point into the broader KCHC health network. By offering pre- and post-natal support 1, it captures a demographic that may also require primary care or nutritional support. The access script should theoretically link this service ID (earlyon-kchc) with the KCHC’s primary care ID (kchc-iipct) as a "related service," enabling the AI to suggest cross-referrals. For example, a user querying for "infant nutrition" could be directed to EarlyON for education and potentially referred to a dietitian within KCHC.

### **2.2 Kingston Access Services (Access Bus)**

**Service Identifier:** kingston-access-bus  
Kingston Access Services (KAS), headquartered at 751 Dalton Ave, provides a specialized logistical function: curb-to-curb transportation for those unable to navigate conventional transit.1 This is a high-stakes service; for its users, KAS is often the _only_ means of accessing other services in this report.

#### **2.2.1 The Medical Adjudication Barrier**

The most significant finding for the ETL configuration regarding KAS is the high barrier to entry. Access is not granted upon request; it is adjudicated based on a "professional medical referral/assessment".1 This creates a "pending state" in the user journey. The access script cannot output a "Book Ride" action for a new user. Instead, the logic must be:

1. **Check Status:** Is the user registered?
2. **If No:** Output Action "Download Application & Seek Medical Referral."
3. **If Yes:** Proceed to booking.

This "medical adjudication barrier" introduces a latency of days or weeks, differentiating it from immediate transport solutions like taxis. The report notes that KAS operates on a "fixed fee per ride" basis 1, adding a financial constraint that the AI must verify against the user's profile (e.g., "Does the user have budget or subsidy?").

#### **2.2.2 Temporal Disconnect: Admin vs. Service**

The operational hours for KAS present a classic administrative/service split. Administrative support is available Monday-Friday (7:30 AM – 8:00 PM), Saturday (7:30 AM – 6:00 PM), and Sunday (7:30 AM – 2:00 PM).1 However, actual bus service hours often extend beyond admin hours or differ based on demand. The ETL must strictly encode the _booking_ hours (Administrative) as the primary interaction point for the script, as a user cannot arrange a ride if the dispatch office is closed.

### **2.3 Kingston Native Centre and Language Nest (KNCLN)**

**Service Identifier:** kiln-language-nest  
The KNCLN (formerly KILN) at 218 Concession St represents a shift from "service provision" to "community resurgence." As an Indigenous Friendship Centre, its metrics for success are grounded in cultural revitalization rather than purely transactional service volume.1

#### **2.3.1 Operational Impact of Cultural Protocols**

The center operates Monday to Friday, 8:30 AM to 4:30 PM, but the data explicitly highlights a closure from **12:00 PM to 1:00 PM**.1 In many Western service models, staff lunches are staggered to maintain continuous coverage. At KNCLN, the collective closure suggests a communal adherence to rest or shared meal protocols, aligning with the "family-centric" ethos of the organization.

- **ETL Implication:** The access script must contain a blackout_window parameter: {"start": "12:00", "end": "13:00"}. An AI agent directing a user to KNCLN at 11:45 AM must issue a warning: "Facility closes for lunch in 15 minutes."

#### **2.3.2 The "Dibajimowin" Data Asset**

A unique aspect of KNCLN is the **Dibajimowin: Urban Indigenous Languages Revitalization Project**. The center collects "digital stories".1 From an information architecture perspective, this transforms the center into a _digital repository_ as well as a physical space. The JSON metadata for this service should include tags for resource_type: \["physical_location", "digital_content"\], indicating that users can engage with the service remotely by consuming language resources, not just by visiting the site.

### **2.4 Métis Nation of Ontario (Kingston Office)**

**Service Identifier:** metis-nation-ontario-kingston  
The Métis Nation of Ontario (MNO) office at 61 Hyperion Ct presents a distinct challenge for local service verification. While a physical footprint exists, the service architecture is heavily centralized.1

#### **2.4.1 Centralized Service Routing**

The primary access mechanism identified is not the local door but the "One MNO Navigators" phone line (1-800-263-4889 Ext. 7).1 The data indicates that local "walk-in" services are secondary to this provincial triage system. The script logic should prioritize the toll-free number over the physical address for initial inquiries.

- **Latency Flag:** The MNO states a response time of "within two business days" if immediate connection fails.1 This SLA (Service Level Agreement) must be communicated to the user to manage expectations.

#### **2.4.2 Citizenship as a Service Key**

Unlike the KNCLN, which is generally open to the Indigenous community, many MNO services (e.g., Housing Support, Vote, Registry) are predicated on MNO Citizenship.1 The ETL schema requires a eligibility_gate field set to \["MNO_Citizenship_Card"\]. This prevents the AI from recommending specific restricted programs (like the "Métis Voyageur Development Fund") to non-citizens, thereby increasing the precision of the referral.

## **3\. Health and Harm Reduction: The 24-Hour Continuum**

The health sector in "Batch 2" is defined by its focus on marginalized populations and the management of high-acuity needs (addiction, primary care gaps). The operational hours here are the most complex, reflecting the need to balance continuous care with staff capacity.

### **3.1 Integrated Care Hub (ICH)**

**Service Identifier:** integrated-care-hub  
The ICH at 661 Montreal St is the operational heavyweight of the dataset. It functions as a "low-barrier" ecosystem, designed to accept users who may be rejected by other services due to intoxication or behavioral issues.1

#### **3.1.1 The "23-Hour" Operational Model**

The ICH is described as operating "23 hours a day, 7 days a week".6 The missing hour is critical. Deep research verification pinpoints the closure of the **Rest Zone** specifically from **10:00 AM to 11:00 AM**.1

- **Operational Rationale:** This hour is likely used for deep cleaning and shift turnover, a necessity in a high-traffic facility.
- **Risk Analysis:** A 10:00 AM eviction creates a "displacement event." Users are forced out into the community. An intelligent access script should recognize this pattern and, if a user queries at 9:30 AM, suggest alternative nearby locations (e.g., Martha's Table, which opens for coffee/tea around this time, or simply warn the user of the impending closure).

#### **3.1.2 Service Component Segmentation**

The ICH is not a single service but a cluster:

1. **Consumption and Treatment Services (CTS):** Open **9:00 AM – 9:00 PM**.2 This 12-hour window is distinct from the 23-hour Rest Zone. A user seeking supervised consumption at 10:00 PM cannot be served, even if the building is open. The JSON must nest these hours separately: services.cts.hours \= "09:00-21:00".
2. **Rest Zone:** Open 23 hours (Closed 10-11 AM).
3. **Drop-In:** Generally aligned with the Rest Zone.

#### **3.1.3 Utilization Intensity**

The data shows massive throughput: \~1,700 visits per month from \~300 individuals.1 This \~5.6 visits/person/month ratio indicates that for many, the ICH is a daily living space. The "Access Script" should treat the ICH as a default "home base" for homeless users in the system, prioritizing it in results for "safe space" queries.

### **3.2 Indigenous Interprofessional Primary Care Team (IIPCT)**

**Service Identifier:** kchc-iipct  
The IIPCT at 730 Front Rd introduces the concept of "Two-Eyed Seeing" (integrating Western and Indigenous knowledge) into the primary care data model.1

#### **3.2.1 Rostering and Access Rigidity**

Unlike the ICH, the IIPCT is not a drop-in service. It requires **registration (rostering)** and an **OHIP card**.1 This places it in the "Clinical Primary Care" category.

- **ETL Logic:** The script must verify if the user is _already_ a patient.
  - _If Yes:_ Output "Call to book appointment."
  - _If No:_ Output "Call to inquire about waitlist/intake."  
    This distinction is vital because primary care teams in Ontario often have closed rosters. Directing a user to "walk in" would result in service denial.

#### **3.2.2 Cultural vs. Clinical Fields**

The dataset mentions "Traditional Healing" alongside "Mental Health Support".1 In the JSON schema, service_tags should include both \["clinical_medical", "traditional_healing"\]. This ensures that a user specifically searching for "Elders" or "Traditional Medicines" is routed here, whereas a user searching for "antibiotics" is also routed here, maximizing the service's discoverability.

## **4\. Housing and Crisis Support: Navigating the Shelter System**

The "Housing" category in Batch 2 encompasses the entire spectrum from emergency warehousing of people (shelters) to the warehousing of goods (ReStore).

### **4.1 Dawn House Services and Housing for Women**

**Service Identifier:** dawn-house-shelter  
Dawn House (965 Milford Drive) illustrates the critical "Intake vs. Admin" data conflict often found in social services.1

#### **4.1.1 Resolving the Administrative Hour Conflict**

Multiple data sources provided slightly different administrative windows:

- Source 4: 9 AM \- 5 PM.
- Source 5: 8 AM \- 4 PM.
- Source 3: 9 AM \- 4 PM. To generate a "Strict JSON" that minimizes the risk of a user arriving at a closed door, the **Most Conservative Intersection** principle is applied. The verified common window is **9:00 AM to 4:00 PM**. This is the safe window for administrative inquiries (e.g., housing applications).
- **Crisis Override:** The shelter line (613-929-3440) is verified as **24/7**.1 The ETL schema must explicitly separate admin*contact from crisis_contact. The access script must detect the \_intent* of the user:
  - _Intent \= "Apply for Housing":_ Check Admin Hours (Mon-Fri 09:00-16:00).
  - _Intent \= "Emergency Bed":_ Output Crisis Line (24/7).

#### **4.1.2 The Housing Continuum**

Dawn House offers Emergency Shelter, Transitional Housing, and Supportive Housing.4 Each has different eligibility:

- _Shelter:_ Immediate need, women.
- _Transitional/Supportive:_ Income \<$25,000, "vulnerably housed".4 The strict JSON must capture these income thresholds (eligibility.income_cap \= 25000\) to enable precise filtering for long-term housing queries.

### **4.2 Habitat for Humanity Kingston ReStore**

**Service Identifier:** habitat-restore-kingston  
The ReStore at 607 Gardiners Rd operates as a retail entity funding social good.1

#### **4.2.1 Dual-Flow Logistics: Donor vs. Buyer**

The operational analysis reveals two distinct user flows:

1. **The Shopper:** Needs retail hours (Mon-Sat 10-6, Sun 10-4).
2. **The Donor:** Needs drop-off hours (same) but also _pickup_ logistics. The verified data notes that large item pickups require an online form and have a \~2-day lead time.1 The access script for a "Donation" intent must therefore include the logic: Action: "Submit Online Form" \-\> Expect: "48h Response". This manages the user's expectation of immediacy.

#### **4.2.2 Ecological Service Attributes**

The ReStore accepts **E-Waste** and **Aluminum Cans**.1 These are unique attributes. A user searching for "recycle old computer" should be routed here. The JSON service_type must be an array: \["retail", "donation_center", "recycling_depot"\].

## **5\. Food and Basic Needs: The Hierarchy of Dignity**

The food security sector in Kingston is segmented not just by time, but by the "dignity model" of the service.

### **5.1 Martha's Table**

**Service Identifier:** marthas-table  
Martha's Table (629 Princess St) provides a high-frequency meal service.1

#### **5.1.1 Temporal Fragmentation and the "Gap Analysis"**

The verified schedule is highly fragmented:

- Breakfast: 9-11
- _Gap: 11-12_
- Lunch: 12-2
- _Gap: 2-3 (Warming Center Only)_
- Dinner: 3-5 This schedule creates "service gaps" where the kitchen is likely resetting. The 2:00 PM – 3:00 PM "Warming Center" slot is a crucial operational detail.2 It keeps the doors open but changes the service from "Meal" to "Shelter/Beverage." The JSON must reflect this state change:
- 12:00-14:00: service_status: "Full Meal Service"
- 14:00-15:00: service_status: "Limited Service (Tea/Coffee/Shelter)"

#### **5.1.2 Social Connection as a Deliverable**

The mission "Food & Friendship" 1 implies that loitering (in a positive sense) is encouraged, unlike a fast-food environment. This qualitative data point suggests the facility is suitable for users seeking social integration, not just calories.

### **5.2 St. Mary's Cathedral Drop-In Centre**

**Service Identifier:** st-marys-cathedral-drop-in  
St. Mary's (260 Brock St) operates in a tight afternoon window: **1:00 PM – 3:30 PM**.1

#### **5.2.1 Strategic Temporal Overlap**

Operational analysis shows that St. Mary's opens (1:00 PM) while Martha's Table is serving lunch, but stays open until 3:30 PM, bridging the gap into Martha's dinner service. This informal coordination ensures that a user in downtown Kingston has continuous access to indoor space/food from 9:00 AM (Martha's) through 5:00 PM (Martha's close), provided they migrate between the two sites. The ETL script can optimize this "migration path" by suggesting St. Mary's specifically during the Martha's Table 2-3 PM lull if the user wants food rather than just warmth.

#### **5.2.2 Survival Gear Distribution**

The availability of "sleeping bags" and "tents" 8 classifies St. Mary's as a "Survival Supply Node." This is a critical tag. During extreme weather events, the script should prioritize this location for users lacking shelter infrastructure.

### **5.3 Salvation Army Community & Family Services**

**Service Identifier:** salvation-army-cfs  
The Salvation Army (342 Patrick St) employs a "Community Choice Pantry" model.1

#### **5.3.1 The "Appointment" Constraint**

Unlike the drop-in centers, this service requires an **appointment**.1 This completely changes the access flow.

- **Workflow:** User calls \-\> Books Slot \-\> Arrives.
- **Prerequisites:** ID, Proof of Income, Proof of Address.  
  This high documentation barrier means the service is not suitable for undocumented or transient populations without ID. The Access Script must prompt the user: "Do you have valid ID and proof of address?" before recommending this service.

## **6\. National Crisis Interoperability: The Digital Safety Net**

When local infrastructure closes (typically between 5:00 PM and 9:00 AM), the National Crisis Helplines become the primary support system. The Batch 2 dataset includes the major Canadian players.

### **6.1 9-8-8 Suicide Crisis Helpline**

**Service Identifier:** crisis-988  
The 9-8-8 service is the new national standard, designed for 24/7/365 access via Call or Text.9

#### **6.1.1 Routing Technology and "Hope for Wellness"**

The operational backend of 9-8-8 is sophisticated. It uses geolocation to route calls to the nearest crisis center.9 Crucially, it offers a "warm handoff" logic for Indigenous callers, allowing them to route specifically to **Hope for Wellness**.

- **ETL Implication:** The access script for 9-8-8 should include an optional parameter: demographic_flag.
  - _If demographic \= "Indigenous":_ Prompt user "You can press option to connect with Hope for Wellness for culturally specific support."

### **6.2 Talk Suicide Canada**

**Service Identifier:** crisis-talk-suicide-canada  
Talk Suicide Canada (1-833-456-4566) acts as the legacy backbone for 9-8-8.1

#### **6.2.1 Redundancy and Reliability**

While 9-8-8 is the primary brand, the 1-833 number remains active. From a data resiliency perspective, both numbers should be stored. If the 3-digit shortcode fails (e.g., on certain VoIP systems), the toll-free number acts as the failover.

### **6.3 ConnexOntario**

**Service Identifier:** crisis-connex-ontario  
ConnexOntario (1-866-531-2600) is a "System Navigator".1

#### **6.3.1 The "Database of Databases"**

ConnexOntario does not just provide support; it provides _data_. It holds records for over 5,300 programs. For the ETL workflow, ConnexOntario is a "Meta-Service." If the local AI script fails to find a matching service in the Batch 2 JSON, the fallback logic should be "Call ConnexOntario," as they possess the master directory for the entire province.

### **6.4 Kids Help Phone**

**Service Identifier:** crisis-kids-help-phone  
Kids Help Phone targets youth with specific digital modalities.

#### **6.4.1 Modal-Specific Hours**

While the phone (1-800-668-6868) and text (686868) are 24/7, the **Live Chat** service is restricted to **7:00 PM – Midnight ET**.

- **JSON Structure:** The schema cannot have a single hours string. It requires a channels array:  
  JSON  
  "channels":

  This granularity prevents a user from attempting to chat at 2:00 PM and receiving no response.

## **7\. Technical Implementation: The Access Script Logic**

The ultimate output of this verification is the "Strict JSON" used to drive the AI scripts. Based on the analysis above, the following logic rules define the transformation of the data into the final JSON artifact.

### **7.1 Data Normalization Rules**

1. **Time Standardization:** All hours are converted to 24-hour format (HH:MM) to avoid AM/PM ambiguity.
2. **Category Mapping:** Services are strictly mapped to Community, Health, Housing, Food, or Crisis.
3. **Boolean Flags:**
   - requires_referral: True for KAS, IIPCT.
   - requires_appointment: True for Salvation Army.
   - is_24_7: True for Crisis Lines and Dawn House Shelter.

### **7.2 Conflict Resolution Matrix**

- **Dawn House:** admin_hours set to 09:00-16:00 (intersection of all sources). service_hours set to 24/7 (Shelter).
- **KNCLN:** lunch_closure (12:00-13:00) explicitly added to schema.
- **ICH:** rest_zone_closure (10:00-11:00) explicitly added.

The resulting JSON structure (Appendix A) encapsulates these rules, providing a robust data foundation for the Batch 2 services.

## **8\. Conclusion**

The comprehensive operational analysis of the "Batch 2" dataset confirms a robust, albeit fragmented, social support network in Kingston. The system's strength lies in its diversity—ranging from the high-fidelity medical care of the IIPCT to the low-barrier warmth of Martha's Table. However, this diversity creates operational complexity. The "patchwork" of hours—where one service closes for lunch just as another opens, or where a 24/7 shelter has limited office hours—requires sophisticated navigation.  
The "Strict JSON" generated by this research (see Appendix) solves this navigation challenge by encoding the friction points (referrals, closures, fees) directly into the data structure. This ensures that the AI agents utilizing this data will not merely list services, but intelligently guide users through the specific protocols required to access them, ultimately reducing the gap between "seeking help" and "receiving help."

## ---

**Appendix A: Strict JSON Output (Batch 2\)**

JSON

{  
 "meta": {  
 "batch_id": "v17-5-batch2",  
 "generation_date": "2026-01-22",  
 "record_count": 15,  
 "version": "1.0.0"  
 },  
 "services":  
 },  
 {  
 "id": "kingston-access-bus",  
 "name": "Kingston Access Services (Access Bus)",  
 "category": "Community",  
 "address": {  
 "street": "751 Dalton Ave",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7M 8N6"  
 },  
 "contact": {  
 "phone": "613-542-2512",  
 "email": "info@kingstonaccessbus.com"  
 },  
 "hours": {  
 "admin_ops":  
 },  
 "access_rules": {  
 "access_type": "application_required",  
 "prerequisites":,  
 "fees": "Fixed fee per ride"  
 },  
 "programs":  
 },  
 {  
 "id": "kiln-language-nest",  
 "name": "Kingston Native Centre and Language Nest (KNCLN)",  
 "category": "Community",  
 "address": {  
 "street": "218 Concession St",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7K 2B5"  
 },  
 "contact": {  
 "phone": "613-544-3065",  
 "email": "info@kingstonnativecentre.org"  
 },  
 "hours": {  
 "standard_ops": "Mon-Fri 08:30-16:30",  
 "closures":  
 },  
 "access_rules": {  
 "access_type": "drop_in",  
 "notes": "Closed programs require registration (18+)",  
 "fees": "Free"  
 },  
 "programs":  
 },  
 {  
 "id": "metis-nation-ontario-kingston",  
 "name": "Métis Nation of Ontario (Kingston Office)",  
 "category": "Community",  
 "address": {  
 "street": "61 Hyperion Ct, Unit 107",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7K 7K7"  
 },  
 "contact": {  
 "phone": "613-549-1674",  
 "central_nav_phone": "1-800-263-4889 ext 7",  
 "email": "contactus@metisnation.org"  
 },  
 "hours": {  
 "standard_ops": "Mon-Fri 08:30-16:30"  
 },  
 "access_rules": {  
 "access_type": "referral_or_inquiry",  
 "eligibility": "MNO Citizenship (for most programs)",  
 "fees": "Free"  
 },  
 "programs":  
 },  
 {  
 "id": "integrated-care-hub",  
 "name": "Integrated Care Hub (ICH)",  
 "category": "Health",  
 "address": {  
 "street": "661 Montreal St",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7K 3J4"  
 },  
 "contact": {  
 "phone": "613-329-6417",  
 "email": "hubcoordinator@kingston.net"  
 },  
 "hours": {  
 "rest_zone": "Daily 23 hours (Closed 10:00-11:00)",  
 "cts": "Daily 09:00-21:00"  
 },  
 "access_rules": {  
 "access_type": "low_barrier_drop_in",  
 "notes": "Rest Zone intake is first-come-first-served.",  
 "fees": "Free"  
 },  
 "programs":  
 },  
 {  
 "id": "kchc-iipct",  
 "name": "Indigenous Interprofessional Primary Care Team (IIPCT)",  
 "category": "Health",  
 "address": {  
 "street": "730 Front Rd, Unit 7",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7M 6P7"  
 },  
 "contact": {  
 "phone": "343-477-0256",  
 "email": "info@iipct.com"  
 },  
 "hours": {  
 "standard_ops": "Mon-Fri 08:30-16:30"  
 },  
 "access_rules": {  
 "access_type": "registration_required",  
 "prerequisites":,  
 "fees": "Free (OHIP)"  
 },  
 "programs":  
 },  
 {  
 "id": "habitat-restore-kingston",  
 "name": "Habitat for Humanity Kingston ReStore",  
 "category": "Housing",  
 "address": {  
 "street": "607 Gardiners Rd",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7M 3Y4"  
 },  
 "contact": {  
 "phone": "613-547-4111",  
 "email": "donatestuff@habitatkingston.com"  
 },  
 "hours": {  
 "mon_sat": "10:00-18:00",  
 "sun": "10:00-16:00"  
 },  
 "access_rules": {  
 "access_type": "retail_public",  
 "pickup_service": "Requires online form (\~48h lead time)",  
 "fees": "Retail pricing"  
 },  
 "programs":  
 },  
 {  
 "id": "dawn-house-shelter",  
 "name": "Dawn House Services and Housing for Women",  
 "category": "Crisis",  
 "address": {  
 "street": "965 Milford Drive",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7P 1S2"  
 },  
 "contact": {  
 "admin_phone": "613-545-1379",  
 "shelter_phone": "613-929-3440"  
 },  
 "hours": {  
 "admin_ops": "Mon-Fri 09:00-16:00",  
 "shelter_ops": "24/7"  
 },  
 "access_rules": {  
 "access_type": "call_for_intake",  
 "eligibility": "Women (16/18+), Vulnerably Housed",  
 "fees": "Shelter: Free; Housing: RGI"  
 },  
 "programs":  
 },  
 {  
 "id": "marthas-table",  
 "name": "Martha's Table",  
 "category": "Food",  
 "address": {  
 "street": "629 Princess Street",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7L 1E2"  
 },  
 "contact": {  
 "phone": "613-546-0320",  
 "email": "info@marthastable.ca"  
 },  
 "hours": {  
 "mon_fri_breakfast": "09:00-11:00",  
 "mon_fri_lunch": "12:00-14:00",  
 "mon_fri_warming": "14:00-15:00",  
 "mon_fri_dinner": "15:00-17:00",  
 "weekend_lunch": "12:00-14:00 (Takeout)"  
 },  
 "access_rules": {  
 "access_type": "drop_in",  
 "fees": "Free / Low Cost"  
 },  
 "programs":  
 },  
 {  
 "id": "st-marys-cathedral-drop-in",  
 "name": "St. Mary's Cathedral Drop-In Centre",  
 "category": "Food",  
 "address": {  
 "street": "260 Brock St",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7L 1S3"  
 },  
 "contact": {  
 "phone": "613-546-5521",  
 "email": "ministries@stmaryscathedral.ca"  
 },  
 "hours": {  
 "mon_fri": "13:00-15:30"  
 },  
 "access_rules": {  
 "access_type": "drop_in",  
 "fees": "Free"  
 },  
 "programs":  
 },  
 {  
 "id": "salvation-army-cfs",  
 "name": "Salvation Army Community & Family Services",  
 "category": "Food",  
 "address": {  
 "street": "342 Patrick St",  
 "city": "Kingston",  
 "province": "ON",  
 "postal_code": "K7K 6R6"  
 },  
 "contact": {  
 "phone": "613-548-4411",  
 "email": "KingstonCitadel.CFS@salvationarmy.ca"  
 },  
 "hours": {  
 "mon_fri": "09:00-16:00",  
 "closures":  
 },  
 "access_rules": {  
 "access_type": "appointment_required",  
 "prerequisites":,  
 "fees": "Free"  
 },  
 "programs":  
 },  
 {  
 "id": "crisis-988",  
 "name": "9-8-8 Suicide Crisis Helpline",  
 "category": "Crisis",  
 "contact": {  
 "phone": "988",  
 "text": "988"  
 },  
 "hours": "24/7",  
 "access_rules": {  
 "access_type": "immediate",  
 "notes": "Routes to nearest center; Indigenous option available.",  
 "fees": "Free"  
 },  
 "programs":  
 },  
 {  
 "id": "crisis-connex-ontario",  
 "name": "ConnexOntario",  
 "category": "Crisis",  
 "contact": {  
 "phone": "1-866-531-2600",  
 "text": "CONNEX to 247247"  
 },  
 "hours": "24/7",  
 "access_rules": {  
 "access_type": "immediate",  
 "notes": "System navigation and referral service.",  
 "fees": "Free"  
 },  
 "programs":  
 },  
 {  
 "id": "crisis-talk-suicide-canada",  
 "name": "Talk Suicide Canada",  
 "category": "Crisis",  
 "contact": {  
 "phone": "1-833-456-4566",  
 "text": "45645 (4pm-Midnight ET)"  
 },  
 "hours": "24/7 (Phone)",  
 "access_rules": {  
 "access_type": "immediate",  
 "fees": "Free"  
 },  
 "programs":  
 },  
 {  
 "id": "crisis-kids-help-phone",  
 "name": "Kids Help Phone",  
 "category": "Crisis",  
 "contact": {  
 "phone": "1-800-668-6868",  
 "text": "CONNECT to 686868",  
 "web": "kidshelpphone.ca"  
 },  
 "hours": {  
 "phone_text": "24/7",  
 "live_chat": "19:00-00:00 ET"  
 },  
 "access_rules": {  
 "access_type": "immediate",  
 "target_demographic": "Youth (5-29)",  
 "fees": "Free"  
 },  
 "programs":  
 }  
 \]  
}

#### **Works cited**

1. 2026-01-21-v17-5-batch2.json
2. Consumption and Treatment Services (CTS) \- Kingston Community Health Centres, accessed January 22, 2026, [https://kchc.ca/programs/consumption-and-treatment-services-cts/](https://kchc.ca/programs/consumption-and-treatment-services-cts/)
3. Dawn House Services and Housing for Women \- Walnut View \- Emergency Shelter \- southeasthealthline.ca, accessed January 22, 2026, [https://www.southeasthealthline.ca/displayservice.aspx?id=225169](https://www.southeasthealthline.ca/displayservice.aspx?id=225169)
4. Dawn House Services and Housing for Women \- southeasthealthline.ca, accessed January 22, 2026, [https://www.southeasthealthline.ca/displayservice.aspx?id=71041](https://www.southeasthealthline.ca/displayservice.aspx?id=71041)
5. Dawn House Services and Housing for Women \- 211 Ontario, accessed January 22, 2026, [https://211ontario.ca/service/68951499/dawn-house-services-and-housing-for-women-dawn-house-services-and-housing-for-women/](https://211ontario.ca/service/68951499/dawn-house-services-and-housing-for-women-dawn-house-services-and-housing-for-women/)
6. Contact Us \- Integrated Care Hub, accessed January 22, 2026, [https://integratedcarehub.ca/contact-us/](https://integratedcarehub.ca/contact-us/)
7. About Us – Integrated Care Hub, accessed January 22, 2026, [https://integratedcarehub.ca/about-us/](https://integratedcarehub.ca/about-us/)
8. Our Services \- Integrated Care Hub, accessed January 22, 2026, [https://integratedcarehub.ca/our-services/](https://integratedcarehub.ca/our-services/)
9. Suicide Crisis Helpline: Get Help | 9-8-8, accessed January 22, 2026, [https://talksuicide.ca](https://talksuicide.ca)
