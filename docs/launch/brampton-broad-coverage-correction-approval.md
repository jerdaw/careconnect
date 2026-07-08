# Brampton Broad Coverage Correction Approval Packet

Date: 2026-07-08
Status: dry-run prepared; production write not executed

## Decision Needed

Approve or reject applying the prepared production correction for existing broad Ontario/Canada records that were backfilled as Kingston-local coverage during the Brampton coverage migration.

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

After exact approval, rerun a read-only target check, visually confirm the generated SQL file, then execute the prepared apply SQL through the authenticated Supabase CLI path.

The transaction must abort if it cannot prove exactly 72 reviewed rows match the intended post-update values.

## Post-Correction Smoke Checks

After an approved apply:

1. Confirm `https://careconnect.ing/api/v1/health` is healthy and still reports `version: "d7cc6e4"`.
2. Confirm Kingston selected-place food search still returns Kingston results.
3. Confirm Brampton selected-place food and shelter searches still return the approved Brampton first-launch set.
4. Confirm a Brampton selected-place search includes applicable broad Ontario/Canada canonical records.
5. Confirm Brampton selected-place search still excludes Kingston-only local records.
6. Confirm invalid `filters.placeId` still returns `400 Invalid request`.
7. Run a read-only production query confirming the 72 reviewed IDs now have broad coverage.

## Rollback Boundary

Rollback SQL is prepared at:

```text
/tmp/careconnect-broad-coverage-rollback.sql
```

If post-correction smoke checks fail, prepare the rollback SQL for approval before executing it. Do not execute rollback automatically.
