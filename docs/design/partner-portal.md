# Partner Portal Architecture

**Status:** Implemented (Phase 12)
**Date:** Updated December 2025
**Access:** `/dashboard`

## 1. Overview

The Partner Portal is a dedicated interface for community organizations ("Partners") to manage their own service listings on Kingston Care Connect. This shifts the maintenance burden from a central administrator to the distributed network of service providers, ensuring data freshness and accuracy.

## 2. Architecture

### 2.1 Authentication & RBAC

We use **Supabase Auth** with a "Magic Link" strategy (Passwordless) for low-friction access.

- **Authentication**: Email/Magic Link via Supabase.
- **Access Control**: Role-Based Access Control (RBAC) stored in the `organization_members` table.
- **Roles**:
  - `owner`: Full control, can invite/remove members.
  - `admin`: Can edit services and view analytics.
  - `editor`: Can edit services.
  - `viewer`: Read-only access to analytics.

### 2.2 Database Schema

The system uses a relational structure in Supabase:

- **organizations**: Stores verified partner entities.
- **organization_members**: Links `auth.users` to `organizations` with a `role`.
- **services**: The core service records. Linked to organizations via `organization_id`.
- **claims**: Stores temporary claims for unclaimed services awaiting admin verification.

## 3. Key Flows

### 3.1 Claiming a Service

1. **Unclaimed Service**: A partner finds their service on the public site and clicks "Claim this Service".
2. **Verification**: If the user is logged in with a domain matching the service's website (e.g., `@unitedway.ca`), the claim can be auto-verified (optional config). Otherwise, it creates a `claim` record.
3. **Approval**: An admin reviews the claim and links the user's organization to the service.

### 3.2 Service Management

- **Edit Form**: Partners use the `ServiceEditForm` to update details.
- **Bilingual Support**: The form explicitly separates English and French fields (`name` vs `name_fr`) to ensure compliance with the [Bilingual Dev Guide](../../bilingual-dev-guide.md).
- **Validation**: Zod schemas ensure data integrity before submission.

## 4. Analytics

Partners have access to privacy-preserving analytics for their listings:

- **Metrics**: Search Views, Detail Views, Click-throughs (Call/Website).
- **Privacy**: We do not track individual users. Analytics are aggregated counts stored in the `analytics` table.

## 5. UI Components

- **DashboardSidebar**: Main navigation for the authenticated zone.
- **PartnerServiceList**: Data table for managing listings.
- **ServiceEditForm**: Comprehensive form for editing service details.
- **AnalyticsCard**: Visualizes performance metrics.

For design patterns, refer to [Components Documentation](../components.md).
