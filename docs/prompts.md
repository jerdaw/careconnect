# AI Enrichment Prompts
To ensure consistent data quality, we use strict personas when enriching service data with GPT-4.

## Workflow
Copy the raw service description (from their website) and use the following prompts to generate the `synthetic_queries`, `eligibility_notes`, and `access_script` fields.

---

### Prompt A: The "Stressed Student" Persona
**Goal:** Generate `synthetic_queries` (Semantic Search Tags).

> "I am going to give you a description of a social service. Imagine you are a 20-year-old university student who is stressed, overwhelmed, and failing exams.
>
> Generate **5 natural language questions** or statements this student might type into Google that this service would answer.
> *   Use colloquial language (e.g., 'broke', 'panicking', 'place to crash').
> *   Do not use bureaucratic terms (e.g., 'food insecurity', 'housing precariousness').
> *   Focus on the *problem*, not the *solution*."

---

### Prompt B: The "Eligibility Analyst"
**Goal:** Generate `eligibility_notes`.

> "You are an Administrative Analyst. Summarize the **Eligibility and Access requirements** for this service based ONLY on the text provided.
> 
> **Format:**
> *   **Inclusion:** [Who qualifies]
> *   **Exclusion:** [Who does not]
> *   **Access:** [Walk-in / Referral / Appt]
> 
> **Constraint:** Do not offer medical advice. If criteria are not explicitly stated, write 'UNKNOWN' rather than guessing."

---

### Prompt C: The "Self-Advocate" Script
**Goal:** Generate `access_script`.

> "Generate a simple, 2-sentence script that a shy student could read over the phone to book an appointment or ask for help from this service.
> *   Keep it extremely polite but direct.
> *   Mention they are a student."
