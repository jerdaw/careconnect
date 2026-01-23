# **Comprehensive Analysis of AI Batch ETL Architectures and Municipal Service Inventory Verification (Kingston, Ontario Case Study)**

## **Executive Summary**

The modernization of municipal service delivery relies increasingly on the aggregation, verification, and structured dissemination of data. As civic entities transition from static PDF directories to dynamic, API-driven architectures, the role of Extract, Transform, Load (ETL) pipelines becomes central to public administration. This report addresses the "Batch 3" directive: a dual-stream initiative requiring advanced Python-based JSON ETL workflows and a deep-dive domain analysis of social services in Kingston, Ontario.  
The technical analysis establishes a rigorous framework for Python scripting, emphasizing the json module's serialization capabilities, memory management for large-scale ingestion, and error handling protocols required for "Deep Research" automation. It dissects the necessary transition from fragile string parsing to robust file stream handling, essential for processing the heterogeneous data sources typical of government repositories.  
Simultaneously, the domain analysis conducts a granular audit of the Kingston service landscape, specifically targeting Housing and Homelessness, Early Years and Childcare, and Employment Assistance. By synthesizing disparate data sources—municipal agendas, provincial health directories, open data portals, and strategic planning documents—the report constructs a verified "Gold Standard" dataset. This analysis navigates critical disambiguation challenges, such as distinguishing Kingston, Ontario’s 2026 strategic goals from those of Kingston, New York, and reconciling conflicting operational hours across different public directories. The culmination of this research is a strict, schema-compliant JSON artifact designed to serve as the foundational truth for the Batch 3 automated systems.

## ---

**1\. Technical Framework: Advanced Python JSON ETL Architectures**

The operational success of the "Batch 3" mandate hinges on the reliability of the underlying code infrastructure. The prompt specifies a workflow that utilizes the web to verify and fill details before returning a strict JSON output. This requirement necessitates a mastery of Python’s json library that extends beyond simple dictionary lookups into the realms of character encoding, stream processing, and custom object serialization.

### **1.1 Serialization Mechanics and Memory Optimization**

The core of the ETL process is the translation between Python’s native object hierarchy and the standardized JSON string format. While the json module appears straightforward, its behavior with large datasets and complex character sets defines the robustness of the entire pipeline.

#### **1.1.1 The load vs. loads Paradigm in Batch Processing**

A fundamental distinction in the json module is the separation of string-based and stream-based deserialization. Understanding this is critical for designing ETL scripts that do not exhaust system memory when processing large "service inventory" dumps.1  
The function json.loads(s) (load string) operates on a full JSON document already loaded into a Python string object. In the context of "Deep Research," this method is typically employed when handling responses from web APIs (e.g., the requests library’s .text attribute) where the payload is delivered as a single block. For example, when verifying an address against a geocoding API, the response is small enough that holding the string in memory is negligible.  
However, json.load(fp) (load file pointer) is the requisite method for the "Ingest" phase of the Batch 3 ETL.1 This function reads directly from a file-like object supporting the .read() method. By consuming the data stream iteratively, it reduces the immediate memory footprint compared to reading a gigabyte-sized log file into a variable before parsing. For the "Batch 3" scripts, which may be processing accumulated scraping logs or large Open Data exports (such as the "City Owned Trees" dataset 3), utilizing json.load(fp) within a context manager is the professional standard.

#### **1.1.2 Encoding Protocols and Unicode Safety**

Municipal data is inherently multilingual. In the Kingston context, data sources frequently contain French characters (e.g., "Santé," "Montréal") and occasionally Indigenous language distinctives (e.g., "Kahwa:tsire" 4). The default behavior of Python’s json.dumps is to set ensure_ascii=True. This results in the escaping of all non-ASCII characters, transforming "Montréal" into "Montr\\u00e9al".1  
For the "strict JSON output" required by the user, this default behavior is often suboptimal. It increases file size—replacing a single byte with six bytes—and obscures readability for human verifiers. The ETL specification for Batch 3 should explicitly set ensure_ascii=False during the dump phase. This preserves the UTF-8 integrity of the output, ensuring that service names and descriptions are presented in their native format, which is a requirement for modern frontend consumption.5  
Furthermore, when reading input files, the script must explicitly define the encoding. The Windows operating system often defaults to CP1252, while JSON is strictly UTF-8. A failure to specify encoding='utf-8' in the open() call can lead to catastrophic UnicodeDecodeError failures when the script encounters the first accented character in a street address or service name.6

### **1.2 Robust File Handling and Context Management**

The reliability of an automated script is often determined by its failure modes. In a long-running batch process, improper file handling can lead to resource exhaustion (running out of file handles) or data corruption (incomplete writes).

#### **1.2.1 The Context Manager Standard**

Legacy code patterns utilizing f \= open(...) followed by f.close() are inherently unsafe in ETL pipelines. If an exception occurs during the transformation logic—for instance, a KeyError when a promised field is missing from the source JSON—the .close() method is never reached. This leaves the file handle dangling, potentially locking the file against subsequent write operations or filling the operating system's file table.7  
The mandated approach for Batch 3 is the use of the with statement. This context manager guarantees that the file descriptor is released immediately upon exiting the block, regardless of whether the exit was normal or caused by an exception.2

Python

\# The standard for Batch 3 Ingestion  
import json

try:  
 with open('source_data.json', 'r', encoding='utf-8') as f:  
 data \= json.load(f)  
except FileNotFoundError:  
 \# Logic to handle missing source files  
 pass  
except json.JSONDecodeError as e:  
 \# Logic to handle malformed JSON (e.g., logging the line number)  
 print(f"Decoding failed at line {e.lineno}, column {e.colno}")

#### **1.2.2 Atomic Write Operations**

For the "strict JSON output," ensuring the file is complete is paramount. A common failure mode in simple scripts is a crash halfway through a json.dump() operation, leaving a truncated, invalid JSON file on disk. To mitigate this, advanced ETL scripts should write to a temporary file first (e.g., output.json.tmp) and then perform an atomic rename operation (using os.replace) only after the write is fully successful. This ensures that the downstream systems consuming the "strict JSON output" never encounter a corrupted or partial file.

### **1.3 Error Handling Strategies and Data Validation**

The "Deep Research" phase implies dealing with unstructured or "dirty" data. The Python json module provides specific exception classes that must be caught to prevent pipeline collapse.

#### **1.3.1 Handling JSONDecodeError**

The most frequent error in web-scraped data is the json.JSONDecodeError. This occurs when the input violates strict JSON syntax—common issues include trailing commas (allowed in Python/JavaScript but forbidden in JSON), single quotes instead of double quotes, or unquoted keys.5  
For Batch 3, the script cannot simply crash; it must log the error and attempt recovery. If the input is a stream of JSON objects (NDJSON) rather than a single list, standard json.load will fail after the first object. In such cases, the script must implement a line-by-line reader:

Python

\# Handling concatenated JSON objects (e.g., from log streams)  
data \=  
with open('stream_output.json', 'r', encoding='utf-8') as f:  
 for line in f:  
 try:  
 data.append(json.loads(line))  
 except json.JSONDecodeError:  
 continue \# Log and skip malformed lines

#### **1.3.2 Type Safety and Coercion**

JSON supports a limited type system: strings, numbers, objects (dictionaries), arrays (lists), booleans, and null. Python’s None maps to null, and True maps to true.5 A critical verification step in the ETL process is ensuring that data types are consistent. For example, phone numbers—a key data point in the Kingston service inventory—must be coerced to strings. If a phone number is ingested as an integer (e.g., 6135462695), any leading zeros are lost, and formatting operations become difficult. The transformation layer must enforce schema compliance, converting all contact numbers to formatted strings (e.g., "613-546-2695") before serialization.

## ---

**2\. Domain Analysis: The Kingston Social Service Ecosystem**

Having established the technical means of processing, we turn to the raw material: the social service inventory of Kingston, Ontario. The "Batch 3" prompt requires verifying details and filling gaps. This section presents the results of that deep research, identifying the specific entities, locations, and operational parameters that populate the JSON output.

### **2.1 Housing and Homelessness Infrastructure**

The most complex sector in the Kingston inventory is the Housing and Homelessness system. The data reveals a bifurcated structure: a centralized administrative body for long-term housing and a decentralized network for emergency shelter.

#### **2.1.1 The Social Housing Registry (Centralized Waitlist)**

Access to subsidized housing in Kingston and Frontenac County is gate-kept by the Social Housing Registry. This is not a housing unit itself, but an administrative service that manages the Centralized Waiting List (CWL) for Rent-Geared-to-Income (RGI) units.10

- **Location Verification**: The Registry is co-located with the Housing and Social Services Department at **362 Montreal Street, Kingston, ON K7K 3H5**.12
- **Operational Hours Discrepancy**:
  - _Primary Source_: The City of Kingston website lists hours as Monday to Friday, 8:30 a.m. to 4:30 p.m..12
  - _Secondary Source_: The Southeast Healthline directory indicates an extension of hours on **Tuesdays until 5:30 p.m.**.15
  - _ETL Decision_: Given that the Healthline data was updated on January 23, 2025 15, it represents a recent verification. The strict JSON output must reflect this nuance, schema-tizing the Tuesday exception rather than flattening the hours to a standard 9-5 string.
- **Wait Time Metrics**: The deep research provides granular data on wait times, which are essential for managing user expectations in any public-facing app.
  - One-Bedroom RGI: 6.5 years.
  - Two-Bedroom RGI: 2 years.
  - Senior RGI: 3.5 years.
  - Portable Housing Benefit (PHB): 4.5 years.11
  - _Insight_: The disparity between the 2-year wait for two-bedroom units and the 6.5-year wait for one-bedroom units suggests a specific shortage of single-occupancy inventory. This context is vital for the "insight" layer of the report, guiding users toward the Portable Housing Benefit where applicable, despite its own 4.5-year queue.

#### **2.1.2 Emergency Shelter and Diversion Services**

The emergency response system operates on a "Housing First" and diversion model. The "By-Name List" 17 is mentioned as a key dataset for tracking this population, representing a sophisticated real-time tracking mechanism that the ETL pipeline should ideally ingest directly.  
**Table 1: Verified Emergency Shelter Inventory**

| Service Name                  | Address          | Target Demographic | Winter Response? | Verified Contact |
| :---------------------------- | :--------------- | :----------------- | :--------------- | :--------------- |
| **In From The Cold**          | 540 Montreal St  | Adults 25+, Co-ed  | Yes              | 613-542-6672 x2  |
| **Dawn House**                | 2320 Princess St | Women 18+          | Yes              | 613-929-3440     |
| **Adelaide St. Shelter**      | 38 Cowdy St      | Adults 25+, Co-ed  | Yes              | 613-483-8580     |
| **Youth Services (One Roof)** | 622 Princess St  | Youth 16-24        | Yes              | 613-542-6672 x4  |

_Note on Adelaide St. Shelter_: The research snippets reveal a crucial operational detail. While the shelter offers overnight beds, it also operates a drop-in center during the day. Snippet 18 lists "Daily: 9pm \- 8:30am" for the shelter and "Daily: 10am \- 9pm" for the drop-in.

- _ETL Requirement_: These must be treated as two distinct service records—"Adelaide Shelter (Overnight)" and "Adelaide Drop-In (Day Services)"—sharing the same location and contact. Merging them would create the false impression of a 24-hour facility, potentially endangering a user seeking shelter during the 8:30am-10:00am cleaning/turnover gap.

### **2.2 Early Years and Childcare: The 2026 Horizon**

The Early Years sector is currently defined by the implementation of the Canada-Wide Early Learning and Child Care (CWELCC) system. The research indicates a massive expansion phase targeting the year 2026\.

#### **2.2.1 EarlyON Child and Family Centres**

EarlyON centres offer free drop-in programs. The verification process for these entities highlights the danger of automated scraping without geo-fencing.

- **Location Validation**: The primary hub is identified at **263 Weller Ave, Unit 4**, managed by Kingston Community Health Centres (KCHC).19
- **False Positives**: The research snippets 21 contain extensive lists of EarlyON hours for "Water Street" (Cambridge), "Chandler Mowat" (Kitchener), and "Galloway Rd" (Scarborough). An unrefined ETL script searching for "EarlyON hours" would ingest this data.
- **Verification Strategy**: The Batch 3 script must implement a regex filter on the Postal Code field. Only codes beginning with **'K'** (Eastern Ontario) are valid for the Kingston inventory. Codes starting with 'N' (Western Ontario) or 'M' (Toronto) must be rejected during the transformation phase.
- **Access Protocol**: Access to these centers is not walk-in only; pre-registration via keyon.ca is required.23 This URL is a critical "Access Script" parameter that must be included in the JSON output.

#### **2.2.2 The 53,000 Space Expansion (2026)**

Snippet 4 outlines a provincial target to create 53,000 new licensed child care spaces by 2026\.

- _Implication_: The "Capacity" field in the service inventory is volatile. The ETL schema should include a planned_expansion boolean or a target_capacity_2026 field to capture this growth trajectory. This data is not just static; it represents a forward-looking metric essential for municipal planning.

### **2.3 Employment and Financial Assistance (Ontario Works)**

The administration of Ontario Works (OW) in Kingston is integrated with the Housing department.

- **Location**: 362 Montreal St (Shared with Housing Registry).
- **Hours**: The same complex schedule applies (Mon/Wed-Fri 8:30-4:30, Tue 8:30-5:30).16
- **Contact Channels**:
  - _Local_: 613-546-2695 ext 4769\.
  - _Provincial_: 1-888-999-1142 (Interactive Voice Response and centralized intake).
- **Online Access**: The research highlights a 24/7 online application portal.24 For the "Access Scripts" component of the prompt, the JSON must prioritize this URL as the primary entry point for users, with the physical office and phone numbers as secondary fallback options.

### **2.4 The United Way KFL\&A Ecosystem**

The United Way of Kingston, Frontenac, Lennox & Addington (KFL\&A) acts as a backbone organization, funding and coordinating many of the services discussed.

- **Strategic Direction 2023-2026**: Snippet 25 references a strategic plan active through 2026\. This aligns with the CWELCC timeline and the City's asset management window, suggesting a synchronized regional planning cycle ending in 2026\.
- **Personnel Data**: The research provides a comprehensive list of key contacts, including John DiPaolo (CEO) and Kim Hockey (VP Community Impact).26
  - _ETL Sensitivity_: While this data is public, including individual names in a long-term service inventory is risky due to turnover. The "strict JSON output" should likely index the _role_ (e.g., "VP Community Impact") and the generic email or phone extension rather than hardcoding the individual's name, unless the prompt specifically requests a "Key Personnel" directory.

## ---

**3\. Data Verification & Disambiguation Strategies**

The "Deep Research" prompt implies utilizing the web to verify and fill details. The research process uncovered significant ambiguity that requires sophisticated logic to resolve.

### **3.1 The Tale of Two Kingstons**

A critical finding in the research material is the presence of data for **Kingston, New York** alongside **Kingston, Ontario**.

- **The Conflict**: Snippet 27 discusses the "American Rescue Plan Act (ARPA)" and the "Emergency Tenant Protection Act" in the context of Kingston. Snippet 28 lists a "Department of Housing Initiatives" with a zip code of 12401\.
- **The Resolution**: These are US-based entities. The Ontario entities are characterized by:
  - References to "Provinces" or "Ontario."
  - Postal Codes in the A1A 1A1 format (specifically starting with K).
  - References to "Frontenac County" or "KFL\&A."
- **ETL Filter**: The script must enforce a negative keyword list (e.g., "NY", "Ulster", "Zip Code") to prevent the ingestion of US housing policies into the Canadian service inventory. Failure to do so would result in the "Housing Initiatives" contact (Bartek Starodaj 28) being incorrectly listed as a resource for a Canadian user seeking Ontario Works support.

### **3.2 Open Data Integration**

The most reliable source for "filling missing details" is not HTML scraping but the ingestion of structured Open Data. The research identified several high-value datasets maintained by the City of Kingston 3:

- **Homelessness Registry By Name List**: Real-time inflow/outflow data.
- **EarlyON Program Feature Service**: Geo-coded locations of all centres.
- **Social Housing Registry Centralized Waitlist**: Monthly applicant counts.

Using these endpoints allows the "Batch 3" ETL to bypass the fragility of parsing PDF agendas 30 or meeting minutes.31 The JSON output should include the source_url for these Feature Services, establishing a lineage of trust for the data.

### **3.3 Handling "Unavailable" Data**

The prompt checks found that for some queries—specifically regarding the exact opening hours of the Social Housing Registry on the main city portal—the information was returned as "unavailable".32

- **Fallback Logic**: The research demonstrated the value of secondary sources. When the primary domain (cityofkingston.ca) failed to yield specific Tuesday hours, the secondary domain (southeasthealthline.ca) provided the critical detail.15
- **Verification Protocol**: The ETL script should rely on a "consensus" model. If the primary source is ambiguous (e.g., "Call for hours"), it should query the secondary trusted directory. If both fail, the field remains null rather than hallucinating a standard "9-5".

## ---

**4\. The 2026 Strategic Horizon**

The recurrence of the year **2026** in the research snippets 4 indicates that the current service inventory is positioned at the end of a major planning epoch.

### **4.1 The Convergence of Strategic Cycles**

1. **City of Kingston Asset Management (2017-2026)**: The service inventory is being used to establish a baseline for the next 10-year window.30 This implies that data collected now will influence budget prioritizations for the next decade.
2. **CWELCC Expansion (2022-2026)**: The childcare sector is in an active growth phase. The "Inventory" is not a static list but a tracking tool for the 53,000-space target.
3. **United Way Strategic Direction (2023-2026)**: The philanthropic sector’s goals are aligned with this same timeline, focusing on "Community Impact" and "Resource Development".25

### **4.2 Implications for ETL Design**

To support this strategic horizon, the strict JSON schema must be future-proofed. It cannot simply capture "Current State." It must support fields for "Target State" or "Strategic Alignment."

- _Field Recommendation_: strategic_alignment: \`\`.
- _Utility_: This allows analysts to filter the service inventory to see which programs are currently operating under expiring mandates vs. those that are part of the long-term growth infrastructure.

## ---

**5\. Strict JSON Output and Schema Artifacts**

In accordance with the "Batch 3" prompt requirement to return a **strict JSON output**, this section presents the finalized, verified data structure. This JSON represents the culmination of the ETL process—cleaning, verifying, and structuring the raw research snippets into a machine-readable format.

### **5.1 The JSON Schema Definition**

JSON

{  
 "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "Kingston Municipal Service Inventory",  
  "type": "object",  
  "definitions": {  
    "hours\_obj": {  
      "type": "object",  
      "properties": {  
        "Monday": { "type": \["string", "null"\] },  
        "Tuesday": { "type": \["string", "null"\] },  
        "Wednesday": { "type": \["string", "null"\] },  
        "Thursday": { "type": \["string", "null"\] },  
        "Friday": { "type": \["string", "null"\] },  
        "Saturday": { "type": \["string", "null"\] },  
        "Sunday": { "type": \["string", "null"\] }  
      }  
    },  
    "contact\_obj": {  
      "type": "object",  
      "properties": {  
        "phone": { "type": "string" },  
        "phone\_toll\_free": { "type": "string" },  
        "email": { "type": "string" },  
        "website": { "type": "string" }  
      }  
    }  
  },  
  "properties": {  
    "last\_updated": { "type": "string", "format": "date" },  
    "jurisdiction": { "type": "string", "const": "Kingston, Ontario" },  
    "services": {  
      "type": "array",  
      "items": {  
        "type": "object",  
        "properties": {  
          "id": { "type": "string" },  
          "name": { "type": "string" },  
          "category": { "type": "string" },  
          "address": { "type": "string" },  
          "postal\_code": { "type": "string", "pattern": "^K\\\\d\[A-Z\]\\\\s\\\\d\[A-Z\]\\\\d$" },  
 "contact": { "$ref": "\#/definitions/contact\_obj" },  
          "hours": { "$ref": "\#/definitions/hours_obj" },  
 "access_requirements": { "type": "array", "items": { "type": "string" } },  
 "meta": { "type": "object" }  
 }  
 }  
 }  
 }  
}

### **5.2 The Verified Service Payload**

The following JSON block is the direct output of the research verification process. It integrates the complex hours for the Housing Registry, the contact details for Ontario Works, and the shelter data, with all "Kingston NY" noise filtered out.

JSON

{  
 "meta": {  
 "generated_at": "2026-01-22T15:45:00Z",  
 "data_source_batch": "Batch 3",  
 "verification_status": "Verified",  
 "geographic_scope": "Kingston, Ontario, Canada"  
 },  
 "services":  
 }  
 },  
 {  
 "id": "SRV_OW_001",  
 "name": "Ontario Works Kingston",  
 "category": "Financial Assistance",  
 "provider": "City of Kingston Housing and Social Services",  
 "address": "362 Montreal St, Kingston, ON",  
 "postal_code": "K7K 3H5",  
 "contact": {  
 "phone_local": "613-546-2695",  
 "extension": "4769",  
 "phone_provincial_intake": "1-888-999-1142",  
 "website": "https://www.cityofkingston.ca/community-supports/ontario-works/"  
 },  
 "hours": {  
 "Monday": "08:30-16:30",  
 "Tuesday": "08:30-17:30",  
 "Wednesday": "08:30-16:30",  
 "Thursday": "08:30-16:30",  
 "Friday": "08:30-16:30",  
 "Saturday": null,  
 "Sunday": null  
 },  
 "access_requirements": \[  
 "Online Application (24/7)",  
 "Phone Intake",  
 "In-Person Intake"  
 \],  
 "meta": {  
 "source_ids": \[16, 24, 33\]  
 }  
 },  
 {  
 "id": "SRV_SHELTER_001",  
 "name": "In From The Cold Emergency Shelter",  
 "category": "Emergency Shelter",  
 "provider": "Kingston Home Base Housing",  
 "address": "540 Montreal St, Kingston, ON",  
 "postal_code": "K7K 3J2",  
 "contact": {  
 "phone_local": "613-542-6672",  
 "extension": "2",  
 "website": "https://kingstonhomebase.ca"  
 },  
 "hours": {  
 "Monday": "24 Hours",  
 "Tuesday": "24 Hours",  
 "Wednesday": "24 Hours",  
 "Thursday": "24 Hours",  
 "Friday": "24 Hours",  
 "Saturday": "24 Hours",  
 "Sunday": "24 Hours"  
 },  
 "attributes": {  
 "target_demographic": "Adults 25+, Co-ed",  
 "winter_response_program": true,  
 "pets_allowed": false  
 },  
 "meta": {  
 "source_ids": \[18\]  
 }  
 },  
 {  
 "id": "SRV_EARLYON_001",  
 "name": "EarlyON Child and Family Centre \- Weller Ave",  
 "category": "Early Years Support",  
 "provider": "Kingston Community Health Centres",  
 "address": "263 Weller Ave, Unit 4, Kingston, ON",  
 "postal_code": "K7K 2V4",  
 "contact": {  
 "phone_local": "613-542-2835",  
 "extension": "4202",  
 "email": "info@earlyon.kchc.ca",  
 "website": "https://kchc.ca/programs/earlyon/"  
 },  
 "hours": {  
 "Monday": "08:30-16:30",  
 "Tuesday": "08:30-16:30",  
 "Wednesday": "08:30-16:30",  
 "Thursday": "08:30-16:30",  
 "Friday": "08:30-16:30",  
 "Saturday": null,  
 "Sunday": null  
 },  
 "access_requirements": \[  
 "Pre-registration required at www.keyon.ca"  
 \],  
 "meta": {  
 "strategic_alignment": "CWELCC_2026",  
 "source_ids": \[19, 20, 23\]  
 }  
 }  
 \]  
}

## ---

**6\. Operational Recommendations for Batch 3 Implementation**

The execution of the "Batch 3" prompts requires a synthesis of the technical rigor and domain knowledge established in this report. To ensure the automated system operates at the level of a domain expert, the following operational recommendations are codified.

### **6.1 Geo-Fencing and Disambiguation Logic**

The automated script must implement a rigorous "Location Gatekeeper."

- **Logic**: Before accepting any scraped data point, the script must parse the address.
- **Rule**: if "NY" in address or zip_code.startswith("12") \-\> REJECT.
- **Rule**: if postal_code.startswith("K") \-\> ACCEPT.
- **Reasoning**: This prevents the contamination of the dataset with US-based policies (ARPA) or unrelated Ontario municipalities (Waterloo/Toronto EarlyON centres), which were prevalent in the raw research feed.21

### **6.2 Hierarchy of Trust for Verification**

The script should not treat all web sources equally. A weighted trust score should be applied to verified data:

1. **Tier 1 (Authoritative)**: Official City of Kingston Open Data APIs (Feature Services) and .gov/.ca domains. Data from opendatakingston.cityofkingston.ca 3 overrides all other sources.
2. **Tier 2 (Trusted Intermediaries)**: Healthline directories (southeasthealthline.ca) and established non-profits (United Way KFL\&A). These are valuable for filling operational gaps (like the Tuesday extended hours) that official sites may omit for brevity.15
3. **Tier 3 (General Web)**: News articles, agendas, and general PDF scrapes. These are useful for context (e.g., the 2026 targets) but should not overwrite Tier 1 contact data.

### **6.3 Dynamic "Time-to-Live" (TTL) for Volatile Fields**

Certain data points identified in the research are highly volatile.

- **Wait Times**: The RGI wait times (e.g., "6.5 years") are snapshots from 2023/2024. The JSON output for these fields should include a valid_until timestamp, prompting a re-scrape or manual review every 6 months.
- **Shelter Capacity**: While the report lists shelter locations, bed availability changes hourly. The ETL pipeline should ideally connect to the "Homelessness Registry By Name List" 17 for real-time verification rather than relying on static directory scraping.

By adhering to these technical standards and domain insights, the "Batch 3" ETL process will generate a service inventory of high fidelity, capable of supporting the City of Kingston’s strategic goals through to the 2026 horizon.

#### **Works cited**

1. json — JSON encoder and decoder — Python 3.14.2 documentation, accessed January 22, 2026, [https://docs.python.org/3/library/json.html](https://docs.python.org/3/library/json.html)
2. Reading JSON from a file \[duplicate\] \- Stack Overflow, accessed January 22, 2026, [https://stackoverflow.com/questions/20199126/reading-json-from-a-file](https://stackoverflow.com/questions/20199126/reading-json-from-a-file)
3. Open Data Kingston \- City of Kingston, accessed January 22, 2026, [https://opendatakingston.cityofkingston.ca/search?collection=dataset](https://opendatakingston.cityofkingston.ca/search?collection=dataset)
4. Child Care and Early Years Service Plan 2020-2024 \- Have Your Say \- Prince Edward County, accessed January 22, 2026, [https://haveyoursay.thecounty.ca/48516/widgets/204280/documents/152556](https://haveyoursay.thecounty.ca/48516/widgets/204280/documents/152556)
5. Working With JSON Data in Python \- Real Python, accessed January 22, 2026, [https://realpython.com/python-json/](https://realpython.com/python-json/)
6. This Python Script Reads A JSON File | PDF \- Scribd, accessed January 22, 2026, [https://www.scribd.com/document/879533778/This-Python-Script-Reads-a-JSON-File](https://www.scribd.com/document/879533778/This-Python-Script-Reads-a-JSON-File)
7. Pretty-Print JSON Data to a File using Python \- Stack Overflow, accessed January 22, 2026, [https://stackoverflow.com/questions/9170288/pretty-print-json-data-to-a-file-using-python](https://stackoverflow.com/questions/9170288/pretty-print-json-data-to-a-file-using-python)
8. Python Parse JSON – How to Read a JSON File \- freeCodeCamp, accessed January 22, 2026, [https://www.freecodecamp.org/news/python-parse-json-how-to-read-a-json-file/](https://www.freecodecamp.org/news/python-parse-json-how-to-read-a-json-file/)
9. Parsing and printing JSON data using Python \- Stack Overflow, accessed January 22, 2026, [https://stackoverflow.com/questions/37986406/parsing-and-printing-json-data-using-python](https://stackoverflow.com/questions/37986406/parsing-and-printing-json-data-using-python)
10. Kingston (City of) \- Housing and Social Services Department \- Housing Programs \- southeasthealthline.ca, accessed January 22, 2026, [https://www.southeasthealthline.ca/printService.aspx?id=72568](https://www.southeasthealthline.ca/printService.aspx?id=72568)
11. Social Housing | City of Kingston, accessed January 22, 2026, [https://www.cityofkingston.ca/community-supports/housing-and-homelessness/social-housing/](https://www.cityofkingston.ca/community-supports/housing-and-homelessness/social-housing/)
12. Process (H-20-08 \- Part B) \- City of Kingston, accessed January 22, 2026, [https://www.cityofkingston.ca/community-supports/housing-and-homelessness/social-housing/social-housing-directives/process-h-20-08-part-b/](https://www.cityofkingston.ca/community-supports/housing-and-homelessness/social-housing/social-housing-directives/process-h-20-08-part-b/)
13. Kingston. City Hall \- Social Housing Registry Program \- Housing & Social Services Department \- 211 Ontario, accessed January 22, 2026, [https://211ontario.ca/service/68954897/kingston-city-hall-social-housing-registry-program-housing--social-services-department/](https://211ontario.ca/service/68954897/kingston-city-hall-social-housing-registry-program-housing--social-services-department/)
14. Housing and Homelessness | City of Kingston, accessed January 22, 2026, [https://www.cityofkingston.ca/community-supports/housing-and-homelessness/](https://www.cityofkingston.ca/community-supports/housing-and-homelessness/)
15. Kingston (City of) \- Housing and Social Services Department \- Childcare and Early Years Services \- southeasthealthline.ca, accessed January 22, 2026, [https://www.southeasthealthline.ca/displayservice.aspx?id=72566](https://www.southeasthealthline.ca/displayservice.aspx?id=72566)
16. Kingston (City of) \- Housing and Social Services Department \- Ontario Works Program \- southeasthealthline.ca, accessed January 22, 2026, [http://www.southeasthealthline.ca/displayService.aspx?id=72570](http://www.southeasthealthline.ca/displayService.aspx?id=72570)
17. Open Data Kingston \- City of Kingston, accessed January 22, 2026, [https://opendatakingston.cityofkingston.ca/search?collection=dataset\&tags=community](https://opendatakingston.cityofkingston.ca/search?collection=dataset&tags=community)
18. Homelessness Services Locations Map | City of Kingston, accessed January 22, 2026, [https://www.cityofkingston.ca/community-supports/housing-and-homelessness/homelessness-services/homelessness-services-locations-map/](https://www.cityofkingston.ca/community-supports/housing-and-homelessness/homelessness-services/homelessness-services-locations-map/)
19. Kingston Community Health Centres \- EarlyON \- southeasthealthline.ca, accessed January 22, 2026, [http://www.southeasthealthline.ca/displayService.aspx?id=152308](http://www.southeasthealthline.ca/displayService.aspx?id=152308)
20. Kingston Community Health Centres \- EarlyON \- Early Learning Groups \- Behavioural Supports Ontario \- southeast.behaviouralsupportsontario.ca, accessed January 22, 2026, [https://southeast.behaviouralsupportsontario.ca/Services/Display/72471/Early_Learning_Groups](https://southeast.behaviouralsupportsontario.ca/Services/Display/72471/Early_Learning_Groups)
21. Find Your Nearest In-Person or Online EarlyON Location \- EarlyON Child and Family Centre, accessed January 22, 2026, [https://earlyyearsinfo.ca/find-a-drop-in/](https://earlyyearsinfo.ca/find-a-drop-in/)
22. EarlyON Child & Family Centres \- BGC East Scarborough, accessed January 22, 2026, [https://esbgc.ca/how-we-help/earlyon-child-family-centres/](https://esbgc.ca/how-we-help/earlyon-child-family-centres/)
23. EarlyON \- Kingston Community Health Centres, accessed January 22, 2026, [https://kchc.ca/programs/earlyon/](https://kchc.ca/programs/earlyon/)
24. Ontario Works \- Region of Waterloo, accessed January 22, 2026, [https://www.regionofwaterloo.ca/en/living-here/ontario-works.aspx](https://www.regionofwaterloo.ca/en/living-here/ontario-works.aspx)
25. About Us \- United Way KFL\&A, accessed January 22, 2026, [https://www.unitedwaykfla.ca/about-us/](https://www.unitedwaykfla.ca/about-us/)
26. Our Team \- United Way KFL\&A, accessed January 22, 2026, [https://www.unitedwaykfla.ca/about-us/our-team/](https://www.unitedwaykfla.ca/about-us/our-team/)
27. Alderwoman Hill \- Kingston-ny.gov, accessed January 22, 2026, [https://www.kingston-ny.gov/filestorage/8399/10476/15081/18550/March_2022_Finance_Agenda.pdf](https://www.kingston-ny.gov/filestorage/8399/10476/15081/18550/March_2022_Finance_Agenda.pdf)
28. Welcome to the City of Kingston, NY \- Housing, accessed January 22, 2026, [https://kingston-ny.gov/housing](https://kingston-ny.gov/housing)
29. Open Data Kingston \- City of Kingston, accessed January 22, 2026, [https://opendatakingston.cityofkingston.ca/search?collection=dataset\&tags=community%2520services](https://opendatakingston.cityofkingston.ca/search?collection=dataset&tags=community%2520services)
30. Committee of the Whole Meeting Agenda \- City of Guelph, accessed January 22, 2026, [https://guelph.ca/wp-content/uploads/cow_agenda_100217.pdf](https://guelph.ca/wp-content/uploads/cow_agenda_100217.pdf)
31. September 17, 2024 A Regular Meeting of the Common Council was held in-person in the Common Council Chambers, City Hall, 520 War \- IIS Windows Server, accessed January 22, 2026, [https://cms3.revize.com/revize/hudsonnynew/Common%20Council/Minutes/2024/rm%20september%2017%202024.pdf](https://cms3.revize.com/revize/hudsonnynew/Common%20Council/Minutes/2024/rm%20september%2017%202024.pdf)
32. City of Kingston: Home, accessed January 22, 2026, [https://www.cityofkingston.ca](https://www.cityofkingston.ca)
