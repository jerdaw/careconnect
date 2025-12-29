# Roadmap V3: Partner Platform & Data Sovereignty

> **Status:** Active
> **Focus:** Empowering service providers to manage their own data via a secure Partner Portal.

## Phase 30: Foundation & Infrastructure 🏗️
- [ ] Initialize Supabase project (Auth + Postgres).
- [ ] Migrate `services.json` to Postgres Database.
- [ ] Create Database Types / ORM Layer (Prisma or Kysely).
- [ ] Update `Search` to query DB instead of local JSON.

## Phase 31: Authentication System 🔐
- [ ] Implement Partner Login Page (Magic Link).
- [ ] Create Auth Context / Protected Routes.
- [ ] Implement "Claim Verification" flow (Database policies / RLS).

## Phase 32: Partner Dashboard & Editing ✏️
- [ ] Create Dashboard Layout (Sidebar, User Profile).
- [ ] Implement "My Services" list (CRUD - Read).
- [ ] Implement "Edit Service" form (CRUD - Update).
- [ ] Add "Verification Badge" logic for self-managed services.

## Phase 33: Analytics & Insights 📊
- [ ] secure "View Count" tracking schema.
- [ ] Implement "Analytics Card" on Partner Dashboard.

---

## Archive
- [v1-pilot](archive/v1-pilot.md): Queens Pilot (Dec 2024)
- [v2-community](archive/v2-community-expansion.md): Community Expansion (Jan 2025)
