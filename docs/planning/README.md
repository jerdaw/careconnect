# Planning Documents

This directory contains planning and strategy documents for HelpBridge.

> Historical note: files under `docs/planning/archive/` preserve earlier phases
> of the project and may still use the legacy Kingston Care Connect branding.
> Treat those references as historical only; current operational guidance uses
> the HelpBridge name and `helpbridge.ca`.

## Active Planning: v18.0

**Status:** AWAITING USER APPROVAL
**Created:** 2026-01-30

### Quick Start (Read These First)

1. **[Executive Summary](v18-0/v18-0-executive-summary.md)** ⭐ START HERE
   - High-level overview (what, why, how much)
   - Decision points and next steps
   - **Reading time:** 10 minutes

2. **[Visual Roadmap](v18-0/v18-0-visual-roadmap.md)**
   - Diagrams and progress trackers
   - Before/after comparison
   - **Reading time:** 5 minutes

### Detailed Documentation (Optional)

3. **[Roadmap Overview](v18-0/production-observability.md)**
   - Goals, phases, success criteria
   - Timeline and dependencies
   - **Reading time:** 15 minutes

4. **[Full Implementation Plan](../implementation/v18-0-production-observability.md)**
   - Complete technical specifications (44 pages)
   - Code examples and testing strategies
   - Rollout procedures and risk assessment
   - **Reading time:** 1-2 hours

---

## Document Navigation

```
docs/planning/
├── README.md ← You are here
├── roadmap.md (main roadmap, updated with v18.0)
├── archive/ (completed version plans)
└── v18-0/
    ├── v18-0-executive-summary.md ⭐ START HERE (10min read)
    ├── v18-0-visual-roadmap.md (5min read)
    └── production-observability.md (15min read)

docs/implementation/
└── v18-0-production-observability.md (full plan, 1-2hr read)
```

---

## Quick Reference

### What is v18.0?

**v18.0: Production Observability & Operational Excellence**

The final infrastructure layer before production launch. Completes circuit breaker rollout, adds production monitoring, alerting, SLO tracking, and operational documentation.

### Why Now?

Platform is technically ready but lacks:

- Complete circuit breaker coverage (40% → 100%)
- Production monitoring (metrics disappear on restart)
- Automated alerting (can't detect incidents)
- Public status page (no transparency)
- Operational runbooks (ad-hoc troubleshooting)

### Timeline

**4 weeks, 24-32 hours of work**

- Week 1: Circuit breaker rollout
- Week 2: Monitoring infrastructure
- Week 3: SLOs + documentation
- Week 4: Validation + launch approval

### Cost

**$20/month** (unchanged from current)
All monitoring tools use free tiers.

### Dependencies

User needs to sign up for:

- Axiom (metrics) - FREE
- Slack webhook (alerts) - FREE
- Upptime (status page) - FREE

**Total setup time:** ~20 minutes

---

## How to Proceed

### Option 1: Approve and Start

Read the [Executive Summary](v18-0/v18-0-executive-summary.md), approve, and we'll begin Phase 1.

### Option 2: Ask Questions

Review documents and ask clarifying questions about scope, timeline, or approach.

### Option 3: Request Changes

Propose modifications to scope, timeline, or implementation strategy.

---

## Document Updates

- **2026-01-30:** v18.0 planning documents created
- Main roadmap updated: `docs/planning/roadmap.md`
- Next review: After user decision
