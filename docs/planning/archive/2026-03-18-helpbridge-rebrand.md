---
status: archived
last_updated: 2026-03-18
owner: jer
tags: [planning, archive, rebrand, helpbridge]
---

# HelpBridge Rebrand And Runtime Rename Archive

## Summary

This archive records the completed rename from `kingston-care-connect` to `HelpBridge` across the repository, GitHub remote, shared ops inventory, and live VPS runtime.

Canonical branding decisions:

1. Product name: `HelpBridge`
2. Technical slug: `helpbridge`
3. Mobile app ID: `org.helpbridge.app`

## Scope Completed

The completed work included:

1. Renamed package, metadata, manifest, and Capacitor identifiers to `helpbridge` / `HelpBridge`.
2. Updated user-facing branding in the app shell, translations, documentation, tests, and API docs.
3. Renamed GitHub repository references and local repository path conventions to `helpbridge`.
4. Standardized the live VPS runtime name to `helpbridge-web` and aligned active deploy/release docs with that runtime.
5. Aligned shared `platform-ops` inventory and active operator-facing docs to the new runtime identity.
6. Removed the temporary rollback assets for the pre-rename VPS runtime after the live cutover stabilized.

## Verification

Verification included:

1. Repo-wide search for legacy identifiers in tracked files and filenames.
2. JSON validation on edited assets.
3. `git diff --check` for whitespace/conflict hygiene.
4. Live VPS verification of private/public health on `helpbridge-web`.
5. Shared inventory/doc validation in `/home/jer/repos/platform-ops`.

## Outcome

The HelpBridge rename is complete for the repo, remote, shared ops workspace, and live VPS runtime. Remaining legacy-name references in this repository are historical archive content only.
