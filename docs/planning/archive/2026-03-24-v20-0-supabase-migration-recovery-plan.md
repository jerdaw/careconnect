---
status: draft
last_updated: 2026-03-24
owner: jer
tags: [roadmap, v20.0, supabase, database, migrations, maintenance]
---

# v20.0: Supabase Migration Recovery Plan

Restore a reliable migration-only bootstrap for CareConnect without risking curated service data, privacy guarantees, or DB-backed retrieval behavior.

## Summary

The repository now has a working real-DB integration test lane, but that lane succeeds by applying a deterministic test bootstrap rather than replaying the historical migration chain in `supabase/migrations/`.

This plan treats migration recovery as a bounded maintenance project:

1. freeze the current known-good runtime schema surface,
2. replace the broken migration archaeology with a reproducible baseline,
3. prove fresh local resets work from migrations only, and
4. keep the DB integration lane green throughout.

## User Review Required

> [!IMPORTANT]
> This work will change the repository's effective migration history. Before implementation, we should treat it as schema-governance work with backups, a remote diff review, and an explicit rollout/repair procedure for any already-applied hosted migrations.
>
> [!WARNING]
> The goal is schema reproducibility, not rewriting or touching curated service content. Test fixtures must remain synthetic, and any remote migration-history repair must avoid mutating production service rows.

## Problem Statement

The current migration chain is not dependable for a fresh rebuild.

Repo-specific evidence already on hand:

1. Core objects used by the app are referenced in migrations, but base `CREATE TABLE` statements for `services`, `organizations`, and `analytics_events` are not present in `supabase/migrations/`.
2. `organization_members` is created in both `002_v6_prerequisites.sql` and `003_org_members.sql`, which is a sign of baseline drift rather than a clean forward-only chain.
3. Later migrations repeatedly alter `services`, `services_public`, and RLS policies, but there is no trustworthy migration-only bootstrap to prove the chain from zero.
4. ADR-021 intentionally parked this problem so the DB integration lane could ship first.

## Goal

Make `supabase db reset` and equivalent fresh local bootstrap flows succeed from repository-managed migrations only, while preserving the runtime contracts already proven by `npm run test:db`.

## Non-Goals

1. Do not change curated service content in `data/services.json`.
2. Do not redesign the public retrieval contract, RLS model, or pilot feature scope as part of this maintenance work.
3. Do not preserve every historical migration file purely for archival sentiment if doing so harms reproducibility.
4. Do not block current DB-backed test coverage while the migration chain is being repaired.

## Chosen Recovery Strategy

Use a **new clean baseline migration** plus a small set of audited forward migrations.

Why this is the right default for CareConnect:

1. The project is governance-sensitive; reliable rebuildability matters more than preserving a messy historical chain.
2. The current chain shows baseline drift and duplicated/overlapping policy work.
3. We already have a working runtime target through the DB integration lane and the live application surface.
4. A clean baseline is easier to audit, explain, and verify than a long chain of partial remediations.

## Success Criteria

This plan is complete only when all of the following are true:

1. A fresh local Supabase project can boot from repository migrations only, without `supabase/test-support/bootstrap.sql`.
2. The rebuilt database exposes the runtime objects the app depends on, including:
   - `services`
   - `services_public`
   - `organizations`
   - `organization_members`
   - `analytics_events`
   - `feedback`
   - `service_update_requests`
   - `app_admins`
   - pilot tables introduced in March 2026
3. `npm run test:db` passes against a migration-built database.
4. `npm run db:verify` and targeted retrieval-path checks remain green.
5. `types/supabase.ts` is regenerated from the repaired schema (Deferred: requires local Docker)
6. `README.md`, `docs/index.md`, and other setup docs no longer direct contributors to bootstrap from `supabase/schema.sql`.
7. The remote migration rollout/repair procedure is documented and reviewed before any hosted apply.

## Source Inputs

Use these inputs as the authoritative starting point during implementation:

1. `supabase/migrations/*.sql`
2. `supabase/test-support/bootstrap.sql`
3. `scripts/run-db-tests.sh`
4. `tests/db/**`
5. `docs/implementation/v22-0-db-migration-readiness-audit.md`
6. `docs/adr/021-dedicated-supabase-db-integration-tests.md`
7. Runtime DB usage in `lib/**`, `app/api/**`, and auth/RLS-sensitive scripts
8. `README.md` and `docs/index.md` setup instructions that still reference `supabase/schema.sql`
9. `types/supabase.ts` and the scripts that import it

## One-Shot Execution Mode

This plan is intended to be executable in one autonomous implementation pass, but only if work is broken into bounded batches with verification after each batch.

Execution rule:

1. do not make all migration/doc/test changes first and validate only at the end,
2. make one bounded batch of changes,
3. run the required checkpoint commands for that batch,
4. only continue if the checkpoint passes or the failure is understood and fixed immediately.

## Checkpoint Cadence

Use this cadence during implementation:

### Checkpoint A: After Inventory Outputs Land

Purpose:

Confirm the audit/manifests are coherent before rewriting migrations.

Run:

- `npm run type-check`
- `npm test -- tests/unit/documentation-hygiene.test.ts`

Continue only if:

1. the manifest clearly distinguishes runtime objects from legacy/test-only objects,
2. no doc-link or roadmap hygiene regression was introduced.

### Checkpoint B: After Baseline Migration Is Introduced

Purpose:

Prove the new baseline is syntactically valid and non-destructive before pruning old chain pieces.

Run:

- `npm run lint`
- `npm run type-check`
- migration-only local reset command

Continue only if:

1. the new baseline applies on a fresh disposable local project,
2. no accidental data-mutation statements were introduced,
3. the expected core objects exist after reset.

### Checkpoint C: After Forward-Migration Cleanup

Purpose:

Confirm the repaired active chain still yields the intended runtime schema.

Run:

- `npm run lint`
- `npm run type-check`
- migration-only local reset command
- `npm run test:db:smoke`

Continue only if:

1. the full active chain replays cleanly,
2. smoke DB retrieval succeeds against the migration-built database,
3. no recursion or policy-visibility regression appears in the smoke lane.

### Checkpoint D: After Test Runner / CI Wiring Changes

Purpose:

Ensure the migration-built path and the DB lane agree before touching final docs/ADR cleanup.

Run:

- `npm run lint`
- `npm run type-check`
- `npm run test:db`
- `npm run db:verify`

Continue only if:

1. the full DB integration lane is green,
2. integrity verification still passes,
3. the runner no longer depends on schema bootstrap when validating migration-built resets.

### Checkpoint E: Final Close-Out

Purpose:

Confirm the repo is in the intended steady state after doc, ADR, and setup guidance cleanup.

Run:

- `npm run lint`
- `npm run type-check`
- `npm test -- tests/unit/documentation-hygiene.test.ts`
- migration-only local reset command
- `npm run test:db`
- `npm run db:verify`

Close the work only if:

1. all acceptance criteria in this plan are satisfied,
2. setup docs no longer point contributors at stale `schema.sql` bootstrap guidance unless it has been deliberately regenerated as canonical,
3. the roadmap can truthfully remove migration-chain repair from active maintenance.

## Implementation Approach

### Phase 1: Freeze The Target Schema Surface

Goal: define what "correct" means before rewriting anything.

Checklist:

- [x] Build a schema object manifest from the current runtime surface:
  - tables
  - views
  - functions/RPCs
  - indexes
  - grants
  - RLS policies
- [x] Include a column-level manifest for high-risk objects used directly by runtime code:
  - `services`
  - `services_public`
  - `organization_members`
  - pilot tables
- [x] Classify each object as:
  - required for runtime
  - test-only
  - obsolete/legacy
  - unknown and needs confirmation
- [x] Diff the manifest against:
  - `supabase/test-support/bootstrap.sql`
  - the live migration folder
  - application usage in `lib/**` and `app/api/**`
- [x] Record any gaps where the app expects an object that the current migration chain does not create.

Deliverables:

1. A checked-in migration recovery audit document or manifest table.
2. A file-level classification of which existing migrations are still meaningful.

Phase exit gate:

- Complete Checkpoint A before starting baseline-rewrite work.

### Phase 2: Design The Replacement Baseline

Goal: define the minimum reproducible schema foundation.

Checklist:

- [x] Create a single baseline migration that establishes the durable schema foundation:
  - required extensions
  - core tables
  - views
  - essential functions
  - grants
  - initial RLS enablement
- [x] Keep baseline content declarative and idempotent where practical.
- [x] Move one-off data backfills and test fixtures out of the baseline.
- [x] Ensure the baseline includes core object creation missing from the current chain.
- [x] Decide explicitly what happens to `supabase/schema.sql`:
  - regenerate it from the repaired schema as a derived artifact, or
  - retire it from setup guidance if it cannot remain canonical
- [x] Keep pilot tables in either:
  - the baseline, if they are now part of the permanent runtime surface, or
  - a small audited forward migration, if keeping the pilot boundary separate is clearer.

Decision rule:

Prefer fewer, cleaner migrations over preserving noisy policy churn from January 2026.

Phase exit gate:

- Complete Checkpoint B before removing or retiring active migration files.

### Phase 3: Rebuild Forward Migrations Intentionally

Goal: keep only the forward changes that still matter after the new baseline.

Checklist:

- [x] Review each existing migration and mark it:
  - absorbed into baseline
  - retained as forward migration
  - replaced by a cleaner successor
  - retired from the active chain
- [x] Collapse overlapping RLS cleanup migrations where the final behavior is already known.
- [x] Preserve meaningful later changes that are easier to audit separately, especially:
  - v22 pilot tables/hardening
  - the 2026-03-11 recursion fix, if it is not folded into baseline
- [x] Remove duplicate object creation from the active chain.
- [x] Document a remote history strategy for already-applied projects:
  - what gets applied normally
  - what requires `supabase migration repair`
  - what must never be replayed destructively against hosted data
- [x] Keep historical SQL available in git history or a clearly non-active archive location, not as executable clutter inside the active migration path.

Phase exit gate:

- Complete Checkpoint C before changing CI assertions or removing any temporary harness behavior.

### Phase 4: Prove Fresh Bootstrap End To End

Goal: turn the repaired chain into an enforceable contract.

Checklist:

- [x] Add a migration-only verification command or script.
- [x] Update local setup docs to use migration-driven bootstrap as the default path.
- [-] Regenerate `types/supabase.ts` from the repaired schema (Deferred: requires local Docker)
- [x] Add CI coverage that proves:
  - fresh migration reset succeeds
  - DB integration tests still pass afterward
- [x] Fail the build if the migration-only bootstrap regresses.

Expected verification flow:

1. start disposable local Supabase,
2. reset/apply migrations only,
3. apply deterministic synthetic seed where needed,
4. run DB retrieval/policy tests.

Phase exit gate:

- Complete Checkpoint D before final documentation and ADR steady-state cleanup.

### Phase 5: Simplify The Temporary Workaround

Goal: keep the test harness only where it adds value.

Checklist:

- [x] Decide whether `supabase/test-support/bootstrap.sql` can be removed entirely or should remain as a test-only fast path.
- [x] If retained, narrow it to test fixtures rather than schema bootstrap.
- [x] Update ADR-021 and testing docs so they describe the post-repair steady state accurately.

Phase exit gate:

- Complete Checkpoint E before archiving this plan or marking migration recovery complete on the roadmap.

## Proposed File Changes During Implementation

Likely implementation targets:

### Migration System

- [x] `supabase/migrations/*.sql`
- [x] `supabase/config.toml`
- [x] `supabase/schema.sql` or its retirement path
- [x] optional new migration verification script under `scripts/`

### Test And CI Wiring

- [x] `scripts/run-db-tests.sh`
- [x] `.github/workflows/ci.yml`
- [x] `vitest.db.config.mts`

### Documentation

- [x] `README.md`
- [x] `docs/index.md`
- [x] `docs/README.md`
- [x] `AGENTS.md`
- [x] `docs/development/testing-guidelines.md`
- [x] `docs/adr/021-dedicated-supabase-db-integration-tests.md`
- [x] operations/runbook docs for hosted rollout and migration-history repair
- [x] `docs/planning/roadmap.md`

## Verification Plan

### Automated

- [x] `npm run lint`
- [x] `npm run type-check`
- [x] `npm run test -- tests/unit/documentation-hygiene.test.ts`
- [x] migration-only local reset command
- [x] `npm run test:db`
- [x] `npm run db:verify`
- [x] targeted check that no active setup docs still instruct `supabase/schema.sql` bootstrap unless it has been deliberately regenerated as canonical

### Manual / Review

- [x] Review the new baseline for accidental data mutation statements.
- [x] Review remote migration rollout notes before any hosted apply.
- [x] Confirm the repaired chain creates the same public retrieval boundary already exercised by DB tests.
- [-] Confirm `types/supabase.ts` matches the repaired schema closely enough (Deferred: requires local Docker)
- [x] Confirm no docs still describe the bootstrap workaround as the long-term source of truth.

## Batch Size Rule

To keep one-shot execution safe, use these maximum batch sizes:

1. inventory/docs only may be batched together,
2. baseline migration creation should be its own batch,
3. forward-migration cleanup should be split into:
   - schema foundation cleanup,
   - RLS/policy cleanup,
   - final retained forward migrations
4. CI wiring and doc cleanup should happen only after migration-built DB validation is already green.

If a batch breaks migration reset or DB smoke coverage, stop, fix that batch, and rerun the checkpoint before continuing.

## Risks And Controls

### Risk 1: Hidden Runtime Object Drift

Control:

Freeze the runtime object manifest first and verify app usage before collapsing migrations.

### Risk 2: Remote Migration History Divergence

Control:

Treat hosted rollout as a separate repair step with explicit evidence, backup posture, and CLI history reconciliation.

### Risk 3: Breaking The DB Test Lane While Repairing Migrations

Control:

Keep `npm run test:db` green throughout; do not remove the dedicated harness until migration-built resets are proven.

### Risk 4: Reintroducing Policy Recursion Or Over-Permissioning

Control:

Retain policy-specific DB tests and add migration-reset verification before rollout.

### Risk 5: Regenerated Types Or Setup Docs Stay Stale After Schema Repair

Control:

Make type regeneration and setup-doc cleanup explicit acceptance criteria, not optional cleanup.

## Exit Conditions

Archive this plan only after:

1. the migration-only bootstrap is green locally and in CI,
2. the roadmap no longer lists migration-chain repair as active maintenance,
3. canonical docs point to migration-driven bootstrap,
4. any temporary schema bootstrap workaround is either removed or explicitly demoted to a test-fixture role.
