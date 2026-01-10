# Deep Research Prompt: AI Chatbot Legal & Compliance Audit

**Context for the AI Researcher:**
You are an expert Legal Compliance Officer and AI Ethics Risk Auditor specializing in Canadian technology law, specifically within the social services and non-profit sectors.

**Target Organization:**
Kingston Care Connect (KCC) is a community-led, non-profit social services directory for Kingston, Ontario. We have deployed a "Privacy-First" AI Assistant that runs entirely client-side (in the user's browser) using WebLLM technology. It helps users find food, housing, and crisis support services.

**Key Technical & Legal Facts:**

1.  **Architecture**: Client-side execution (Zero data egress). No user conversation data is sent to KCC servers.
2.  **Disclaimer Strategy**: We currently use a dedicated `AiDisclaimer` UI component, specific Terms of Service clauses warning of hallucinations, and system prompts that instruct the AI to be "grounded" in the provided context.
3.  **Jurisdiction**: Ontario, Canada (PIPEDA, PHIPA, AODA).
4.  **Risk Profile**: High. Users may be in crisis (mental health, domestic violence, homelessness).

**Your Mission:**
Conduct a rigorous legal and compliance stress-test research session to identify potential liability gaps.

**Scope of Authority & Research Parameters:**

- **Binding Law vs. Emerging Practice**: Prioritize binding Canadian law (statutes and case law). However, given the novelty of AI, you **MUST** also include "emerging best practices" and "soft law" (e.g., NIST AI Risk Management Framework, Law Society guidelines) where binding precedent is sparse.
- **International Benchmarks**: Where Canadian law is silent or ambiguous, reference international standards for robustness even if not strictly binding. Specifically, compare against **GDPR** (for privacy-by-design principles), the **EU AI Act** (for risk categorization), and **ADA** (to inform AODA interpretations).
- **Scaling & Validation**: Include recommendations for third-party validation. Distinguish between what is necessary for a "Day 1" MVP versus a scaled funded organization (e.g., when to trigger a formal ISO 27701 audit vs. seeking pro-bono counsel review).

## 1. Liability & "Reasonable Reliance"

- **Case Law**: Analyze the implications of _Moffatt v. Air Canada_ (2024) for non-profit informational chatbots. Does the "reasonable reliance" principle apply equally to free community services?
- **Duty of Care**: In the context of crisis intervention (e.g., a user tells the bot they are suicidal), what is the specific legal "Standard of Care" for an unmonitored automated system? Is a static disclaimer sufficient, or must the system proactively detect and interrupt these flows?
- **Promissory Estoppel**: Can the AI inadvertently create binding contracts or promises on behalf of the service providers it lists (e.g., "Yes, this shelter definitely has beds tonight")?

## 2. Privacy & PIPEDA/PHIPA Compliance

- **Client-Side Loophole**: Does the fact that the AI runs client-side strictly exempt us from all data processing obligations, or do we still hold liability for the "tools" we provide that process personal health information (PHI) locally?
- **Right to be Forgotten**: Since we don't store data, how do we prove we _didn't_ store data if challenged? What audit trails or architectural documentation serves as legal proof of privacy-by-design?

## 3. Regulatory Safety & Guardrails

- **Medical Advice**: Where is the legal line between "health information" (allowed) and "medical advice" (regulated)? If the AI summarizes verified clinic hours, is that safe? If it suggests "Go to the ER for that symptom," is that practicing medicine without a license?
- **AODA (Accessibility)**: Are there specific new requirements for AI interfaces under the Accessibility for Ontarians with Disabilities Act? (e.g., screen reader compatibility with streaming text generation).

## 4. Deliverables

Produce a **Legal Risk Mitigation Strategy** that includes:

1.  **Gap Analysis**: What specific clauses are missing from our current Terms of Service?
2.  **System Prompt Hardening**: specific "Safety Preamble" text we must inject into the system prompt to legally indemnify us against hallucinated advice.
3.  **UI "Friction" Requirements**: unexpected UI patterns we should implement to break "automation bias".
4.  **Operational Roadmap**: A pragmatic list of "Next Steps" distinguishing between immediate zero-cost actions and future paid certifications.

**Output Format:**
Provide the research as a detailed report with citations to Canadian statutes and relevant case law where applicable. Mark "Best Practice" advice clearly to distinguish it from "Legal Requirement".
