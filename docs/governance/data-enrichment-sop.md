---
status: stable
last_updated: 2026-01-21
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
npx tsx scripts/audit-data-completeness.ts
```

### Target Metrics

| Field                      | Target Coverage | Notes                             |
| -------------------------- | --------------- | --------------------------------- |
| `scope`                    | 100%            | Required for geographic filtering |
| `coordinates`              | 90%+            | Required for distance search      |
| `hours` (structured)       | 70%+            | Enables "Open Now" filter         |
| `access_script`            | 50%+            | Phone anxiety support             |
| `plain_language_available` | 100%            | Automated scoring                 |

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

1. Filter services missing coordinates
2. Geocode with 1-second rate limit
3. Cache results in `data/geocode-cache.json` (local-only; gitignored to avoid committing derived artifacts)
4. Manual entry for failures (10-20 expected)

**Script:**

```bash
OPENCAGE_API_KEY=xxx npx tsx scripts/geocode-services.ts
```

### 5.3 Hours Parsing

**Source:** 67 services have `hours_text` but no structured `hours`

**Process:**

1. Run hours parser script
2. Review failures (complex formats)
3. Use ChatGPT for ambiguous cases

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
3. French translation for provincial services

### 5.5 Plain Language Scoring

**Automated:** Flesch Reading Ease score

**Threshold:** Score > 60 = accessible

**Script:**

```bash
npx tsx scripts/audit-plain-language.ts
```

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
