# Security Headers Validation

## Overview

CareConnect implements comprehensive security headers to protect against common web vulnerabilities. The security headers are automatically validated in CI to prevent misconfigurations.

## Configured Security Headers

All security headers are defined in `next.config.ts` and applied to every route via Next.js middleware.

### Content-Security-Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded.

**Current Policy**:

```text
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://onesignal.com https://cdn.onesignal.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

**Rationale**:

- `default-src 'self'`: Only load resources from same origin by default
- `script-src 'unsafe-inline' 'unsafe-eval'`: Required for Next.js runtime and WebLLM AI features
- `frame-ancestors 'none'`: Prevents clickjacking (equivalent to X-Frame-Options: DENY)
- `connect-src` allows Supabase and OneSignal for backend services

**Known Warnings**:

- ⚠️ `'unsafe-inline'` in script-src - required for Next.js inline scripts
- ⚠️ `'unsafe-eval'` in script-src - required for WebLLM AI engine

**Future Improvements**:

- Consider CSP nonces for inline scripts to remove `'unsafe-inline'`
- Evaluate if WebLLM can work with stricter CSP (may not be possible)

### X-Frame-Options

**Purpose**: Prevents clickjacking attacks.

**Value**: `DENY`

**Rationale**: Completely disallows embedding the application in iframes. This is the most secure option since we don't need iframe embedding.

**Redundancy**: Also enforced via CSP `frame-ancestors 'none'` for modern browsers.

### X-Content-Type-Options

**Purpose**: Prevents MIME sniffing attacks.

**Value**: `nosniff`

**Rationale**: Forces browsers to respect the `Content-Type` header instead of guessing content types, preventing execution of malicious files disguised as safe types.

### Referrer-Policy

**Purpose**: Controls how much referrer information is sent with requests.

**Value**: `strict-origin-when-cross-origin`

**Rationale**:

- Same-origin requests: Full URL sent
- Cross-origin HTTPS→HTTPS: Origin only
- HTTPS→HTTP: No referrer (security downgrade protection)

**Alternative**: `no-referrer` for maximum privacy (would break some analytics)

### X-DNS-Prefetch-Control

**Purpose**: Controls browser DNS prefetching for performance.

**Value**: `on`

**Rationale**: Allows browser to prefetch DNS for external resources (Supabase, OneSignal) to improve loading speed.

### Permissions-Policy

**Purpose**: Controls browser feature access.

**Value**: `camera=(), microphone=(), geolocation=(self), interest-cohort=()`

**Rationale**:

- `camera=()`: Disable camera access (not needed)
- `microphone=()`: Disable microphone access (not needed)
- `geolocation=(self)`: Allow geolocation only from same origin (used for proximity search)
- `interest-cohort=()`: Opt out of Google FLoC tracking

### Strict-Transport-Security (HSTS)

**Purpose**: Enforces HTTPS connections.

**Value**: `max-age=63072000; includeSubDomains; preload`

**Rationale**:

- `max-age=63072000`: 2 years (recommended for preload list)
- `includeSubDomains`: Protect all subdomains
- `preload`: Eligible for Chrome's HSTS preload list

**Requirements**:

- Only enable in production with valid SSL certificate
- Minimum `max-age` should be 1 year (31536000 seconds)
- Use caution: Once preloaded, reverting requires browser updates

## Validation

### Automated Validation

Security headers are validated automatically in CI via:

```bash
# Validate configured headers in next.config.ts
npm run validate:security-headers

# Validate live response headers from a running app
SECURITY_HEADERS_BASE_URL=http://127.0.0.1:3000 npm run validate:security-headers:runtime
```

**What It Checks**:

- ✅ All required headers are present
- ✅ Header values match expected formats
- ✅ CSP directives are complete and correct
- ✅ HSTS max-age meets minimum threshold (1 year)
- ✅ Permissions-Policy restricts dangerous features

**CI Integration**:

The validation runs as part of the `static-analysis` job in `.github/workflows/ci.yml`. If validation fails, the CI build is blocked.

Runtime validation also runs in `.github/workflows/production-smoke.yml` against the deployed `https://careconnect.ing` responses.

### Manual Validation

Run locally before committing security header changes:

```bash
# Validate next.config.ts security header configuration
npm run validate:security-headers

# Start the app in another terminal
npm run dev

# Validate live response headers from the running app
SECURITY_HEADERS_BASE_URL=http://127.0.0.1:3000 npm run validate:security-headers:runtime
```

Use `SECURITY_HEADERS_PATHS` to override the checked routes if needed:

```bash
SECURITY_HEADERS_BASE_URL=http://127.0.0.1:3000 \
SECURITY_HEADERS_PATHS=/en,/api/v1/health \
npm run validate:security-headers:runtime
```

### Browser Testing

**Chrome DevTools**:

1. Open DevTools → Network tab
2. Load the page
3. Click on the document request
4. View Response Headers section
5. Verify all security headers are present

**Security Headers Analyzer**:

- [Security Headers](https://securityheaders.com/) - Online header scanner
- [Mozilla Observatory](https://observatory.mozilla.org/) - Comprehensive security scan

**Note**: Browser HSTS enforcement still requires HTTPS, but the runtime validator checks whether the header is present on responses.

## Modifying Security Headers

### When to Modify

Only modify security headers if:

- ✅ Adding a new trusted external service (update CSP `connect-src`)
- ✅ Fixing a security vulnerability
- ✅ Complying with new security standards
- ✅ Responding to security audit findings

**DO NOT modify** for convenience or to "make something work" without understanding security implications.

### How to Modify

1. **Read the documentation** for the specific header you're modifying
2. **Understand the security trade-offs** of your change
3. **Update `next.config.ts`**:

   ```typescript
   const securityHeaders = [
     {
       key: "Content-Security-Policy",
       value: [
         "default-src 'self'",
         // Add your changes here
       ].join("; "),
     },
     // ...
   ]
   ```

4. **Run validation**:

   ```bash
   npm run validate:security-headers
   SECURITY_HEADERS_BASE_URL=http://127.0.0.1:3000 npm run validate:security-headers:runtime
   ```

5. **Test in browser** - verify the change doesn't break functionality
6. **Document the change** - update this file with rationale
7. **Commit with clear message**:

   ```bash
   git commit -m "security: update CSP to allow new-service.com

   - Added https://new-service.com to CSP connect-src
   - Required for [feature name]
   - Validated with security-headers.com
   "
   ```

### Common Changes

#### Adding a New External Service to CSP

**Example**: Adding a new analytics service `https://analytics.example.com`

```typescript
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://analytics.example.com", // Added analytics
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://onesignal.com https://cdn.onesignal.com https://analytics.example.com", // Added analytics
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  // ...
]
```

**Checklist**:

- [ ] Add domain to relevant CSP directives (script-src, connect-src, etc.)
- [ ] Use HTTPS URLs only
- [ ] Be as specific as possible (avoid wildcards like `https://*`)
- [ ] Document why this service is needed
- [ ] Validate with `npm run validate:security-headers`

#### Enabling iframe Embedding (Not Recommended)

If you **must** allow iframe embedding (e.g., for embeddable widgets):

```typescript
{
  key: "Content-Security-Policy",
  value: [
    // ...
    "frame-ancestors https://trusted-site.com", // Replace 'none' with specific domains
  ].join("; "),
},
{
  key: "X-Frame-Options",
  value: "ALLOW-FROM https://trusted-site.com", // Or remove this header
}
```

**Warning**: This significantly weakens clickjacking protection. Only allow specific, trusted domains.

#### Adjusting Referrer Policy

For stricter privacy (breaks some analytics):

```typescript
{
  key: "Referrer-Policy",
  value: "no-referrer", // No referrer sent to any site
}
```

For more permissive policy (less privacy):

```typescript
{
  key: "Referrer-Policy",
  value: "no-referrer-when-downgrade", // Default browser behavior
}
```

## Troubleshooting

### Validation Fails in CI

**Error**: `Missing required CSP directive: script-src`

**Cause**: CSP is malformed or incomplete in `next.config.ts`

**Fix**:

1. Check `next.config.ts` syntax (missing comma, bracket, etc.)
2. Ensure all required CSP directives are present
3. Run `npm run validate:security-headers` locally to debug

### Headers Not Applied in Browser

**Symptom**: Security headers missing when inspecting in DevTools

**Possible Causes**:

1. **Cached response** - Hard refresh with Ctrl+Shift+R (Chrome) or Cmd+Shift+R (Mac)
2. **Service Worker override** - Disable service worker in DevTools → Application → Service Workers
3. **Proxy/CDN stripping headers** - Check headers before CDN (use curl to origin server)
4. **Next.js not applying headers** - Verify `async headers()` function in `next.config.ts`

**Debug**:

```bash
# Check headers in dev server
npm run dev
curl -I http://localhost:3000

# Check headers in production build
npm run build
npm run start
curl -I http://localhost:3000
```

### CSP Blocking Resources

**Symptom**: Console errors like `Refused to load script from 'https://example.com' because it violates CSP`

**Cause**: CSP policy doesn't allow the resource

**Fix**:

1. **Identify the resource domain** from the console error
2. **Determine if it's necessary** - remove if not needed
3. **Add to CSP** if necessary (see "Adding a New External Service" above)
4. **Use nonce or hash** for inline scripts (advanced - requires Next.js configuration)

**Example Console Error**:

```text
Refused to load script from 'https://cdn.example.com/script.js'
because it violates the following Content Security Policy directive:
"script-src 'self' 'unsafe-inline'".
```

**Fix**: Add `https://cdn.example.com` to `script-src`:

```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://cdn.example.com",
```

### HSTS Not Working Locally

**Symptom**: HSTS header not enforced in browser during local development

**Cause**: HSTS only applies to HTTPS connections. `localhost` uses HTTP.

**Expected Behavior**: This is normal. HSTS will work in production with SSL.

**Testing HSTS Locally** (advanced):

1. Set up local SSL certificate (mkcert, etc.)
2. Run Next.js with HTTPS
3. Test with `curl -I https://localhost:3000`

## Security Checklist

Before deploying security header changes:

- [ ] All required headers are present
- [ ] `npm run validate:security-headers` passes
- [ ] Manual browser testing completed
- [ ] No console CSP errors
- [ ] External security scan performed (securityheaders.com)
- [ ] Changes documented in this file
- [ ] Security implications understood and accepted
- [ ] Code reviewed by another developer

## References

### Standards & Specifications

- [MDN Web Docs: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Docs: HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)

### Testing Tools

- [Security Headers](https://securityheaders.com/) - Header scanner with grade
- [Mozilla Observatory](https://observatory.mozilla.org/) - Comprehensive security scan
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Google's CSP analyzer

### Best Practices

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Chrome HSTS Preload List](https://hstspreload.org/)
- [CSP Best Practices](https://web.dev/articles/csp)

### Related Documentation

- `next.config.ts` - Security headers configuration
- `scripts/validate-security-headers.ts` - Validation script
- `.github/workflows/ci.yml` - CI integration
- `docs/architecture.md` - Overall system architecture

## Changelog

### 2026-02-12 - Initial Security Headers Configuration

- ✅ Implemented all required security headers
- ✅ Added automated validation in CI
- ✅ Documented security headers and validation process
- ⚠️ CSP includes `'unsafe-inline'` and `'unsafe-eval'` (required for Next.js + WebLLM)

### Future Improvements

- [ ] Implement CSP nonces to remove `'unsafe-inline'` from script-src
- [ ] Evaluate stricter CSP for production vs. development
- [ ] Add Content-Security-Policy-Report-Only for monitoring violations
- [ ] Consider Subresource Integrity (SRI) for external scripts
- [ ] Implement Feature-Policy (deprecated, use Permissions-Policy)
