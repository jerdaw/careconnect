# Runbook Summary: High Error Rate

**Last Updated:** 2026-06-04

This public summary describes high-error-rate handling without exposing private monitoring or incident commands.

## Meaning

A high error rate means a meaningful share of requests is failing or returning unexpected errors. It may affect search, service detail pages, API routes, or authenticated workflows.

## Public Response Principles

1. Confirm whether the issue affects public users, partner users, or admin-only routes.
2. Prioritize crisis and essential-service discovery.
3. Check whether recent code, data, or configuration changes are correlated.
4. Avoid logging or publishing raw user search text.
5. Use private maintainer runbooks for live remediation.
