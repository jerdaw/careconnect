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

- [ ] After Chromium dependencies are available, run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run test:a11y -- --project=chromium
```

- [ ] After `psql` is available, run:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run test:db:smoke
```

## Production Database Preflight

- [ ] Confirm target environment and project ID through approved private/shared operations source of truth.
- [ ] Run read-only live schema inspection for `services`, public service views, indexes, and RLS policies.
- [ ] Confirm existing live columns match migration assumptions.
- [ ] Confirm backup or rollback posture.
- [ ] Apply migration only after explicit human approval.
- [ ] Run post-migration read-only checks for `primary_place_id`, `coverage`, public views, and search API.

## Production Rollout After Approval

- [ ] Inspect private/shared operations source of truth for environment and release instructions.
- [ ] Perform read-only production schema preflight.
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
