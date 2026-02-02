# Roadmap V2: Community Expansion & Technical Maturity

> **Status:** Completed
> **Focus:** Generalizing for Kingston Community, Bilingual Support, and Data Completion.

## Phase 2: Community Expansion (Current)

The goal of Phase 2 is to transition from a student-focused pilot to a general community resource for all Kingston residents.

### 2.1 Audience Shift (Completed)

- [x] Remove "Student/Queen's" branding from landing page.
- [x] Sanitize `services.json` of exclusive campus-only services.
- [x] Update README and documentation to reflect community mission.
- [x] Retarget "Beta" messaging.

### 2.2 Data Verification ("The Kingston 150")

- [ ] Complete the "Kingston 150" dataset (Add remaining ~100 high-impact services).
- [ ] Audit existing data for freshness (verify phone numbers/hours).
- [ ] Implement automated link checking.

### 2.3 Bilingual Foundations

- [ ] Implement `next-intl` routing.
- [ ] Extract hardcoded UI strings to `messages/en.json`.
- [ ] Translate core UI path to French (`messages/fr.json`).
- [ ] _Stretch:_ Auto-translate service descriptions (with manual review flag).

### 2.4 EDIA Review & Upgrade (New)

- [ ] Conduct reduced-barrier accessibility audit (WCAG AA).
- [ ] Review content for inclusive language and representation.
- [ ] Publish Transparency Statement / EDIA findings.

### 2.5 Privacy & Trust Verification (New)

- [ ] Formal "No-Tracking" Audit (Cookies/Network).
- [ ] Add visible Privacy Badge to UI.
- [ ] Publish plain-language Privacy Policy.

---

## Phase 3: Technical Maturity (Q3 2025)

### 3.1 Progressive Web App (PWA) (Active)

- [ ] Install PWA support (Service Workers).
- [ ] Create Manifest and Icons.
- [ ] Verify installability (Lighthouse).

### 3.2 Feedback Loop (Active)

- [ ] Replace `mailto` links with structured feedback forms.
- [ ] Implement "Report Inaccurate Information" button on service cards.

### 3.3 Partner Portal (Concept) (Active)

- [ ] Design simple auth flow for Service Providers.
- [ ] Allow claim/edit functionality for verified organizations.

---

## Archive

- [v1-pilot](2025-12-01-v1-pilot.md): Initial Queen's University focused pilot (Completed Dec 2024).
