# Runbook Summary: Circuit Breaker Open

**Last Updated:** 2026-06-04

This public summary explains the circuit-breaker incident class without exposing private dashboards, alert channels, host access, or live remediation commands.

## Meaning

The circuit breaker opens when database-dependent operations repeatedly fail and the app should avoid cascading failures. Public search should degrade toward safe fallbacks where possible.

## Public Symptoms

- health status reports degraded,
- database-backed features are unavailable,
- public search may rely on local JSON or cached data,
- admin or partner workflows may be limited.

## Public Response Principles

1. Confirm whether public search still returns verified resources.
2. Avoid any action that could corrupt service data.
3. Keep user-facing messaging conservative.
4. Use private operations procedures for live diagnosis and recovery.
5. Review whether fallback behavior protected users as intended.
