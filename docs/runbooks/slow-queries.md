# Runbook Summary: Slow Queries

**Last Updated:** 2026-06-04

This public summary covers slow-query incidents without publishing private database access steps or production diagnostics.

## Meaning

Slow queries can degrade search, service detail loading, partner dashboards, and health checks.

## Public Response Principles

1. Confirm whether public search and crisis-resource discovery remain usable.
2. Prefer read-only investigation before making database changes.
3. Preserve privacy by inspecting aggregate timings, not user query text.
4. Treat schema/index changes as reviewed migrations, not ad hoc production fixes.
5. Keep live diagnostic details in private maintainer notes.
