---
status: archived
last_updated: 2026-04-03
owner: jer
tags: [planning, archive, rebrand, careconnect]
---

# CareConnect Rebrand And Runtime Rename Archive

## Summary

This archive records the completed rename from `kingston-care-connect` to `CareConnect` across the repository, GitHub repository slug, shared ops inventory, and live VPS runtime.

Canonical branding decisions:

1. Product name: `CareConnect`
2. Technical slug: `careconnect`
3. Mobile app ID: `ca.careconnect.app`
4. Canonical public host: `https://careconnect.ing`

## Scope Completed

The completed work included:

1. Renamed package, metadata, manifest, and Capacitor identifiers to `careconnect` / `CareConnect`.
2. Updated user-facing branding in the app shell, translations, documentation, tests, and API docs.
3. Renamed the GitHub repository slug to `jerdaw/careconnect` and aligned repo references and local repository path conventions to `careconnect`.
4. Standardized the live VPS runtime name to `careconnect-web` and aligned active deploy/release docs with that runtime.
5. Cut over the live direct-VPS deployment to `https://careconnect.ing`, with `www.careconnect.ing` redirecting to the apex and both HelpBridge domains redirecting to the canonical host.
6. Aligned shared `platform-ops` inventory and active operator-facing docs to the new runtime identity.
7. Removed the temporary rollback assets for the pre-rename VPS runtime after the live cutover stabilized.

## Verification

Verification included:

1. Repo-wide search for legacy identifiers in tracked files and filenames.
2. JSON validation on edited assets.
3. `git diff --check` for whitespace/conflict hygiene.
4. Live VPS verification of private/public health on `careconnect-web`.
5. Public verification of `careconnect.ing`, `www.careconnect.ing`, `helpbridge.ca`, and `www.helpbridge.ca`.
6. Shared inventory/doc validation in `/home/jer/repos/platform-ops`.

## Outcome

The CareConnect rename is complete for the repo, the `jerdaw/careconnect` GitHub remote, the shared ops workspace, and the live VPS runtime. Remaining pre-CareConnect references in this repository are historical archive content only.
