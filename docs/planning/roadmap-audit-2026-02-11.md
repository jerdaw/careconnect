# Roadmap Comprehensive Audit & Update (2026-02-11)

## Summary

Based on comprehensive codebase audit completed 2026-02-11, all findings have been integrated into the roadmap as **v20.0 (Technical Excellence & Testing)** and **v21.0 (Production Deployment & Admissions Portfolio)**.

**Total Items Added**: 76

- **v20.0**: 38 autonomous AI agent tasks (~100-120h)
- **v21.0**: 38 OMSAS/CanMEDS admissions improvements (~40-50h autonomous + 20-30h human)

---

## Audit Findings

### Current State (As of 2026-02-11)

**Project Maturity**: Late prototype / pre-beta

- 196 manually curated services
- 275 commits over 44 days (solo developer + AI pair programming)
- NOT deployed to production
- NO real-world usage metrics
- NO external partners or user validation

**Test Coverage**:

- 713 passing tests across 135 test files
- **Statement Coverage: 53.72%** (target: 75%) — **FAILING**
- Branch Coverage: 80.69% ✅
- Function Coverage: 81.71% ✅
- Gaps:
  - 72% of components untested (61/85 files)
  - 4 critical utility functions untested (geo, fuzzy, synonyms, query-expander)
  - 7 E2E tests skipped (documented limitations)

**Code Quality**:

- 9 remaining `console.*` calls (should use `logger.*`)
- 26 ESLint disable directives
- 5 TODOs in production code
- Direct `process.env` access in 4 files (bypasses validation)

**i18n/Data Quality**:

- French coverage: 100% core, 0% advanced fields
- 5 non-EN/FR locales missing ~2 keys each
- 58/196 services missing coordinates (30%)
- 161/196 services missing email (82%)
- 109/196 services missing identity tags (56%)
- 125/196 services missing French synthetic queries (64%)

**Documentation**:

- 205 markdown files (~73.5k lines) — **EXCELLENT**
- 20 ADRs, 5 runbooks, comprehensive governance
- Missing: 2 template files, admin ops guide, developer onboarding, GDPR docs

**Deployment**:

- No production deployment
- No custom domain
- No usage metrics
- No uptime monitoring
- No real users

---

## v20.0: Technical Excellence & Testing

**Priority**: HIGH (Pre-Production Requirement)
**Effort**: ~100-120 hours (AI-autonomous)
**Timeline**: 2-4 weeks
**Dependencies**: None

### Categories

**A. Code Quality & Type Safety** (~15h)

- A1: Replace console._ with logger._ (1-2h)
- A2: Reduce ESLint disable directives (4-6h)
- A3: Harden update-request validation (1h)
- A4: Migrate process.env to lib/env.ts (2-3h)
- A5: Harden CSV import validation (2-3h)
- A6: Remove unused code (1h)

**B. Test Coverage** (~60h) — LARGEST GAP

- B1: Unit tests for search utilities (6-8h)
- B2: Tests for 4 untested API routes (4-6h)
- B3: Test for useRBAC hook (1-2h)
- B4: Critical component tests (8-12h)
- B5: Smoke tests for 40+ components (10-15h)
- B6: Fix 7 skipped E2E tests (6-8h)
- B7: Error scenario tests (6-8h)
- B8: Feedback workflow integration test (3h)
- B9: Service update integration test (3h)

**C. i18n & Data Enrichment** (~20h)

- C1: Backfill 2 missing i18n keys (1-2h)
- C2: French synthetic queries for 125 services (3-4h)
- C3: Expand crisis keywords (1-2h)
- C4: Expand synonym dictionary (2-3h)
- C5: Populate access_script_fr (4-6h)
- C6: Auto-generate hours_text_fr (2-3h)

**D. Documentation Gaps** (~15h)

- D1: Missing template files (1-2h)
- D2: Admin operations guide (3-4h)
- D3: Developer onboarding guide (2-3h)
- D4: GDPR compliance docs (2-3h)
- D5: Database migration procedures (2-3h)
- D6: Performance baselines (2-3h)

**E. CI/CD & DevOps** (~10h)

- E1: Git tags for versions (1h)
- E2: Security header validation in CI (2-3h)
- E3: Coverage threshold enforcement (1h)
- E4: GitHub release notes (2h)
- E5: Dependabot/Renovate setup (1-2h)
- E6: Bundle size tracking (1h)

**F. Security & Privacy** (~6h)

- F1: OWASP dependency-check in CI (2h)
- F2: Automated CSP header validation (2h)
- F3: Rate limiting tests for all endpoints (2-3h)

**G. Code Architecture** (~10h)

- G1: Move AI metadata to Supabase (4-6h)
- G2: Extract shared enhancer function (2h)
- G3: Data quality dashboard (4-6h)

**Success Criteria**:

- ✅ Test coverage ≥75% statements
- ✅ Zero console.\* in production code
- ✅ All E2E tests passing or documented
- ✅ French coverage: 100% core, 90%+ advanced
- ✅ Git tags for all versions
- ✅ Security scanning in CI

---

## v21.0: Production Deployment & Admissions Portfolio

**Priority**: CRITICAL (Admissions Impact)
**Effort**: ~40-50h autonomous + 20-30h human
**Timeline**: 12 weeks
**Dependencies**: v20.0 completion

### Phase Breakdown

**Phase 1: Production Deployment** (Week 1) — HUMAN REQUIRED

- #1: Deploy to production + custom domain (2-3h + 1 day DNS)
- #29: Automated uptime monitoring (1-2h)

**Phase 2: Usage Metrics & Evidence** (Week 2) — AUTONOMOUS

- #2: Real usage metrics collection (4-6h)
- #6: Public impact page (3-4h)
- #10: CI badges in README (1h)
- #11: Documentation portal (2-3h)

**Phase 3: Scholarship & Professional Artifacts** (Weeks 3-4) — AUTONOMOUS

- #7: Publish privacy whitepaper (1-2 days)
- #14: Document AIA prominently (1-2h)
- #16: Data governance policy (3-4h)
- #23: AI-assisted dev methodology (1-2 days)

**Phase 4: Quality & Compliance** (Weeks 3-4) — AUTONOMOUS

- #9: WCAG 2.1 AA formalization (4-8h)
- #13: GitHub releases with tags (2h)
- #15: Ethics review process (3h)
- #24: API documentation (2-3h)

**Phase 5: Performance & Monitoring** (Weeks 4-5) — AUTONOMOUS

- #19: Data quality dashboard (4-6h)
- #20: Load/performance test (2-3h)
- #25: Penetration test (4-6h)

**Phase 6: Communication Artifacts** (Weeks 5-6) — AUTONOMOUS

- #5: ABS-format project summary (2-3h)
- #18: One-page project brief (2h)
- #21: Presentation/poster (4-6h)
- #36: Project logo/brand (2h)
- #37: 2-minute demo video (1-2h)
- #38: Acknowledgments page (1-2h)

**Phase 7: Data Enrichment** (Weeks 6-8) — AUTONOMOUS

- #22: French advanced field translation (6-8h)
- #26: Identity tags backfill (4-6h — needs human review)
- #27: Geocode 58 services (1h)

**Phase 8: Governance & Operational Excellence** (Weeks 7-9) — AUTONOMOUS

- #17: PR-based workflow (1h setup)
- #28: Incident response tabletop (3h)
- #30: CODE_OF_CONDUCT.md (30 min)
- #31: Stakeholder map (2h)
- #32: A11y testing methodology (2-3h)
- #33: Risk register (2-3h)
- #34: License compliance CI (1-2h)
- #35: Lessons learned doc (3h)

**Phase 9: Human-Dependent High-Value** (Weeks 3-12) — REQUIRES HUMAN

- #3: Formal community partner (2-4 weeks outreach)
- #4: User testing session n=5 (1-2 weeks)
- #8: Advisory board formalization (2-4 weeks)

### OMSAS/CanMEDS Mapping

**Health Advocate**:

- #22: French translation (equity, FLSA compliance)
- #26: Identity tags (vulnerable populations)

**Leader**:

- #1: Production deployment (system launch)
- #3: Partner endorsement (stakeholder engagement)
- #28: Tabletop exercise (operational maturity)

**Collaborator** (HIGHEST VALUE):

- #3: Partner endorsement letter/MOU

**Scholar**:

- #4: Usability study (evaluation methodology)
- #7: Published whitepaper (scholarly output)
- #35: Lessons learned (reflective practice)

**Professional**:

- #9: WCAG compliance (legal/ethical responsibility)
- #15: Ethics review (ethical AI governance)
- #25: Penetration test (security diligence)

**Success Criteria**:

- ✅ Live production URL with 30+ days uptime >99%
- ✅ One formal partner endorsement letter
- ✅ Usability study report (n=5)
- ✅ Published whitepaper
- ✅ Advisory board meeting minutes
- ✅ Complete admissions portfolio (ABS, brief, deck, video)

---

## Roadmap Integration

All 76 items have been added to `docs/planning/roadmap.md`:

**Section Updates**:

1. **Current State** — Updated with audit findings (test coverage, data quality, deployment status)
2. **v20.0** — Technical Excellence & Testing (38 items, ~100-120h)
3. **v21.0** — Production Deployment & Admissions Portfolio (38 items, ~60-80h)
4. **v22.0** — Renamed from previous v20.0 (Post-Launch Search Quality)

**Impact on Existing Roadmap**:

- v19.0: Launch Preparation — UNCHANGED (awaiting user execution)
- v18.0: Production Observability — UNCHANGED (complete)
- Data Quality & Enrichment — UNCHANGED (ongoing manual work)

---

## Critical Path to Production

### Immediate Priorities (P0)

**From v20.0**:

1. A1: Replace console._ with logger._ (1-2h)
2. A3: Harden update-request validation (1h)
3. C1: Backfill i18n keys (1-2h)
4. C3: Expand crisis keywords (1-2h)

**Effort**: ~5h
**Impact**: Pre-launch code quality blockers

### High-Value Quick Wins (P1)

**From v20.0**:

- B1: Search utility tests (6-8h)
- B2: API route tests (4-6h)
- B3: useRBAC test (1-2h)
- C2: French synthetic queries (3-4h)
- C5: access_script_fr translation (4-6h)
- D1: Template files (1-2h)

**Effort**: ~20-30h
**Impact**: Test coverage boost, French equity, documentation completeness

**From v21.0** (depends on deployment):

- #1: Production deployment (2-3h + domain)
- #6: Impact page (3-4h)
- #10: README badges (1h)
- #11: Docs portal (2-3h)

**Effort**: ~10-15h
**Impact**: Project becomes live + professional presentation

### Coverage Push (P2)

**From v20.0**:

- B4: Critical components (8-12h)
- B5: 40+ component smoke tests (10-15h)
- B6: Fix E2E tests (6-8h)
- B7: Error scenarios (6-8h)

**Effort**: ~30-45h
**Impact**: Achieve 75% coverage target

---

## Autonomous vs. Human Requirements

### Fully Autonomous (AI Agents)

**From v20.0**: All 38 items (100%)
**From v21.0**: 35/38 items (92%)

**Total Autonomous Work**: ~140-170 hours

### Requires Human Intervention

**From v21.0**:

- #1: Production deployment (account setup, domain purchase)
- #3: Partner endorsement (outreach, relationship building)
- #4: Usability study (participant recruitment, real sessions)
- #8: Advisory board (advisor recruitment, meeting facilitation)
- #26: Identity tag backfill (human review of AI suggestions)
- #27: Geocoding (OPENCAGE_API_KEY acquisition)

**Total Human Work**: ~20-30 hours + 4-8 weeks timeline

---

## Admissions Impact Analysis

### Current State (No Evidence)

- No production deployment → "I built a project"
- No usage metrics → Can't quantify impact
- No partners → No external validation
- No user testing → No evaluation evidence
- Solo commits → No collaboration artifacts

### After v21.0 Completion

- **Production deployment** → "I launched and operate a service"
- **30 days metrics** → "Served X searches, Y crisis interventions"
- **Partner letter** → External validation from Kingston CHC/211 Ontario
- **Usability study** → Methodological rigor (CanMEDS Scholar)
- **Advisory board** → Stakeholder engagement (CanMEDS Leader/Collaborator)
- **Published whitepaper** → Scholarly contribution
- **Professional portfolio** → ABS, brief, deck, video, logo, demo

**Transformation**: Portfolio project → Deployed community tool with validated impact

---

## Recommended Execution Order

### Sprint 1 (Week 1): Pre-Launch Hygiene

1. Run v20.0 P0 tasks (A1, A3, C1, C3) — 5h
2. Deploy to production (#1) — 3h + domain
3. Set up uptime monitoring (#29) — 2h
4. Create impact page (#6) — 4h
5. Add README badges (#10) — 1h
   **Total**: ~15h + domain setup

### Sprint 2 (Week 2): Test Coverage Push

1. B1: Search utility tests — 8h
2. B2: API route tests — 6h
3. B3: useRBAC test — 2h
4. B4: Critical component tests — 10h
   **Total**: ~26h

### Sprint 3 (Week 3): French Equity & Documentation

1. C2: French synthetic queries — 4h
2. C5: access_script_fr — 6h
3. C6: hours_text_fr — 3h
4. D2-D6: Documentation guides — 12h
   **Total**: ~25h

### Sprint 4 (Week 4): Scholarship Artifacts

1. #7: Publish whitepaper — 12h
2. #23: AI methodology doc — 10h
3. #5: ABS summary — 3h
4. #18: Project brief — 2h
   **Total**: ~27h

### Sprint 5-12 (Weeks 5-12): Remaining v20.0 + v21.0

- Complete B5-B9 (component tests, E2E fixes, integration tests) — 30h
- Complete E1-E6, F1-F3, G1-G3 (CI/security/architecture) — 25h
- Complete #9-#38 from v21.0 (compliance, monitoring, communication) — 35h
- **Human work**: Partner outreach, usability study, advisory board — 20-30h over 8 weeks
  **Total**: ~110h

**Grand Total**: ~200h autonomous + 30h human across 12 weeks

---

## Success Metrics

### Technical Excellence (v20.0)

- [ ] Test coverage ≥75% statements
- [ ] Zero console.\* calls
- [ ] All E2E tests passing or documented
- [ ] French coverage: 100% core, 90%+ advanced
- [ ] CI passing with coverage enforcement
- [ ] Git tags for all versions

### Production Evidence (v21.0)

- [ ] Live URL operational
- [ ] 30 days uptime >99%
- [ ] Monthly usage reports (3+ months)
- [ ] Partner endorsement letter
- [ ] Usability study report
- [ ] Advisory board minutes

### Portfolio Completeness (v21.0)

- [ ] ABS-ready STAR narrative
- [ ] One-page project brief PDF
- [ ] 10-slide presentation deck
- [ ] 2-minute demo video
- [ ] Published whitepaper
- [ ] Public docs site
- [ ] Professional README

---

## Files Modified

- **Primary**: `/docs/planning/roadmap.md`
  - Updated "Current State" with audit findings
  - Added v20.0: Technical Excellence & Testing (38 items)
  - Added v21.0: Production Deployment & Admissions Portfolio (38 items)
  - Renamed previous v20.0 to v22.0

- **Created**: `/docs/planning/roadmap-audit-2026-02-11.md` (this file)
  - Comprehensive audit summary
  - Execution recommendations
  - Success metrics

---

## Next Steps

1. **Review roadmap updates**: Read `roadmap.md` to understand all 76 items
2. **Prioritize**: Decide on execution order (recommended order above)
3. **Start with P0**: Complete 5h of pre-launch hygiene (A1, A3, C1, C3)
4. **Deploy**: Execute #1 (production deployment) to unlock usage metrics
5. **Execute sprints**: Follow recommended sprint plan or customize based on priorities

**Key Decision Points**:

- Domain purchase for production deployment ($15/year)
- OPENCAGE_API_KEY for geocoding (free tier available)
- Partner outreach timing (weeks 3-6 recommended)
- Usability study participant recruitment (weeks 4-6)
- Advisory board recruitment (weeks 6-10)

---

## Audit Credits

**Conducted**: 2026-02-11
**Scope**: Comprehensive codebase analysis via 6 parallel AI agents

- Project structure exploration
- Git history analysis
- Documentation & governance review
- Security & accessibility analysis
- Test coverage gaps analysis
- Data & i18n completeness analysis
- TODOs & incomplete work audit

**Output**: 76 actionable improvements with effort estimates, dependencies, and admissions impact analysis

**Integration**: All findings incorporated into roadmap with clear categorization, success criteria, and execution guidance
