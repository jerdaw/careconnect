# Brampton Broad Coverage Correction Approval Packet

Date: 2026-07-08
Status: approved, applied, and post-correction smokes passed

## Decision Needed

Completed on 2026-07-08 after owner approval.

Required approval text before any production write:

```text
I approve applying the broad Ontario/Canada coverage correction to production Supabase. The write must update only scope, primary_place_id, and coverage for the reviewed broad-record ID set, run post-correction smoke checks, and prepare rollback SQL for approval before executing any rollback.
```

## Problem

The approved Brampton seven-record production sync completed successfully, and Brampton selected-place searches return the approved first-launch set. A separate broad-service smoke found that existing production broad Ontario/Canada records still carry coverage backfilled as local `kingston-on`.

This prevents Brampton selected-place searches from reusing intended canonical broad records such as 211 Ontario, Kids Help Phone, and other province-wide or Canada-wide supports.

## Scope

The prepared correction updates only existing broad records that already exist in `data/services.json` as Ontario-wide or Canada-wide records and whose production `scope`, `primary_place_id`, or `coverage` does not match that broad shape.

The correction does not:

- add new service rows,
- delete service rows,
- change Brampton launch rows,
- change Kingston-local rows,
- change schema,
- change names, descriptions, phone numbers, addresses, URLs, categories, verification levels, provenance, or embeddings,
- deploy application code.

## Dry Run Evidence

Read-only production snapshot:

```text
/tmp/careconnect-production-services-coverage-snapshot.rows.json
```

Generated SQL artifacts:

```text
/tmp/careconnect-broad-coverage-correction.sql
/tmp/careconnect-broad-coverage-rollback.sql
/tmp/careconnect-broad-coverage-correction-manifest.json
```

Dry-run summary:

| Metric               | Count |
| -------------------- | ----: |
| Production rows read |   203 |
| Corrections prepared |    72 |
| Provincial records   |    49 |
| National records     |    23 |

Guardrail check:

| Check                                              | Result |
| -------------------------------------------------- | ------ |
| Apply SQL contains `begin;` and `commit;`          | pass   |
| Rollback SQL contains `begin;` and `commit;`       | pass   |
| Apply SQL targets `public.services`                | pass   |
| Rollback SQL targets `public.services`             | pass   |
| Apply SQL updates only approved coverage fields    | pass   |
| Rollback SQL updates only approved coverage fields | pass   |
| Apply SQL has exact 72-row assertion               | pass   |
| Rollback SQL has exact 72-row assertion            | pass   |
| Generated SQL references no `brampton-` IDs        | pass   |

Artifact identity:

| Artifact     | SHA-256                                                            |
| ------------ | ------------------------------------------------------------------ |
| Apply SQL    | `c6bbeebbdb1695b55b009e5a99b6b412322f9c0e5c987bf6f87cc19bfe8211ee` |
| Rollback SQL | `5ff03a4fc2de73b7566a542698ead7cfdece01f96d755c8b8902dab292878665` |

Manifest path:

```text
/tmp/careconnect-broad-coverage-correction-manifest.json
```

The manifest records `writesEnabled: false`, the 72-ID reviewed set, SQL byte counts, SQL SHA-256 hashes, and guardrail facts for the generated apply and rollback SQL.

Manifest verifier:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run sync:broad-coverage:verify -- \
  --manifest /tmp/careconnect-broad-coverage-correction-manifest.json
```

Latest verifier result on 2026-07-08: pass, `ok: true`, 72 IDs checked, manifest ID count matched the correction summary, apply and rollback SQL reviewed-ID sets matched the manifest, apply and rollback byte counts matched, apply and rollback SQL SHA-256 values matched, apply and rollback guardrails matched, and `writesEnabled` was confirmed false.

Do not apply production SQL unless the manifest verifier returns `ok: true` immediately before execution.

The update assignment in both SQL files is limited to:

```sql
scope = updates.scope,
primary_place_id = updates.primary_place_id,
coverage = updates.coverage
```

## Reviewed ID Set

- `aboriginal-legal-services-als-`
- `advocacy-centre-for-the-elderly-ace-`
- `arch-disability-law`
- `arthritis-society-canada`
- `assaulted-womens-helpline`
- `bounceback-ontario`
- `cancer-information-helpline`
- `cleo-community-legal-education`
- `consumer-protection-ontario`
- `crisis-211-ontario`
- `crisis-988`
- `crisis-assaulted-womens-helpline`
- `crisis-connex-ontario`
- `crisis-eating-disorders`
- `crisis-good2talk`
- `crisis-hope-for-wellness`
- `crisis-kids-help-phone`
- `crisis-ontario-gambling`
- `crisis-pflag-canada`
- `crisis-poison-control`
- `crisis-talk-suicide-canada`
- `crisis-talk4healing`
- `crisis-telehealth-ontario`
- `crisis-text-line`
- `crisis-trans-lifeline`
- `diabetes-canada-information-support`
- `employment-standards-information-centre`
- `heart-and-stroke-foundation`
- `hiv-aids-legal-clinic-ontario-halco-`
- `hope-for-wellness-helpline`
- `hospice-palliative-care-ontario-hpco-`
- `human-rights-legal-support-centre-hrlsc-`
- `injured-workers-community-legal-clinic-iwc-`
- `jordan-s-principle-call-centre`
- `justice-for-children-and-youth-jfcy-`
- `justice-for-children-youth`
- `kids-help-phone`
- `landlord-and-tenant-board-contact-centre`
- `landlord-s-self-help-centre`
- `law-society-referral-service`
- `legal-aid-ontario`
- `lung-health-line`
- `ms-knowledge-network-ms-canada-`
- `nishnawbe-aski-legal-services-nalsc-`
- `office-of-the-worker-adviser-owa-`
- `ontario-211-ontario`
- `ontario-black-youth-helpline`
- `ontario-boots-on-the-ground`
- `ontario-caregiver-helpline`
- `ontario-farmer-wellness`
- `ontario-femaide`
- `ontario-irs-crisis-line`
- `ontario-legal-information-centre`
- `ontario-lgbt-youthline`
- `ontario-male-survivors`
- `ontario-metis-crisis-line`
- `ontario-mmiwg-crisis-line`
- `ontario-naseeha`
- `ontario-nors`
- `ontario-ontx-distress`
- `ontario-sadv-navigation`
- `ontario-seniors-safety-line`
- `ontario-vac-assistance`
- `ontario-victim-support-line`
- `parkinson-canada`
- `pro-bono-ontario`
- `sexual-health-infoline-ontario-shilo-`
- `steps-to-justice`
- `talk-tobacco`
- `trans-lifeline-canada`
- `workers-health-safety-legal-clinic`
- `wsib-workplace-safety-insurance-board-`

## Post-Approval Execution Plan

After exact approval, the read-only target check was rerun, the generated SQL file was visually checked, and the manifest verifier returned `ok: true`. The verifier confirmed the reviewed ID count, apply and rollback SQL reviewed-ID sets, byte counts, SHA-256 values, and guardrails all matched the manifest.

The first execution attempt used `/tmp/careconnect-broad-coverage-correction.sql` and made no changes because production `services.scope` is a `service_scope` enum while the reviewed SQL used text values. A derived enum-cast SQL pair was generated from the reviewed artifacts:

| Artifact              | Path                                                                | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Applied enum-cast SQL | `/tmp/careconnect-broad-coverage-correction-service-scope-cast.sql` | `923904812439cdfadaa691bb6dacadcf888a799aab34b976d38837a1275fcb47` |
| Enum-cast rollback    | `/tmp/careconnect-broad-coverage-rollback-service-scope-cast.sql`   | `6ecce3ca94f0363fb95bc589ec21add5ad76cd96154a5935a6368f77224a20d5` |

The derived SQL differed only by casting `updates.scope` to `service_scope` in the assignment and casting `services.scope::text` in the assertion comparison. A guardrail comparison confirmed the same 72 reviewed IDs, no `brampton-` IDs, only `scope`, `primary_place_id`, and `coverage` assignments, and exact 72-row assertions in both apply and rollback SQL.

The transaction must abort if it cannot prove exactly 72 reviewed rows match the intended post-update values.

Execution result: pass. The cast-corrected apply SQL returned `updated_rows: 72`.

Post-correction DB check:

| Metric                  | Count |
| ----------------------- | ----: |
| Production rows         |   203 |
| Rows with coverage      |   203 |
| Brampton-primary rows   |     7 |
| Reviewed IDs            |    72 |
| Reviewed IDs found      |    72 |
| Matching target         |    72 |
| Mismatching target      |     0 |
| Reviewed provincial     |    49 |
| Reviewed national       |    23 |
| Reviewed with embedding |    72 |
| Brampton IDs corrected  |     0 |

## Post-Correction Smoke Checks

After an approved apply:

1. Pass: `https://careconnect.ing/api/v1/health` returned healthy and still reported `version: "d7cc6e4"`.
2. Pass: Kingston selected-place food search still returned Kingston results.
3. Pass: Brampton selected-place food and shelter searches returned the approved Brampton first-launch set.
4. Pass: Brampton selected-place food, crisis, and 211 searches included applicable broad Ontario/Canada canonical records such as `ontario-211-ontario`, `ontario-victim-support-line`, and `ontario-naseeha`.
5. Pass: Brampton selected-place searches excluded known Kingston-only local records checked during the smoke.
6. Pass: invalid `filters.placeId` still returned `400 Invalid request`.
7. Pass: read-only production query confirmed the 72 reviewed IDs now have broad coverage.

## Rollback Boundary

Rollback SQL is prepared at:

```text
/tmp/careconnect-broad-coverage-rollback.sql
/tmp/careconnect-broad-coverage-rollback-service-scope-cast.sql
```

Post-correction smoke checks passed, so rollback is not indicated. Do not execute rollback without explicit approval.
