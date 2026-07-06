# Brampton L1 Review Template

Use this template before adding any Brampton candidate to `data/services.json`.

## Candidate

- Candidate name:
- Provider/program:
- Draft source file:
- Reviewer:
- Review date:

## Required L1 Checks

- [ ] Official/source URL loads.
- [ ] The service or program exists.
- [ ] The candidate serves Brampton or has clearly applicable broad coverage.
- [ ] Phone, URL, address, or intake path is copied only from a cited source.
- [ ] Unknown facts remain blank or `UNKNOWN`; they are not inferred.
- [ ] Duplicate/canonical review completed.
- [ ] Verification level is no higher than L1 unless direct provider confirmation supports L2/L3.
- [ ] Public wording does not imply a partnership or official relationship.

## Coverage Decision

Use one:

```json
[{ "kind": "local", "placeIds": ["brampton-on"], "label": "Brampton" }]
```

```json
[{ "kind": "regional", "placeIds": ["brampton-on"], "regionIds": ["peel-region"], "label": "Peel Region" }]
```

```json
[{ "kind": "provincial", "label": "Ontario-wide" }]
```

```json
[{ "kind": "national", "label": "Canada-wide" }]
```

## Decision

- [ ] Approved for live data entry
- [ ] Needs more research
- [ ] Reject
- [ ] Reuse or update canonical existing record instead

## Notes
