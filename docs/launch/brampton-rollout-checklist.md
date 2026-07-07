# Brampton Rollout Checklist

## Pre-Merge

- [x] Foundation branch reviewed.
- [x] Technical verification passed.
- [x] Browser and accessibility QA attempted and documented.
- [x] Public positioning reviewed.
- [x] Brampton draft candidates prepared.
- [x] Duplicate/canonical review prepared.
- [x] No Brampton records added to live data without approval.
- [x] No production migration applied without approval.

## Human Approval Gates

- [x] Approve first Brampton L1 records for `data/services.json`.
- [ ] Approve any land acknowledgment changes.
- [ ] Approve any partner or official relationship wording.
- [ ] Approve production migration.
- [ ] Approve deploy/merge.
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

- [ ] Triage serious axe findings logged by the passing Chromium a11y run: `color-contrast` on `/en`, `/en?q=health`, `/en/dashboard`, `/en/submit-service`, and `/en/service/kids-help-phone`; `aria-hidden-focus` on `/en?q=health`.
- [ ] Complete manual screenshot review for desktop, tablet, and mobile viewports.

## Production Database Preflight

- [x] Confirm target environment path through approved private/shared operations source of truth.
- [x] Run restricted production control-plane readiness, preflight summary, status summary, and CareConnect service-health checks without collecting secrets or raw sensitive output.
- [ ] Run read-only live schema inspection for `services`, public service views, indexes, and RLS policies.
- [ ] Restore authenticated Supabase schema-inspection access, or add an approved restricted operations wrapper command for read-only schema inspection.
- [ ] Confirm existing live columns match migration assumptions.
- [ ] Confirm backup or rollback posture.
- [ ] Apply migration only after explicit human approval.
- [ ] Run post-migration read-only checks for `primary_place_id`, `coverage`, public views, and search API.

## Production Rollout After Approval

- [x] Inspect private/shared operations source of truth for environment and release instructions.
- [ ] Perform authenticated read-only production schema preflight.
- [ ] Apply migration.
- [ ] Deploy application.
- [ ] Smoke test Kingston search.
- [ ] Smoke test Brampton selected-place behavior.
- [ ] Smoke test broad Ontario/Canada services.
- [ ] Confirm no user search logging was introduced.

## Rollback

- [ ] Revert application deployment to prior release.
- [ ] If data records caused the issue, remove or correct the approved Brampton records in a follow-up data commit.
- [ ] Do not roll back production schema without explicit database rollback approval.

## Post-Launch

- [ ] Monitor feedback channels.
- [ ] Queue L2/L3 verification candidates.
- [ ] Expand Brampton only through the same L1 review workflow.
