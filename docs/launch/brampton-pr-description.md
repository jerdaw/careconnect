# PR Description: Brampton Production Data Closeout

## Summary

- Keeps Kingston live while Brampton is live with the approved seven-record L1 first launch set.
- Records the completed production migration, deployment, and seven-record Supabase data sync.
- Records the approved and applied broad Ontario/Canada coverage correction.
- Documents the exact seven-ID Brampton rollback path for approval only.
- Adds the final autonomous closeout plan for the remaining safe/reliable work.
- Leaves rollback execution, land acknowledgment wording, official relationship wording, and future L2/L3 promotions behind explicit approval gates.

## Data Governance

- No fabricated service data.
- Seven Brampton records were promoted to live search after project-owner approval.
- Deferred Brampton candidates remain draft-only.
- Existing broad Ontario/Canada production records have been corrected after approval so Brampton selected-place searches can reuse applicable canonical broad records.
- The applied broad correction updated only `scope`, `primary_place_id`, and `coverage` for the reviewed broad-record ID set.
- The applied broad correction did not add rows, delete rows, change service facts, change embeddings, change schema, deploy app code, or touch Brampton launch rows.

## Production State

- Production app health is healthy at `version: "d7cc6e4"`.
- Production migration is applied.
- Seven approved Brampton L1 records are live in production Supabase.
- Read-only production check confirms all seven approved Brampton rows have `primary_place_id = 'brampton-on'`, null legacy `scope`, explicit `coverage`, and embeddings.
- Broad correction is applied and verified for the 72 reviewed broad records.
- Provider-assisted CareConnect restore evidence remains tracked in the private/shared operations source of truth; public-safe status is latest-backup restore evidence received from Supabase Support on 2026-07-08, with post-restore checks passed.

## Verification

- `npm test -- tests/scripts/check-v22-gate0-exit.test.ts tests/scripts/check-v22-evidence-intake.test.ts --run`: passed, 2 files and 29 tests.
- `npm test -- --run`: passed, 218 files and 1732 tests, 24 skipped.
- Pre-push hook for `origin/codex/brampton-production-data-closeout`: passed full Vitest, 218 files and 1732 tests, 24 skipped.
- `npm run sync:broad-coverage:verify -- --manifest /tmp/careconnect-broad-coverage-correction-manifest.json`: passed with `ok: true`, 72 reviewed IDs, matching apply/rollback ID sets, byte counts, SHA-256 hashes, guardrails, and `writesEnabled: false`.
- `npm test -- tests/scripts/broad-coverage-production-correction.test.ts --run`: passed, 1 file and 19 tests.
- Public health check: passed, `status: "healthy"` and `version: "d7cc6e4"`.
- Read-only production seven-row aggregate: passed, 7 found, 7 Brampton-primary, 7 null legacy scope, 7 with coverage, 7 with embeddings.
- Post-correction production DB check: passed, 72 reviewed IDs match target broad coverage, 49 provincial and 23 national, 72 with embeddings, 0 Brampton IDs corrected.
- Post-correction public smoke: passed, Brampton food/crisis/211 searches include applicable broad records and checked Kingston-only records remain excluded.
- Public-positioning scan: Brampton-specific land acknowledgment wording remains in draft/review docs only.
- Deferred-candidate hygiene check: passed, deferred Brampton candidate IDs are not live and exactly seven Brampton-primary records are present in `data/services.json`.

## Rollout Notes

- Do not execute broad correction rollback without explicit approval.
- Do not execute the seven-ID Brampton rollback unless the owner explicitly approves removal of the seven live Brampton rows.
- Do not publish land acknowledgment or official/partner relationship wording without exact wording approval.
- Continue future Brampton expansion through the same L1 review workflow.

## Reviewer Checklist

- [x] Kingston behavior remains intact.
- [x] Brampton first-launch behavior is honest and bounded.
- [x] Approved Brampton rows are live in repo data and production data.
- [x] Broad correction SQL and rollback SQL are prepared and verifier-checked.
- [x] Public docs do not imply official partnerships.
- [x] Deferred draft service candidates are not live data.
- [x] Broad Ontario/Canada production coverage correction applied after approval.
- [ ] Land acknowledgment wording remains approval-gated.
- [ ] Official/partner relationship wording remains approval-gated.
