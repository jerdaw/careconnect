# Governance Protocol: The Kingston 150 Standard 🛡️

**Document Version:** 1.0
**Effective Date:** Dec 29, 2025
**Scope:** All services listed in the Kingston Care Connect database.

---

## 1. The "Do No Harm" Mandate

We prioritize **accuracy over coverage**. It is better to return *no result* than to send a vulnerable user to a closed door, a disconnected phone line, or an unsafe environment.

### 1.1 The "Do-Not-Log" List
To protect user privacy, the following intent categories triggers a **Zero-Log Policy**. No query text, IP address, or metadata is recorded for these searches:
*   Suicide / Self-Harm
*   Sexual Violence / Assault
*   Domestic Violence
*   Substance Use / Overdose

---

## 2. Verification Levels (L-Scale)

Every service in the database must be assigned a verification level.

| Level | Definition | Display Policy |
| :--- | :--- | :--- |
| **L0** | **Unverified.** Raw data scraped from web or submitted by public. | ⛔ **HIDDEN** |
| **L1** | **Existence Verified.** Phone number calls through, Website loads. Confirmed active within 90 days. | ✅ **VISIBLE** |
| **L2** | **Eligibility Verified.** Inclusion/Exclusion criteria verified against official documentation (PDF, About Page). | ✅ **VISIBLE** |
| **L3** | **Provider Confirmed.** Direct contact (email/phone) with service provider confirming details. | ✅ **VISIBLE** (Preferred) |
| **L4** | **Official Partner.** Signed MOU or Data Sharing Agreement. | 🌟 **FEATURED** |

> **Current Pilot Standard:** All visible services must be **L1 or higher**.

---

## 3. Identity & Equity Attributes

We do not apply "vibes-based" tagging. All identity tags must be **Evidence-Based**.

### 3.1 Affirming Care Standards
To tag a service as `2SLGBTQI+ Friendly` or `Indigenous-Led`, the record must include an `evidence_url` pointing to a public statement by the organization.

*   **Acceptable Evidence:** "About Us" page stating mandate, Board of Directors list, official mandate.
*   **Unacceptable Evidence:** Third-party directories, assumptions based on name/logo.

---

## 4. Maintenance Cycle

*   **Crisis Services:** Verified Monthly.
*   **General Services:** Verified Quarterly.
*   **Stale Data:** Any record not verified in > 6 months is auto-downgraded to **L0** (Hidden).

---

**Approved By:**
Kingston Care Connect Steering Committee
