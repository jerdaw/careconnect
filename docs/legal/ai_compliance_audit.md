# Legal & Compliance Audit: AI Assistant v1.0

**Date:** January 10, 2026
**Version:** 1.2
**Status:** DRAFT (Pending Approval)
**Scope:** Legal liability, privacy compliance (PIPEDA/PHIPA), and regulatory safety (AODA/Medical) for Kingston Care Connect's client-side AI chatbot.

---

## Executive Summary

Kingston Care Connect (KCC) has deployed a "Privacy-First" AI Assistant using WebLLM technology (client-side execution). While this architecture significantly reduces data privacy risks by adhering to a "Zero Data Egress" model, it **does not absolve the organization of tort liability or duty of care obligations**.

**Critical Finding:** The landmark decision in _Moffatt v. Air Canada_ (2024) establishes that organizations are fully liable for the output of their automated agents. The defense that a chatbot is a "separate entity" or that users should "double-check" information has been legally dismantled. Given KCC's vulnerable user base (specifically those in crisis), the "reasonable reliance" threshold is high, creating a substantive duty of care to prevent negligent misrepresentation and foreseeable harm.

This report consolidates deep research into a unified risk mitigation strategy.

---

## 1. Liability & Duty of Care

### 1.1 The _Moffatt_ Standard: "Tool Theory" & Vicarious Liability

- **Case Law:** _Moffatt v. Air Canada_ (2024 BCCRT 149).
- **"Tool Theory":** The Tribunal reinforced the principle that _"If the computer does not think like a man, it is man's fault."_ KCC cannot blame the underlying model (Llama-3, etc.). By deploying it, KCC adopts its outputs.
- **Vicarious Liability:** The AI is legally analogous to a human volunteer at a help desk. If the AI acts negligently, KCC is vicariously liable for that negligence.
- **The "Separate Entity" Fallacy:** KCC cannot argue that the AI is a "beta tool" distinct from its core service. KCC is the publisher of **every word** the AI generates.

### 1.2 Negligent Misrepresentation Audit (_Queen v. Cognos_)

To establish liability, a plaintiff must satisfy the 5-part test from _Queen v. Cognos Inc._ (1993). KCC is at high risk on all counts:

| Test Criteria                | Application to KCC Chatbot                                                                                         | Risk Level   |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------------- | :----------- |
| **1. Duty of Care**          | A "special relationship" exists. KCC invites reliance by offering a "Help" tool to vulnerable users.               | **HIGH**     |
| **2. Untrue Representation** | AI hallucinations (e.g., inventing beds, hours, or policies) constitute untrue statements.                         | **HIGH**     |
| **3. Negligence**            | Failure to use "reasonable care" (e.g., omitting Safety Preambles or RAG restrictions) is negligence.              | **HIGH**     |
| **4. Reasonable Reliance**   | Users in crisis (homeless, abuse victims) have a _higher_ legal justification for reliance than typical consumers. | **CRITICAL** |
| **5. Detriment**             | Damages are physical (exposure, hunger) and psychological, not just financial.                                     | **CRITICAL** |

### 1.3 Crisis Intervention & "Good Samaritan" Risks

- **The "Undertaking" Rule:** In tort law, if you "undertake" to rescue (e.g., the AI starts giving advice to a suicidal user), you must do so reasonably. Abandoning them or giving bad advice is actionable negligence.
- **Good Samaritan Act Gap:** Ontario's _Good Samaritan Act_ protects individual bystanders. It is legally ambiguous whether it protects an _organization_ systematically deploying a tool. KCC is likely viewed as a "service provider," holding it to a higher standard of care.
- **Gross Negligence:** Knowingly deploying a stochastic model (LLM) for crisis support without hard-coded fail-safes could be argued as "gross negligence."

### 1.4 Promissory Estoppel & Apparent Authority

- **The Risk:** The AI creates an "apparent agreement" or acts with "apparent authority." If it says, _"Yes, the shelter has reserved a bed for you,"_ and the user relies on this, KCC could be estopped from denying the promise.
- **Impact:** While KCC cannot force a shelter to admit the user, it could be liable for damages resulting from the user's reliance (e.g., travel costs, injury from sleeping rough).

---

## 2. Privacy & Data Sovereignty

### 2.1 The Client-Side Defense (PIPEDA & Commercial Activity)

- **Architecture:** WebLLM runs entirely in the browser ("Zero Data Egress").
- **PIPEDA "Commercial Activity":** Even as a non-profit, KCC may trigger PIPEDA if it engages in "commercial activities" like selling donor lists or advertising. However, regarding the _chatbot_, since KCC does not **collect** the data (it stays on the client), the bulk of PIPEDA does not apply to chat content.
- **Software Distributor Liability:** KCC is the _distributor_ of the software. If the client-side code has design vulnerabilities (e.g., Cross-Site Scripting allowing third parties to read the local cache), KCC is liable for **negligent design**.
- **Cookie/Storage Consent:** Even without server tracking, using `localStorage` requires a "Cookie/Storage Banner" to inform users that data is being stored on their device.

### 2.2 PHIPA: The "Custody or Control" Test

- **Health Information Custodian (HIC):** KCC is likely _not_ a HIC.
- **Custody:** Under _PHIPA_, liability attaches to "custody or control." Since data never leaves the user's browser, KCC never assumes custody.
- **Residual Risk:** If a future update introduces a "server-side logging" feature for debugging (even temporary), KCC immediately assumes custody and PHIPA liability. **Strict discipline is required.**

### 2.3 Right to be Forgotten (Erasure)

- **Paradox:** Users may legally demand deletion. KCC cannot delete what it doesn't hold.
- **Solution:** The "Nuke History" button. KCC must provide a UI control that clears `localStorage` and IndexedDB. This empowers the user to exercise their right to erasure locally.
- **Audit Proof:** KCC must maintain a technical "Privacy Whitepapers" documenting the architecture to prove to the IPC that no server-side data exists.

---

## 3. Regulatory Safety

### 3.1 Unauthorized Practice of Medicine (_RHPA_)

- **The Law:** The _Regulated Health Professions Act_ restricts "communicating a diagnosis" to licensed professionals.
- **AI Risk:** "Triaging" is distinct from "Information."
  - _Safe:_ "Protocol says go to ER for deep cuts."
  - _Illegal:_ "Your cut looks deep, go to the ER." (This is an assessment/diagnosis).
- **Control:** The System Prompt must strictly forbid diagnosis, assessment of severity, or treatment recommendations. It must only quote verified service descriptions.

### 3.2 Accessibility (AODA) & Emerging Standards

- **Req:** _Accessibility for Ontarians with Disabilities Act_ mandates WCAG 2.0 Level AA (transitioning to 2.1).
- **AI Specific Hallucinations & UX:**
  - **Streaming Text:** Token-by-token generation confuses screen readers (stuttering). **Required:** use `aria-live="polite"` regions that update only on full sentences.
  - **Cognitive Load (WCAG 2.2 "Redundant Entry"):** The UI must not require users to re-enter information (e.g., "I live downtown") in the same session. Context must be maintained.
  - **Keyboard Navigation:** The chat widget must be fully operable via keyboard (tab focus), ensuring no "keyboard traps."
  - **Focus Management (WCAG 2.4.11):** When new content appears, focus must be managed so it doesn't disorient the user or obscure the input.
  - **Flashing:** "Thinking" animations must not flash >3 times/sec (seizure risk).

---

## 4. International Benchmarks (Best Practice)

While not binding in Ontario yet, these set the "Gold Standard" for due diligence:

### 4.1 EU AI Act (High Risk)

- **Relevance:** Classifies systems used for "essential public services" (housing/benefits) as **High Risk**.
- **Mitigation:** Adhering to High Risk standards (transparency, human oversight, logging) is a strong defense against negligence claims.

### 4.2 NIST AI Risk Management Framework (RMF)

- **Framework:** Map, Measure, Manage, Govern.
- **Action:** KCC should explicitly **Map** crisis risks and document **Manage** controls (Safety Preamble). This documentation is evidence of "due diligence" in any liability suit.

---

## 5. Risk Mitigation Strategy

### 5.1 Gap Analysis: Terms of Service (ToS) Updates

| Clause Category                  | Missing Element                                                                                 | Legal Rationale                                                |
| :------------------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **No Professional Relationship** | Explicit statement that AI is NOT a doctor, lawyer, or social worker.                           | Prevents "Reasonable Reliance" on professional duty standards. |
| **Crisis Waiver**                | "This tool is unmonitored and cannot contact 911."                                              | Mitigates "Good Samaritan" / "Undertaking" negligence claims.  |
| **Volatility Disclaimer**        | "Service availability is an estimate, not a guarantee."                                         | Counters Promissory Estoppel; clarifies "info" vs. "promise."  |
| **Device Security Assumption**   | "You are responsible for the security of your device and clearing history on public terminals." | Mitigates liability for the "public computer" privacy risk.    |
| **Third-Party Data**             | "KCC is not liable for accuracy of third-party listings."                                       | Aligns with Competition Act "publisher" defenses.              |

### 5.2 System Prompt Hardening ("Safety Preamble")

This preamble acts as a binding "contract" with the model to prevent negligence.

**Recommended System Prompt Protocol:**

> **CRITICAL INSTRUCTIONS - LEGALLY BINDING PROTOCOLS:**
>
> 1.  **Identity & Scope:** You are the Kingston Care Connect Assistant. You are an automated information retrieval system, **NOT** a social worker, doctor, lawyer, or crisis counselor. You cannot take actions in the real world (e.g., booking beds).
> 2.  **Zero-Hallucination Mandate:** You must **ONLY** provide information present in the provided context (Service Directory). If the answer is not in the context, state: _"I do not have that information in my directory."_ Do not guess hours, location, or availability.
> 3.  **Crisis Protocol:** If the user mentions suicide, self-harm, domestic violence, or immediate danger, you **MUST** immediately output the 'Crisis Handoff Block' (9-8-8 info) and **CEASE** generating further advice. Do not attempt to de-escalate or counsel.
> 4.  **No Medical Advice:** Do not diagnose or interpret symptoms. Provide contact info for 'Health811' but clarify: _"I cannot provide medical advice."_
> 5.  **Volatility Disclaimer:** When stating hours or availability, preface with: _"According to my last update..."_ to avoid creating a binding promise.

### 5.3 UI "Friction" Considerations

To break "Automation Bias" (the tendency to blindly trust computers), we must introduce friction at critical moments:

1.  **Crisis Interrupter Modal:**
    - _Mechanism:_ Client-side regex (e.g., `/(suicid|kill myself|harm|abuse)/i`).
    - _Action:_ Disable input. Show full-screen modal with red text: _"You seem to be in distress. This AI cannot help. Call 9-8-8."_
    - _Rationale:_ Physically prevents reliance on the bot during emergency.
2.  **Source Attribution "Pills":**
    - _Mechanism:_ Every claim (e.g. "Open 9-5") must link to the static directory page (`[Source]`).
    - _Rationale:_ Re-anchors user to the static page (the "obvious" source per _Moffatt_) and enables verification.
3.  **"Nuke History" Button:**
    - _Mechanism:_ Prominent "Clear Chat & Cache" button.
    - _Rationale:_ Demonstrates privacy compliance and control foundation.
4.  **Outcome Feedback Loop:**
    - _Mechanism:_ Ask _"Did this help?"_ after responses.
    - _Rationale:_ Counters "infallibility" bias and signals that errors are possible/expected.

### 5.4 Operational Roadmap

**Phase 1: Immediate Actions (Day 1 - Zero Cost)**

- [ ] **Prompt Injection:** Update `ChatAssistant.tsx` system prompt with the "Safety Preamble."
- [ ] **ToS Update:** Add the 5 critical clauses (Professional, Crisis, Volatility, Device, Third-Party).
- [ ] **Static Disclaimer:** Hard-code a message above chat: _"I am an AI. Verify critical info."_
- [ ] **Crisis Regex:** Implement basic client-side keyword blocking.
- [ ] **Volunteer Board:** Recruit 2-3 local experts (law/social work) for a pro-bono ethical advisory board.

**Phase 2: MVP Hardening (Month 1-3)**

- [ ] **RAG Implementation:** Ensure AI strictly uses Retrieval-Augmented Generation (RAG) with `temperature=0`.
- [ ] **AODA Remediation:** Modify WebLLM streaming to use `aria-live` regions for screen readers.
- [ ] **Audit Trail:** Create technical whitepaper documenting "Zero Egress" architecture.

**Phase 3: Scaling & Validation (Year 1+)**

- [ ] **Third-Party Audit:** Algorithmic Impact Assessment (AIA) based on Treasury Board directives.
- [ ] **ISO 27701:** Privacy certification.
- [ ] **Insurance:** Purchase "AI Errors & Omissions" liability insurance as exposure grows.
