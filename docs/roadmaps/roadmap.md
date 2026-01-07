# Kingston Care Connect: Roadmap

> **Current Version**: v13.0
> **Last Updated**: 2026-01-07
> **Status**: Production-Ready / Maintenance Mode

---

## ️ Current State

Completed **Roadmap V12**: Established fundamental **legal protections**, **regulatory compliance (PIPEDA, AODA)**, and **liability mitigation**.

Completed **Roadmap V10**: Strengthened data governance with **schema validation (Zod)**, **staleness enforcement**, and **ranking improvements**.

For details on completed features, see the [Archived Roadmaps](archive/).

---

## v12.0: Legal & Compliance Infrastructure (Completed)

> **Status**: Implemented
> **Definition**: [2026-01-02-v12-0-legal-compliance.md](archive/2026-01-02-v12-0-legal-compliance.md)

---

## v10.0: Data Architecture & Governance (Completed)

> **Status**: Implemented
> **Definition**: [archive/2026-01-02-v10-0-data-architecture.md](archive/2026-01-02-v10-0-data-architecture.md)

---

## v11.0: Scope Expansion (Applies-to-Kingston First)

### 1) Ontario-wide services (incremental)

- [ ] **Goal**: Build towards a comprehensive set of Ontario-wide services that apply anywhere in Ontario (including Kingston).
- [ ] **Definition**: Province-wide availability (not city-specific) with a verifiable public source and stable operator.
- [ ] **Priorities**: Crisis, mental health, substance use, domestic violence, legal aid, youth, seniors, disability, newcomer supports.
- [ ] **Method**: Manual curation first; optionally add a 211 Ontario partnership for additive ingestion with human review.

### 2) Canada-wide services (incremental)

- [ ] **Goal**: Add Canada-wide services that apply regardless of city/province and remain useful for Kingston residents.
- [ ] **Priorities**: National crisis and youth supports, Indigenous resources, newcomer/federal settlement supports, legal info, veterans.
- [ ] **Method**: Same verification requirements as the Kingston dataset; tag and surface clearly as national resources.

### 3) Major Ontario cities (true scope extension)

- [ ] **Goal**: Add city-specific service directories for major Ontario population centres.
- [ ] **Start set**: Toronto, Ottawa, Hamilton, London, Windsor, Kitchener-Waterloo (adjust based on partner readiness).
- [ ] **Data strategy**: City-by-city ingestion via 211/open data, then manual L1 verification for high-impact services.
- [ ] **Enablers**: 211 sync (additive-only, preserve manual edits) + partner update requests with audit trail + server-side data fetching as scale increases.

### Shared guardrails

- [ ] **Coverage taxonomy**: Standardize how we label services as `kingston`, `ontario`, `canada`, or `city` (and keep “applies to Kingston” explicit in UI).
- [ ] **Privacy posture**: City selection should be user-driven (no background location tracking); keep public search query handling privacy-first.
- [ ] **Verification**: Maintain staleness enforcement and provenance for every new scope so expansion does not dilute trust.

### Conditional Features (Scale Triggers)

| Feature                     | Trigger                        | Effort    |
| :-------------------------- | :----------------------------- | :-------- |
| IndexedDB for PWA           | >500 services                  | High      |
| PostgreSQL-first migration  | Partner portal heavy usage     | Very High |
| Server-side semantic search | Privacy policy change + budget | High      |

---

## v13.0: Secure Data Architecture (Completed)

> **Status**: ✅ Implemented (2026-01-07)
> **Focus**: Privacy & Scalability
> **Definition**: [v13-0-librarian-model.md](v13-0-librarian-model.md)

### 1. Privacy-First Data Fetching ("Librarian Model")

- [x] **Goal**: Stop sending the full database (JSON) to the client.
- [x] **Method**: Migrate public search to use Supabase API (server-side).
- **Benefit**: Internal notes, draft services, and verification metadata remain strictly on the server.

### 2. On-Demand Scalability

- [x] **Goal**: Support 1000+ services without increasing initial page load size.
- [x] **Method**: Paginated fetching and server-side filtering.

---

## v14.0: Measurable Impact, Equity & Trust

> **Status**: Planned
> **Focus**: Verifiable community impact without tracking

### 1. Privacy-Preserving Outcomes + QI Loop

- [ ] **Goal**: Measure usefulness and continuously improve data quality without logging queries or tracking users.
- [ ] **User feedback**: "Was this helpful?", "Report an issue", and "Couldn't find a service" prompts (opt-in, no account required).
- [ ] **Data minimization**: Store only aggregated counts + user-submitted feedback content (no cookies, no persistent identifiers).
- [ ] **Operations**: Triage queue + resolution workflow (status, owner, timestamps) with staleness links back to the verification backlog.
- [ ] **Public reporting**: Quarterly "Impact & Data Quality" summary (e.g., reports resolved, median time-to-fix, % services verified in last 90 days).

### 2. Equity-First Access Pack (TMU/Toronto-Ready)

- [ ] **Full UI localization**: Close remaining `next-intl` gaps for `en`, `fr`, `ar`, `zh-Hans`, `es` and add an i18n regression audit to CI.
- [ ] **Plain-language mode**: Add simplified summaries and "how to use this service" steps for the highest-impact services, backed by a lightweight review workflow.
- [ ] **Low-bandwidth outputs**: Printable/text-only "resource cards" for service pages (phone/address/hours/eligibility), optimized for shelters and drop-in centres.
- [ ] **Accessibility upgrades**: Keyboard-first flows, reduced-motion support, and AODA-focused UX checks for critical pages (Search, Service Details).

### 3. Visible Verification + Provenance (Trust Layer)

- [ ] **Service-level trust panel**: Display `verified_at`, `verified_by`, method, sources, and "last reviewed" directly on Service Details.
- [ ] **Partner update requests**: Structured change requests with audit trail (who/what/when) and human approval before publish.
- [ ] **Crisis-safe routing**: Consistent emergency escalation UI (e.g., 911/988) and clear scope disclaimers for crisis-related intents.
- [ ] **Narrative alignment**: McMaster = evaluation/QI; Queen's = Kingston governance & partners; Western = operational reliability at scale.

---

## Roadmap Overview

The following items represent the strategic phases of the roadmap:

| Version   | Focus                        | Status    | Key Benefit                        |
| :-------- | :--------------------------- | :-------- | :--------------------------------- |
| **v10.0** | Data Architecture/Governance | Completed | Data quality + search relevance    |
| **v10.1** | UI Polish & Data Expansion   | Completed | 159 services + Map + Multi-lingual |
| **v12.0** | Legal & Compliance           | Completed | Liability protection + compliance  |
| **v13.0** | Secure Data Architecture     | Completed | Privacy + Infinite Scale           |
| **v11.0** | Scope Expansion              | Planned   | Ontario + Canada + major cities    |
| **v14.0** | Impact, Equity & Trust       | Planned   | Verifiable outcomes + access       |

---

## Removed Items (Feasibility/Scope)

The following items were evaluated and removed during previous roadmap cycles:

| Item                                   | Reason                          |
| :------------------------------------- | :------------------------------ |
| Partner Onboarding (email auto-verify) | Security risk                   |
| Conversational Intake AI               | Complexity, browser support     |
| Navigator Sharing                      | Scope creep                     |
| Trip Planner                           | Paid API, scope creep           |
| User-tracking Impact Analytics         | Scope, privacy risk             |
| Full Health Literacy Rewrite           | Effort without review process   |
| Text-to-Speech                         | Nice-to-have, not core          |
| Research Publication                   | Personal activity, not software |
