# Phase 2 Manual Implementation Steps

Completion of Phase 2 (Legal & Compliance) requires a few manual actions that cannot be automated.

## 1. Apply Database Migration

The "Claim Listing" feature requires a new table in Supabase.

1.  **Locate the Migration File**:
    `supabase/migrations/20260103_add_partner_terms.sql`
2.  **Open Supabase Dashboard**:
    Go to your project at [supabase.com/dashboard](https://supabase.com/dashboard).
3.  **Go to SQL Editor**:
    Click the **SQL Editor** icon in the left sidebar.
4.  **Run Query**:
    - Copy the entire content of `20260103_add_partner_terms.sql`.
    - Paste it into the SQL Editor.
    - Click **Run**.
    - Confirm you see "Success" in the output.

## 2. Verify Claim Flow

Once the migration is applied, verify the feature in your browser:

1.  Start the app: `npm run dev`
2.  Navigate to any **Unverified** service (L0 or L1).
    - _Tip: Most services starting with "A" in the seed data are likely unverified._
3.  Scroll to "Contact Information" on the right sidebar.
4.  Look for the **"Own this organization?"** section.
5.  Click **"Claim This Listing"**.
6.  **Test the Modal**:
    - Ensure Step 1 shows the "Partner Terms Agreement" box.
    - Check "I agree" and click "Continue".
    - Enter a valid email format in Step 2.
    - Click "Submit Claim".
    - Verify the success toast appears: "Claim request submitted".

## 4. Run Automated Tests

You can verify the code changes by running:

```bash
npx playwright test tests/e2e/accessibility.spec.ts tests/e2e/partner.spec.ts
```
