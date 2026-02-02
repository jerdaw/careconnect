---
status: completed
last_updated: 2026-01-20
owner: jer
tags: [roadmap, v17.0, security, authorization, critical, owasp]
---

# v17.0: Production Readiness - Security & Authorization

**Priority:** CRITICAL (BLOCKING)
**Estimated Effort:** 2-3 weeks (single developer)
**Dependencies:** None (foundational work)
**Standards:** OWASP API Security Top 10 (2023)

## Executive Summary

This release addresses critical security vulnerabilities that **must be resolved before public launch**. The most severe issue is a horizontal privilege escalation bug (OWASP API1:2023 - Broken Object Level Authorization) allowing any authenticated user to modify or delete any service in the database.

**Defense in Depth Strategy:**

1. **Layer 1 (Database):** Supabase Row Level Security (RLS) policies - primary defense
2. **Layer 2 (Application):** Authorization utility with ownership checks - defense in depth
3. **Layer 3 (API Gateway):** Rate limiting and input validation - abuse prevention

## User Review Required

> [!IMPORTANT]
> **BLOCKING SECURITY ISSUE**: The current API allows any authenticated user to modify/delete ANY service, not just their own. This is OWASP API1:2023 (Broken Object Level Authorization) - the #1 API security risk.

> [!WARNING]
> **Rate Limiting Migration**: Moving from in-memory to persistent rate limiting requires either Vercel KV (~$1/mo) or Upstash Redis (free tier). User must approve approach.

> [!NOTE]
> **RLS Policies**: This plan implements RLS as the primary defense. The v17.2 Dashboard plan will extend these policies for partner-specific features.

---

## Phase 0: Database-Level Security (RLS) - PRIMARY DEFENSE

**Goal:** Implement Row Level Security as the first line of defense. Even if application code has bugs, the database prevents unauthorized access.

### 0.1 Enable RLS on Services Table

#### [SQL] Supabase Migration

```sql
-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published services (verification_level > 0)
CREATE POLICY "Public can view published services"
ON services FOR SELECT
USING (verification_level > 0 AND deleted_at IS NULL);

-- Policy: Authenticated users can insert for their organization
CREATE POLICY "Org members can insert services"
ON services FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Policy: Org members can update their org's services
CREATE POLICY "Org members can update own services"
ON services FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'editor')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'editor')
  )
);

-- Policy: Only admins/owners can delete
CREATE POLICY "Org admins can delete own services"
ON services FOR DELETE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

### 0.2 Create Audit Log Table

#### [SQL] Supabase Migration

```sql
-- Audit log for security-sensitive operations
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'service.create', 'service.update', 'service.delete', 'admin.access'
  resource_type TEXT NOT NULL, -- 'service', 'organization', 'user'
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Index for querying by user and resource
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);

-- RLS: Users can only see their own audit logs, admins see all
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### 0.3 Create Organization Members Table (if not exists)

#### [SQL] Supabase Migration

```sql
-- Organization membership with roles
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own org memberships
CREATE POLICY "Users see own memberships"
ON organization_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only org owners/admins can manage members
CREATE POLICY "Org admins manage members"
ON organization_members FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

---

## Phase 1: Application-Level Authorization (Defense in Depth)

**Goal:** Add application-level checks as a second layer of defense. These provide better error messages and logging than RLS alone.

### 1.1 Create Authorization Utility

#### [NEW] lib/auth/authorization.ts

Create a centralized authorization utility for ownership checks:

```typescript
// Proposed interface
export async function assertServiceOwnership(userId: string, serviceId: string): Promise<void>

export async function assertOrganizationMembership(
  userId: string,
  orgId: string,
  requiredRole?: OrganizationRole
): Promise<void>

export async function getEffectivePermissions(
  userId: string,
  resourceType: "service" | "feedback" | "organization"
): Promise<Permission[]>
```

- Centralize all ownership/permission checks
- Throw standardized `AuthorizationError` on failure
- Support role hierarchy: owner > admin > editor > viewer

---

### 1.2 Fix Service Update/Delete Authorization

#### [MODIFY] app/api/v1/services/[id]/route.ts

**Current State (VULNERABLE):**

```typescript
// Line ~45: Only checks if user exists
const {
  data: { user },
} = await supabase.auth.getUser()
if (!user) return createApiError("Unauthorized", 401)
// MISSING: Check if user owns this service!
```

**Required Changes:**

1. Import authorization utility
2. Before PUT: Verify user's organization owns the service
3. Before DELETE: Verify user's organization owns the service
4. Return 403 Forbidden if ownership check fails

**Implementation Steps:**

- [x] Add `org_id` lookup from service record
- [x] Query `organization_members` to verify user membership
- [x] Check role permits the operation (editor+ for edit, admin+ for delete)
- [x] Add test cases for unauthorized access attempts

---

### 1.3 Fix Admin Route Authorization

#### [MODIFY] app/api/admin/save/route.ts

**Current State (WEAK):**

```typescript
if (process.env.NODE_ENV === "production") {
  return NextResponse.json({ error: "Not available" }, { status: 403 })
}
```

**Required Changes:**

- [x] Check for actual admin role, not just environment
- [x] Query user's role from `organization_members` or dedicated `admins` table
- [x] Log admin actions to audit table

#### [MODIFY] app/api/admin/push/route.ts

- [x] Add admin role verification (currently only checks if user exists)
- [x] Validate user has push notification permissions

#### [MODIFY] app/api/admin/reindex/route.ts

- [x] Add admin role verification
- [x] Add audit logging for reindex operations

#### [MODIFY] app/api/admin/data/route.ts

- [x] Add admin role verification

---

## Phase 2: Rate Limiting Persistence

**Goal:** Rate limiting survives serverless cold starts.

### 2.1 Evaluate Storage Options

| Option        | Pros                           | Cons                  | Cost                 |
| ------------- | ------------------------------ | --------------------- | -------------------- |
| Vercel KV     | Native integration, simple     | Vendor lock-in        | ~$1/mo for low usage |
| Upstash Redis | Serverless-friendly, free tier | Additional account    | Free tier: 10K/day   |
| Supabase      | Already integrated             | Not designed for this | Included             |

**Recommendation:** Upstash Redis (free tier sufficient for pilot)

### 2.2 Implement Persistent Rate Limiter

#### [MODIFY] lib/rate-limit.ts

**Current State:**

```typescript
const requests = new Map<string, { count: number; resetTime: number }>()
// In-memory only - resets on cold start
```

**Required Changes:**

1. Create Redis client configuration
2. Implement atomic increment with TTL
3. Fallback to in-memory if Redis unavailable
4. Add connection pooling for performance

#### [NEW] lib/rate-limit/redis-store.ts

- Redis-backed rate limit store
- Atomic operations using INCR + EXPIRE
- Connection health monitoring

#### [MODIFY] .env.example

Add Redis configuration:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Phase 3: API Security Hardening

**Goal:** Secure remaining API endpoints and standardize error handling.

### 3.1 Secure Service Export Endpoint

#### [MODIFY] app/api/v1/services/export/route.ts

**Current State:** Unauthenticated endpoint exposes all service data + embeddings

**Required Changes:**

- [x] Require authentication for full export
- [x] Create separate public endpoint with limited fields (no embeddings)
- [x] Add rate limiting (stricter than search)
- [x] Log export requests for audit

**Alternative:** Split into two endpoints:

- `/api/v1/services/export` - Authenticated, full data + embeddings
- `/api/v1/services/public-export` - Unauthenticated, limited fields

---

### 3.2 Standardize Error Responses

#### [NEW] lib/api/errors.ts

Create standardized error response factory:

```typescript
interface ApiErrorResponse {
  error: {
    code: string // e.g., "UNAUTHORIZED", "FORBIDDEN", "VALIDATION_ERROR"
    message: string // Human-readable message
    details?: unknown // Validation errors, field-specific info
    requestId: string // For log correlation
  }
}
```

#### [MODIFY] lib/api-utils.ts

- [x] Update `createApiError` to use new format
- [x] Add error code constants
- [x] Ensure all routes use standardized format

#### Routes to update:

- [x] `app/api/v1/feedback/route.ts` - Currently returns `{ success: false, message }`
- [x] `app/api/v1/services/route.ts` - Uses correct format
- [x] `app/api/v1/search/services/route.ts` - Uses correct format
- [x] All admin routes

---

### 3.3 Add PATCH Endpoint for Partial Updates

#### [MODIFY] app/api/v1/services/[id]/route.ts

**Add PATCH handler:**

- [x] Accept partial service object
- [x] Validate only provided fields with Zod `.partial()`
- [x] Merge with existing service data
- [x] Same authorization checks as PUT

---

### 3.4 Implement Soft Deletes

#### [MODIFY] types/service.ts

Add soft delete field:

```typescript
interface Service {
  // ... existing fields
  deleted_at?: string | null
  deleted_by?: string | null
}
```

#### [MODIFY] app/api/v1/services/[id]/route.ts

**DELETE handler changes:**

- [x] Set `deleted_at` timestamp instead of hard delete
- [x] Record `deleted_by` user ID
- [x] Return success with warning about soft delete

#### [MODIFY] lib/search/data.ts

- [x] Filter out soft-deleted services in all queries
- [x] Add `includeDeleted` option for admin views

---

## Phase 4: Cleanup & Documentation

### 4.1 Deprecate Legacy Endpoints

#### [MODIFY] app/api/feedback/route.ts

- [x] Add deprecation warning header
- [x] Redirect to `/api/v1/feedback` with 301
- [x] Log deprecation usage for monitoring

### 4.2 Remove Unused Endpoints

#### [DELETE] app/api/v1/submissions/route.ts

- Mock endpoint never implemented
- Remove file entirely

### 4.3 Create ADR

#### [NEW] docs/adr/007-api-authorization.md

Document:

- Authorization model decisions
- Role hierarchy
- Rate limiting strategy
- Error response standardization

---

## Verification Plan

### Automated Tests

#### [NEW] tests/api/authorization.test.ts

Test cases:

- [x] Authenticated user can only modify own organization's services
- [x] Unauthenticated user receives 401 on protected endpoints
- [x] User without ownership receives 403
- [x] Admin can access admin endpoints
- [x] Non-admin receives 403 on admin endpoints
- [x] Rate limiting triggers after threshold
- [x] Soft-deleted services excluded from search

```bash
npm test -- tests/api/authorization.test.ts
```

#### [NEW] tests/lib/rate-limit-redis.test.ts

Test cases:

- [x] Redis store increments correctly
- [x] TTL expires after window
- [x] Fallback to in-memory on Redis failure
- [x] Concurrent requests handled atomically

### Manual Verification

- [x] Create two test users in different organizations
- [x] Verify User A cannot modify User B's services
- [x] Verify rate limiting persists across serverless cold starts
- [x] Verify admin endpoints require admin role
- [x] Test soft delete and verify service hidden from search

### Security Checklist

- [x] Run `npm audit` - zero high/medium vulnerabilities
- [x] Test horizontal privilege escalation (should fail)
- [x] Test rate limit bypass attempts
- [x] Verify error responses don't leak sensitive info
- [x] Check audit logs capture admin actions

---

## File Change Summary

| Action                      | File                                       | Priority |
| --------------------------- | ------------------------------------------ | -------- |
| **Database (Phase 0)**      |                                            |          |
| SQL                         | `supabase/migrations/XXX_rls_services.sql` | P0       |
| SQL                         | `supabase/migrations/XXX_audit_logs.sql`   | P0       |
| SQL                         | `supabase/migrations/XXX_org_members.sql`  | P0       |
| **Application (Phase 1)**   |                                            |          |
| NEW                         | `lib/auth/authorization.ts`                | P0       |
| NEW                         | `lib/auth/audit.ts`                        | P0       |
| MODIFY                      | `app/api/v1/services/[id]/route.ts`        | P0       |
| MODIFY                      | `app/api/admin/save/route.ts`              | P0       |
| MODIFY                      | `app/api/admin/push/route.ts`              | P0       |
| MODIFY                      | `app/api/admin/reindex/route.ts`           | P1       |
| MODIFY                      | `app/api/admin/data/route.ts`              | P1       |
| **Rate Limiting (Phase 2)** |                                            |          |
| NEW                         | `lib/rate-limit/redis-store.ts`            | P1       |
| MODIFY                      | `lib/rate-limit.ts`                        | P1       |
| **API Hardening (Phase 3)** |                                            |          |
| MODIFY                      | `app/api/v1/services/export/route.ts`      | P1       |
| NEW                         | `lib/api/errors.ts`                        | P2       |
| MODIFY                      | `lib/api-utils.ts`                         | P2       |
| MODIFY                      | `app/api/v1/feedback/route.ts`             | P2       |
| MODIFY                      | `types/service.ts`                         | P2       |
| MODIFY                      | `lib/search/data.ts`                       | P2       |
| **Cleanup (Phase 4)**       |                                            |          |
| MODIFY                      | `app/api/feedback/route.ts`                | P3       |
| DELETE                      | `app/api/v1/submissions/route.ts`          | P3       |
| NEW                         | `docs/adr/007-api-authorization.md`        | P3       |
| **Tests**                   |                                            |          |
| NEW                         | `tests/api/authorization.test.ts`          | P0       |
| NEW                         | `tests/api/rls-policies.test.ts`           | P0       |
| NEW                         | `tests/lib/rate-limit-redis.test.ts`       | P1       |

---

## Dependencies

- **External:** Upstash Redis account (free tier) OR Vercel KV
- **Internal:** None - this is foundational work

## Migration Path

1. **Database first:** Run RLS migrations in Supabase (can be done without code deploy)
2. **Test RLS:** Verify policies block unauthorized access in staging
3. **Deploy app:** Authorization utility + audit logging
4. **Enable rate limiting:** After Redis/KV configured
5. **Cleanup:** Deprecation warnings, then removal in next release

## Success Criteria

- [x] Zero horizontal privilege escalation possible (verified by RLS + app tests)
- [x] RLS policies active on all sensitive tables
- [x] All API routes have authorization checks (defense in depth)
- [x] Rate limiting survives cold starts (verified by test)
- [x] Error responses follow standardized format
- [x] All admin actions logged to audit table
- [x] Audit logs queryable by user/resource
- [x] ADR-007 documents decisions

## Security Monitoring (Post-Deploy)

### Recommended Alerts

Set up monitoring for these security events:

| Event                 | Threshold                | Action             |
| --------------------- | ------------------------ | ------------------ |
| Failed auth attempts  | >10/min from same IP     | Rate limit, notify |
| RLS policy denials    | Any                      | Log for review     |
| Admin endpoint access | Any                      | Log + notify       |
| Rate limit exceeded   | >100/hour same user      | Investigate        |
| Audit log gaps        | Missing expected entries | Alert immediately  |

### Audit Log Review Cadence

- **Daily:** Review admin actions
- **Weekly:** Review rate limit violations
- **Monthly:** Full audit log analysis for anomalies

## Rollback Plan

If issues discovered post-deploy:

1. **RLS breaking app:** Temporarily disable specific policy (not all RLS)
2. **Authorization bugs:** Revert to previous route handlers, RLS still protects
3. **Rate limiting issues:** Fallback automatically uses in-memory
4. **Soft delete problems:** Add migration to restore deleted_at column if needed

## OWASP Reference

This plan addresses the following OWASP API Security Top 10 (2023) risks:

| Risk                                      | Status          | How Addressed                        |
| ----------------------------------------- | --------------- | ------------------------------------ |
| API1: Broken Object Level Authorization   | ✅ Fixed        | RLS + ownership checks               |
| API2: Broken Authentication               | ⬜ Out of scope | Handled by Supabase Auth             |
| API4: Unrestricted Resource Consumption   | ✅ Fixed        | Rate limiting                        |
| API5: Broken Function Level Authorization | ✅ Fixed        | Admin role checks                    |
| API8: Security Misconfiguration           | ✅ Fixed        | Standardized errors, no info leakage |
