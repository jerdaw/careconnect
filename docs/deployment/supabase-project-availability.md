---
status: stable
last_updated: 2026-07-27
owner: jer
tags: [deployment, supabase, reliability, github-actions]
---

# Supabase Free-Project Availability

Supabase can pause Free projects that receive too little user database activity
over a seven-day period. The `Supabase Keepalive` GitHub Actions workflow makes
three minimal, authenticated Data API queries to each configured project every
day. This creates database activity while keeping the maintenance traffic small
and observable.

This is an availability safeguard, not a health check or backup. Supabase's
[project pausing guidance](https://supabase.com/docs/guides/platform/free-project-pausing)
remains authoritative, and upgrading the owning organization to a paid plan is
the provider-supported way to eliminate inactivity pausing.

## Workflow Contract

The workflow at `.github/workflows/supabase-keepalive.yml`:

- runs daily at `08:17 UTC` and supports manual dispatch;
- queries `services_public` for CareConnect and `profiles` for VisitBrief;
- sends both `apikey` and bearer authorization headers using public client
  keys;
- requires HTTP `200` for all three queries to each project;
- opens or refreshes one `Supabase Keepalive Failure` issue when secret
  validation or a Data API query fails;
- closes that issue after the next successful run while preserving a failed
  workflow conclusion for the triggering run;
- never uses a service-role key and does not print response bodies.

The selected resources already have the explicit Data API grants required for
their applications. Row-level security remains active; a successful query can
return no rows and still count as a database request.

## Repository Secrets

The workflow requires four GitHub repository secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `VISITBRIEF_SUPABASE_URL`
- `VISITBRIEF_SUPABASE_PUBLISHABLE_KEY`

Store only project URLs and public client keys in this workflow. Do not add
service-role keys, database passwords, or response data.

## Verification

Review the latest scheduled or manually dispatched result:

```bash
gh run list --workflow supabase-keepalive.yml --limit 5
gh run view <run-id> --log
```

A healthy run reports `3/3 queries` for both configured projects. If one
project fails, inspect the HTTP status without printing the saved response
body, then check project availability, the repository secret names, Data API
grants, and the selected resource.

The failure issue is intentionally persistent rather than one issue per run:

```bash
gh issue list \
  --state open \
  --search '"Supabase Keepalive Failure" in:title'
```

The workflow updates the issue with the latest run URL and closes it only after
both projects complete a healthy keepalive. The `automated` repository label
must remain available so the workflow can create the issue on the first
failure.

## Change Safety

When changing the workflow:

1. Keep the query pointed at an existing, explicitly exposed Data API resource.
2. Use a one-row limit and a public client key.
3. Update `tests/unit/supabase-keepalive-workflow.test.ts` with the contract.
4. Manually dispatch once and confirm both projects report `3/3 queries`.
5. Confirm the scheduled run remains green and no failure issue remains open.
6. Record private provider or billing details in the shared private operations
   repository, not in this public repository.

## Rollback

If the shared workflow must be separated, remove only the secondary project's
two repository secrets and query call after a replacement schedule has been
verified. Keep CareConnect's own daily query in place unless the project moves
to a paid Supabase organization or is intentionally retired.
