# Kingston Care Connect: Roadmap

> **Current Version**: v15.0
> **Last Updated**: 2026-01-13
> **Status**: Production-Ready

---

## Current State

**v15.0 Mobile-Ready Infrastructure** is complete, delivering offline-first PWA capabilities, push notifications via OneSignal, and mobile-optimized APIs. The platform now supports full offline access to 196 services with background synchronization.

**Previous milestones**: v14.0 (Impact & Trust), v13.1 (AI Compliance), v13.0 (Librarian Model), v12.0 (Legal & Compliance), v11.0 (Ontario Scope), v10.0 (Data Governance).

For complete details on all implemented features, see the [Archived Roadmaps](archive/).

---

## Completed Versions

All completed versions (v10.0 through v15.0) have been archived with full implementation details:

- **[v15.0: Mobile-Ready Infrastructure](archive/v15-0-mobile-ready-infrastructure.md)** (2026-01-13) - Offline-first PWA, push notifications, mobile APIs
- **[v14.0: Impact, Equity & Trust](archive/2026-01-13-v14-0-impact-equity-trust.md)** (2026-01-13) - Privacy-preserving metrics, plain language, trust signals
- **[v13.1: AI Compliance Remediation](archive/2026-01-12-v13-1-ai-compliance-remediation.md)** (2026-01-12) - Legal safety, AODA compliance
- **[v13.0: Secure Data Architecture](archive/2026-01-07-v13-0-librarian-model.md)** (2026-01-07) - Server-side search, privacy-first
- **[v12.0: Legal & Compliance](archive/2026-01-02-v12-0-legal-compliance.md)** (2026-01-02) - PIPEDA, liability protection
- **[v11.0: Scope Expansion](archive/2026-01-08-v11-0-scope-expansion.md)** (2026-01-08) - Ontario-wide services (196 total)
- **[v10.0: Data Architecture](archive/2026-01-02-v10-0-data-architecture.md)** (2026-01-02) - Schema validation, data quality

---

## v15.1: Mobile App Launch

> **Status**: Future
> **Focus**: App Store Distribution
> **Prerequisites**: macOS access, Apple Developer Program ($99/year), Google Play Console ($25)
> **Note**: ⚠️ **Only implement when user has macOS access and explicitly requests it**

### Overview

v15.1 completes the mobile app journey by publishing native iOS and Android apps to App Store and Google Play Store. All backend infrastructure is built in v15.0, so v15.1 focuses purely on native builds, assets, testing, and store submissions.

### 1. Native App Builds

- [ ] **Goal**: Create iOS and Android app builds using Capacitor wrapper.
- [ ] **Requirements**: Xcode on macOS (iOS), Android Studio (Android).
- [ ] **Timeline**: 4-6 weeks after v15.0 completion.

### 2. App Store Submissions

- [ ] **Goal**: Pass App Store Review and Google Play Review on first attempt.
- [ ] **Deliverables**: App icons, screenshots, store metadata, privacy labels.
- [ ] **Target**: 4.5+ star rating within first 90 days.

### 3. Launch & Monitoring

- [ ] **Goal**: Successful public launch with crash-free rate ≥ 99%.
- [ ] **Activities**: ASO (App Store Optimization), social media announcement, partner outreach.
- [ ] **Metrics**: 500+ installs in first 90 days, 20% 30-day retention.

---

## Roadmap Overview

The following items represent the strategic phases of the roadmap:

| Version   | Focus                        | Status    | Key Benefit                         |
| :-------- | :--------------------------- | :-------- | :---------------------------------- |
| **v10.0** | Data Architecture/Governance | Completed | Data quality + search relevance     |
| **v10.1** | UI Polish & Data Expansion   | Completed | 159 services + Map + Multi-lingual  |
| **v12.0** | Legal & Compliance           | Completed | Liability protection + compliance   |
| **v13.0** | Secure Data Architecture     | Completed | Privacy + Infinite Scale            |
| **v13.1** | AI Compliance Remediation    | Completed | Moffatt/AODA Legal Safety           |
| **v11.0** | Scope Expansion              | Completed | Ontario-wide services (47)          |
| **v14.0** | Impact, Equity & Trust       | Completed | Verifiable outcomes + access        |
| **v15.0** | Mobile-Ready Infrastructure  | Completed | Offline + Push (no macOS required)  |
| **v15.1** | Mobile App Launch            | Future    | App Store + Play Store distribution |

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
