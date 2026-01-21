---
status: planned
last_updated: 2026-01-20
owner: jer
tags: [roadmap, v17.4, dashboard, partner-portal, feature-completion]
---

# v17.4: Dashboard & Partner Portal Completion

**Priority:** HIGH
**Estimated Effort:** 2-3 weeks (single developer)
**Dependencies:** v17.0 (RLS policies MUST be deployed first)
**Impact:** Enables partners to self-manage services

## Executive Summary

Complete the partner dashboard and admin panel to production quality. The dashboard currently has placeholder features and requires additional RLS policies for partner-specific views. This release implements full CRUD operations, proper data filtering, and admin panel improvements.

> [!IMPORTANT]
> **Dependency on v17.0**: The core RLS policies for the `services` table are implemented in v17.0. This plan extends those policies for additional dashboard-specific tables (feedback, analytics, notifications).

---

## Phase 1: Extended RLS Policies for Dashboard Tables (2-3 days)

### 1.1 Prerequisite Check

Before implementing v17.4, verify v17.0 RLS policies are active:

```sql
-- Verify services RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'services' AND rowsecurity = true;

-- Verify core policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'services';
-- Expected: "Public can view published services", "Org members can insert services", etc.
```

### 1.2 Dashboard-Specific RLS Policies

> [!NOTE]
> These policies extend v17.0's base policies for dashboard-specific views.

**New file:** `supabase/migrations/XXX_dashboard_rls_policies.sql`

```sql
-- Feedback table (partners see feedback on their services only)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners see feedback on their services"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    service_id IN (
      SELECT id FROM services
      WHERE org_id IN (
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Search Analytics table (partners see their service analytics)
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners see their analytics"
  ON search_analytics
  FOR SELECT
  TO authenticated
  USING (
    service_id IN (
      SELECT id FROM services
      WHERE org_id IN (
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

**Testing:**

- [ ] Verify v17.0 RLS policies are working first
- [ ] Test dashboard-specific policies in isolation
- [ ] Verify data isolation between partner organizations

---

### 1.3 Dashboard Data Access Strategy: RLS-First Approach

> [!IMPORTANT]
> **Security Architecture Decision:** This project uses Row Level Security (RLS) policies as the primary data filtering mechanism. Application-layer filters are **NOT REQUIRED** and should be avoided to prevent confusion.

**Why RLS-First?**

- ✅ **Single Source of Truth**: Security logic lives in one place (database)
- ✅ **defense-in-depth**: RLS protects against bugs in application code
- ✅ **Performance**: PostgreSQL optimizes RLS queries better than app-layer filters
- ✅ **Auditability**: All data access controlled by auditable RLS policies

#### 1.3.1 Correct Pattern: Trust RLS

**DO THIS:**

```typescript
// Dashboard Services - RLS automatically filters by organization
export async function getDashboardServices() {
  const { data } = await supabase
    .from("services")
    .select("*")
    .is("deleted_at", null) // Filter soft-deleted only
    .order("updated_at", { ascending: false })

  // RLS policy ensures user only sees their org's services
  // No explicit org_id filter needed
  return data
}
```

**DON'T DO THIS:**

```typescript
// ❌ WRONG: Redundant application-layer filter
export async function getDashboardServices(orgId: string) {
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("org_id", orgId) // ❌ Unnecessary - RLS handles this
    .is("deleted_at", null)
  return data
}
```

#### 1.3.2 Dashboard Feedback Query

**DO THIS:**

```typescript
// app/[locale]/dashboard/feedback/page.tsx
const { data: feedback } = await supabase
  .from("feedback")
  .select("*, service:service_id(name, id)")
  .order("created_at", { ascending: false })

// RLS policy "Partners see feedback on their services" automatically filters
```

**Verification:**

```sql
-- Verify RLS is working (run in Supabase SQL Editor)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'test-user-id';

SELECT * FROM feedback;
-- Should only return feedback for services owned by test-user's org
```

#### 1.3.3 Dashboard Analytics Query

**DO THIS:**

```typescript
// app/[locale]/dashboard/analytics/page.tsx
const { data: analytics } = await supabase.from("search_analytics").select("*").gte("created_at", weekAgo)

// RLS policy "Partners see their analytics" automatically filters
```

**Testing Strategy:**

- [ ] Verify RLS policies are enabled (`SELECT tablename, rowsecurity FROM pg_tables`)
- [ ] Test with multiple org users to ensure data isolation
- [ ] Verify no cross-org data leakage via RLS policy tests (Phase 0 from v17.1)

> [!WARNING]
> **When to use app-layer filters:** ONLY for non-security purposes like pagination, sorting, or search. Never for authorization/access control.

---

## Phase 2: Missing Dashboard Features (4-5 days)

### 2.1 Settings Page

**Problem:** `/dashboard/settings` doesn't exist; navigation link is broken.

#### 2.1.1 Create Settings Page

**New file:** `app/[locale]/dashboard/settings/page.tsx`

```typescript
export default async function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsForm />
    </DashboardLayout>
  )
}
```

#### 2.1.2 SettingsForm Component

**New file:** `components/dashboard/SettingsForm.tsx`

```typescript
interface SettingsFormProps {}

export function SettingsForm() {
  return (
    <Form>
      {/* Organization Settings */}
      <Section title="Organization">
        <TextField label="Organization Name" />
        <TextArea label="Bio/Description" maxLength={500} />
        <TextField label="Website" type="url" />
        <TextField label="Phone" type="tel" />
      </Section>

      {/* Member Settings */}
      <Section title="Members">
        <MemberList />
        <InviteMemberButton />
      </Section>

      {/* Notification Preferences */}
      <Section title="Notifications">
        <Checkbox label="Email notifications on feedback" />
        <Checkbox label="Weekly analytics report" />
      </Section>

      {/* Danger Zone */}
      <Section title="Organization Management" variant="danger">
        <Button variant="destructive">Delete Organization</Button>
      </Section>

      <SubmitButton>Save Settings</SubmitButton>
    </Form>
  )
}
```

**Features:**

- [ ] Edit organization profile
- [ ] Add/remove members (with role assignment)
- [ ] Notification preferences
- [ ] Delete organization (soft delete)

**Database:**

- [ ] Create `organization_settings` table
- [ ] RLS: Only org members can read/write own settings

---

### 2.2 Service CRUD Operations

#### 2.2.1 Service Deletion

**Problem:** No delete button in dashboard; soft delete not implemented.

**Modify:** `app/[locale]/dashboard/services/[id]/page.tsx`

```typescript
export default async function ServiceDetailPage() {
  return (
    <ServiceDetail>
      {/* existing content */}
      <DangerZone>
        <DeleteServiceButton serviceId={id} />
      </DangerZone>
    </ServiceDetail>
  )
}
```

**New file:** `components/dashboard/DeleteServiceButton.tsx`

```typescript
export function DeleteServiceButton({ serviceId }: { serviceId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
      >
        Delete Service
      </Button>

      <ConfirmDialog
        open={open}
        title="Delete Service"
        description="This action cannot be undone. The service will be hidden from search."
        onConfirm={() => deleteService(serviceId)}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </>
  )
}
```

**Backend:** `lib/actions/services.ts`

```typescript
export async function deleteService(serviceId: string) {
  const {
    data: { user },
  } = await getUser()

  // Verify ownership via v17.0 auth utility
  await assertServiceOwnership(user.id, serviceId)

  // Soft delete
  const { error } = await supabase
    .from("services")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", serviceId)
    .eq("org_id", userOrgId) // double-check ownership

  if (error) throw error
  return { success: true }
}
```

#### 2.2.2 Public Service Creation

**Problem:** Only admin can create services via JSON; partners have no create endpoint.

**New file:** `app/api/v1/services/create/route.ts`

```typescript
// POST /api/v1/services/create
export async function POST(request: Request) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return createApiError("Unauthorized", 401)

  const body = await request.json()
  const validation = createServiceSchema.safeParse(body)
  if (!validation.success) {
    return createApiError("Validation failed", 400, validation.error)
  }

  // Create service owned by user's organization
  const orgId = await getUserOrgId(user.id)

  const { data, error } = await supabase
    .from("services")
    .insert({
      ...validation.data,
      org_id: orgId,
      created_by: user.id,
      verification_level: "L1", // Default: unverified
    })
    .select()
    .single()

  if (error) return createApiError(error.message, 500)
  return NextResponse.json(data)
}
```

**Schema:** `lib/schemas/service-create.ts`

```typescript
export const createServiceSchema = z.object({
  name: z.string().min(3).max(200),
  name_fr: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  description_fr: z.string().min(10).max(2000),
  category: z.enum(['health', 'housing', ...]),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  website: z.string().url().optional(),
  hours_text: z.string().optional(),
})
```

**UI:** `app/[locale]/dashboard/services/create/page.tsx`

```typescript
export default function CreateServicePage() {
  return (
    <DashboardLayout>
      <CreateServiceForm />
    </DashboardLayout>
  )
}
```

---

### 2.3 Notifications Database Integration

**Problem:** Notifications page shows mock data; not connected to database.

#### 2.3.1 Create Notifications Table

**New file:** `supabase/migrations/create_notifications_table.sql`

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL,  -- 'service_feedback', 'search_alert', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,

  CONSTRAINT org_notifications FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE INDEX notifications_org_id_created_at
  ON notifications(org_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orgs see own notifications"
  ON notifications
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

#### 2.3.2 Notification Queries

**Modify:** `app/[locale]/dashboard/notifications/page.tsx`

```typescript
export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <DashboardLayout>
      <NotificationsList notifications={notifications} />
    </DashboardLayout>
  )
}
```

**New helper:** `lib/actions/notifications.ts`

```typescript
export async function getNotifications(limit = 50) {
  const orgId = await getUserOrgId()

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return data || []
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

  if (error) throw error
}
```

---

## Phase 3: Admin Panel Improvements (3-4 days)

### 3.1 Admin Save to Database

**Problem:** Admin panel writes to JSON file, not Supabase.

#### 3.1.1 Implement Database Save

**Modify:** `app/api/admin/save/route.ts`

**Current:**

```typescript
// Writes to JSON file
const filePath = join(process.cwd(), "data", "services.json")
fs.writeFileSync(filePath, JSON.stringify(services, null, 2))
```

**Required:**

```typescript
export async function POST(request: Request) {
  // Verify admin
  await assertAdminRole(user.id)

  const { services } = await request.json()

  // Upsert to Supabase
  const { error } = await supabase.from("services").upsert(services, { onConflict: "id" })

  if (error) return createApiError(error.message, 500)

  // Also save to JSON for offline mode
  fs.writeFileSync(jsonPath, JSON.stringify(services, null, 2))

  // Trigger reindex
  await triggerEmbeddingGeneration()

  return NextResponse.json({ success: true })
}
```

### 3.2 Reindex Progress Tracking

**Problem:** Embedding generation provides no progress feedback.

#### 3.2.1 Create Progress Table

**New file:** `supabase/migrations/create_reindex_progress.sql`

```sql
CREATE TABLE reindex_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP DEFAULT now(),
  total_services INT,
  processed_count INT DEFAULT 0,
  status TEXT DEFAULT 'running',  -- 'running', 'complete', 'error'
  error_message TEXT,
  completed_at TIMESTAMP,
);

CREATE INDEX reindex_progress_started_at
  ON reindex_progress(started_at DESC);
```

#### 3.2.2 Update Admin Endpoints

**Modify:** `app/api/admin/reindex/route.ts`

```typescript
export async function POST(request: Request) {
  await assertAdminRole(user.id)

  const progressId = crypto.randomUUID()

  // Create progress record
  await supabase.from("reindex_progress").insert({
    id: progressId,
    total_services: serviceCount,
  })

  // Trigger generation in background
  triggerEmbeddingGenerationWithProgress(progressId)

  return NextResponse.json({ progressId })
}
```

#### 3.2.3 Progress Query Endpoint

**New file:** `app/api/admin/reindex/status/route.ts`

```typescript
// GET /api/admin/reindex/status?progressId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const progressId = searchParams.get("progressId")

  const { data } = await supabase.from("reindex_progress").select("*").eq("id", progressId).single()

  return NextResponse.json(data)
}
```

**UI:** `components/admin/ReindexProgress.tsx`

```typescript
export function ReindexProgress({ progressId }: { progressId: string }) {
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/admin/reindex/status?progressId=${progressId}`)
        .then(r => r.json())
        .then(setProgress)
    }, 1000)

    return () => clearInterval(interval)
  }, [progressId])

  return (
    <div>
      <ProgressBar
        value={progress?.processed_count}
        max={progress?.total_services}
      />
      <p>{progress?.processed_count} / {progress?.total_services}</p>
      {progress?.status === 'complete' && <CheckIcon />}
      {progress?.error_message && <ErrorAlert>{progress.error_message}</ErrorAlert>}
    </div>
  )
}
```

### 3.3 OneSignal Targeting

**Problem:** Admin pushes to "All" subscribers; no segment targeting.

#### 3.3.1 Segment Configuration

**Modify:** `app/api/admin/push/route.ts`

```typescript
interface PushRequest {
  title: string
  message: string
  target: "all" | "offline_users" | "high_engagement" | "new_users"
  filters?: {
    createdAfter?: Date
    createdBefore?: Date
    minSessions?: number
  }
}

export async function POST(request: Request) {
  await assertAdminRole(user.id)

  const { title, message, target, filters } = await request.json()

  // Build OneSignal segment filters
  const segmentFilters = buildOneSignalFilters(target, filters)

  const response = await oneSignalClient.createNotification({
    included_segments: [target],
    filters: segmentFilters,
    headings: { en: title },
    contents: { en: message },
  })

  return NextResponse.json(response)
}
```

### 3.4 Complete Service Form

**Problem:** Admin form missing fields (hours, fees, eligibility).

**Modify:** `components/admin/ServiceForm.tsx`

Add sections:

- [ ] Hours (structured format with day/time pairs)
- [ ] Phone number(s)
- [ ] Email address
- [ ] Website
- [ ] Fees (free, sliding scale, cost)
- [ ] Eligibility criteria
- [ ] Access methods (phone, in-person, online)

---

## Phase 4: RBAC Implementation (2-3 days)

### 4.1 Role Hierarchy

**Modify:** `types/organization.ts`

```typescript
export type OrganizationRole = "owner" | "admin" | "editor" | "viewer"

interface OrganizationMember {
  user_id: string
  org_id: string
  role: OrganizationRole
  added_at: string
  added_by: string
}

// Permissions per role:
// owner: Can do everything, transfer ownership
// admin: Can manage services, members, settings
// editor: Can create/edit/delete own services
// viewer: Can view services, analytics (read-only)
```

### 4.2 Role-Based Access Control

**New file:** `lib/rbac.ts`

```typescript
export async function requireRole(userId: string, orgId: string, requiredRole: OrganizationRole): Promise<void> {
  const member = await getOrganizationMember(userId, orgId)

  const roleHierarchy = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
  }

  if (roleHierarchy[member.role] < roleHierarchy[requiredRole]) {
    throw new Error(`Requires ${requiredRole} role`)
  }
}
```

### 4.3 Member Management UI

**New file:** `components/dashboard/MemberManagement.tsx`

```typescript
export function MemberManagement() {
  return (
    <Section>
      <MembersList />
      <InviteMemberForm />
    </Section>
  )
}
```

Features:

- [ ] List organization members
- [ ] Show member roles
- [ ] Change member role
- [ ] Remove member
- [ ] Invite new members (by email)
- [ ] Resend invitations

**Backend:** `lib/actions/members.ts`

```typescript
export async function inviteMember(email: string, role: OrganizationRole) {
  const orgId = await getUserOrgId()

  // Create invitation record
  const { data: invitation } = await supabase
    .from("organization_invitations")
    .insert({
      org_id: orgId,
      email,
      role,
      invited_by: userId,
    })
    .select()
    .single()

  // Send invite email
  await sendInviteEmail(email, orgId, invitation.token)

  return invitation
}
```

---

## Testing & Verification

### Unit Tests

**New file:** `tests/lib/actions/services.test.ts`

```typescript
describe('getDashboardServices', () => {
  it('returns only services for user's organization')
  it('excludes soft-deleted services')
  it('returns empty array for new organization')
})

describe('deleteService', () => {
  it('marks service as deleted')
  it('prevents non-owners from deleting')
})

describe('createService', () => {
  it('creates service owned by user's org')
  it('validates required fields')
  it('sets L1 verification level')
})
```

**New file:** `tests/lib/rbac.test.ts`

```typescript
describe("requireRole", () => {
  it("allows owner to do any action")
  it("allows admin to manage services")
  it("prevents editor from managing members")
  it("prevents viewer from editing")
})
```

### Integration Tests

**Modify:** `tests/integration/dashboard-workflows.test.ts`

```typescript
describe("Partner Dashboard Workflow", () => {
  it("partner logs in")
  it("sees only their services")
  it("can create new service")
  it("can edit service")
  it("can delete service")
  it("can view feedback on own services")
})

describe("Member Management Workflow", () => {
  it("owner invites new member")
  it("member accepts invitation")
  it("member has correct permissions")
  it("owner can change member role")
})
```

### E2E Tests

**Modify:** `tests/e2e/dashboard.spec.ts`

Add scenarios:

- [ ] Partner signs up → creates service → sees in dashboard
- [ ] Partner edits service → changes appear in search
- [ ] Partner deletes service → hidden from search
- [ ] Admin reindexes → progress updates
- [ ] Admin sends push notification → appears in OneSignal

---

## Database Changes Summary

| Table                    | Action     | Source    | Purpose                                          |
| ------------------------ | ---------- | --------- | ------------------------------------------------ |
| services                 | RLS policy | v17.0     | Base authorization (SELECT/INSERT/UPDATE/DELETE) |
| organization_members     | NEW + RLS  | v17.0     | Role-based membership                            |
| audit_logs               | NEW + RLS  | v17.0     | Security audit trail                             |
| feedback                 | RLS policy | **v17.2** | Filter by service org_id                         |
| search_analytics         | RLS policy | **v17.2** | Filter by service org_id                         |
| organization_settings    | NEW        | **v17.2** | Store org preferences                            |
| notifications            | NEW        | **v17.2** | Database notifications                           |
| reindex_progress         | NEW        | **v17.2** | Track embedding generation                       |
| organization_invitations | NEW        | **v17.2** | Member invitations                               |

---

## Success Criteria

- [ ] v17.0 RLS policies verified before starting
- [ ] All dashboard links navigable
- [ ] Partners see only their own data (verified with test users)
- [ ] Full service CRUD working
- [ ] Settings page functional
- [ ] Member management working (invite, role change, remove)
- [ ] Admin panel uses Supabase instead of JSON
- [ ] Progress tracking for reindex operations
- [ ] Zero privilege escalation possible (re-verify after v17.0)

---

## Dependency Graph

```
v17.0 (Security)
    ├── RLS on services table
    ├── organization_members table
    └── Authorization utility
         │
         ▼
v17.2 (Dashboard)
    ├── Extended RLS for feedback, analytics
    ├── Dashboard UI features
    └── Admin panel improvements
```

---

## Rollback Plan

1. **RLS Policies**: Policies are additive; can disable specific policies without removing v17.0 base
2. **New Tables**: Can be soft-deleted or dropped if issues arise
3. **UI Features**: Deploy behind feature flag if uncertain
4. **Revert to v17.0**: Dashboard still works with base security, just missing new features
