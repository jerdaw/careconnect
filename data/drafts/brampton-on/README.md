# Brampton Draft Curation

This folder is for Brampton expansion research drafts only. Nothing in this folder is live service data, and nothing here should be represented as verified until it is promoted through the normal service review workflow.

## Scope

- Place ID: `brampton-on`
- Launch mode: small emergency/core-service set first
- Minimum visible threshold: L1, current within the active freshness window
- Kingston remains live while Brampton records are reviewed

## Draft Rules

1. AI-assisted research can create draft candidates, not publishable service records.
2. Every candidate needs source URLs for material claims.
3. Contact details, hours, eligibility, service area, and access process must be copied only from supported sources and marked `UNKNOWN` when unclear.
4. Regional, Ontario-wide, and Canada-wide services should stay canonical instead of being duplicated as Brampton-local services.
5. Possible duplicates must be checked against current Kingston, Ontario-wide, and Canada-wide records before promotion.
6. Brampton-specific land acknowledgment wording must not be added until verified through reliable local or Indigenous-led public sources.

## Promotion Gate

Before a Brampton draft can become a visible record:

1. The record passes `lib/schemas/service.ts`.
2. The service has `primary_place_id: "brampton-on"` only when the evidence supports a Brampton-local listing.
3. The `coverage` array accurately describes local, regional, provincial, or national availability.
4. The record is L1 or higher.
5. A reviewer confirms no canonical existing record should be updated instead.
6. `npm run validate-data` and `npm run check:embeddings` pass before merge.
