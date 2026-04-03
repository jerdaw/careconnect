---
status: stable
last_updated: 2026-01-21
owner: jer
tags: [data, enrichment, geocoding, ai-tooling]
---

# ADR 009: Data Enrichment Process

## Status

Accepted

## Date

2026-01-21

## Context

As of **2026-01-21**, CareConnect maintained 196 verified services with significant data gaps:

- 75% missing `scope` field
- 91% missing `coordinates`
- 73% missing `access_script`
- 62% missing structured `hours`

We needed a standard, cost-effective process for addressing these gaps that leverages existing paid tools (ChatGPT Plus, Google AI Pro) and free-tier APIs.

> Note: These metrics change over time. Recompute current gaps with `npm run audit:data`.

## Decision

We adopt a tiered enrichment strategy:

### 1. Rule-Based Inference (Scope)

Assign geographic scope using deterministic rules:

- Local addresses → `"kingston"`
- Crisis/telehealth → `"ontario"` or `"canada"`
- National services → `"canada"`

**Rationale:** 90%+ of scope assignments can be automated; AI review only for edge cases.

### 2. OpenCage Geocoding (Coordinates)

Use OpenCage API for batch geocoding.

**Rationale:**

- Free tier (2,500 calls/day) sufficient for 179 services
- Better Canadian address accuracy than Nominatim
- Caching prevents redundant calls

### 3. Category-Based Templates (Access Scripts)

Generate access scripts using category templates:

- Crisis: confidentiality, judgment-free, can end anytime
- Health: booking, fees, documents
- Housing: eligibility, process

**Rationale:** Reduces per-service customization; templates cover 80% of content.

### 4. Automated Readability Scoring (Plain Language)

Use Flesch-Kincaid algorithm locally.

**Rationale:** No API cost, deterministic, can be run on every build.

## Consequences

### Positive

- Zero marginal cost for scope, hours, and plain language
- Geocoding within free tier limits
- Leverages existing ChatGPT/Gemini subscriptions
- Repeatable process documented in SOP

### Neutral

- L3 verification still requires human outreach (cannot be automated)
- OpenCage requires API key management

### Negative

- 10-20 services may require manual geocoding
- Complex hours formats may need AI interpretation
