---
status: stable
last_updated: 2026-04-05
owner: jer
tags: [governance, verification, protocol]
---

# Service Verification Protocol

**Version**: 1.1  
**Effective Date**: January 3, 2026

## 1. Objective

To maintain the highest level of accuracy and safety for service listings in CareConnect (CareConnect), ensuring users can trust the information provided.

## 2. Verification Levels (L-Scale)

| Level  | Name        | Description                            | Requirements                                                                                          |
| :----- | :---------- | :------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **L0** | Unverified  | Initial import or community suggestion | Valid name & category. Warning displayed.                                                             |
| **L1** | Basic Check | Automated/Light check                  | valid phone/website, no user reports of inaccuracy, and current within the 180-day visibility window. |
| **L2** | Verified    | Confirmed by CareConnect Team          | Direct contact with provider (email/phone) within the last 180 days.                                  |
| **L3** | Partner     | Managed by Provider                    | Provider has claimed listing, accepted Terms, and updates data directly.                              |
| **L4** | Accredited  | Official Government Source             | Data sync via API from municipal/provincial databases.                                                |

## 3. Verification Process

### Step 1: Ingestion (L0)

- New suggestions enter as L0.
- AI pre-scan for profanity or malicious content.

### Step 2: Validation (L0 to L1)

- Volunteer verifies:
  - Phone number connects.
  - Website is active.
  - Address exists in Kingston area.
- Record `last_verified` or `provenance.verified_at` so freshness enforcement can keep the listing visible.

### Step 3: Confirmation (L1 to L2)

- Outreach to provider via email/phone script:
  > "Hello, we are listing your service on CareConnect. Please verify your hours and eligibility..."
- Update `last_verified` timestamp.
- **Do not commit private communications to git** (no email bodies, screenshots, or staff names).

### Step 4: Partnership (L2 to L3)

- Provider uses "Claim Listing" feature.
- Signs Partner Terms of Service (Click-Wrap).
- Identity verification via work email.
- Track outreach progress in a governance-safe way (no PII) when needed, e.g. `data/verification/l3-candidates.csv`.

## 4. Maintenance Cycle

- **Crisis / highly volatile listings**: Review monthly where operationally feasible.
- **Pilot / priority listings**: Target re-verification within 90 days.
- **General directory listings**: Must be re-verified within 180 days to remain publicly visible.
- **Sampling discipline**: CareConnect can still audit a monthly sample across L0-L2 listings to catch decay earlier.
- **Stale Data**: Listings not verified for >180 days are downgraded to L0, hidden from search, and may surface only with an explicit stale warning when directly linked.

## 5. Dispute Resolution

- If a listing is reported as inaccurate (Flag button):
  - Immediate "Under Review" flag applied.
  - Verification team has 48 hours to investigate.
  - Correction applied or listing removed.
