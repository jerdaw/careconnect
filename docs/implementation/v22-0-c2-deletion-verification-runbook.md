---
status: draft
last_updated: 2026-03-24
owner: jer
tags: [implementation, v22.0, privacy, deletion, runbook]
---

# v22.0 C2 Deletion Verification Runbook

This runbook defines the proposed verification path for the C2 deletion mechanism.

Status:

1. Prepared for review and later execution.
2. No deletion should be run until privacy approval is explicit.
3. This runbook is evidence-preparation only; it is not proof by itself.

## Preconditions

1. The retention policy has been approved.
2. The operator has read-only access for dry-run review and appropriate write access only if deletion is approved.
3. The operator records the timestamp, reviewer, and environment for each run.

## Verification Steps

### 1. Dry-run candidate identification

Use a read-only query to list candidate rows that are either:

1. older than the approved retention cutoff, or
2. superseded by a newer decision record.

Example review query:

```sql
select
  id,
  decision,
  decision_date,
  created_at
from pilot_integration_feasibility_decisions
where decision_date < (current_date - interval '365 days')
order by decision_date asc, created_at asc;
```

### 2. Supersession review

Confirm whether any older record has been replaced by a newer decision that makes the earlier record unnecessary.

Suggested evidence:

1. Before count of total rows
2. Before count of deletion candidates
3. Reviewer note explaining why each deletion bucket is allowed

### 3. Approved deletion execution

If privacy review explicitly approves execution, run the agreed deletion query and record:

1. exact statement used,
2. operator,
3. execution timestamp,
4. before/after row counts.

### 4. Evidence package

Attach the following to the C2 evidence bundle:

1. dry-run query output or screenshots,
2. reviewer note,
3. before/after counts,
4. signed privacy approval reference.

## Acceptance Target

This runbook supports C2-3 verification only when an actual dated execution record is attached in:

1. [`docs/implementation/v22-0-evidence/c2-retention`](v22-0-evidence/c2-retention/README.md)
2. [v22.0 Control C2 Privacy Retention Mapping](v22-0-control-c2-retention-mapping.md)
