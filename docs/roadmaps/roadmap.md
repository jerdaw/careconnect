# Project Specification: The Kingston Semantic Bridge (Phase 1)

**Document Type:** Data Curation & Governance Protocol
**Version:** 5.0 (The "Audit-Traceable" Build)
**Status:** READY FOR EXECUTION

---

## 1. Executive Strategy: "The Kingston 150" (Quality > Quantity)

**The Problem:** Scraping 60,000 records from 211 creates legal liability (Terms of Service violation) and data noise.
**The Solution:** We manually curate the **Top 150 High-Impact Services** in Kingston.
**The Narrative:** "Instead of scraping a messy database, I hand-verified the critical safety net for Kingston students to ensure high fidelity for vulnerable users. I prioritized **Governance** over scale."

### 1.1 The Curation Targets (Sum: 150)

You will manually populate the database with services from these 7 high-need domains.

| Domain | Target Count | Key Kingston Examples (Mandatory) |
| --- | --- | --- |
| **Crisis & Emergency** | 10 | AMHS-KFLA Crisis Line, Detox Centre, Kingston Youth Shelter, SACK. |
| **Food Security** | 30 | AMS Food Bank (Queen's), Partners in Mission, Martha's Table, The Good Food Box. |
| **Mental Health** | 40 | Queen's Student Wellness, Maltby Centre, Resolve Counselling, Good2Talk. |
| **Housing & Shelter** | 20 | Kingston Home Base, Ryandale Shelter, Dawn House. |
| **Primary Care** | 20 | KCHC (Weller Mines), Sexual Health Clinic, CDK Family Medicine (Walk-in). |
| **Financial/Legal** | 15 | Queen's Legal Aid, Ontario Works Kingston, OSAP Financial Aid Office. |
| **Academic/Disability** | 15 | QSAS (Queen's Student Accessibility), Four Directions Indigenous Student Centre. |

---

## 2. The Governance Framework (The "Scholar" Layer)

*This section answers the question: "How do you know this data is safe?"*

### 2.1. Verification Levels (L0 - L4)

We utilize a rigorous auditing standard.

* **L0 (Unverified):** Raw data from the web. *Action: Do not display.*
* **L1 (Contact Verified):** Phone number and URL tested by student team.
* **L2 (Eligibility Verified):** Inclusion/Exclusion criteria cross-referenced with official documentation (e.g., PDF brochure, website policy page).
* **L3 (Provider Confirmed):** Direct email/phone confirmation from the agency.
* **L4 (Official Partner):** Formal MOU signed (Future state).

**Policy:** The Pilot will only display services at **L1 or higher**.

### 2.2. Identity-Aware Access Filters (Cultural Safety)

We replace subjective tags with **Evidence-Based assertions**.

* **Rule:** A service cannot be tagged "Indigenous-Led" or "2SLGBTQI+ Affirming" based on "vibes."
* **Requirement:** Must provide a `tag_evidence_url` (e.g., a link to their "About Us" page stating "We are an Indigenous-led organization").
* **Label:** "Provider-Stated Affirming" (Protects you from liability).

### 2.3. Privacy & Ethics (TCPS 2 Alignment)

* **Transient Processing Only:** Raw user queries are processed in memory for vector matching and then immediately discarded. We **NEVER** persist raw user text to logs or analytics.
* **Local Intent Classification:** Intent classification for analytics is performed locally (regex/rules) or on-server **without external LLM calls**. We do not send user data to OpenAI for categorization.
* **The "Do-Not-Log" List:** If the intent matches **Self-Harm, Suicide, Sexual Violence, or Domestic Abuse**, we drop the log event entirely. We show the Safety Intercept (9-8-8) and record nothing.
* **Category Logging:** For safe queries (e.g., "Food"), we log only the coarse intent ID (e.g., `INTENT_FOOD_SECURITY`) and the week number.

---

## 3. The Data Schema (HSDS-Inspired + Audit Trace)

We use a schema inspired by the Human Services Data Specification (HSDS) but extended with strict provenance fields.

**File Structure:** `data/services.json`
**Schema Definition:**

```json
[
  {
    "id": "ks-001",
    "name": "AMS Food Bank",
    "description": "Confidential non-perishable food service for Queen's students.",
    "url": "https://myams.org/service/food-bank/",
    "telephone": "613-533-6000",
    "address": "John Deutsch University Centre, Kingston, ON",
    "category": "Food Security",
    
    // AUDIT TRACE (Provenance)
    "verification_level": "L2",
    "verification_method": "web_check", // or 'phone_call'
    "last_verified_at": "2025-12-26",
    "verified_by_role": "Nursing Student Volunteer", // Anonymized role
    
    // PROVENANCE FOR CLAIMS
    "description_source_url": "https://myams.org/about",
    "eligibility_source_url": "https://myams.org/policies",
    
    // IDENTITY-AWARE FILTERS (Evidence-Based)
    "identity_tags": [
      {
        "tag": "Student-Led",
        "evidence_url": "https://myams.org/governance"
      }
    ],

    // THE AI LAYER (Enriched Data)
    "synthetic_queries": [
      "I have no money for groceries this week",
      "Where can I get free food on campus?"
    ],
    
    // ELIGIBILITY NOTES (Replaces "Clinical Summary")
    "eligibility_notes": "Post-secondary students only. No means test required. Access limited to once per week. (Source: AMS Website)",
    
    // ACCESS SCRIPT (Self-Advocacy)
    "access_script": "Hi, I am a Queen's student. I am calling to ask about the food hamper pickup times. Do I need to bring my student card?"
  }
]

```

---

## 4. The "Double-Enrichment" Protocol (Revised)

We use GPT-4 to generate "Translation Layers." Note the shift to "Eligibility Analyst" to avoid clinical overreach.

**Tools Required:** OpenAI ChatGPT (Plus) or API.
**Process:** Copy-paste the raw service text into GPT-4 with the following prompts.

### 4.1. Enrichment A: The "Stressed Student" Persona

**Goal:** Capture *Emotional Intent* (for vector matching).
**The Prompt:**

> "I am going to give you a description of a social service. Imagine you are a 20-year-old university student who is stressed, overwhelmed, and failing exams.
> Generate **5 natural language questions** or statements this student might type into Google that this service would answer. Use colloquial language (e.g., 'broke', 'panicking', 'place to crash'). Do not use bureaucratic terms."

### 4.2. Enrichment B: The "Eligibility Analyst" Persona

**Goal:** Capture *Access Rules* (for the "Clinician Mode"). **DO NOT** act as a doctor/nurse.
**The Prompt:**

> "You are an Administrative Analyst. Summarize the **Eligibility and Access requirements** for this service based ONLY on the text provided.
> Format: 'Inclusion: [Who qualifies]. Exclusion: [Who does not]. Access: [Walk-in/Referral/Appt].'
> *Constraint:* Do not offer medical advice. If criteria are not explicitly stated, write 'UNKNOWN' rather than guessing."

### 4.3. Enrichment C: The "Self-Advocate" Script

**Goal:** Reduce *Phone Anxiety*.
**The Prompt:**

> "Generate a simple, 2-sentence script that a shy student could read over the phone to book an appointment or ask for help from this service."

---

## 5. The Execution Plan (Phase 1 Sprint)

### Day 1: The Setup & Taxonomy Definition

1. **Task:** Create the **Governance Protocol** document (1 page PDF).
* *Content:* Define L0-L4 verification levels. Define the "Do-Not-Log" list (Suicide, Sexual Violence, Domestic Abuse).


2. **Task:** Create the Google Sheet/Notion DB with columns for `Verification Level`, `Source Evidence URL`, and `Reviewer Role`.

### Day 2: The "Kingston 150" Curation

1. **Task:** Fill the first 50 rows (Focus on **Crisis** and **Food** first).
* *Source:* Official Org Websites (e.g., kchc.ca, amhs-kfla.ca).


2. **Task:** **Verification Call.** Call the top 5 crisis lines to confirm they are active.
* *Action:* Mark as `L1` (Contact Verified).
* *Action:* Mark as `L3` (Provider Confirmed) **only** if they explicitly confirmed eligibility criteria on the phone.



### Day 3: The AI Enrichment

1. **Task:** Run Prompt A ("Student") for all 50 services.
2. **Task:** Run Prompt B ("Eligibility Analyst") for all 50.
3. **Task:** Run Prompt C ("Script") for all 50.
4. **Task:** Paste outputs into the `synthetic_queries`, `eligibility_notes`, and `access_script` columns.

### Day 4: The Quality Assurance (QA)

1. **Task:** The "Evidence Audit."
* Pick 5 random services. Click the `eligibility_source_url`. Does the `eligibility_note` match reality? If not, correct it.


2. **Task:** JSON Export. Convert the sheet to `data/services.json`.

---

**Completion Criteria for Phase 1:**

* A `services.json` file with ~50-100 entries (Sprint 1 Target).
* **Provenance Fields** populated for every entry (`eligibility_source_url`, `last_verified_at`).
* **Governance PDF** drafted.

**Shall we move to Phase 2: The "Hybrid Brain" Architecture (Building the Search Logic)?**
