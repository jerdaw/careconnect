# Kingston Care Connect: Product Roadmap

> **Current Version**: v17.6 (Authorization Resilience Complete)
> **Last Updated**: 2026-01-25
> **Platform Status**: Production-Ready with Comprehensive Resilience

## 📊 Current State

- **Services**: ~196 curated social services (run `npm run audit:data` for exact count)
- **Test Coverage**: 100% for resilience layer, 95%+ for eligibility, 85%+ for AI, 65%+ for search
- **Load Testing**: Baseline metrics established, k6 infrastructure in place
- **Resilience**: Circuit breaker protection on all database operations
- **Security**: Multi-layered authorization with tiered fail-safe strategy
- **Accessibility**: WCAG 2.1 AA compliant
- **Languages**: 7 locales (EN, FR, ZH-Hans, AR, PT, ES, PA)
- **Offline-Ready**: PWA with IndexedDB fallback and background sync

---

## 🎯 Active Work

### Data Quality & Enrichment (Manual Process)

**Status**: Ongoing (Manual Work)
**Priority**: LOW
**Effort**: User-driven at own pace

Follow-up on verification levels and French translation of access scripts. This is manual data curation work separate from technical feature development.

#### Current Data Quality Gaps

Run `npm run audit:data` to refresh current counts:

- ~18/196 services missing coordinates (impacts proximity search)
- ~17/196 services missing verified physical address
- ~10/196 services missing structured hours
- 0/196 services at L3 verification (provider-confirmed partnerships)

#### Available Tools

**Translation Helper (v17.6)**:
```bash
npm run translate:prompt <batch-file>   # Generate translation prompts
npm run translate:parse <batch> <response>  # Parse AI responses
npm run translate:validate <batch>      # Validate translations
```

**Data Auditing**:
```bash
npm run audit:data           # Current service count and gaps
npm run bilingual-check      # Verify French completeness
npm run check-staleness      # Find services needing re-verification
```

#### Tasks (User-driven)

- [ ] Translate `access_script_fr` for remaining services (batch process)
- [ ] Web-verify 17 missing addresses (no provider contact required)
- [ ] Web-verify 10 missing hours (no provider contact required)
- [ ] Run geocoding for verified addresses: `OPENCAGE_API_KEY=... npm run geocode`
- [ ] Future: Establish first 10 L3 partnerships (requires provider outreach)
- [ ] Future: Expand underrepresented categories (Transport, Financial, Indigenous)

📄 [Historical Context](archive/2026-01-23-v17-5-data-quality.md)

---

## ✅ Completed Work

Production-readiness complete (v17.0–v17.6). Platform is resilient, secure, accessible, and performant. See [archive/](archive/) for full implementation details.

### Recent Releases

- **[v17.6: Authorization Resilience](archive/2026-01-25-v17-6-post-v17-5-enhancements.md)** (2026-01-25)
  - **4 phases complete**: Load testing baselines, circuit breaker integration tests, translation workflow, authorization protection
  - Tiered circuit breaker protection for all 6 authorization functions
  - Fail-secure strategy (high risk) vs fail-open with safe defaults (low risk)
  - 9 circuit breaker integration tests (all passing)
  - 7 translation helper unit tests (all passing)
  - French translation workflow automation (`translate:prompt`, `translate:parse`, `translate:validate`)
  - k6 load testing baseline metrics documented
  - ADR-017: Authorization resilience strategy

- **[v17.5: Performance Tracking & Circuit Breaker](archive/2026-01-25-v17-5-performance-and-resilience.md)** (2026-01-25)
  - **Core resilience infrastructure**: Circuit breaker pattern for Supabase database failures
  - Performance tracking system with p50/p95/p99 latency metrics
  - Health check endpoint (`/api/v1/health`) with circuit breaker status
  - Metrics endpoint (`/api/v1/metrics`) for development/staging observability
  - k6 load testing infrastructure (smoke, sustained load, spike tests)
  - 34 new tests (unit + integration), 100% test coverage for resilience layer
  - ADR-016: Performance tracking and circuit breaker pattern
  - Protected operations: search, analytics, service management, offline sync

### Foundation (v17.0–v17.4)

- [v17.4: Dashboard & Partner Portal](archive/2026-01-25-v17-4-dashboard-partner-portal.md)
- [v17.3: Accessibility Compliance](archive/2026-01-20-v17-3-accessibility.md)
- [v17.2: Internationalization](archive/2026-01-20-v17-2-internationalization.md)
- [v17.1: Test Coverage](archive/2026-01-19-v17-1-test-coverage.md)
- [v17.0: Security & Authorization](archive/2026-01-17-v17-0-security-authorization.md)
- [v16.4: High-Value Improvements](archive/2026-01-15-v16-4-high-value-improvements.md)
- [v16.3: Quality & Tooling](archive/2026-01-15-v16-3-quality-tooling-refresh.md)
- [v16.2: Security Hardening](archive/2026-01-15-v16-2-security-hardening.md)
- [v16.0: Search Ranking](archive/2026-01-14-v16-0-search-ranking-enhancements.md)
- [v15.0: Mobile-Ready Infrastructure](archive/2026-01-13-v15-0-mobile-ready-infrastructure.md)
- [v14.0: Impact, Equity & Trust](archive/2026-01-13-v14-0-impact-equity-trust.md)
- [v13.1: AI Compliance](archive/2026-01-12-v13-1-ai-compliance-remediation.md)
- [v13.0: Secure Data Architecture](archive/2026-01-07-v13-0-librarian-model.md)
- [v12.0: Legal & Compliance](archive/2026-01-02-v12-0-legal-compliance.md)
- [v11.0: Scope Expansion](archive/2026-01-08-v11-0-scope-expansion.md)
- [v10.0: Data Architecture](archive/2026-01-02-v10-0-data-architecture.md)

### 🏆 Key Achievements (v17 Cycle)

**Production Readiness Milestones**:
- ✅ **Zero-downtime resilience**: Circuit breaker prevents cascading failures during DB outages
- ✅ **Comprehensive testing**: 150+ tests across unit, integration, E2E, load, and accessibility
- ✅ **Security hardening**: Tiered authorization with fail-secure defaults, RLS policies, XSS prevention
- ✅ **Performance observability**: p50/p95/p99 metrics, health check API, circuit breaker telemetry
- ✅ **Accessibility compliance**: WCAG 2.1 AA, keyboard navigation, screen reader support
- ✅ **International support**: 7 languages with RTL support for Arabic
- ✅ **Mobile-ready**: PWA with offline support, service worker, IndexedDB caching
- ✅ **Developer experience**: Comprehensive documentation, ADRs, testing guides, automated workflows

---

## ⏸️ Paused Work

### v15.1: Mobile App Launch

**Status**: Blocked - Awaiting User Decision
**Blockers**:
- Requires macOS with Xcode for iOS builds
- Requires paid Apple Developer account ($99/year)
- Requires Google Play Developer account ($25 one-time)
- **Total Cost**: $124 first year, then $99/year recurring

**Scope**: Native iOS/Android builds, app store submissions, launch monitoring, production app deployment

**Infrastructure Ready**:
- ✅ Capacitor configuration complete
- ✅ Android project configured
- ✅ iOS project configured (needs macOS to build)
- ✅ PWA fallback fully functional

> [!IMPORTANT]
> **Automation Boundary**: Do not proceed with paid services, special hardware/OS requirements, or major architectural changes without explicit user approval.

---

## 📋 Future Considerations

### Observability & Performance (Post-v17.6)
- Real-time performance monitoring dashboard (visualize circuit breaker state, p50/p95/p99 graphs over time)
- Automated load testing in CI (scheduled weekly k6 runs with automatic baseline comparison)
- Performance regression alerts on pull requests (fail builds if latency degrades >20%)
- Integration with production monitoring (Axiom, Sentry, or Datadog for live metrics)

### Advanced Resilience
- Enhanced circuit breaker features:
  - Per-operation circuit breakers (separate for auth, analytics, services)
  - Dynamic threshold adjustment based on historical failure rates
  - Predictive circuit opening based on latency trends
- Multi-region resilience (database replica failover, geo-distributed load balancing)
- Cached authorization with smart invalidation (Redis/memory cache for 5-10min TTL)

### API & Integration
- GraphQL API (alongside REST for flexible querying and reduced over-fetching)
- Webhooks (event-driven integrations for partner notifications)
- API keys & server-to-server auth (for third-party service integrations)
- Public API documentation (OpenAPI/Swagger spec)

### Data & Content
- Automated data staleness detection (flag services >6 months without verification)
- Community-driven service suggestions (public submission form with moderation queue)
- Multi-language support expansion (add Korean, Ukrainian based on demographic needs)
- Enhanced search: Fuzzy matching, typo tolerance, voice search improvements

---

## 📖 Using This Roadmap

### For Developers
- **Current work**: Focus on "Active Work" section (currently manual data quality tasks)
- **Technical reference**: See "Completed Work" for implementation patterns and ADR links
- **Planning**: Review "Future Considerations" for upcoming features
- **Testing**: Run `npm test` for unit/integration, `npm run test:e2e:local` for E2E

### For Contributors
- Check `CONTRIBUTING.md` for contribution guidelines
- Review ADRs in `docs/adr/` for architectural decisions
- Test commands documented in `CLAUDE.md`
- Follow conventional commits (enforced by commitlint)

### For Stakeholders
- Platform is production-ready with v17.6 completion
- Manual data quality work ongoing at user's pace
- Future features prioritized by impact and feasibility
- Mobile app launch available upon user approval (requires paid accounts)

---

## 🔄 Roadmap Maintenance

- **Update frequency**: After each version release
- **Archive policy**: Completed roadmaps moved to `archive/` directory
- **Metrics refresh**: Run `npm run audit:data` before updating Current State
- **Last reviewed**: 2026-01-25
