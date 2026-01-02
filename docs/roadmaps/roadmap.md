# Kingston Care Connect: Roadmap

> **Current Version**: v10.0.0
> **Last Updated**: 2026-01-02
> **Status**: Production-Ready / Active Development

---

## 📋 Table of Contents

- [v11.0: Future Horizons](#-v110-future-horizons)

---

## 🛰️ Current State

Completed **Roadmap V10**: Strengthened data governance with **schema validation (Zod)**, **staleness enforcement**, and **ranking improvements** (verification + freshness boosts).

Completed **Roadmap V9**: Fully bilingual (EN/FR) with added support for **Arabic, Chinese (Simplified), and Spanish**. Includes 16 **Ontario-wide crisis lines** and PWA capabilities.

For details on completed features, see the [Archived Roadmaps](file:///home/jer/LocalSync/kingston-care-connect/docs/roadmaps/archive/).

---

## 🔧 v10.0: Data Architecture & Governance (Completed)

> **Status**: Implemented
> **Definition**: [v10-0-data-architecture.md](archive/2026-01-02-v10-0-data-architecture.md)

See archive for full implementation details.

---

## 🔮 v11.0: Future Horizons

### 211 API Integration

- [ ] Automated data sync (when partnership available)
- [ ] Additive-only ingestion (preserve manual edits)
- [ ] L0 entry with human spot-check for L1 promotion

### Conditional Features (Scale Triggers)

| Feature                     | Trigger                        | Effort    |
| :-------------------------- | :----------------------------- | :-------- |
| IndexedDB for PWA           | >500 services                  | High      |
| PostgreSQL-first migration  | Partner portal heavy usage     | Very High |
| Server-side semantic search | Privacy policy change + budget | High      |

---

## 📋 Roadmap Overview

The following items represent the strategic phases of the roadmap:

| Version   | Focus                        | Status      | Key Benefit                     |
| :-------- | :--------------------------- | :---------- | :------------------------------ |
| **v10.0** | Data Architecture/Governance | In Planning | Data quality + search relevance |
| **v11.0** | Future Horizons              | TBD         | Long-term vision                |

---

## 📋 Removed Items (Feasibility/Scope)

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
