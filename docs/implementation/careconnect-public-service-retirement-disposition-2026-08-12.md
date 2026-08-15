---
status: stable
last_updated: 2026-08-15
owner: jer
tags: [implementation, governance, public-service, retirement]
---

# CareConnect Public-Service Retirement Disposition (2026-08-12)

## Decision

Controlled retirement of the actionable public directory is complete. The
bounded evidence screen is closed, and the localized non-service retirement
surface was deployed from main revision `ef91ac67c8a7` on 2026-08-15 after the
recovery/dependency preflight and explicit owner approval. The release changed
only the public frontend; it did not change service records, Supabase,
workflows, shared keepalive coverage, or DNS.

The default is to retain source/history and a reproducible non-service artifact,
not to maintain or restore the 204-record corpus for optionality.

## Project-Facing Basis

1. The governed inventory contains 204 records, but the 2026-08-12 local
   freshness check identifies 8 visible records and 196 stale/hidden records.
2. Two visible crisis records are due under the 30-day crisis cadence. A tiny
   crisis-only directory would preserve the highest-risk curation obligation.
3. No contact or referral outcome is documented. Privacy-preserving aggregate
   evidence may show activity, but cannot by itself establish unique people,
   successful referrals, outcomes, or public benefit.
4. Accurate service navigation requires recurring human stewardship. There is
   no documented accountable external owner for operations and record
   freshness.
5. The implemented privacy, accessibility, offline, and governance behavior can
   be preserved in a reproducible local or private build without retaining an
   indefinitely actionable public directory.

## Bounded Evidence Screen

The complete screen is capped at two hours and may use only existing
aggregate-only evidence, current public/read-only state, boundary-safe cost and
incident summaries, transition complexity, and existing project documents.

It must not add tracking, run production SQL, access raw logs or personal data,
extract credentials, change service records, alter Supabase or shared keepalive
behavior, deploy, or contact external parties.

The screen may change the transition sequence only if meaningful recurring
human use is credibly corroborated. Even then, continued public operation
requires an accountable steward and a fixed decision deadline. Aggregate
traffic without corroboration is not sufficient.

## CC-2A Documentary Evidence Screen (2026-08-12)

CC-2A used only repository documents and code, public `GET` requests, public
GitHub workflow and issue metadata, and value-safe private/shared operations
summaries. It did not run production SQL, access raw logs or personal data,
extract credentials, change records or infrastructure, deploy, or contact
anyone.

| Evidence                     | Dated observation                                                                                                                                                                                                                                                                                                                                                                                                    | Strength and limit                                                                                                                                 | Decision implication                                                                                                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public availability          | On 2026-08-12 the health endpoint, English home page, public services API, impact page, robots file, sitemap, and both due crisis detail pages returned HTTP 200. Health reported `healthy` at release `1b561ec0b614`; the API returned 8 records.                                                                                                                                                                   | Strong evidence that the current service is reachable, not evidence that people use or benefit from it.                                            | Retirement must be a controlled live change with rollback, not an assumption that the service is already absent.                                                                                                                                                    |
| Governed inventory           | The reproducible local check as of 2026-08-12 reported 204 total records: 6 fresh, 2 due, 196 stale, 0 unknown, 8 visible, and 196 hidden. The two due records are crisis records last verified 34 days earlier.                                                                                                                                                                                                     | Strong snapshot evidence; no service fact or verification date was changed.                                                                        | Do not restore the stale corpus for optionality. The visible crisis records retain an active stewardship obligation until separately approved handling occurs.                                                                                                      |
| Direct outcome evidence      | The historical 2026-03-09 baseline recorded 0 contact attempts and 0 referrals for its bounded window. The public impact page on 2026-08-12 showed 0 feedback responses, 0 reported issues, and 0 feedback received, while showing 8 of 8 current public records as recently verified.                                                                                                                               | The historical baseline does not prove later absence of activity. Zero voluntary feedback does not prove zero use.                                 | No connection, referral, or outcome benefit is currently corroborated by the allowed evidence.                                                                                                                                                                      |
| Analytics contract           | Search analytics store locale and result count with query text set to `NULL`. Detail analytics store service ID, event type, and timestamp. They do not provide a person, session, referrer, user agent, referral, or outcome field. The existing aggregate API requires authentication and organization scope.                                                                                                      | Strong code-contract evidence. Existing counts could indicate activity but cannot reliably distinguish unique people, bots, referrals, or benefit. | Aggregate traffic alone cannot reverse the retirement default or justify corpus reverification.                                                                                                                                                                     |
| Operational automation       | The five most recent checked daily production-smoke runs were successful. The latest eight checked scheduled shared Supabase-keepalive runs (2026-08-05 through 2026-08-12) were also successful, required secret names were present, and no automated keepalive-failure issue was open. The unchanged workflow queries both CareConnect and VisitBrief Supabase Data APIs directly; it does not call this frontend. | Strong current workflow metadata; no raw logs or secret values were read. It proves routine availability checks, not public value.                 | Frontend retirement does not require a keepalive migration. Keep the workflow, repository, Actions, required secrets, and Supabase projects intact; treat any later disable/delete as a separate dependency-separation decision.                                    |
| Operating-cost boundary      | Exact provider, billing, and infrastructure cost evidence remains private and incomplete in the public record.                                                                                                                                                                                                                                                                                                       | The allowed evidence does not establish a boundary-safe total or project-specific operating cost.                                                  | Do not claim cash savings. The disposition rests on stewardship and safety obligations rather than a financial-savings claim.                                                                                                                                       |
| Incident and recovery burden | Existing value-safe operations records document July 8 provider-assisted database recovery and application redeploy proof, prior production auth remediation, and a synthetic alert whose delivery was not confirmed. The historical proof is not a current August 12 encrypted private database export. Current health is green.                                                                                    | Establishes non-zero operations and transition burden, but not a current private export or recurring outage rate.                                  | The approved rollout stayed frontend-only and left Supabase/data/workflows untouched. The owner explicitly accepted the bounded no-database-change risk using the historical provider recovery proof; no current recoverable private database artifact was claimed. |
| Current work queues          | Four public issues remain open: two historical v22 external-evidence gates and two service-verification queues.                                                                                                                                                                                                                                                                                                      | Issue state reflects unfinished work, not a mandate to complete superseded strategy.                                                               | Supersede the v22 gates as active work and do not execute the verification queues for optionality.                                                                                                                                                                  |

### CC-2A Result

Recorded CC-2A window: `2026-08-12T13:03:52Z` to
`2026-08-12T13:07:25Z` (4 minutes rounded up). Cumulative evidence-screen time
used: 4 of 120 minutes. CC-1 documentation and validation time is outside this
evidence-screen total.

The allowed evidence did not corroborate meaningful recurring human use or an
accountable steward. It therefore strengthened the controlled-retirement
default but did not itself authorize a live change. Current aggregate
production counts were not queried and, by contract, could establish only
activity rather than unique people, referrals, outcomes, or benefit. The later
deployment proceeded under a separate explicit approval.

### CC-2B Close Decision (2026-08-12)

CC-2B was not pursued. The available browser session was unauthenticated, and
the screen continued to prohibit production SQL, raw-log access, personal-data
access, and credential extraction. More importantly, the authenticated
aggregate endpoint contract could provide activity counts only; it could not
establish people, referrals, outcomes, or benefit. A query within the approved
boundary therefore could not satisfy the continuation gate.

The evidence screen is closed at 4 of 120 minutes. The remaining 116 minutes
are unused, not deferred to a broader search. This decision does **not** claim
zero use; it records that the allowed evidence cannot corroborate the benefit
and stewardship required to continue an actionable public directory.

## Deployed Retirement Surface (2026-08-15)

The source-controlled retirement mode now:

1. rewrites interactive public routes to a localized non-directory page;
2. returns `410 Gone` from non-health API routes while preserving the existing
   health endpoints;
3. presents only official emergency routing (`911`, call/text `988`) and 211
   Ontario navigation, without real CareConnect listings, search, forms,
   accounts, location access, analytics, offline synchronization, or chat;
4. removes service-data routes from the retirement sitemap and install
   shortcuts, prevents new service-response PWA caches, and clears prior
   service/offline caches plus offline service and embedding data during an
   upgrade while preserving user-authored local data for explicit download or
   confirmed clearing;
5. substitutes empty corpus modules at build time, forces connected prior
   clients to the localized retirement route, and retires public mobile URL
   associations; and
6. preserves source/history and the dated pre-retirement visual baseline.

The exact public-safe preflight, acceptance, rollback, and evidence contract is
the [retirement transition and rollback packet](careconnect-retirement-transition-and-rollback-2026-08-12.md).
The deployment passed localized route, accessibility, API fail-closed,
client-artifact, cache/IndexedDB cleanup, service-worker unregistration, and
connected-client transition checks. The underlying corpus and shared services
remain unchanged.

## Current Operating Boundary

After the controlled frontend retirement:

1. The localized non-service retirement surface remains live; the actionable
   CareConnect directory does not.
2. No corpus restoration, optionality reverification, expansion, feature work,
   pilot, new instrumentation, partner pitch, or research conversion is active.
3. The two crisis records that were due in the 2026-08-12 snapshot were not
   changed by the frontend retirement. Any later record change requires
   explicit approval.
4. Any database, workflow, shared keepalive, redirect, or deployment change
   requires its own recovery preflight and explicit approval.
5. Exact production, backup, rollback, environment, and shared-host details
   remain in the private/shared operations source of truth.
6. Re-enabling the directory or deploying another public behavior requires a
   new bounded decision, recovery/dependency preflight, and explicit approval.

## Artifact Preservation

Preserve source and history, a reproducible local or private interactive build,
dated screenshots or video, and technical evidence for privacy, accessibility,
offline behavior, and governance. Do not retain real actionable listings on a
public artifact solely to preserve interactive behavior. A public synthetic
prototype is not the default.

The first public-only visual baseline was captured locally on `2026-08-12`
without authentication, form submission, data changes, or deployment. Its
[manifest and screenshots](artifacts/careconnect-retirement-baseline-2026-08-12/README.md)
preserve the home and impact surfaces while explicitly treating their visible
counts and claims as observations rather than validated impact evidence.

## Reopening Requirements

Reopen service implementation or evaluation only when all of these conditions
exist:

1. An independently supported service need.
2. An accountable operational steward owns record freshness.
3. An institution owns governance, privacy, safety, and any required ethics or
   QI pathway.
4. A bounded evaluation or implementation decision has explicit success and
   stop criteria.
5. The proposal is preferable to 211, a simple process or spreadsheet, or doing
   nothing.

A problem-first needs assessment does not require CareConnect to remain public
and does not by itself reopen implementation.

## Superseded Active Authority

This record supersedes the
[2026-07-02 limited-public-directory pilot risk disposition](v22-0-limited-public-directory-pilot-risk-disposition-2026-07-02.md)
and the v19-v22 pilot, launch, and external-validation plans as active execution
authority. Those records remain historical evidence and are not deleted.

The [current roadmap](../planning/roadmap.md) is the navigation and sequencing
authority for implementation.
