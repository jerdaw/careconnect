# Kingston Care Connect: Roadmap

> **Current Version**: v12.0
> **Last Updated**: 2026-01-02
> **Status**: Production-Ready / Maintenance Mode

---

## ️ Current State

Completed **Roadmap V12**: Established fundamental **legal protections**, **regulatory compliance (PIPEDA, AODA)**, and **liability mitigation**.

Completed **Roadmap V10**: Strengthened data governance with **schema validation (Zod)**, **staleness enforcement**, and **ranking improvements**.

For details on completed features, see the [Archived Roadmaps](file:///home/jer/LocalSync/kingston-care-connect/docs/roadmaps/archive/).

---

## v12.0: Legal & Compliance Infrastructure (Completed)

> **Status**: Implemented
> **Definition**: [2026-01-02-v12-0-legal-compliance.md](archive/2026-01-02-v12-0-legal-compliance.md)

---

## v10.0: Data Architecture & Governance (Completed)

> **Status**: Implemented
> **Definition**: [archive/2026-01-02-v10-0-data-architecture.md](archive/2026-01-02-v10-0-data-architecture.md)

---

## v11.0: Future Horizons

### 1. Ontario-wide Service Expansion (Deferred from v10.1)

- [ ] **Goal**: Expand from 16 crisis lines to 50+ provincial resources.
- [ ] **Scope**: Legal aid, disability support, senior care, and specialized health services operational across Ontario.
- [ ] **Method**: Manual verification or 211 API integration (see below).

### 2. 211 API Integration (Automation)

- [ ] Automated data sync (when partnership available).
- [ ] Additive-only ingestion (preserve manual edits).
- [ ] L0 entry with human spot-check for L1 promotion.

### Conditional Features (Scale Triggers)

| Feature                     | Trigger                        | Effort    |
| :-------------------------- | :----------------------------- | :-------- |
| IndexedDB for PWA           | >500 services                  | High      |
| PostgreSQL-first migration  | Partner portal heavy usage     | Very High |
| Server-side semantic search | Privacy policy change + budget | High      |

---

## Roadmap Overview

The following items represent the strategic phases of the roadmap:

| Version   | Focus                        | Status      | Key Benefit                       |
| :-------- | :--------------------------- | :---------- | :-------------------------------- |
| **v10.0** | Data Architecture/Governance | Completed   | Data quality + search relevance   |
| **v10.1** | UI Polish & Data Expansion   | Completed   | 159 services + Map + Bilingual    |
| **v12.0** | Legal & Compliance           | In Planning | Liability protection + compliance |
| **v11.0** | Future Horizons (Ontario)    | Planned     | Provincial scale + Automation     |

---

## Removed Items (Feasibility/Scope)

The following items were evaluated and removed during previous roadmap cycles:

| Item                                   | Reason                          |
| :------------------------------------- | :------------------------------ |
| Partner Onboarding (email auto-verify) | Security risk                   |
| Conversational Intake AI               | Complexity, browser support     |
| Navigator Sharing                      | Scope creep                     |
| Trip Planner                           | Paid API, scope creep           |
| Impact Analytics Dashboard             | Scope, privacy risk             |
| Health Literacy Rewrite                | Effort without review process   |
| Text-to-Speech                         | Nice-to-have, not core          |
| Research Publication                   | Personal activity, not software |
