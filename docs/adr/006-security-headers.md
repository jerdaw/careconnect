# ADR-006: Security Headers and Content Security Policy

**Date:** 2026-01-15  
**Status:** Accepted  
**Context:** Security audit identified missing HTTP security headers

## Decision

Implement comprehensive security headers in `next.config.ts`:

1. **Content-Security-Policy (CSP)**

   - Restricts script, style, image, font, and connection sources
   - Prevents clickjacking via `frame-ancestors 'none'`
   - Allows OneSignal for push notifications
   - Allows Supabase connections (including WebSocket)

2. **Additional Headers**
   - `X-Frame-Options: DENY` — Prevents embedding in iframes
   - `X-Content-Type-Options: nosniff` — Prevents MIME sniffing
   - `Referrer-Policy: strict-origin-when-cross-origin` — Controls referrer info
   - `X-DNS-Prefetch-Control: on` — Enables DNS prefetching for performance
   - `Permissions-Policy` — Disables camera, microphone; restricts geolocation to self

## Rationale

- Defense-in-depth against XSS, clickjacking, and data injection
- Required for security compliance and penetration testing
- `unsafe-inline` and `unsafe-eval` needed for Next.js/React compatibility

## Consequences

- Third-party scripts must be explicitly allowlisted in CSP
- Inline styles work but external stylesheets must come from allowed sources
- Future integrations will need CSP updates

## Related

- [SECURITY_AUDIT.md](../audits/SECURITY_AUDIT.md)
- [next.config.ts](/next.config.ts)
