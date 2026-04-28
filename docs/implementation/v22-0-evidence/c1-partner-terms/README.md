---
status: draft
last_updated: 2026-04-28
owner: jer
tags: [implementation, v22.0, evidence, legal]
---

# C1 Evidence Bundle

Use this folder for the `UA-1 / G0-3` legal review package.

Recommended dated contents:

1. `C1-YYYYMMDD-submission.md` based on [SUBMISSION_TEMPLATE.md](SUBMISSION_TEMPLATE.md)
2. `C1-YYYYMMDD-clause-matrix.md` based on [CLAUSE_MATRIX_TEMPLATE.md](CLAUSE_MATRIX_TEMPLATE.md)
3. Candidate partner contract terms
4. Candidate API terms
5. Any addenda covering analytics, retention, audit, or re-identification
6. Optional artifact inventory if the source bundle spans multiple files or screenshots

Prepared draft packet:

1. [C1-20260428-submission.md](C1-20260428-submission.md) - prep-only submission scaffold
2. [C1-20260428-clause-matrix.md](C1-20260428-clause-matrix.md) - prep-only clause matrix
3. [C1-20260428-artifact-inventory.md](C1-20260428-artifact-inventory.md) - prep-only artifact inventory

These files are intentionally marked `prep_only`; they do not count as legal
review evidence until real candidate terms and reviewer notes are attached.

Minimum review contents:

1. Named source artifacts used for the review
2. Clause-by-clause outcomes for `C1-1` through `C1-4`
3. Any blocking clause with explicit `reject` or `acceptable_with_conditions` disposition
4. Final legal recommendation with reviewer and date

Suggested workflow:

1. Drop the source terms into this folder with dated filenames.
2. Fill the submission template with reviewer metadata and the artifact list.
3. Fill the clause matrix against the exact source sections/pages reviewed.
4. Sync the final outcome back to the control and gate-tracker documents only after the review is complete.

This folder prepares the bundle location only. C1 remains pending until the review is complete and synced back to:

1. [v22.0 Control C1 Legal Review](../../v22-0-control-c1-legal-review.md)
2. [v22.0 Integration Feasibility Decision Record](../../v22-0-integration-feasibility-decision.md)
