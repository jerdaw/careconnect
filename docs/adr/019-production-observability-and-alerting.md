---
status: stable
last_updated: 2026-06-04
owner: jer
tags: [architecture, observability, privacy, public-docs]
---

# ADR 019: Production Observability And Alerting

**Status:** Accepted, public summary
**Last Updated:** 2026-06-04

## Decision

CareConnect supports aggregate service-health observability and optional alerting for maintainers while preserving the public-search privacy boundary.

## Rationale

1. Maintainers need to detect outages, degraded database access, elevated errors, and latency regressions.
2. Observability should not store raw search queries, sensitive user text, or unnecessary identifiers.
3. Alert routing and provider configuration are environment-specific and should stay outside public GitHub docs.

## Consequences

- Public docs describe observability principles and supported signals.
- Private maintainer notes hold exact provider setup, alert routing, dashboard locations, and incident execution steps.
- Tests should cover privacy boundaries, throttling, and telemetry behavior without requiring live provider credentials.
