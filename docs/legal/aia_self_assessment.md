---
status: stable
last_updated: 2026-01-15
owner: jer
tags: [legal, ai, assessment]
---

# Algorithmic Impact Assessment (AIA) - Self-Assessment

**Project**: Kingston Care Connect AI Assistant (v13.1)

## 1. Description of Automated Decision System

The system is a "Search-Augmented" Local Intelligence Assistant (RAG). It assists users in finding community services by retrieving records from a local PostgreSQL database and summarizing them. It does **not** make eligibility determinations or triage patients.

## 2. Impact Assessment (Low-Risk Profile)

Based on the _Canadian Directive on Automated Decision-Making_, the system is categorized as **Level 1 (Low Impact)** because:

- Decisions are non-binding.
- It provides information referral, not service delivery.
- A "Human-in-the-loop" (the user) is required for all final actions.

## 3. Mitigation Strategies

| Risk Area           | Mitigation Implemented                                                |
| :------------------ | :-------------------------------------------------------------------- |
| **Negligence**      | "Moffatt-proof" Safety Preamble & Hardened ToS.                       |
| **Clinical Safety** | Client-side "Crisis Circuit Breaker" (Regex Guard).                   |
| **Privacy**         | Zero-Egress Architecture (Local Inference).                           |
| **Bias**            | RAG-only grounding (AI only knows what is in our verified directory). |

## 4. Transparency

- **Disclaimer**: Persistent banner in UI.
- **Source Pills**: Direct citations for every service recommended.
- **Audit Trail**: This document and the `ai_compliance_audit.md`.

---

**Assessment Date**: 2026-01-10
**Assessor**: AI Remediation Agent (Antigravity)
