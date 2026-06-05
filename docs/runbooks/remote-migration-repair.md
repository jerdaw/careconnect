# Remote Migration Repair Boundary

**Last Updated:** 2026-06-04

Remote migration repair can affect live database state and must use private maintainer procedures. This public page records the safety boundary only.

## Public Rules

1. Do not assume local migrations match a live database.
2. Perform read-only live-schema preflight before any write.
3. Prepare rollback or compensating steps before execution.
4. Keep credentials, SQL editor context, and live project identifiers out of public git.
5. Record exact repair commands in private maintainer notes.
