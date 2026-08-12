---
status: draft
last_updated: 2026-08-12
owner: jer
tags: [implementation, retirement, transition, rollback, public-service]
---

# CareConnect Retirement Transition and Rollback Packet (2026-08-12)

## Status and Scope

This packet defines the smallest reversible release that can retire the
actionable CareConnect directory. The implementation is prepared in a draft
pull request; it is **not deployed** and does not authorize a deployment,
redirect, service-record change, Supabase change, workflow change, or shared
keepalive change.

Environment-specific release commands, host paths, credentials, backup
locations, monitoring destinations, and dependency inventory remain in the
private/shared operations source of truth.

## Candidate Release Contract

The prepared source-controlled retirement mode has this contract:

1. All interactive public routes resolve to a localized non-directory page.
2. Non-health API routes fail closed with `410 Gone` and `no-store`/`noindex`
   headers.
3. `/api/health`, `/api/v1/health`, and `/api/v1/health/probe` retain their
   existing behavior for CareConnect release and recovery checks. They are not
   part of the independent shared Supabase keepalive contract.
4. The retirement page contains no CareConnect service records, search,
   submission or feedback form, account surface, location request, analytics,
   offline synchronization, or chat assistant.
5. Emergency routing is limited to `911` and call/text `988`. General service
   navigation points to the independently maintained 211 Ontario service.
6. The page is translated across the seven supported locales, retains the
   correct Arabic text direction, exposes a keyboard skip link and semantic
   headings, and is marked `noindex`, `nofollow`, and `noarchive`.
7. The retirement manifest contains no search, crisis-directory, dashboard, or
   share-target shortcuts. The retirement sitemap is empty and is omitted from
   `robots.txt`.
8. The retirement worker creates no new service-response caches. On upgrade,
   the worker and retirement page remove the prior service, start-URL,
   fallback, asset, framework, and Workbox precache entries; clear service,
   embedding, and sync metadata from current and legacy offline databases;
   remove vector databases; and unregister existing workers. Locally queued
   `pendingFeedback` is not treated as directory data and is not deleted by
   this packet.
9. The prior actionable public screenshots are removed. Replacement public
   screenshots show only the non-service retirement surface.
10. Source/history and the dated pre-retirement visual baseline remain in Git.

## Mandatory Live Preflight

Stop unless every item below is true:

1. The exact candidate commit is reviewed, the working tree is clean, required
   CI is green, and the local production build plus retirement route,
   accessibility, i18n, and rollback-policy tests pass.
2. The private/shared operations source confirms a current, trusted recovery
   path and the exact pre-transition release that can be restored. A repository
   build alone is not recovery proof.
3. The shared operations preflight confirms no diff to
   `.github/workflows/supabase-keepalive.yml`, a latest successful scheduled
   run, and continued repository, Actions, and required-secret availability.
   That workflow queries the CareConnect and VisitBrief Supabase Data APIs
   directly; it does not call this frontend or its health endpoints. Any later
   workflow, repository, Actions, secret, or Supabase-project disable/delete is
   a separate dependency-separation decision.
4. The owner reviews the proposed release and rollback target and explicitly
   approves the live deployment. Approval of this code or pull request is not
   deployment approval.
5. No unresolved evidence suggests that the transition would remove an
   actively stewarded public benefit. Aggregate activity alone is not enough.

## Approval-Gated Transition Sequence

Only after the mandatory preflight and explicit approval:

1. Record the candidate and rollback commit identifiers and dated public `GET`
   baselines for the home page, one service-detail URL, the public service API,
   and the preserved health endpoints.
2. Deploy the reviewed candidate using the private release runbook. Do not
   modify service records, database state, Supabase configuration, workflows,
   shared keepalive coverage, or DNS/domain routing as part of this release.
3. Verify the acceptance checks below from a fresh browser context and through
   the established health/monitoring path.
4. Preserve the dated results and make a separate decision on any later data,
   workflow, infrastructure, or domain cleanup. Successful surface retirement
   does not authorize those actions.

## Acceptance Checks

The transition is accepted only when all checks pass:

- Each supported locale returns the retirement page with the correct language
  and direction.
- The root, a former service-detail URL, a former search URL, and former public
  static pages expose no CareConnect listing or search control.
- Non-health API requests return `410`, do not include service data, and use
  `Cache-Control: no-store` plus `X-Robots-Tag` protection.
- The three preserved health endpoints retain their expected authorization and
  status contracts for CareConnect release/recovery checks.
- The shared Supabase keepalive workflow has no candidate diff and its latest
  scheduled run remains successful; repository, Actions, and required secrets
  remain available.
- `robots.txt`, `sitemap.xml`, and `manifest.json` do not advertise an active
  directory or service-detail routes.
- The page exposes working `tel:911`, `tel:988`, `sms:988`, `tel:211`, and the
  official 211 Ontario link, with no serious or critical WCAG 2.1 A/AA issue.
- The rendered page initiates no CareConnect service-data, Supabase auth/data,
  analytics, feedback, location, offline-sync, or chat request.
- After the upgrade cleanup runs, prior service, start-URL, offline-fallback,
  asset, framework, and Workbox precache entries are absent;
  service/embedding records are absent from current and legacy IndexedDB
  stores; old actionable screenshot paths are unavailable; existing service
  workers are unregistered; and subsequent service API requests fail closed.

Stop and roll back if any former public route or cache still discloses an
actionable CareConnect listing, if emergency routing is missing or misleading,
if localization/accessibility materially fails, or if a preserved CareConnect
health contract or the independently verified keepalive contract regresses.

## Rollback

The rollback target is only the exact prior deployed release recorded during
the live preflight. Changing the source-controlled mode back to `active` is a
testable policy path, not an approved live rollback. Use the private release
runbook to restore the recorded prior release; do not edit database rows,
restore the hidden corpus, change verification dates, or alter shared workflows
as a shortcut.

After rollback, repeat the home, service-route, public-API, health, and shared
dependency checks and record the resulting release identifier. Because the
rollback target restores the earlier public directory behavior, treat any
extended rollback window as a renewed stewardship/safety decision, not the
default resolution.

## Evidence to Preserve

- Candidate and rollback commit identifiers.
- CI and local validation summaries.
- Dated pre-transition, post-transition, and any rollback `GET` results.
- Localized desktop/mobile retirement screenshots and accessibility report.
- Proof that service APIs fail closed and the sitemap/manifest contain no
  directory claims or service routes.
- Upgrade cache/IndexedDB/unregistration results and the independent shared
  keepalive workflow result.
- The explicit approval and final go/rollback decision in the existing private
  operations record.

Do not preserve credentials, raw logs, search queries, personal data, private
host details, or provider/billing data in this public repository.
