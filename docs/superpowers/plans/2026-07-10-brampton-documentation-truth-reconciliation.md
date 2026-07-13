# Brampton Documentation Truth Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the active Brampton planning index and L2/L3 verification workplan accurately reflect the completed eight-record production launch while preserving genuine future verification and approval gates.

**Architecture:** Treat the Brampton readiness report, production approval packet, and active roadmap as current-state evidence. Correct only the two contradictory active guidance documents, using explicit text assertions before and after each edit and leaving historical evidence, service data, runtime code, and production state unchanged.

**Tech Stack:** Markdown, MkDocs 1.x/Material, Node.js 22, Vitest, Prettier, repository reference checker

**Status:** Content reconciliation implemented; required repository validation
passed; optional strict MkDocs remains environment-blocked (2026-07-10).

## Global Constraints

- Modify only `docs/planning/README.md`, `docs/launch/brampton-l2-l3-verification-workplan.md`, and this plan while executing the content tasks.
- Do not modify service data, embeddings, drafts, verification levels, provenance, application code, database schema, migrations, private operations material, secrets, or production state.
- Preserve Gate 0 as `NO-GO` pending C1/D4 evidence.
- Preserve Knights Table and Ste. Louise at L1, and preserve BMCC, CCS, and PCHS as draft-only deferred candidates.
- Do not imply endorsement, partnership, consultation, or approval by a municipality, region, 211, or provider.
- Keep historical reports and approval evidence unchanged.
- Run all Git and Node commands from `/home/jer/repos/vps/careconnect/.worktrees/brampton-doc-truth-reconcile` with Node.js 22 on `PATH`.

---

### Task 1: Correct the active planning index

**Files:**

- Modify: `docs/planning/README.md:3`
- Modify: `docs/planning/README.md:18-34`
- Modify: `docs/planning/README.md:181-235`
- Modify: `docs/superpowers/plans/2026-07-10-brampton-documentation-truth-reconciliation.md`
- Test: `tests/unit/documentation-hygiene.test.ts`

**Interfaces:**

- Consumes: completed launch facts from `docs/launch/brampton-readiness-report.md`, `docs/launch/brampton-production-approval-packet.md`, and `docs/planning/roadmap.md`
- Produces: one active planning entry point that distinguishes completed Brampton launch work from remaining verification and Gate 0 work

- [x] **Step 1: Demonstrate the stale planning guidance**

Run:

```bash
grep -F "production/a11y/approval gates still open" docs/planning/README.md
grep -F "### Option 1: Close Brampton Launch Gates" docs/planning/README.md
grep -F "Approve production migration/deploy only after preflight" docs/planning/README.md
```

Expected: all three commands print a match, proving the active index still directs contributors toward completed work.

- [x] **Step 2: Update the planning status and quick-start description**

Set the frontmatter date and active status to:

```markdown
last_updated: 2026-07-10
```

```markdown
**Status:** v22 Gate 0 decision work remains `NO-GO` pending C1/D4 closure. The approved eight-record Brampton first-launch set is live in production; future verification, expansion, and official/partner wording remain approval-gated.
```

Update the Brampton readiness report description to:

```markdown
- Current Brampton launch evidence, completed production/QA status, and remaining verification/approval gates
```

- [x] **Step 3: Replace stale active-track and dependency wording**

Replace the second active track with:

```markdown
2. **Brampton constrained multi-city launch closeout and bounded verification**
   - The approved eight-record first-launch set is live in production. Further records and L2/L3 changes continue only through the governed verification and approval workflow.
```

Rename `Current dependencies:` to `Current dependencies and completed prerequisites:` and replace the two stale Brampton bullets with:

```markdown
- Brampton first-launch production, accessibility, visual QA, and broad-coverage closeout already recorded
```

- [x] **Step 4: Replace the obsolete Brampton launch-gate procedure**

Replace Option 1 with:

```markdown
### Option 1: Continue Bounded Brampton Verification

Use the active roadmap and verification workplan for the remaining Brampton track:

1. Resolve Knights Table address and program-split evidence before any L2 decision
2. Recheck Ste. Louise registration and hours before any L2 decision
3. Review BMCC, CCS, and PCHS one at a time through the L1 template
4. Require explicit approval before any future promotion, L2/L3 change, or official/partner wording
```

- [x] **Step 5: Verify the planning index correction**

Run:

```bash
test "$(grep -Fc "Brampton constrained multi-city launch closeout and bounded verification" docs/planning/README.md)" -eq 1
test "$(grep -Fc "### Option 1: Continue Bounded Brampton Verification" docs/planning/README.md)" -eq 1
test "$(grep -Fc "production/a11y/approval gates still open" docs/planning/README.md)" -eq 0
test "$(grep -Fc "### Option 1: Close Brampton Launch Gates" docs/planning/README.md)" -eq 0
test "$(grep -Fc "Approve production migration/deploy only after preflight" docs/planning/README.md)" -eq 0
npm test -- --run tests/unit/documentation-hygiene.test.ts
```

Expected: every `test` command exits `0`; the documentation-hygiene test file passes.

- [x] **Step 6: Mark Task 1 complete and commit**

Change Task 1 checkboxes in this plan to `[x]`, then run:

```bash
git add docs/planning/README.md docs/superpowers/plans/2026-07-10-brampton-documentation-truth-reconciliation.md
git diff --cached --check
git commit -m "docs: close stale Brampton planning gates"
```

Expected: commit succeeds with only the planning index and plan-progress changes staged.

### Task 2: Reconcile the L2/L3 verification workplan

**Files:**

- Modify: `docs/launch/brampton-l2-l3-verification-workplan.md:4`
- Modify: `docs/launch/brampton-l2-l3-verification-workplan.md:24-74`
- Modify: `docs/superpowers/plans/2026-07-10-brampton-documentation-truth-reconciliation.md`

**Interfaces:**

- Consumes: eight-record production state and broad-coverage completion evidence from the authoritative sources
- Produces: one verification workplan with eight promoted live records, three deferred candidates, completed production prerequisites, and explicit remaining L1/L2/L3 gates

- [x] **Step 1: Demonstrate the stale workplan state**

Run:

```bash
grep -F "production sync pending bounded apply" docs/launch/brampton-l2-l3-verification-workplan.md
grep -F "## Promoted Seven-Record Follow-Up" docs/launch/brampton-l2-l3-verification-workplan.md
test "$(grep -Fc "Ste. Louise Outreach Centre of Peel" docs/launch/brampton-l2-l3-verification-workplan.md)" -eq 2
grep -F -- "- [ ] Production Supabase is synced" docs/launch/brampton-l2-l3-verification-workplan.md
```

Expected: the stale phrases match, Ste. Louise appears twice, and the production-sync checkbox is unchecked.

- [x] **Step 2: Correct promoted and deferred record state**

Replace the status and promoted heading with:

```markdown
Status: approved eight-record production sync complete; six records at L2; Knights Table and Ste. Louise remain at L1
```

```markdown
## Promoted Eight-Record Follow-Up
```

Remove the Ste. Louise row from `Deferred L1 Candidates`. Keep its existing L1-to-L2 evidence row in the promoted table. Leave BMCC, CCS, and PCHS unchanged as the three draft-only deferred candidates.

- [x] **Step 3: Record broad-coverage completion and the remaining review sequence**

Replace the broad-canonical status paragraph with:

```markdown
The approved broad Ontario/Canada coverage correction is applied and verified. Production Brampton selected-place results include applicable broad canonical services; see `docs/launch/brampton-broad-coverage-correction-approval.md` for the public-safe approval and verification record.
```

Replace the review sequence with:

```markdown
1. Preserve broad canonical reuse from the applied coverage correction; do not create Brampton-local duplicates.
2. Upgrade promoted launch records toward L2 only where source/contact evidence resolves key details.
3. Resolve Knights Table address and program split before any L2 claim.
4. Recheck Ste. Louise registration workflow and hours before any L2 claim.
5. Review deferred candidates one at a time through the L1 template in `docs/data/brampton-l1-review-template.md`; use `data/drafts/brampton-on/reviews/2026-07-08-deferred-candidate-research.md` for the current deferred-candidate research packet.
6. Promote no additional live records until human approval is recorded.
```

- [x] **Step 4: Close the production-sync definition-of-done item**

Replace the unchecked item with:

```markdown
- [x] Production Supabase is synced with the bounded approved eight-record Brampton set; post-sync checks passed on 2026-07-08.
```

- [x] **Step 5: Verify internal workplan consistency**

Run:

```bash
test "$(grep -Fc "## Promoted Eight-Record Follow-Up" docs/launch/brampton-l2-l3-verification-workplan.md)" -eq 1
test "$(grep -Fc "Ste. Louise Outreach Centre of Peel" docs/launch/brampton-l2-l3-verification-workplan.md)" -eq 1
test "$(grep -Fc "production sync pending bounded apply" docs/launch/brampton-l2-l3-verification-workplan.md)" -eq 0
test "$(grep -Fc "## Promoted Seven-Record Follow-Up" docs/launch/brampton-l2-l3-verification-workplan.md)" -eq 0
test "$(grep -Fc -- "- [ ] Production Supabase is synced" docs/launch/brampton-l2-l3-verification-workplan.md)" -eq 0
test "$(grep -Fc -- "- [x] Production Supabase is synced with the bounded approved eight-record Brampton set" docs/launch/brampton-l2-l3-verification-workplan.md)" -eq 1
```

Expected: every command exits `0`, proving the record count, status, and completion marker are internally consistent.

- [x] **Step 6: Mark Task 2 complete and commit**

Change Task 2 checkboxes in this plan to `[x]`, then run:

```bash
git add docs/launch/brampton-l2-l3-verification-workplan.md docs/superpowers/plans/2026-07-10-brampton-documentation-truth-reconciliation.md
git diff --cached --check
git commit -m "docs: reconcile Brampton verification workplan"
```

Expected: commit succeeds with only the verification workplan and plan-progress changes staged.

### Task 3: Validate and close the documentation batch

**Files:**

- Modify: `docs/superpowers/plans/2026-07-10-brampton-documentation-truth-reconciliation.md`
- Verify: `.gitignore`
- Verify: `docs/planning/README.md`
- Verify: `docs/launch/brampton-l2-l3-verification-workplan.md`
- Verify: `docs/superpowers/specs/2026-07-10-brampton-documentation-truth-reconciliation-design.md`

**Interfaces:**

- Consumes: completed Task 1 and Task 2 documents
- Produces: validated, formatter-clean, reference-clean documentation and a plan that records the completed batch

- [x] **Step 1: Run required repository validation**

Run:

```bash
npm run format:check
npm run check:refs
npm run check:root
npm test -- --run tests/unit/documentation-hygiene.test.ts
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Run the strict MkDocs build in an isolated Python environment — environment-blocked as of 2026-07-10**

Run:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m mkdocs build --strict
```

Expected: dependencies install inside ignored `.venv/`, and the strict documentation build completes successfully with output under ignored `site/`.

- [x] **Step 3: Audit final scope and protected files**

Run:

```bash
git status --short
git diff main...HEAD --stat
git diff main...HEAD --name-only
git diff main...HEAD -- data/services.json data/embeddings.json data/drafts supabase app components lib scripts tests
```

Expected: the branch contains only `.gitignore`, the design/plan documents, and the two active-document corrections; the protected-path diff is empty.

- [x] **Step 4: Record exact validation evidence in this plan**

Append a `## Completion Record` section containing the date, command results, exact Vitest file/test counts, strict MkDocs result, final changed-file list, and confirmation that the protected-path diff is empty. Mark every completed Task 3 step `[x]`; leave an unavailable optional check unchecked with its blocker recorded.

- [x] **Step 5: Commit the completion record**

Run:

```bash
git add docs/superpowers/plans/2026-07-10-brampton-documentation-truth-reconciliation.md
git diff --cached --check
git commit -m "docs: record Brampton reconciliation validation"
```

Expected: commit succeeds with only the completed plan and its validation evidence staged.

- [x] **Step 6: Re-run final clean-state checks**

Run:

```bash
git status --short --branch
git log --oneline --decorate -6
git diff main...HEAD --check
```

Expected: the feature worktree is clean, recent commits are reviewable and scoped, and the complete branch diff has no whitespace errors.

## Completion Record

Date: 2026-07-10

- `npm run format:check`: passed; all matched files use Prettier formatting.
- `npm run check:refs`: passed across 156 files.
- `npm run check:root`: passed; project-root hygiene is clean.
- `npm test -- --run tests/unit/documentation-hygiene.test.ts`: 1 Vitest
  file passed, 19 tests passed.
- `git diff --check`: passed.
- Task 3 Step 6 clean-state evidence at commit `92cce536`:

  ```text
  $ git status --short --branch
  ## codex/brampton-doc-truth-reconcile...origin/codex/brampton-doc-truth-reconcile
  [exit 0]

  $ git log --oneline --decorate -6
  92cce536 (HEAD -> codex/brampton-doc-truth-reconcile, origin/codex/brampton-doc-truth-reconcile) docs: record Brampton reconciliation validation
  d90dbbf7 docs: reconcile Brampton verification workplan
  9e458a98 docs: close stale Brampton planning gates
  895b74b6 docs: plan Brampton truth reconciliation
  9300634d docs: design Brampton truth reconciliation
  a454247a chore: ignore local worktrees
  [exit 0]

  $ git diff main...HEAD --check
  [no output]
  [exit 0]
  ```

- Final branch scope: `.gitignore`,
  `docs/launch/brampton-l2-l3-verification-workplan.md`,
  `docs/planning/README.md`, this implementation plan, and its design spec.
- Protected-path audit for `data/services.json`, `data/embeddings.json`,
  `data/drafts`, `supabase`, `app`, `components`, `lib`, `scripts`, and `tests`:
  empty.
- Strict MkDocs status: environment-blocked. The prescribed
  `python3 -m venv .venv` command exited `1` because the available WSL Python
  lacks `ensurepip`; no strict build pass is claimed.
- Design/plan resolution: the approved design permits the optional strict
  MkDocs limitation to remain recorded and Step 2 to remain unchecked; no pass
  is claimed.
