# Governance Protocol: The Kingston 150
> **Version:** 1.0
> **Status:** Active
> **Enforcement:** Strict L1+ requirement for production.

This document defines the rules for data inclusion, verification, and ethical management in Kingston Care Connect.

## 1. Verification Levels
We adhere to a rigorous audit trail. Every service record must be assigned a `verification_level`.

| Level | Name | Definition | Action |
| :--- | :--- | :--- | :--- |
| **L0** | Unverified | Raw data scraped or imported. No human eyes have checked it. | **HIDDEN**. Do not display. |
| **L1** | Contact Verified | A student has confirmed the phone number works and the website is live. | **DISPLAY**. Tag as "Verified". |
| **L2** | Eligibility Verified | Inclusion/Exclusion criteria have been cross-referenced with official docs (PDF, Policy Page). | **DISPLAY**. "High Confidence". |
| **L3** | Provider Confirmed | Direct email/phone confirmation from the agency staff. | **DISPLAY**. "Provider Partner". |

## 2. Privacy & The "Do-Not-Log" List
To protect vulnerable users, the following intent categories invoke our **Privacy Shield Protocol**:

*   **Self-Harm / Suicide**
*   **Sexual Violence / Assault**
*   **Domestic Abuse / IPV**
*   **Human Trafficking**

**Protocol:**
1.  **Zero Persistence:** No user query text is written to disk or database.
2.  **Safety Intercept:** Immediate routing to 9-8-8 or crisis resources.
3.  **Null Analytics:** We do not track "how many people asked for suicide help" beyond a transient, non-identifiable counter in volatile memory (optional).

## 3. Identity-Aware Filters
We reject subjective tagging. All identity tags must be **Evidence-Based**.

*   **Incorrect:** Tagging a clinic as "LGBTQ+ Friendly" because it "seems nice."
*   **Correct:** Tagging a clinic as "Provider-Stated Affirming" because their website says: *"We are a designated safe space for the 2SLGBTQ+ community."*
*   **Requirement:** Every tag in `identity_tags` must include an `evidence_url` pointing to the source of truth.

## 4. Updates & Lineage
*   **Expiration:** Any record not verified in the last **6 months** degrades to **L0** automatically.
*   **Provenance:** All changes to `last_verified_at` must include the `verified_by` field (Role or Name).
