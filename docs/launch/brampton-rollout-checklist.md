# Brampton Rollout Checklist

## Pre-Merge

- [x] Foundation branch reviewed.
- [x] Technical verification passed.
- [x] Browser and accessibility QA completed, remediated, and documented.
- [x] Public positioning reviewed.
- [x] Brampton draft candidates prepared.
- [x] Duplicate/canonical review prepared.
- [x] No Brampton records added to live data without approval.
- [x] No production migration applied without approval.

## Human Approval Gates

- [x] Approve first Brampton L1 records for `data/services.json`.
- [x] Approve and merge foundation branch to `main` through PR #33.
- [x] Approve About-page land/source-context wording.
- [x] Approve any partner or official relationship wording disposition: no new official, partner, endorsement, sponsorship, municipal/government affiliation, or Indigenous approval/consultation wording is being added for this launch. Current source-reference and provider-confirmed wording remains the approved public posture; future formal relationship claims remain approval-gated.
- [x] Approve production migration.
- [x] Approve deployment.
- [x] Approve syncing the original seven approved Brampton L1 rows into production Supabase.
- [x] Approve adding Ste. Louise as an eighth Brampton live record and applying vetted L2 upgrades where source evidence supports them.
- [x] Approve broad Ontario/Canada production coverage correction.
- [x] Resolve the Knights Table address mismatch for L1 using the official provider contact page; recheck the 211 Ontario pantry listing before L2.

## Data Launch After Approval

- [x] Add approved Brampton records to `data/services.json`.
- [x] Run `npm run validate-data`.
- [x] Run `npm run db:validate`.
- [x] Run `npm run build` to regenerate embeddings.
- [x] Run `npm run check:embeddings`.
- [x] Run search QA for Kingston and Brampton.
- [x] Commit data and embeddings together.
- [x] Confirm each promoted Brampton record came from `data/drafts/brampton-on/services/` or an explicitly reviewed successor draft.

## Local QA Reruns

- [x] Browser a11y rerun completed on 2026-07-07 using extracted user-space Chromium libraries:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npm run test:a11y -- --project=chromium
```

- [x] DB smoke rerun completed on 2026-07-07 using extracted PostgreSQL client binaries:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
PATH=/tmp/careconnect-local-deps/usr/lib/postgresql/16/bin:/tmp/careconnect-local-deps/usr/bin:$PATH \
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-} \
  npm run test:db:smoke
```

- [x] Triage serious axe findings logged by the passing Chromium a11y run: remediated with `tests/e2e/accessibility-regression.spec.ts` passing 5 Chromium routes.
- [x] Triage the `useSemanticSearch` worker `Failed to fetch` console error logged by the passing Chromium a11y run: optional init failure is caught and logged as a warning without unhandled rejection.
- [x] Complete screenshot review for desktop, tablet, and mobile viewports through `tests/e2e/brampton-visual-qa.spec.ts`.

## Production Database Preflight

- [x] Confirm target environment path through approved private/shared operations source of truth.
- [x] Run restricted production control-plane readiness, preflight summary, status summary, and CareConnect service-health checks without collecting secrets or raw sensitive output.
- [x] Run read-only live schema inspection for `services`, public service views, indexes, and RLS policies.
- [x] Restore authenticated Supabase CLI access and link the repo to the target project.
- [x] Confirm existing live columns match migration assumptions: `primary_place_id` and `coverage` are absent before migration.
- [x] Confirm pending migration normalizes existing broad `services_public` grants before granting SELECT.
- [x] Post-merge read-only Supabase preflight rerun confirmed `20260706120000` remains local-only and production still lacks `primary_place_id` and `coverage`.
- [x] Confirm backup or rollback posture using `docs/launch/brampton-production-approval-packet.md` and the approved private/shared operations source of truth. Current finding: Supabase Support reported triggering a latest-backup restore on 2026-07-08, and post-restore health, schema, service-count, seven-row Brampton, and Kingston/Brampton search smokes passed.
- [x] Apply migration only after explicit human approval.
- [x] Run post-migration DB read-only checks for `primary_place_id`, `coverage`, and public views.
- [x] Run post-deploy search API checks after deployment approval.
- [x] Confirm production currently has 0 of the 7 approved Brampton rows before data sync.

## Production Rollout After Approval

- [x] Inspect private/shared operations source of truth for environment and release instructions.
- [x] Perform authenticated read-only production schema preflight.
- [x] Apply migration.
- [x] Deploy application.
- [x] Smoke test Kingston search.
- [x] Smoke test Brampton selected-place behavior before data sync: valid empty result set, confirming rows are not live yet.
- [x] Sync the original seven approved Brampton L1 rows into production Supabase after explicit approval.
- [x] Sync the approved eight-record Brampton follow-up into production Supabase after the bounded helper and rollback SQL were ready.
- [x] Smoke test Brampton selected-place behavior after data sync.
- [x] Prepare broad Ontario/Canada coverage correction dry-run and rollback SQL from a read-only production snapshot; see `docs/launch/brampton-broad-coverage-correction-approval.md`.
- [x] Verify the prepared broad Ontario/Canada correction manifest and SQL artifacts with `npm run sync:broad-coverage:verify`; latest result on 2026-07-08 was `ok: true`.
- [x] Reconfirm read-only production state after verifier prep: health healthy at `d7cc6e4`, seven Brampton rows live with coverage and embeddings, and sampled broad records showed the correction was still needed before approval.
- [x] Apply broad Ontario/Canada coverage correction after explicit approval.
- [x] Smoke test broad Ontario/Canada services after correction.
- [x] Confirm no user search logging was introduced.

## Rollback Posture

- Application rollback is not indicated after the successful deployment and smoke checks. If a future incident requires it, revert only after explicit approval through the documented app rollback path.
- If approved Brampton data records cause a future issue, remove or correct them only through an approved follow-up data commit or an explicitly approved production correction.
- [x] Prepare exact seven-ID data rollback for approval after the broad-service post-sync smoke miss; see `docs/launch/brampton-seven-id-data-rollback-prep.md`. Do not execute without explicit approval.
- [x] Prepare exact eight-record follow-up rollback SQL before applying the Ste. Louise/L2 production sync. Do not execute rollback without explicit approval.
- [x] Prepare broad-record correction rollback SQL. Do not execute without explicit approval after a failed approved correction smoke.
- Production schema rollback is not indicated and must not run without explicit database rollback approval.

## Post-Launch

- [x] Monitor public-safe feedback and post-launch health channels through the private/shared operations workflow. No private feedback contents, raw headers, raw bodies, webhook URLs, recipient details, or secret values were copied into public docs.
- [x] Record provider-assisted CareConnect restore evidence through the private/shared operations workflow. Current public-safe status: latest-backup restore evidence received from Supabase Support on 2026-07-08, with post-restore checks passed.
- [x] Record bounded CareConnect app redeploy proof through the private/shared operations workflow.
- [x] Set up private/shared operations restore-proof readiness checks for recurring hardening.
- [x] Record public health and route-sweep monitoring evidence through the private/shared operations workflow.
- [ ] Repeat the CareConnect synthetic alert delivery and explicit acknowledgement drill after route diagnosis. The 2026-07-08 closeout attempt was accepted by Alertmanager, but delivery and acknowledgement were not confirmed; no retry was run.
- [x] Record the 2026-07-08 L2/L3 and deferred-candidate decisions in `data/drafts/brampton-on/reviews/2026-07-08-l2-verification-review.md`.
- [ ] Expand Brampton only through the same L1 review workflow.
