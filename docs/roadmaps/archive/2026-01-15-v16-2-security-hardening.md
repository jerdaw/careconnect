# v16.2: Security Hardening

**Date:** 2026-01-15  
**Status:** Completed  
**Objective:** Address high and medium priority security findings from the comprehensive security audit.

## Scope

- [x] **Content Security Policy**: Implemented restricted CSP in `next.config.ts`.
- [x] **XSS Prevention**: Added HTML escaping to `highlightMatches` utility.
- [x] **SQL Injection Mitigation**: Escaped ILIKE wildcards in search API endpoints.
- [x] **Password Policy**: Strengthened Supabase password requirements (8+ chars, alphanumeric).
- [x] **Dependency Security**: Added `npm audit` to the CI pipeline.
- [x] **Documentation**: Created ADR-006 and updated `SECURITY_AUDIT.md`.
- [x] **Verification**: Added 20 new unit tests for security features.

## Success Criteria

- ✅ 0 high/medium vulnerabilities in audit.
- ✅ All security headers present in production build.
- ✅ No XSS possible through service names/descriptions.
- ✅ CI fails on high-priority npm vulnerabilities.

## Implementation Details

- **Files**: `next.config.ts`, `lib/search/highlight.ts`, `app/api/v1/services/route.ts`, `app/api/v1/search/services/route.ts`, `supabase/config.toml`, `.github/workflows/ci.yml`.
- **Tests**: `tests/lib/highlight.test.ts`, `tests/lib/escape-ilike.test.ts`.

## Related

- [SECURITY_AUDIT.md](../../audits/SECURITY_AUDIT.md)
- [ADR-006: Security Headers](../../adr/006-security-headers.md)
