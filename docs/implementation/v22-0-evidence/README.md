---
status: draft
last_updated: 2026-04-04
owner: jer
tags: [implementation, v22.0, evidence, gate-0]
---

# v22.0 Gate 0 Evidence Workspace

This folder is the canonical in-repo drop location for Gate 0 evidence bundles.

Rules:

1. This workspace prepares evidence handling; it does not change blocker status by itself.
2. Do not mark any Gate 0 blocker `complete` until the corresponding evidence also satisfies [v22.0 Gate 0 Evidence Intake Pack](../v22-0-gate-0-evidence-intake-pack.md).
3. Keep every evidence submission dated and attributable.
4. Do not fabricate evidence or backfill dates.

Subfolders:

1. [`c1-partner-terms`](c1-partner-terms/README.md) - legal/API terms and clause review package
2. [`c2-retention`](c2-retention/README.md) - retention policy draft, sign-off memo, and verification artifacts
3. [`d4-partner-ops`](d4-partner-ops/README.md) - named pilot partner list and outreach execution bundle

Suggested workflow:

1. Copy the relevant `SUBMISSION_TEMPLATE.md` into a dated file.
2. Add the real evidence artifacts for that submission.
3. Follow the [v22.0 Gate 0 Evidence Sync Runbook](../v22-0-gate-0-evidence-sync-runbook.md) after the minimum evidence checks pass.
