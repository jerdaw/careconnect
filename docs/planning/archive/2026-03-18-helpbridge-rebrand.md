---
status: archived
last_updated: 2026-03-18
owner: jer
tags: [planning, archive, rebrand, helpbridge]
---

# HelpBridge Rebrand Archive

## Summary

This archive records the completed repository-side rebrand from `kingston-care-connect` to `HelpBridge`.

Canonical branding decisions:

1. Product name: `HelpBridge`
2. Technical slug: `helpbridge`
3. Mobile app ID: `org.helpbridge.app`

## Scope Completed

The repository implementation completed the following work:

1. Renamed package, metadata, manifest, and Capacitor identifiers to `helpbridge` / `HelpBridge`.
2. Updated user-facing branding in the app shell, translations, documentation, tests, and API docs.
3. Renamed GitHub repository references and local repository path conventions to `helpbridge`.
4. Verified that tracked repo files no longer contain legacy project identifiers, except for one intentionally untouched curated-data record in `data/services.json`.

## Verification

Repository-side verification included:

1. Repo-wide search for legacy identifiers in tracked files and filenames.
2. JSON validation on edited assets.
3. `git diff --check` for whitespace/conflict hygiene.

## Follow-Up Work Moved Back to the Roadmap

The following items remain outside this repository-side rename and stay as operational follow-ups:

1. Update `platform-ops` and VPS-serving configuration on the ops machine.
2. Confirm external deployment/domain cutover details where applicable.
3. Decide whether to manually revise the one legacy brand string embedded in curated service data (`data/services.json`) under the project's manual-curation rules.

## Outcome

The HelpBridge rebrand is complete for this repository and its GitHub remote. Remaining work is operational rather than application-code rename work.
