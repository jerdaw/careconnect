---
status: stable
last_updated: 2026-08-12
owner: jer
tags: [governance, standards, verification]
---

# Governance Protocol: The CareConnect Local Verification Standard

> [!IMPORTANT]
> **Retirement-transition boundary:** This standard is preserved as a
> historical and conditional safety protocol. It does not authorize active
> feature or service-record changes, new ingestion, provider outreach or
> partnership work, pilot reverification, or Brampton pre-launch execution.
> Apply it only to separately approved safety work or after the
> [current roadmap](../planning/roadmap.md) explicitly reopens an operationally
> stewarded service scope.

**Document Version:** 1.1
**Effective Date:** Dec 29, 2025
**Current Scope:** Conditional safety rules for governed records when specific
service work is separately approved or an operationally stewarded public scope
is reopened.

This standard superseded the earlier Kingston-specific framing while preserving
the same accuracy-over-coverage rule. Its former Kingston and Brampton launch
framing is historical; no Brampton pre-launch execution is active under the
current disposition.

---

## 1. The "Do No Harm" Mandate

We prioritize **accuracy over coverage**. It is better to return _no result_ than to send a vulnerable user to a closed door, a disconnected phone line, or an unsafe environment.

### 1.1 The "Do-Not-Log" List

To protect user privacy, the following intent categories triggers a **Zero-Log Policy**. No query text, IP address, or metadata is recorded for these searches:

- Suicide / Self-Harm
- Sexual Violence / Assault
- Domestic Violence
- Substance Use / Overdose

---

## Data Standards & Verification Levels (L-Scale)

Every service in the database must be assigned a verification level.

| Level  | Definition                                                                                                                                 | Display Policy             |
| :----- | :----------------------------------------------------------------------------------------------------------------------------------------- | :------------------------- |
| **L0** | **Unverified.** Raw data scraped from web or submitted by public.                                                                          | **HIDDEN**                 |
| **L1** | **Existence Verified.** Phone number calls through, Website loads, and the record has been re-verified within the active freshness window. | ✅ **VISIBLE**             |
| **L2** | **Eligibility Verified.** Inclusion/Exclusion criteria verified against official documentation (PDF, About Page).                          | ✅ **VISIBLE**             |
| **L3** | **Provider Confirmed.** Direct contact (email/phone) with service provider confirming details.                                             | ✅ **VISIBLE** (Preferred) |
| **L4** | **Official Partner.** Signed MOU or Data Sharing Agreement.                                                                                | 🌟 **FEATURED**            |

> **Conditional display standard:** If an operationally stewarded public scope
> is approved, visible services must be **L1 or higher** and remain within the
> active freshness window. This rule does not authorize reverification or
> publication during the retirement transition.

---

## 3. Identity & Equity Attributes

We do not apply unsupported identity tagging. All identity tags must be **Evidence-Based**.

### 3.1 Affirming Care Standards

To tag a service as `2SLGBTQI+ Friendly` or `Indigenous-Led`, the record must include an `evidence_url` pointing to a public statement by the organization.

- **Acceptable Evidence:** "About Us" page stating mandate, Board of Directors list, official mandate.
- **Unacceptable Evidence:** Third-party directories, assumptions based on name/logo.

---

## 4. Maintenance Cycle

The cadences below define the safety standard for an approved, actively
stewarded service. They do not create an active reverification queue or
authorize restoration of the corpus during the retirement transition.

- **Crisis Services:** Verify monthly.
- **Pilot / priority services:** Target re-verification within 90 days.
- **General directory services:** Re-verify within 180 days to remain publicly visible.
- **Stale Data:** Any record not verified in > 180 days is auto-downgraded to **L0** (Hidden).

---

**Approved By:**
CareConnect Steering Committee
