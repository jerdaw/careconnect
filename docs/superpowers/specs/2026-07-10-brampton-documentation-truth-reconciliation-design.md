---
status: approved
last_updated: 2026-07-10
owner: jer
tags: [design, documentation, brampton, governance, launch-closeout]
---

# Brampton Documentation Truth Reconciliation Design

## Purpose

Reconcile the active Brampton planning guidance with the completed launch evidence so contributors are not directed to repeat production migration, deployment, accessibility QA, broad-coverage correction, or the approved eight-record production sync.

## Authoritative Evidence

The implementation must use these current-state sources as authoritative:

1. `docs/launch/brampton-readiness-report.md` records the completed broad-coverage correction, eight-record/L2 production sync, deployment, public smokes, accessibility suite, visual QA, and final readiness decision.
2. `docs/launch/brampton-production-approval-packet.md` records the approved and applied production actions and the remaining approval gates.
3. `docs/planning/roadmap.md` records Brampton production closeout as complete while preserving future verification and relationship-wording gates.

Historical reports and approval evidence remain unchanged. This batch corrects only active guidance that contradicts those sources.

## Scope

Modify exactly these active documents:

- `docs/planning/README.md`
- `docs/launch/brampton-l2-l3-verification-workplan.md`

The planning index will describe the constrained Brampton launch as production-complete and direct future work toward bounded verification. The verification workplan will describe the eight live records accurately, distinguish promoted records from deferred candidates, and mark the approved production sync complete.

## Content Decisions

### Planning index

- Update the document date to `2026-07-10`.
- Preserve Gate 0 as `NO-GO` pending C1/D4 evidence.
- Replace the stale statement that Brampton production, accessibility, and approval gates remain open with the completed production posture.
- Replace the stale current-status bullets for pending migration/deploy approval and accessibility/visual-QA follow-up with one completed Brampton launch-closeout bullet that preserves future verification gates.
- Replace the stale “Close Brampton Launch Gates” path with a “Continue Bounded Brampton Verification” path.
- Direct future work toward Knights Table L2 evidence, one-at-a-time BMCC/CCS/PCHS L1 review, and explicit approval for future promotion or official/partner wording.

### Verification workplan

- Update the status to state that the approved eight-record production sync is complete, with six L2 records and Knights Table plus Ste. Louise at L1.
- Rename “Promoted Seven-Record Follow-Up” to “Promoted Eight-Record Follow-Up.”
- Keep Ste. Louise in the promoted-record table and remove its duplicate row from “Deferred L1 Candidates.”
- Preserve BMCC, CCS, and PCHS as the only deferred candidates.
- State that the broad Ontario/Canada correction is applied and verified rather than pending.
- Rewrite the review sequence around remaining verification work without implying that completed production work must be repeated.
- Mark the production-sync definition-of-done item complete.

## Guardrails

- Do not modify `data/services.json`, `data/embeddings.json`, draft candidate records, verification levels, or provenance.
- Do not change application code, database schema, migrations, deployment state, private operations material, or secrets.
- Do not imply municipal, regional, 211, or provider endorsement or partnership.
- Do not mark Knights Table, Ste. Louise, BMCC, CCS, PCHS, C1, or D4 verification work complete without new governed evidence and the required approval.
- Preserve dates and narrative in historical evidence documents.

## Validation

Run the following from the isolated worktree:

```bash
npm run format:check
npm run check:refs
npm test -- --run tests/unit/documentation-hygiene.test.ts
git diff --check
```

Inspect the final diff to confirm that it contains only the committed worktree hygiene rule, this design and implementation-plan documentation, and the two approved active-document corrections. If an isolated MkDocs environment is available, also run `mkdocs build --strict`; otherwise record that environment limitation without treating it as a pass.

## Acceptance Criteria

1. Active planning guidance no longer describes completed Brampton launch gates as open.
2. The verification workplan consistently describes eight promoted live records: six L2 records, Knights Table at L1, and Ste. Louise at L1.
3. Ste. Louise appears only in the promoted-record follow-up and not in the deferred-candidate table.
4. Broad canonical reuse and the approved production sync are recorded as completed.
5. Genuine future verification and approval gates remain explicit.
6. All required validation commands pass, or any unavailable optional MkDocs check is reported accurately.

## Non-Goals

- Additional Brampton service promotion or verification.
- Changes to public positioning copy outside the two scoped active documents.
- Gate 0 evidence closure.
- Production, release, deployment, or rollback actions.
- Broader documentation restructuring or historical cleanup.
