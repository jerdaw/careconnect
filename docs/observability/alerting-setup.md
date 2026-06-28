# Observability And Alerting Notes

**Last Updated:** 2026-06-27

CareConnect includes optional observability and alerting hooks so maintainers can detect service degradation without collecting user search queries.

## Public Documentation Boundary

This public document intentionally omits webhook URLs, alert-channel names, production environment paths, provider account setup steps, dashboard links, and live incident procedures.

## Public-Safe Principles

1. Search queries, filter details, and sensitive user text are not stored for public search.
2. Health checks should report service status without exposing secrets or private infrastructure.
3. Alerting should focus on aggregate service degradation, not individual user behavior.
4. Any persistent telemetry should use minimization, access controls, and documented retention.
5. Production alert routing and incident response details belong in private/shared operations material.

## Signals

The application can expose or derive these aggregate signals:

- health endpoint status,
- circuit breaker state,
- error-rate trends,
- latency summaries,
- service-level objective summaries,
- data freshness indicators.

## Local Development

For local development, observability integrations are optional. The app should run without alerting provider credentials.

Use `.env.example` for supported variable names and keep live values in ignored environment files or a password manager.

## Critical-Only Mode

CareConnect supports a reversible critical-only posture for low-interruption
operation:

1. `OPERATIONAL_NOTIFICATION_MODE=critical_only` suppresses noncritical
   operational alert notifications while preserving sustained critical outage
   paths and future security/privacy incidents.
2. `USER_NOTIFICATION_MODE=critical_only` allows emergency user broadcasts and
   blocks general or noncritical service-update broadcasts.
3. Recovery notifications should only send when the original incident produced
   a critical notification.

Use `normal` for either mode to restore the standard notification behavior.

## Related Docs

- [Runbooks Overview](../runbooks/README.md)
- [Incident Response Overview](../operations/incident-response-plan.md)
- [Architecture](../architecture.md)
