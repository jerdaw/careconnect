# ADR 007: API Authorization & Resource Ownership Defense

## Status
Accepted

## Date
2026-01-20

## Context
As the project transitioned from a single-partner pilot to a multi-organization platform, the API faced "Broken Object Level Authorization" (BOLA) risks. Authenticated partners could potentially modify or delete services belonging to other organizations by simply knowing the service UUID.

## Decision
We implemented a "Defense in Depth" strategy for authorization, combining Database-level Row Level Security (RLS) with Application-level assertion helpers.

### 1. Database Layer (Supabase RLS)
We enabled RLS on all primary tables (`services`, `feedback`, `audit_logs`, etc.). 
- **Public access** is strictly limited to `published = true` services.
- **Partner access** is gated by an `organization_members` check. 
- **Admin access** is gated by a `role = 'admin'` check in the user's `raw_user_meta_data`.

### 2. Application Layer (Assertion Helpers)
To prevent "leaky abstractions" and provide clear error messages (403 vs 404), we introduced a centralized authorization utility at `lib/auth/authorization.ts`.
- `assertServiceOwnership`: Verifies that the authenticated user belongs to the organization that owns a specific service.
- `assertAdminRole`: Verifies that the user has platform-wide administrative privileges.

### 3. Unified Audit Logging
All destructive and sensitive operations (Create, Update, Delete, Export, Reindex) are logged to a unified `audit_logs` table. This provides a clear trail of who performed which action on which resource.

## Consequences
- **Security**: Significantly reduced the surface area for horizontal and vertical privilege escalation.
- **Complexity**: Slightly increased code boilerplate in API routes (requires an extra ownership check before mutations).
- **Performance**: Negligible impact due to efficient indexing on the `organization_members` and `audit_logs` tables.
- **Maintainability**: Centralized logic in `authorization.ts` makes it easier to update security policies platform-wide.
