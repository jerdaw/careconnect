# Planning Documents

This directory contains planning and strategy documents for HelpBridge.

> Historical note: files under `docs/planning/archive/` preserve earlier phases
> of the project and may still use the legacy Kingston Care Connect branding.
> Treat those references as historical only; current operational guidance uses
> the HelpBridge name and `helpbridge.ca`.

## Active Planning: v22.0

**Status:** GATE 0 DECISION WORK IN PROGRESS (`NO-GO` pending C1/D4 closure; C2 complete)
**Created:** 2026-02-27

### Quick Start (Read These First)

1. **[Roadmap](roadmap.md)** ⭐ START HERE
   - Current product state, active work, completed work, and follow-ups
   - **Reading time:** 10 minutes

2. **[v22.0 Non-Duplicate Value Decision Plan](v22-0-non-duplicate-value-decision-plan.md)**
   - Strategic objective, hypotheses, kill rules, and stage gates
   - **Reading time:** 15 minutes

### Detailed Documentation (Optional)

3. **[v22.0 Approval Checklist](v22-0-approval-checklist.md)**
   - Canonical sign-off record for Gate 0 decisions
   - **Reading time:** 10 minutes

4. **[v22.0 Phase 0 Implementation Plan](../implementation/v22-0-phase-0-implementation-plan.md)**
   - Technical execution spec for pilot instrumentation and governance evidence
   - **Reading time:** 20-30 minutes

5. **[HelpBridge Rebrand Archive](archive/2026-03-18-helpbridge-rebrand.md)**
   - Historical record of the completed repo + runtime rename
   - **Reading time:** 5 minutes

6. **[v20.0 DB Integration Test Lane Archive](archive/2026-03-24-v20-0-db-integration-test-lane.md)**
   - Historical record of the completed real DB integration test lane and the remaining migration-history follow-up
   - **Reading time:** 5 minutes

7. **[v20.0 Repo Audit Remediation Archive](archive/2026-03-29-v20-0-repo-audit-remediation.md)**
   - Historical record of the completed repo-maintenance batch: typed service writes, dashboard action extraction, search typing cleanup, script/reference hygiene, and dependency cleanup
   - **Reading time:** 5-10 minutes

8. **[v20.0 Runtime Hardening and Performance Remediation Archive](archive/2026-03-30-v20-0-runtime-hardening-and-performance-remediation.md)**
   - Historical record of the completed audit-driven hardening wave: privacy/governance fixes, org-scoped service creation, CSV import repair, lazy AI/search loading, and workflow cleanup
   - **Reading time:** 5-10 minutes

9. **[v20.0 Workflow Runtime Cleanup and 211 Sync Quarantine Archive](archive/2026-04-01-v20-0-workflow-runtime-cleanup-and-211-sync-quarantine.md)**
   - Historical record of the completed maintenance wave that quarantined the experimental 211 sync path and closed the remaining GitHub Actions runtime follow-up
   - **Reading time:** 5 minutes

---

## Document Navigation

```
docs/planning/
├── README.md ← You are here
├── roadmap.md (main roadmap, updated for v22.0)
├── archive/ (completed version plans)
├── v22-0-non-duplicate-value-decision-plan.md
├── v22-0-approval-checklist.md
├── archive/2026-04-01-v20-0-workflow-runtime-cleanup-and-211-sync-quarantine.md
├── archive/2026-03-18-helpbridge-rebrand.md
├── archive/2026-03-30-v20-0-runtime-hardening-and-performance-remediation.md
└── archive/2026-03-29-v20-0-repo-audit-remediation.md
```

---

## Quick Reference

### What is v22.0?

**v22.0: Non-Duplicate Value Decision Plan**

The current strategic planning track for proving non-duplicate value relative to 211 through measured connection outcomes, strict privacy constraints, and explicit kill criteria.

### Why Now?

The platform is technically mature, but the next decision is strategic rather than purely technical:

- Avoid direct breadth competition with 211
- Validate measurable last-mile outcome value
- Keep governance and privacy redlines explicit before expanding pilot work

### Timeline

**~90-day decision cycle**

- Phase 0: baseline + governance locks
- Phase 1: pilot execution
- Phase 2: objective go / conditional / stop decision

### Cost

Pilot cost remains bounded by existing infrastructure and partner participation assumptions documented in the v22 plan.

### Dependencies

Current dependencies:

- Gate 0 blocker closure (`C1`, `D4`)
- Baseline evidence already published
- Integration feasibility decision already recorded in conditional mode
- Offline/local threat-model completion already recorded

---

## How to Proceed

### Option 1: Close Gate 0

Use the active roadmap and Gate 0 tracker to close the remaining blocking items:

1. Attach candidate partner legal/API terms for C1 review
2. Attach named pilot partner and outreach execution evidence for D4

### Option 2: Ask Questions

Review documents and ask clarifying questions about scope, timeline, or approach.

### Option 3: Request Changes

Propose modifications to scope, timeline, or implementation strategy.

---

## Document Updates

- **2026-03-24:** Planning index updated to reflect Gate 0 `NO-GO` blockers and current close-out order
- **2026-03-29:** Planning index updated to reflect completed C2 closure and remaining C1/D4 blockers
- **2026-03-29:** Added v20.0 repo-audit remediation archive and removed the stale reference to a nonexistent active v20 migration-recovery plan
- **2026-03-30:** Added the v20.0 runtime hardening and performance remediation archive and refreshed roadmap baseline metrics after the audit-driven maintenance wave
- **2026-04-01:** Added the v20.0 workflow runtime cleanup and 211 sync quarantine archive after closing the remaining Node-runtime workflow follow-up
- **2026-03-24:** v20.0 DB integration test lane archived; migration-history cleanup remains on the active roadmap
- **2026-03-18:** Planning index updated for v22.0 and HelpBridge rebrand archive
- **2026-03-18:** HelpBridge rebrand archived in `docs/planning/archive/2026-03-18-helpbridge-rebrand.md`
- Next review: After any `UA-1` / `UA-2` / `UA-3` evidence update or the next material roadmap change
