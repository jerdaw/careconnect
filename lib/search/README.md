# Search Engine Architecture

This directory contains the core search logic for Kingston Care Connect. It supports both client-side (local) and server-side (hybrid) search modes.

## Scoring Engine (`scoring.ts`)

The search engine uses a weighted scoring model to rank results. The final score for a service is calculated through an 11-step pipeline.

### Scoring Factors

| Factor                | Type       | Details                                                                       |
| :-------------------- | :--------- | :---------------------------------------------------------------------------- |
| **Synthetic Match**   | Additive   | Up to +100 points for exact matches against AI-generated queries.             |
| **Name Match**        | Additive   | Direct matches in service names.                                              |
| **Identity Tags**     | Additive   | Matches against preferred community tags.                                     |
| **Description**       | Additive   | Keyword matches in service descriptions.                                      |
| **Personalization**   | Multiplier | Up to 1.3x boost for services matching user's active profile (age, identity). |
| **Verification**      | Multiplier | L3 (1.2x), L2 (1.1x), L1 (1.0x).                                              |
| **Freshness**         | Multiplier | 1.1x for data verified <30 days ago, 0.9x for >90 days.                       |
| **Authority Tier**    | Multiplier | (v16.0) 1.25x Gov, 1.15x Health, 1.1x Nonprofit.                              |
| **Completeness**      | Additive   | (v16.0) Max +22 points for contact info, hours, and eligibility data.         |
| **Intent Targeting**  | Additive   | (v16.0) Boost for queries matching high-confidence intent categories.         |
| **Resource Capacity** | Additive   | (v16.0) Boost for large-scale organizations (staff, budget, area).            |

## Proximity Scoring (`geo.ts`)

Implements continuous proximity decay to surface nearby services without hard distance cutoffs.

- **Algorithm**: `1 / (1 + k * distance)`
- **K-Factor**: Adjusted based on service scope (0.02 for local, 0.005 for provincial/national).
- **Virtual delivery**: Services marked as `virtual_delivery: true` are exempt from distance decay.

## Server-Side Hybrid Scoring (`server-scoring.ts`)

For privacy and scalability, the server API implements a hybrid scoring strategy:

1. Fetch 100 candidate services from Supabase.
2. Apply the full TypeScript scoring logic in memory.
3. Sort and paginate the final results.

This ensures 100% parity between client-side and server-side ranking results.

## Testing

Comprehensive tests cover the scoring logic:

- `tests/unit/search-intelligence.test.ts`: Client-side scoring factors.
- `tests/unit/server-scoring.test.ts`: Server-side integration and proximity.
- `tests/unit/geo.test.ts`: Proximity decay and scope-based calculations.
