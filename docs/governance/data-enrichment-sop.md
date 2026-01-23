---
status: stable
last_updated: 2026-01-23
owner: jer
tags: [governance, data-quality, enrichment, sop]
---

# Data Enrichment Standard Operating Procedure

**Version**: 1.0  
**Effective Date**: January 21, 2026

## 1. Purpose

This document defines the standard process for enriching service data with missing fields. It ensures consistency, quality, and repeatability when addressing data gaps.

## 2. Scope

Applies to all enrichment work on `data/services.json`:

- Adding missing field values (scope, coordinates, hours, etc.)
- Improving verification levels (L1 → L2 → L3)
- Expanding service categories

## 3. Data Quality Metrics

### Current State Audit

Run the audit before starting any enrichment work:

```bash
npm run audit:data
# Or directly:
node --import tsx scripts/audit-data-completeness.ts
```

### Target Metrics

| Field                      | Target Coverage               | Notes                                                               |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `scope`                    | 100%                          | Required for geographic filtering                                   |
| `coordinates`              | 95%+ (Kingston physical only) | Required for distance search when a stable physical location exists |
| `hours` (structured)       | 70%+                          | Enables "Open Now" filter                                           |
| `access_script`            | 50%+                          | Phone anxiety support                                               |
| `plain_language_available` | 100%                          | Automated scoring                                                   |

## 4. Field Priority Tiers

### Tier 1: Critical (Unlocks Features)

| Field           | Acquisition Method                             | Cost                 |
| --------------- | ---------------------------------------------- | -------------------- |
| **scope**       | Rule-based inference from service type/address | Free                 |
| **coordinates** | OpenCage geocoding API                         | Free tier: 2,500/day |

### Tier 2: Enhancement (UX Improvements)

| Field             | Acquisition Method                       | Cost           |
| ----------------- | ---------------------------------------- | -------------- |
| **hours**         | Parse `hours_text` + AI review           | ChatGPT (paid) |
| **access_script** | Category-based templates + customization | ChatGPT (paid) |

### Tier 3: Completeness (Quality Polish)

| Field                          | Acquisition Method            | Cost       |
| ------------------------------ | ----------------------------- | ---------- |
| **plain_language_available**   | Flesch-Kincaid scoring script | Free       |
| **verification_level** (L2→L3) | Manual outreach to providers  | Human time |

## 5. Acquisition Strategies

### 5.1 Scope Assignment

**Rule-Based Inference:**

1. Services with Kingston addresses → `"kingston"`
2. Crisis lines, telehealth → `"ontario"` or `"canada"`
3. National services (Trans Lifeline, Kids Help Phone) → `"canada"`

**Script:**

```bash
npx tsx scripts/assign-scopes.ts
```

**Review:** Spot-check 20 random services after running.

### 5.2 Geocoding

**Provider:** OpenCage (free tier: 2,500 calls/day)

**Process:**

1. Identify Kingston services that should be distance-searchable (stable physical location):
   - `scope === "kingston"`
   - `virtual_delivery !== true`
   - `address` is a real, geocodable physical address (not “Virtual”, “Mailing Only”, “Various Locations”, etc.)
2. Export gaps for review with `npm run audit:coords` (writes a report under `docs/audits/v17-5/coordinates/outputs/`)
3. Geocode with a 1-second rate limit
4. Cache results in `data/geocode-cache.json` (local-only; gitignored to avoid committing derived artifacts)
5. Manual entry for edge cases (confidential addresses, pop-ups, rotating sites)

**Script:**

```bash
OPENCAGE_API_KEY=xxx node --import tsx scripts/geocode-services.ts
# Or:
OPENCAGE_API_KEY=xxx npm run geocode
```

### 5.3 Hours Parsing

Run `npm run audit:data` to determine which services are missing structured `hours` and/or `hours_text`.

**Process:**

1. Export the current hours gaps:

   ```bash
   npm run audit:hours
   ```

   Output: `docs/audits/v17-5/hours/outputs/hours-gaps.json`

2. If structured `hours` already exist but `hours_text` is missing, backfill safely:

   ```bash
   npm run backfill:hours-text
   ```

3. Prioritize fixes:
   - Add `hours_text` for services missing it (human-readable display)
   - Add structured `hours` only where the hours are unambiguous and evidence-backed (to avoid false “Open Now”)
4. Use ChatGPT for ambiguous cases (with strict evidence requirements) only after collecting source URLs and confirming the provider’s official hours.

**Prompt for AI assistance:**

```
Convert this hours string to structured JSON:
"Mon-Fri 9am-5pm (Closed 12-1pm), Sat 10am-2pm"

Return format:
{
  "monday": { "open": "09:00", "close": "17:00" },
  ...
}
```

### 5.4 Access Scripts

**Templates by Category:**

- **Crisis:** Emphasize confidentiality, no judgment, can end anytime
- **Health:** Focus on booking process, what to bring, fees
- **Housing:** Explain eligibility, documents needed

**Process:**

1. Assign category templates to services without scripts
2. Customize for specific services (especially L3 candidates)
3. French translation:
   - Prefer translation-only (no new facts) from `access_script` → `access_script_fr`
   - v17.5 workflow: `docs/audits/v17-5/ai-results/access-script-fr/README.md`

### 5.5 AI Deep Research Output Ingestion (Recommended for Large Batches)

When generating `hours` and `access_script` at scale using Deep Research (ChatGPT / Gemini), use an auditable ingestion workflow:

1. Preserve raw model outputs (immutable archive)
2. Normalize outputs into merge-ready batch JSON
3. Validate batch alignment and schema sanity
4. Merge into `data/services.json` using a no-overwrite-by-default merge tool
5. Run governance QA sampling + record evidence spot-checks

Canonical references:

- Architecture decision: `docs/adr/011-ai-deep-research-output-ingestion.md`
- Example artifact set (v17.5): `docs/audits/v17-5/ai-results/README.md`
- Historical roadmap record (safe to delete if you don't need it): `docs/roadmaps/archive/2026-01-23-v17-5-ai-output-ingestion.md`

### 5.6 Plain Language Scoring

**Automated:** Flesch Reading Ease score

**Threshold:** Score > 60 = accessible

**Script:**

```bash
node --import tsx scripts/audit-plain-language.ts
```

### 5.7 Verification Level Upgrades (L2 → L3)

This project is **governance-first**: `verification_level: "L3"` must only be used when the provider relationship is real and documented.

**Do not commit private communications to git.** Avoid storing:

- email bodies / screenshots
- staff names or direct contact details not already public
- private portal URLs or login flows

v17.5 workspace (recommended starting point):

- Workspace: `docs/audits/v17-5/verification/README.md`
- Tracker (manual): `data/verification/l3-candidates.csv`

Generate a prioritized suggestion list (no service data changes):

```bash
npm run audit:l3
```

Output:

- `docs/audits/v17-5/verification/outputs/l3-candidate-suggestions.json`

When a provider confirmation is received:

1. Summarize the confirmation in `confirmation_summary_public` (no PII).
2. Record the date in `confirmation_received_at`.
3. Only then consider upgrading the service’s `verification_level` to `L3` (and update any relevant provenance fields).

## 6. Quality Assurance

### Pre-Enrichment Checklist

- [ ] Run `npm run audit:data` to establish baseline
- [ ] Document current metrics
- [ ] Create backup: `cp data/services.json data/services.backup.json`

### Post-Enrichment Checklist

- [ ] Run `npm run validate-data` – schema validation
- [ ] Run `npm run audit:data` – verify improvement
- [ ] Spot-check 20 random services
- [ ] Run `npm run lint` and `npm run type-check`
- [ ] Commit with message: `data: enrich [field] for N services`

## 7. Tools & Resources

### Already Paid (Effectively Free)

| Tool          | Use Case                                |
| ------------- | --------------------------------------- |
| ChatGPT Plus  | Access scripts, hours parsing, research |
| Google AI Pro | Alternative for research, verification  |

### Free Tier Sufficient

| Tool      | Use Case           | Limit        |
| --------- | ------------------ | ------------ |
| OpenCage  | Geocoding          | 2,500/day    |
| Nominatim | Geocoding fallback | Rate-limited |

### Local Scripts

| Script                               | Purpose             |
| ------------------------------------ | ------------------- |
| `scripts/audit-data-completeness.ts` | Gap analysis        |
| `scripts/assign-scopes.ts`           | Scope assignment    |
| `scripts/geocode-services.ts`        | Batch geocoding     |
| `scripts/audit-plain-language.ts`    | Readability scoring |

## 8. Ongoing Maintenance

- **Monthly:** Run data audit, address new gaps
- **Quarterly:** Verify coordinates still accurate
- **Annually:** Re-contact L2/L3 providers for verification

## 9. Related Documents

- [Verification Protocol](verification-protocol.md) – L0 through L4 levels
- [ADR 009: Data Enrichment Process](../adr/009-data-enrichment-process.md) – Decision rationale
