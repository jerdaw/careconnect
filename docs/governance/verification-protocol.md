# Service Verification Protocol

**Version**: 1.0  
**Effective Date**: January 3, 2026

## 1. Objective

To maintain the highest level of accuracy and safety for service listings in Kingston Care Connect (KCC), ensuring users can trust the information provided.

## 2. Verification Levels (L-Scale)

| Level  | Name        | Description                            | Requirements                                                             |
| :----- | :---------- | :------------------------------------- | :----------------------------------------------------------------------- |
| **L0** | Unverified  | Initial import or community suggestion | Valid name & category. Warning displayed.                                |
| **L1** | Basic Check | Automated/Light check                  | valid phone/website, no user reports of inaccuracy.                      |
| **L2** | Verified    | Confirmed by KCC Team                  | Direct contact with provider (email/phone) within last 6 months.         |
| **L3** | Partner     | Managed by Provider                    | Provider has claimed listing, accepted Terms, and updates data directly. |
| **L4** | Accredited  | Official Government Source             | Data sync via API from municipal/provincial databases.                   |

## 3. Verification Process

### Step 1: Ingestion (L0)

- New suggestions enter as L0.
- AI pre-scan for profanity or malicious content.

### Step 2: Validation (L0 to L1)

- Volunteer verifies:
  - Phone number connects.
  - Website is active.
  - Address exists in Kingston area.

### Step 3: Confirmation (L1 to L2)

- Outreach to provider via email/phone script:
  > "Hello, we are listing your service on Kingston Care Connect. Please verify your hours and eligibility..."
- Update `last_verified` timestamp.

### Step 4: Partnership (L2 to L3)

- Provider uses "Claim Listing" feature.
- Signs Partner Terms of Service (Click-Wrap).
- Identity verification via work email.

## 4. Maintenance Cycle

- **L3 Listings**: Must renew verification every 6 months. Automatic reminders sent at 5 months.
- **L0-L2 Listings**: KCC volunteers audit 10% of listings monthly.
- **Stale Data**: Listings not verified for >12 months are downgraded to L0 and flagged "Potentially Outdated".

## 5. Dispute Resolution

- If a listing is reported as inaccurate (Flag button):
  - Immediate "Under Review" flag applied.
  - Verification team has 48 hours to investigate.
  - Correction applied or listing removed.
