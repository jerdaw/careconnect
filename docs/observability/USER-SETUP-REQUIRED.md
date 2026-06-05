# Maintainer Setup Boundary

**Last Updated:** 2026-06-04

Some observability setup requires maintainer-owned accounts, credentials, and production access. Those steps are intentionally not published in this repository.

## Public Guidance

- Keep webhook URLs, API tokens, and provider credentials out of git.
- Store live credentials in a password manager or approved secret store.
- Configure production monitoring outside this public repository.
- Keep alerting privacy-preserving: no search queries, no sensitive user text, and no unnecessary identifiers.
- Document exact live steps only in private maintainer notes.

## Local Development

The app should remain usable locally without observability credentials. If optional providers are not configured, related features should fail closed or remain disabled.
