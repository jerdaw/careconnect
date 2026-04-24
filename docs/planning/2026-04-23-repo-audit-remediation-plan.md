# Repo Audit Remediation Plan (2026-04-23)

**Status:** Active planning only  
**Related:** `2026-04-23-repo-audit-follow-up-board.md`, `roadmap.md`, `v22-0-non-duplicate-value-decision-plan.md`

## Summary

This plan turns the 2026-04-23 audit board into one ordered remediation track
for CareConnect.

No fixes are applied here. This is sequencing only.

## Priority Sequence

### Track 1: Production Truth And Incident Workflow

Why first:

1. active incident, observability, and QA docs still contain the strongest
   production-truth drift in this repo
2. wrong live-operational guidance is the highest current risk

Scope:

1. sweep active production, incident, observability, and QA docs for
   Vercel/serverless assumptions
2. converge repo-local guidance on one current VPS production workflow
3. ensure production-check and rollback guidance point to the same path

Exit criteria:

1. one canonical production incident workflow exists
2. active ops and observability docs no longer prescribe impossible
   serverless-era actions

### Track 2: Feedback Privacy And Retention

Why second:

1. the repo’s public privacy posture is otherwise disciplined
2. the feedback surface is the main place where documented retention and PHI
   handling claims exceed code evidence

Scope:

1. trace feedback data from intake through moderation, resolution, deletion, and
   backup/log inclusion
2. separate privacy-safe search telemetry claims from feedback/admin-surface
   handling
3. decide how PHI spill handling is documented and later enforced

Exit criteria:

1. documented feedback retention claims can be evidenced from code or ops
2. PHI spill handling expectations are explicit for future implementation work

### Track 3: Security Gate Policy

Why third:

1. the repo has meaningful admin and public API surfaces
2. dependency and privileged-route follow-through depends on the prior docs
   cleanup

Scope:

1. decide when dependency findings become blocking
2. audit admin routes as one privileged surface
3. define how approved security exceptions are recorded

Exit criteria:

1. CI blocking versus advisory security posture is explicit
2. admin-route follow-up is scoped as one bounded future workstream

### Track 4: Test Gate And Coverage Truth

Why last:

1. this is important, but less urgent than wrong production guidance and
   feedback-retention drift
2. current coverage language should be revisited after the earlier tracks

Scope:

1. restate what the published coverage number is meant to represent
2. review excluded route/page surfaces against actual runtime risk
3. decide whether browser E2E remains non-blocking

Exit criteria:

1. public and roadmap test language match the enforced gate
2. high-risk excluded surfaces are explicitly accepted or queued for stronger
   enforcement

## Non-Goals

1. no v22 strategy change by itself
2. no code, schema, or workflow fixes in this document
3. no new feature commitments
