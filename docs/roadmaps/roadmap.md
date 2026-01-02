# Kingston Care Connect: Roadmap

> **Current Version**: v9.0.0
> **Last Updated**: 2026-01-01
> **Status**: Production-Ready / Active Development

---

## 📋 Table of Contents

- [Current State](#-current-state)
- [Immediate Action Items](#-immediate-action-items)
- [Future Horizons](#-future-horizons)

---

## 🛰️ Current State

Completed **Roadmap V9**: Fully bilingual (EN/FR) with added support for **Arabic, Chinese (Simplified), and Spanish**. Includes 16 **Ontario-wide crisis lines** and PWA capabilities.

For details on completed features, see the [Archived Roadmaps](file:///home/jer/LocalSync/kingston-care-connect/docs/roadmaps/archive/).

---

## 🛠️ Immediate Action Items

### Database Migrations

- [ ] Execute [002_v6_prerequisites.sql](file:///home/jer/LocalSync/kingston-care-connect/supabase/migrations/002_v6_prerequisites.sql)
- [ ] Execute [003_org_members.sql](file:///home/jer/LocalSync/kingston-care-connect/supabase/migrations/003_org_members.sql)

### Environment Variables

Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `TWILIO_ACCOUNT_SID`, and `SUPABASE_SERVICE_ROLE_KEY` are configured.

---

## � Future Horizons

### 211 API Integration

- [ ] Automated data sync (when partnership available)

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
