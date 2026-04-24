# Repo Audit Follow-Up Board (2026-04-23)

Status: audit-only. No fixes applied.

## Scope

Parallel audit across:

- code quality
- security
- privacy
- documentation quality and drift
- test quality and drift

## Current Setup

CareConnect is a Next.js and Supabase application whose current program state
is governed by the v22 Gate 0 decision track:

- `app/` owns the route surface.
- `lib/` owns most domain logic, search, governance, and data helpers.
- Supabase backs data, auth, and policy enforcement.
- The active roadmap is strategic and governance-driven, so repo quality depends
  heavily on CI discipline and documentation accuracy while v22 remains paused.

## Current Entry Points

- `README.md`
- `docs/README.md`
- `docs/planning/roadmap.md`
- `docs/planning/v22-0-non-duplicate-value-decision-plan.md`
- `docs/deployment/direct-vps-proof.md`
- `docs/deployment/production-checklist.md`

## Findings By Area

### Code Quality

- `Medium-Low`: CI still leaves broad blind spots by design, and the enforced
  coverage floor is lower than the repo's apparent maturity. Major route/page
  surfaces stay outside the enforced threshold even though the app surface is
  large and the roadmap reports materially higher real coverage. Evidence:
  `.github/workflows/ci.yml`, `vitest.config.mts`,
  `docs/planning/roadmap.md`.

### Security

- `Medium`: `npm audit --audit-level=high` is explicitly non-blocking in the
  primary CI flow even though the repo exposes public APIs and authenticated
  admin routes. Evidence: `.github/workflows/ci.yml`,
  `app/api/admin/data/route.ts`, `app/api/admin/reindex/route.ts`.

### Privacy

- `Medium`: documented 90-day deletion for resolved feedback is not evidenced
  in schema or implementation. Evidence:
  `docs/audits/2026-01-03-privacy-impact-assessment.md`,
  `messages/en.json`,
  `supabase/migrations/20260101000000_baseline.sql`,
  `app/api/v1/feedback/route.ts`,
  `app/api/v1/feedback/[id]/route.ts`.
- `Medium-Low`: free-text feedback still accepts unredacted PHI spill despite
  the privacy assessment already identifying that risk. Evidence:
  `docs/audits/2026-01-03-privacy-impact-assessment.md`,
  `types/feedback.ts`,
  `app/api/v1/feedback/route.ts`,
  `lib/feedback/server.ts`.

### Documentation Quality And Drift

- `High`: active incident, observability, and QA docs still prescribe a
  Vercel/serverless production model even though the current production truth is
  direct VPS deployment. Evidence: `docs/deployment/direct-vps-proof.md`,
  `docs/deployment/production-checklist.md`,
  `docs/operations/incident-response-plan.md`,
  `docs/observability/alerting-setup.md`,
  `docs/operations/phase-1-qa-execution-guide.md`.

### Test Quality And Drift

- `Medium`: coverage reporting overstates what merge protection actually
  guarantees. The repo advertises stronger coverage and feature-level test
  maturity than the enforced threshold or browser E2E gate require. Evidence:
  `README.md`, `vitest.config.mts`, `.github/workflows/ci.yml`,
  `docs/planning/roadmap.md`.

## Follow-Up Tracks

- Sweep active incident, observability, QA, and production docs for remaining
  Vercel/serverless assumptions and converge them on one canonical VPS
  production path.
- Trace feedback data end-to-end: intake, visibility, retention trigger,
  deletion evidence, backup/log inclusion, and PHI spill handling.
- Define when dependency findings become blocking and how approved exceptions
  are recorded.
- Audit admin routes as a single privileged surface: authz, audit logging,
  background execution, and blast radius.
- Revisit excluded or low-threshold test surfaces against actual runtime risk
  rather than test convenience.
