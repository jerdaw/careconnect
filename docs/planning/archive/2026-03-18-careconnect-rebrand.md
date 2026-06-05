---
status: archived
last_updated: 2026-04-03
owner: jer
tags: [planning, archive, rebrand, careconnect]
---

# CareConnect Rebrand And Runtime Rename Archive

## Summary

This archive records the completed rename from `kingston-care-connect` to `CareConnect` across the public repository and GitHub repository slug.

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
4. Aligned public documentation with the CareConnect product name.
5. Moved host-specific runtime details to private operations material.
6. Aligned shared `platform-ops` inventory and active operator-facing docs to the new runtime identity.
7. Removed obsolete public references to the pre-rename runtime.

## Verification

Verification included:

1. Repo-wide search for legacy identifiers in tracked files and filenames.
2. JSON validation on edited assets.
3. `git diff --check` for whitespace/conflict hygiene.
4. Live runtime verification details are maintained privately.
5. Public verification of `careconnect.ing`, `www.careconnect.ing`, `helpbridge.ca`, and `www.helpbridge.ca`.
6. Shared inventory/doc validation is maintained outside public GitHub docs.

## Outcome

The CareConnect rename is complete for the repo and the `jerdaw/careconnect` GitHub remote. Remaining pre-CareConnect references in this repository are historical archive content only.
