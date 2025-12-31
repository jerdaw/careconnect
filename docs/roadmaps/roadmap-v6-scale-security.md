# Roadmap V6: Scale & Security

> **Status**: Planning
> **Owner**: TBD
> **Start Date**: TBD
> **Last Updated**: 2025-12-31

---

## Executive Summary

Roadmap V6 solidifies the foundation laid in V1-V5, ensuring the platform is ready for **wide-scale deployment** and **long-term maintenance**. It focuses on **five strategic pillars**:

1.  **Foundation Hardening**: Complete documented-but-missing tests, scripts, and automation from V5 before adding new features.
2.  **Mobile Excellence**: Transition from "installable PWA" to an "essential daily tool" with push notifications and background sync.
3.  **Bilingual Integrity**: Achieve 100% parity between English and French across all content and UI.
4.  **Automated Health**: Reduce manual maintenance via automated verification bots and data integrity checks.
5.  **Partner Empowerment**: Expand the partner dashboard with full CRUD capabilities for self-service management.

All features continue to adhere to **strict privacy principles** established in earlier phases.

---

## Phase 8: Foundation Hardening (Est. 1 Week)

> [!IMPORTANT]
> This phase addresses gaps identified in the comprehensive project audit (2025-12-31). These items were documented in V5 but not fully implemented. **Complete this phase before Phase 9.**

### 8.1 Missing Test Coverage

**Goal**: Implement all tests documented in V5 roadmap that were not created.

#### 8.1.1 AI Module Tests

**[NEW] `tests/ai/query-expander.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { expandQuery, clearExpansionCache } from "@/lib/ai/query-expander"
import { aiEngine } from "@/lib/ai/engine"

// Mock the AI engine
vi.mock("@/lib/ai/engine", () => ({
  aiEngine: {
    isReady: false,
    chat: vi.fn(),
  },
}))

describe("Query Expander", () => {
  beforeEach(() => {
    clearExpansionCache()
    vi.clearAllMocks()
  })

  it("returns empty expansion when AI is not ready", async () => {
    const result = await expandQuery("food")
    expect(result.expanded).toEqual([])
    expect(result.fromCache).toBe(false)
  })

  it("returns empty expansion for short queries", async () => {
    ;(aiEngine as any).isReady = true
    const result = await expandQuery("f")
    expect(result.expanded).toEqual([])
  })

  it("parses JSON array response correctly", async () => {
    ;(aiEngine as any).isReady = true
    ;(aiEngine.chat as any).mockResolvedValue('["food bank", "meal program", "grocery"]')

    const result = await expandQuery("hungry")
    expect(result.expanded).toEqual(["food bank", "meal program", "grocery"])
    expect(result.fromCache).toBe(false)
  })

  it("caches results for repeated queries", async () => {
    ;(aiEngine as any).isReady = true
    ;(aiEngine.chat as any).mockResolvedValue('["shelter"]')

    await expandQuery("homeless")
    const result = await expandQuery("homeless")

    expect(result.fromCache).toBe(true)
    expect(aiEngine.chat).toHaveBeenCalledTimes(1)
  })

  it("handles malformed JSON gracefully", async () => {
    ;(aiEngine as any).isReady = true
    ;(aiEngine.chat as any).mockResolvedValue('Here are some terms: ["food bank", "pantry"]')

    const result = await expandQuery("food help")
    expect(result.expanded).toEqual(["food bank", "pantry"])
  })
})
```

---

#### 8.1.2 Eligibility Checker Tests

**[NEW] `tests/eligibility.test.ts`**

```typescript
import { describe, it, expect } from "vitest"
import { parseEligibility, checkEligibility } from "@/lib/eligibility/checker"
import type { UserContext } from "@/types/user-context"
import type { Service } from "@/types/service"

describe("parseEligibility", () => {
  it("extracts age range from 'Ages 18-29'", () => {
    const criteria = parseEligibility("Ages 18-29 only")
    expect(criteria.minAge).toBe(18)
    expect(criteria.maxAge).toBe(29)
  })

  it("extracts single age from 'Age 55+'", () => {
    const criteria = parseEligibility("Age 55+")
    expect(criteria.minAge).toBe(55)
    expect(criteria.maxAge).toBeUndefined()
  })

  it("detects youth keyword", () => {
    const criteria = parseEligibility("For youth in Kingston")
    expect(criteria.maxAge).toBe(29)
  })

  it("detects senior keyword", () => {
    const criteria = parseEligibility("Senior citizens welcome")
    expect(criteria.minAge).toBe(55)
  })

  it("detects Indigenous identity requirement", () => {
    const criteria = parseEligibility("Must be First Nations, Inuit, or Metis")
    expect(criteria.requiredIdentities).toContain("indigenous")
  })

  it("detects newcomer identity requirement", () => {
    const criteria = parseEligibility("For immigrants and refugees")
    expect(criteria.requiredIdentities).toContain("newcomer")
  })

  it("detects 2SLGBTQI+ identity requirement", () => {
    const criteria = parseEligibility("LGBTQ+ affirming space")
    expect(criteria.requiredIdentities).toContain("2slgbtqi+")
  })
})

describe("checkEligibility", () => {
  const createService = (notes: string): Service => ({
    id: "test",
    name: "Test Service",
    description: "Test",
    verification_level: "L1",
    intent_category: "Other",
    eligibility_notes: notes,
  })

  const createContext = (overrides: Partial<UserContext> = {}): UserContext => ({
    ageGroup: null,
    identities: [],
    hasOptedIn: true,
    ...overrides,
  })

  it("returns 'unknown' when user has not opted in", () => {
    const service = createService("Ages 18-29")
    const context = createContext({ hasOptedIn: false })
    expect(checkEligibility(service, context)).toBe("unknown")
  })

  it("returns 'unknown' when no eligibility notes", () => {
    const service = { ...createService(""), eligibility_notes: undefined }
    const context = createContext()
    expect(checkEligibility(service, context)).toBe("unknown")
  })

  it("returns 'eligible' when youth user matches youth service", () => {
    const service = createService("Ages 16-29")
    const context = createContext({ ageGroup: "youth" })
    expect(checkEligibility(service, context)).toBe("eligible")
  })

  it("returns 'ineligible' when senior user doesn't match youth service", () => {
    const service = createService("Ages 16-29")
    const context = createContext({ ageGroup: "senior" })
    expect(checkEligibility(service, context)).toBe("ineligible")
  })

  it("returns 'eligible' when user has required identity", () => {
    const service = createService("For Indigenous peoples")
    const context = createContext({ identities: ["indigenous"] })
    expect(checkEligibility(service, context)).toBe("eligible")
  })

  it("returns 'ineligible' when user lacks required identity", () => {
    const service = createService("For Indigenous peoples")
    const context = createContext({ identities: ["newcomer"] })
    expect(checkEligibility(service, context)).toBe("ineligible")
  })
})
```

---

#### 8.1.3 Voice Input Hook Tests

**[NEW] `tests/hooks/useVoiceInput.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

// Mock dependencies before importing hook
vi.mock("@/lib/ai/transcriber", () => ({
  transcribeAudio: vi.fn().mockResolvedValue("test transcription"),
}))

describe("useVoiceInput", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock MediaRecorder
    global.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      ondataavailable: null,
      onstop: null,
      state: "inactive",
    })) as any
    ;(global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true)

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
    })
  })

  it("initializes with correct default state", async () => {
    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isListening).toBe(false)
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.transcript).toBe("")
    expect(result.current.error).toBeNull()
  })

  it("detects browser support correctly", async () => {
    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isSupported).toBe(true)
  })

  it("handles missing MediaRecorder gracefully", async () => {
    ;(global as any).MediaRecorder = undefined
    
    // Re-import to get fresh module
    vi.resetModules()
    const { useVoiceInput } = await import("@/hooks/useVoiceInput")
    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.isSupported).toBe(false)
  })
})
```

---

### 8.2 Missing NPM Scripts

**Goal**: Add documented scripts to package.json.

#### [MODIFY] `package.json`

Add the following scripts:

```json
{
  "scripts": {
    "bilingual-check": "npx tsx scripts/bilingual-audit.ts",
    "i18n-audit": "npx tsx scripts/i18n-key-audit.ts",
    "health-check": "npx tsx scripts/check-links.ts"
  }
}
```

---

### 8.3 Bilingual Audit Scripts

**Goal**: Implement the bilingual audit tooling documented in Phase 10.

#### [NEW] `scripts/bilingual-audit.ts`

```typescript
#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from "fs"
import path from "path"

interface Service {
  id: string
  name: string
  name_fr?: string
  description: string
  description_fr?: string
  eligibility_notes?: string
  eligibility_notes_fr?: string
}

interface AuditResult {
  serviceId: string
  serviceName: string
  missingFields: string[]
}

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const REPORT_PATH = path.join(process.cwd(), "data/bilingual-audit-report.json")

function auditServices(): AuditResult[] {
  const services: Service[] = JSON.parse(readFileSync(SERVICES_PATH, "utf-8"))
  const issues: AuditResult[] = []

  for (const service of services) {
    const missingFields: string[] = []

    if (!service.name_fr?.trim()) missingFields.push("name_fr")
    if (!service.description_fr?.trim()) missingFields.push("description_fr")
    if (service.eligibility_notes && !service.eligibility_notes_fr?.trim()) {
      missingFields.push("eligibility_notes_fr")
    }

    if (missingFields.length > 0) {
      issues.push({
        serviceId: service.id,
        serviceName: service.name,
        missingFields,
      })
    }
  }

  return issues
}

function main() {
  console.log("🔍 Running bilingual content audit...")

  const issues = auditServices()

  if (issues.length === 0) {
    console.log("✅ All services have complete French translations!")
    process.exit(0)
  }

  console.log(`\n⚠️  Found ${issues.length} services with missing French content:\n`)

  const fieldCounts: Record<string, number> = {}
  for (const issue of issues) {
    for (const field of issue.missingFields) {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1
    }
  }

  console.log("Missing Fields Summary:")
  for (const [field, count] of Object.entries(fieldCounts)) {
    console.log(`  - ${field}: ${count} services`)
  }

  writeFileSync(REPORT_PATH, JSON.stringify({ generated: new Date().toISOString(), issues }, null, 2))
  console.log(`\n📝 Detailed report saved to: ${REPORT_PATH}`)

  process.exit(1)
}

main()
```

---

#### [NEW] `scripts/i18n-key-audit.ts`

```typescript
#!/usr/bin/env npx tsx
import { readFileSync, readdirSync, statSync } from "fs"
import path from "path"

const MESSAGES_DIR = path.join(process.cwd(), "messages")
const COMPONENTS_DIR = path.join(process.cwd(), "components")
const APP_DIR = path.join(process.cwd(), "app")

function getAllKeys(obj: Record<string, any>, prefix = ""): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null) {
      keys.push(...getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function findUsedKeys(dir: string): Set<string> {
  const usedKeys = new Set<string>()
  const tPattern = /t\(["'`]([^"'`]+)["'`]\)/g

  function scanFile(filePath: string) {
    const content = readFileSync(filePath, "utf-8")
    let match
    while ((match = tPattern.exec(content)) !== null) {
      usedKeys.add(match[1])
    }
  }

  function scanDir(dir: string) {
    for (const entry of readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
        scanDir(fullPath)
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        scanFile(fullPath)
      }
    }
  }

  scanDir(dir)
  return usedKeys
}

function main() {
  console.log("🌐 Running i18n key audit...\n")

  const enMessages = JSON.parse(readFileSync(path.join(MESSAGES_DIR, "en.json"), "utf-8"))
  const frMessages = JSON.parse(readFileSync(path.join(MESSAGES_DIR, "fr.json"), "utf-8"))

  const enKeys = new Set(getAllKeys(enMessages))
  const frKeys = new Set(getAllKeys(frMessages))

  const missingInFr = [...enKeys].filter((k) => !frKeys.has(k))
  const missingInEn = [...frKeys].filter((k) => !enKeys.has(k))

  const usedKeys = new Set([...findUsedKeys(COMPONENTS_DIR), ...findUsedKeys(APP_DIR)])

  console.log("📊 Audit Results:\n")

  if (missingInFr.length > 0) {
    console.log(`❌ Missing in French (${missingInFr.length}):`)
    missingInFr.slice(0, 10).forEach((k) => console.log(`   - ${k}`))
    if (missingInFr.length > 10) console.log(`   ... and ${missingInFr.length - 10} more`)
  } else {
    console.log("✅ All English keys have French translations")
  }

  if (missingInEn.length > 0) {
    console.log(`\n❌ Missing in English (${missingInEn.length}):`)
    missingInEn.forEach((k) => console.log(`   - ${k}`))
  }

  console.log(`\n📈 Total keys: EN=${enKeys.size}, FR=${frKeys.size}`)
  console.log(`📈 Used keys found in code: ${usedKeys.size}`)

  if (missingInFr.length > 0 || missingInEn.length > 0) {
    process.exit(1)
  }
}

main()
```

---

### 8.4 Health Check Automation

**Goal**: Add GitHub Actions workflow for monthly URL health checks.

#### [NEW] `.github/workflows/health-check.yml`

```yaml
name: Monthly Health Check

on:
  schedule:
    - cron: "0 8 1 * *" # 8 AM UTC on the 1st of each month
  workflow_dispatch:

jobs:
  url-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci

      - name: Run URL Health Check
        id: health-check
        run: npx tsx scripts/check-links.ts
        continue-on-error: true

      - name: Upload Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: url-health-report
          path: data/url-health-report.json
          if-no-files-found: ignore

      - name: Create Issue on Failure
        if: steps.health-check.outcome == 'failure'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            let body = '## URL Health Check Failed\n\nThe monthly health check found issues with service URLs. Please review the attached artifact for details.';
            
            try {
              const report = JSON.parse(fs.readFileSync('data/url-health-report.json', 'utf-8'));
              const brokenList = report.broken
                .slice(0, 20)
                .map(b => `- [ ] **${b.serviceName}** - ${b.url}`)
                .join('\n');
              body = `## URL Health Check Report\n\n**Found ${report.summary?.broken || 'N/A'} broken URLs**\n\n${brokenList}`;
            } catch (e) {
              console.log('Could not parse report:', e);
            }
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🔗 Monthly Health Check: Broken URLs Found`,
              body,
              labels: ['data-quality', 'automated']
            });
```

---

### 8.5 Wire Partner Edit Form

**Goal**: Connect existing `EditServiceForm` component to the dashboard.

#### [NEW] `app/[locale]/dashboard/services/[id]/edit/page.tsx`

```typescript
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { EditServiceForm } from "@/components/EditServiceForm"
import { getServiceById } from "@/lib/services"

interface Props {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const t = await getTranslations("Dashboard")
  return { title: `Edit Service: ${id}` }
}

export default async function EditServicePage({ params }: Props) {
  const { id, locale } = await params
  const t = await getTranslations("Dashboard")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const service = await getServiceById(id)

  if (!service) {
    notFound()
  }

  // TODO: Verify user has permission to edit this service
  // For now, allow any authenticated user

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("editService")}</h1>
        <p className="text-muted-foreground">{service.name}</p>
      </div>
      <EditServiceForm service={service} locale={locale} />
    </div>
  )
}
```

---

### 8.6 Database Schema Prerequisites

**Goal**: Add missing tables required for V6 features.

#### [NEW] `supabase/migrations/002_v6_prerequisites.sql`

```sql
-- ============================================
-- V6 Prerequisites: Tables for upcoming features
-- ============================================

-- Service Submissions (Crowdsourcing Queue)
CREATE TABLE IF NOT EXISTS service_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  phone TEXT,
  url TEXT,
  address TEXT,
  submitted_by_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin review queue
CREATE INDEX idx_submissions_status ON service_submissions(status);
CREATE INDEX idx_submissions_created ON service_submissions(created_at DESC);

-- RLS: Public can submit, only admins can view/update
ALTER TABLE service_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit" ON service_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Push Subscriptions (for Phase 9)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB NOT NULL,
  categories TEXT[] NOT NULL DEFAULT ARRAY['general'],
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_categories ON push_subscriptions USING GIN (categories);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Organization Members (for Phase 12)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
    )
  );

CREATE POLICY "Admins can manage members" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );
```

---

### 8.7 Localization Keys for Dashboard

**Goal**: Add missing translation keys for new dashboard features.

#### [MODIFY] `messages/en.json`

Add to Dashboard section:
```json
{
  "Dashboard": {
    "editService": "Edit Service",
    "services": {
      "title": "My Services",
      "edit": "Edit",
      "view": "View",
      "lastUpdated": "Last updated",
      "noServices": "No services claimed yet"
    }
  }
}
```

#### [MODIFY] `messages/fr.json`

Add to Dashboard section:
```json
{
  "Dashboard": {
    "editService": "Modifier le service",
    "services": {
      "title": "Mes services",
      "edit": "Modifier",
      "view": "Voir",
      "lastUpdated": "Dernière mise à jour",
      "noServices": "Aucun service réclamé"
    }
  }
}
```

---

### Phase 8 Verification Plan

| Task | Test Type | Verification Method |
|------|-----------|---------------------|
| 8.1 Query Expander Tests | Unit | `npm test -- tests/ai/query-expander.test.ts` |
| 8.1 Eligibility Tests | Unit | `npm test -- tests/eligibility.test.ts` |
| 8.1 Voice Input Tests | Unit | `npm test -- tests/hooks/useVoiceInput.test.ts` |
| 8.2 NPM Scripts | Manual | Run `npm run bilingual-check` |
| 8.3 Bilingual Audit | Integration | Script produces valid JSON report |
| 8.4 Health Check Workflow | Manual | Trigger workflow_dispatch in GitHub |
| 8.5 Edit Form | E2E | Navigate to `/dashboard/services/[id]/edit` |
| 8.6 Database Migration | Manual | Run migration in Supabase SQL Editor |

---

### Phase 8 Timeline

| Task | Effort | Priority |
|------|--------|----------|
| 8.1 Missing Tests | 2-3 hours | High |
| 8.2 NPM Scripts | 15 min | High |
| 8.3 Audit Scripts | 1 hour | High |
| 8.4 Health Check Workflow | 30 min | Medium |
| 8.5 Wire Edit Form | 1 hour | Medium |
| 8.6 Database Migration | 30 min | Medium |
| 8.7 Localization Keys | 15 min | Low |

**Total Estimated Time**: 1 week (including testing and validation)

---

## Phase 9: Mobile App Excellence (Est. 2-3 Weeks)

### 9.1 Push Notifications

**Goal**: Enable low-latency alerts for critical service changes (e.g., emergency shelter openings, food bank schedule changes) to opted-in users.

#### 9.1.1 Architecture

> [!IMPORTANT]
> Push notifications require a server-side component (VAPID keys) and user opt-in. We will use Web Push API with Supabase Edge Functions for delivery.

| Component | Technology | Privacy Implications |
|-----------|------------|---------------------|
| Client Subscription | Web Push API | Subscription tokens stored in Supabase (no PII) |
| Notification Delivery | Supabase Edge Functions | Server knows device tokens, not user identity |
| Topic Subscription | Category-based opt-in | Users choose categories (e.g., "Food", "Crisis") |

#### 9.1.2 TypeScript Interfaces

```typescript
// types/notifications.ts
export type NotificationCategory = "crisis" | "food" | "housing" | "health" | "general"

export interface PushSubscription {
  id: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  categories: NotificationCategory[]
  locale: "en" | "fr"
  created_at: string
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  url?: string
  category: NotificationCategory
  urgency: "high" | "normal" | "low"
}
```

---

#### [NEW] `lib/notifications/push-manager.ts`

```typescript
"use client"

import type { NotificationCategory, PushSubscription } from "@/types/notifications"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null

  async init(): Promise<boolean> {
    if (!("PushManager" in window)) {
      console.warn("[Push] PushManager not supported")
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error("[Push] ServiceWorker registration failed:", error)
      return false
    }
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    return Notification.permission
  }

  async requestPermission(): Promise<boolean> {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  async subscribe(categories: NotificationCategory[]): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.init()
    }

    try {
      const subscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      })

      // Send subscription to server
      const response = await fetch("/api/v1/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          categories,
          locale: document.documentElement.lang || "en",
        }),
      })

      if (!response.ok) throw new Error("Failed to save subscription")

      return response.json()
    } catch (error) {
      console.error("[Push] Subscription failed:", error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) return false

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await fetch("/api/v1/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }
      return true
    } catch (error) {
      console.error("[Push] Unsubscribe failed:", error)
      return false
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
  }
}

export const pushManager = new PushNotificationManager()
```

---

#### [NEW] `hooks/usePushNotifications.ts`

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import { pushManager } from "@/lib/notifications/push-manager"
import { useLocalStorage } from "./useLocalStorage"
import type { NotificationCategory } from "@/types/notifications"

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  subscribedCategories: NotificationCategory[]
  isLoading: boolean
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    subscribedCategories: [],
    isLoading: true,
  })

  const [preferences, setPreferences] = useLocalStorage<NotificationCategory[]>(
    "kcc_notification_prefs",
    []
  )

  useEffect(() => {
    const checkState = async () => {
      const isSupported = "PushManager" in window && "serviceWorker" in navigator
      if (!isSupported) {
        setState((prev) => ({ ...prev, isSupported: false, isLoading: false }))
        return
      }

      const permission = await pushManager.getPermissionStatus()
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      setState({
        isSupported: true,
        permission,
        isSubscribed: !!subscription,
        subscribedCategories: preferences,
        isLoading: false,
      })
    }

    checkState()
  }, [preferences])

  const subscribe = useCallback(async (categories: NotificationCategory[]) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    const hasPermission = await pushManager.requestPermission()
    if (!hasPermission) {
      setState((prev) => ({ ...prev, permission: "denied", isLoading: false }))
      return false
    }

    const subscription = await pushManager.subscribe(categories)
    if (subscription) {
      setPreferences(categories)
      setState((prev) => ({
        ...prev,
        permission: "granted",
        isSubscribed: true,
        subscribedCategories: categories,
        isLoading: false,
      }))
      return true
    }

    setState((prev) => ({ ...prev, isLoading: false }))
    return false
  }, [setPreferences])

  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const success = await pushManager.unsubscribe()
    if (success) {
      setPreferences([])
      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscribedCategories: [],
        isLoading: false,
      }))
    } else {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
    return success
  }, [setPreferences])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}
```

---

#### [NEW] `app/api/v1/notifications/subscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const SubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  categories: z.array(z.enum(["crisis", "food", "housing", "health", "general"])),
  locale: z.enum(["en", "fr"]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription, categories, locale } = SubscriptionSchema.parse(body)

    const supabase = await createClient()

    // Upsert subscription (update if endpoint exists, insert otherwise)
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          categories,
          locale,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      )
      .select()
      .single()

    if (error) {
      console.error("[Notifications] Subscription error:", error)
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 })
    }
    console.error("[Notifications] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

---

#### [NEW] `components/settings/NotificationSettings.tsx`

```typescript
"use client"

import { usePushNotifications } from "@/hooks/usePushNotifications"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { Bell, BellOff, Loader2 } from "lucide-react"
import type { NotificationCategory } from "@/types/notifications"

const CATEGORIES: { id: NotificationCategory; icon: string }[] = [
  { id: "crisis", icon: "🚨" },
  { id: "food", icon: "🍽️" },
  { id: "housing", icon: "🏠" },
  { id: "health", icon: "🏥" },
  { id: "general", icon: "📢" },
]

export function NotificationSettings() {
  const t = useTranslations("Settings.notifications")
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribedCategories,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {t("notSupported")}
        </p>
      </div>
    )
  }

  if (permission === "denied") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm text-red-800 dark:text-red-200">
          {t("permissionDenied")}
        </p>
      </div>
    )
  }

  const handleCategoryToggle = (category: NotificationCategory) => {
    const newCategories = subscribedCategories.includes(category)
      ? subscribedCategories.filter((c) => c !== category)
      : [...subscribedCategories, category]
    subscribe(newCategories)
  }

  if (!isSubscribed) {
    return (
      <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-950">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold">{t("enablePrompt")}</h3>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">{t("enableDescription")}</p>
        <Button
          onClick={() => subscribe(["crisis", "general"])}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("enableButton")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-green-600" />
          <span className="font-medium">{t("enabled")}</span>
        </div>
        <Button variant="outline" size="sm" onClick={unsubscribe} disabled={isLoading}>
          <BellOff className="mr-2 h-4 w-4" />
          {t("disable")}
        </Button>
      </div>

      <div>
        <h4 className="mb-3 font-medium">{t("categories")}</h4>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ id, icon }) => (
            <Button
              key={id}
              variant={subscribedCategories.includes(id) ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryToggle(id)}
              disabled={isLoading}
            >
              {icon} {t(`categoryLabels.${id}`)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

#### Localization Keys (`messages/en.json`)

```json
{
  "Settings": {
    "notifications": {
      "notSupported": "Push notifications are not supported in your browser.",
      "permissionDenied": "Notification permission was denied. Please enable it in your browser settings.",
      "enablePrompt": "Stay Updated",
      "enableDescription": "Get instant alerts when critical services change—like emergency shelter openings or food bank schedule updates. Your subscription stays private.",
      "enableButton": "Enable Notifications",
      "enabled": "Notifications Enabled",
      "disable": "Turn Off",
      "categories": "Notify me about:",
      "categoryLabels": {
        "crisis": "Crisis & Emergencies",
        "food": "Food Services",
        "housing": "Housing Updates",
        "health": "Health Services",
        "general": "General Announcements"
      }
    }
  }
}
```

#### Localization Keys (`messages/fr.json`)

```json
{
  "Settings": {
    "notifications": {
      "notSupported": "Les notifications push ne sont pas prises en charge par votre navigateur.",
      "permissionDenied": "L'autorisation de notification a été refusée. Veuillez l'activer dans les paramètres de votre navigateur.",
      "enablePrompt": "Restez informé",
      "enableDescription": "Recevez des alertes instantanées lorsque des services critiques changent—comme les ouvertures de refuges d'urgence ou les mises à jour des banques alimentaires. Votre abonnement reste privé.",
      "enableButton": "Activer les notifications",
      "enabled": "Notifications activées",
      "disable": "Désactiver",
      "categories": "Me notifier pour :",
      "categoryLabels": {
        "crisis": "Crises et urgences",
        "food": "Services alimentaires",
        "housing": "Mises à jour logement",
        "health": "Services de santé",
        "general": "Annonces générales"
      }
    }
  }
}
```

---

#### Database Schema (`supabase/migrations/push_subscriptions.sql`)

```sql
-- Push notification subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB NOT NULL,
  categories TEXT[] NOT NULL DEFAULT ARRAY['general'],
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for category-based broadcast queries
CREATE INDEX idx_push_subscriptions_categories ON push_subscriptions USING GIN (categories);

-- Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (for Edge Functions)
CREATE POLICY "Service role only" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');
```

---

### 9.2 Background Sync

**Goal**: Ensure the vector store and service data stay updated even when the app is backgrounded or closed.

#### 9.2.1 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Service Worker │────>│  Background Sync │────>│ /api/v1/services│
│   (sw.js)       │     │      API         │     │    (fetch)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        v                        v
┌─────────────────┐     ┌──────────────────┐
│   IndexedDB     │<────│  Cache Update    │
│ (services-cache)│     │                  │
└─────────────────┘     └──────────────────┘
```

#### [MODIFY] `public/sw.js`

```javascript
// Background Sync Registration
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-services") {
    event.waitUntil(syncServices())
  }
})

async function syncServices() {
  try {
    const response = await fetch("/api/v1/services?fields=id,name,description,updated_at")
    if (!response.ok) throw new Error(`Sync failed: ${response.status}`)

    const services = await response.json()
    const cache = await caches.open("kcc-services-v1")

    // Update cache with fresh data
    await cache.put(
      "/api/v1/services",
      new Response(JSON.stringify(services), {
        headers: { "Content-Type": "application/json" },
      })
    )

    // Notify clients of update
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "SERVICES_UPDATED",
        count: services.length,
        timestamp: Date.now(),
      })
    })

    console.log(`[SW] Synced ${services.length} services`)
  } catch (error) {
    console.error("[SW] Background sync failed:", error)
    throw error // Retry will be scheduled by the browser
  }
}

// Periodic Background Sync (requires user permission)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "sync-services-daily") {
    event.waitUntil(syncServices())
  }
})
```

#### [NEW] `lib/pwa/background-sync.ts`

```typescript
export async function registerBackgroundSync() {
  if (!("serviceWorker" in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready

    // One-time sync (when coming back online)
    if ("sync" in registration) {
      await (registration as any).sync.register("sync-services")
    }

    // Periodic sync (daily updates)
    if ("periodicSync" in registration) {
      const status = await navigator.permissions.query({
        name: "periodic-background-sync" as PermissionName,
      })

      if (status.state === "granted") {
        await (registration as any).periodicSync.register("sync-services-daily", {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        })
      }
    }

    return true
  } catch (error) {
    console.warn("[BackgroundSync] Registration failed:", error)
    return false
  }
}
```

---

## Phase 10: Bilingual Completion Audit (Est. 1-2 Weeks)

### 10.1 Content Audit

**Goal**: Identify and resolve any service descriptions or identity tags missing French translations.

#### 10.1.1 Audit Script

**[NEW] `scripts/bilingual-audit.ts`**

```typescript
#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from "fs"
import path from "path"

interface Service {
  id: string
  name: string
  name_fr?: string
  description: string
  description_fr?: string
  eligibility_notes?: string
  eligibility_notes_fr?: string
}

interface AuditResult {
  serviceId: string
  serviceName: string
  missingFields: string[]
}

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const REPORT_PATH = path.join(process.cwd(), "data/bilingual-audit-report.json")

function auditServices(): AuditResult[] {
  const services: Service[] = JSON.parse(readFileSync(SERVICES_PATH, "utf-8"))
  const issues: AuditResult[] = []

  for (const service of services) {
    const missingFields: string[] = []

    // Check required French fields
    if (!service.name_fr?.trim()) {
      missingFields.push("name_fr")
    }
    if (!service.description_fr?.trim()) {
      missingFields.push("description_fr")
    }
    if (service.eligibility_notes && !service.eligibility_notes_fr?.trim()) {
      missingFields.push("eligibility_notes_fr")
    }

    if (missingFields.length > 0) {
      issues.push({
        serviceId: service.id,
        serviceName: service.name,
        missingFields,
      })
    }
  }

  return issues
}

function main() {
  console.log("🔍 Running bilingual content audit...")

  const issues = auditServices()

  if (issues.length === 0) {
    console.log("✅ All services have complete French translations!")
    return
  }

  console.log(`\n⚠️  Found ${issues.length} services with missing French content:\n`)

  // Summary by field
  const fieldCounts: Record<string, number> = {}
  for (const issue of issues) {
    for (const field of issue.missingFields) {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1
    }
  }

  console.log("Missing Fields Summary:")
  for (const [field, count] of Object.entries(fieldCounts)) {
    console.log(`  - ${field}: ${count} services`)
  }

  // Write detailed report
  writeFileSync(REPORT_PATH, JSON.stringify({ generated: new Date().toISOString(), issues }, null, 2))
  console.log(`\n📝 Detailed report saved to: ${REPORT_PATH}`)

  // Exit with error code for CI integration
  process.exit(1)
}

main()
```

#### [MODIFY] `package.json`

```json
{
  "scripts": {
    "bilingual-check": "npx tsx scripts/bilingual-audit.ts"
  }
}
```

---

### 10.2 UI Audit

**Goal**: Final pass on all error messages, tooltips, and dashboard components.

#### 10.2.1 Automated Key Audit

**[NEW] `scripts/i18n-key-audit.ts`**

```typescript
#!/usr/bin/env npx tsx
import { readFileSync, readdirSync, statSync } from "fs"
import path from "path"

const MESSAGES_DIR = path.join(process.cwd(), "messages")
const COMPONENTS_DIR = path.join(process.cwd(), "components")
const APP_DIR = path.join(process.cwd(), "app")

interface KeyAuditResult {
  missingInFr: string[]
  missingInEn: string[]
  unusedKeys: string[]
}

function getAllKeys(obj: Record<string, any>, prefix = ""): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null) {
      keys.push(...getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function findUsedKeys(dir: string): Set<string> {
  const usedKeys = new Set<string>()
  const tPattern = /t\(["'`]([^"'`]+)["'`]\)/g

  function scanFile(filePath: string) {
    const content = readFileSync(filePath, "utf-8")
    let match
    while ((match = tPattern.exec(content)) !== null) {
      usedKeys.add(match[1])
    }
  }

  function scanDir(dir: string) {
    for (const entry of readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        scanDir(fullPath)
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        scanFile(fullPath)
      }
    }
  }

  scanDir(dir)
  return usedKeys
}

function main() {
  console.log("🌐 Running i18n key audit...")

  const enMessages = JSON.parse(readFileSync(path.join(MESSAGES_DIR, "en.json"), "utf-8"))
  const frMessages = JSON.parse(readFileSync(path.join(MESSAGES_DIR, "fr.json"), "utf-8"))

  const enKeys = new Set(getAllKeys(enMessages))
  const frKeys = new Set(getAllKeys(frMessages))

  // Find missing keys
  const missingInFr = [...enKeys].filter((k) => !frKeys.has(k))
  const missingInEn = [...frKeys].filter((k) => !enKeys.has(k))

  // Find unused keys
  const usedKeys = new Set([...findUsedKeys(COMPONENTS_DIR), ...findUsedKeys(APP_DIR)])
  const unusedKeys = [...enKeys].filter((k) => !usedKeys.has(k))

  console.log("\n📊 Audit Results:\n")

  if (missingInFr.length > 0) {
    console.log(`❌ Missing in French (${missingInFr.length}):`)
    missingInFr.forEach((k) => console.log(`   - ${k}`))
  } else {
    console.log("✅ All English keys have French translations")
  }

  if (missingInEn.length > 0) {
    console.log(`\n❌ Missing in English (${missingInEn.length}):`)
    missingInEn.forEach((k) => console.log(`   - ${k}`))
  }

  if (unusedKeys.length > 0) {
    console.log(`\n⚠️  Potentially unused keys (${unusedKeys.length}):`)
    unusedKeys.slice(0, 10).forEach((k) => console.log(`   - ${k}`))
    if (unusedKeys.length > 10) {
      console.log(`   ... and ${unusedKeys.length - 10} more`)
    }
  }

  // Exit with error if missing keys
  if (missingInFr.length > 0 || missingInEn.length > 0) {
    process.exit(1)
  }
}

main()
```

---

## Phase 11: Automated Verification Bot (Est. 2-3 Weeks)

### 11.1 URL Health Checker

**Goal**: Monthly automated crawl to flag 404s and broken links in service data.

#### 11.1.1 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ GitHub Actions  │────>│  URL Checker     │────>│  Create Issue   │
│ (Monthly Cron)  │     │  Script          │     │  with Report    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

#### [NEW] `scripts/health-check-urls.ts`

```typescript
#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from "fs"
import path from "path"

interface Service {
  id: string
  name: string
  url?: string
  phone?: string
}

interface HealthCheckResult {
  serviceId: string
  serviceName: string
  url: string
  status: number | "error"
  errorMessage?: string
  responseTime?: number
}

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const REPORT_PATH = path.join(process.cwd(), "data/url-health-report.json")

async function checkUrl(url: string): Promise<{ status: number | "error"; errorMessage?: string; responseTime: number }> {
  const start = Date.now()
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "KingstonCareConnect-HealthCheck/1.0",
      },
    })

    clearTimeout(timeout)
    return {
      status: response.status,
      responseTime: Date.now() - start,
    }
  } catch (error) {
    return {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      responseTime: Date.now() - start,
    }
  }
}

async function main() {
  console.log("🔗 Running URL health check...")

  const services: Service[] = JSON.parse(readFileSync(SERVICES_PATH, "utf-8"))
  const servicesWithUrls = services.filter((s) => s.url)

  console.log(`Found ${servicesWithUrls.length} services with URLs\n`)

  const results: HealthCheckResult[] = []
  let checked = 0

  for (const service of servicesWithUrls) {
    const result = await checkUrl(service.url!)
    results.push({
      serviceId: service.id,
      serviceName: service.name,
      url: service.url!,
      ...result,
    })

    checked++
    const statusIcon = result.status === 200 ? "✅" : result.status === "error" ? "❌" : "⚠️"
    process.stdout.write(`\r${statusIcon} Checked ${checked}/${servicesWithUrls.length}`)

    // Rate limiting: 500ms between requests
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log("\n\n📊 Results Summary:\n")

  const healthy = results.filter((r) => r.status === 200)
  const broken = results.filter((r) => r.status === "error" || (typeof r.status === "number" && r.status >= 400))
  const redirects = results.filter((r) => typeof r.status === "number" && r.status >= 300 && r.status < 400)

  console.log(`  ✅ Healthy: ${healthy.length}`)
  console.log(`  🔀 Redirects: ${redirects.length}`)
  console.log(`  ❌ Broken: ${broken.length}`)

  if (broken.length > 0) {
    console.log("\n❌ Broken URLs:\n")
    for (const result of broken) {
      console.log(`  - ${result.serviceName}`)
      console.log(`    URL: ${result.url}`)
      console.log(`    Error: ${result.errorMessage || `HTTP ${result.status}`}\n`)
    }
  }

  // Write report
  writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        summary: {
          total: results.length,
          healthy: healthy.length,
          redirects: redirects.length,
          broken: broken.length,
        },
        broken,
        redirects,
      },
      null,
      2
    )
  )

  console.log(`📝 Report saved to: ${REPORT_PATH}`)

  if (broken.length > 0) {
    process.exit(1)
  }
}

main()
```

---

#### [NEW] `.github/workflows/health-check.yml`

```yaml
name: Monthly Health Check

on:
  schedule:
    - cron: "0 8 1 * *" # 8 AM UTC on the 1st of each month
  workflow_dispatch:

jobs:
  url-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci

      - name: Run URL Health Check
        id: health-check
        run: npx tsx scripts/health-check-urls.ts
        continue-on-error: true

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: url-health-report
          path: data/url-health-report.json

      - name: Create Issue on Failure
        if: steps.health-check.outcome == 'failure'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('data/url-health-report.json', 'utf-8'));
            
            const brokenList = report.broken
              .map(b => `- [ ] **${b.serviceName}** (ID: \`${b.serviceId}\`)\n  - URL: ${b.url}\n  - Error: ${b.errorMessage || `HTTP ${b.status}`}`)
              .join('\n');
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🔗 Monthly Health Check: ${report.broken.length} Broken URLs Found`,
              body: `## URL Health Check Report\n\n**Generated**: ${report.generated}\n\n### Summary\n- ✅ Healthy: ${report.summary.healthy}\n- 🔀 Redirects: ${report.summary.redirects}\n- ❌ Broken: ${report.summary.broken}\n\n### Broken URLs\n\n${brokenList}\n\n---\n*This issue was automatically generated by the monthly health check workflow.*`,
              labels: ['data-quality', 'automated']
            });
```

---

### 11.2 Phone Number Validator

**Goal**: Validate phone number connectivity using Twilio Lookup API.

> [!WARNING]
> Twilio Lookup API costs ~$0.005/lookup. Budget ~$1/month for 200 services.

#### [NEW] `scripts/validate-phones.ts`

```typescript
#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from "fs"
import path from "path"

interface Service {
  id: string
  name: string
  phone?: string
}

interface PhoneValidationResult {
  serviceId: string
  serviceName: string
  phone: string
  isValid: boolean
  carrier?: string
  type?: "mobile" | "landline" | "voip"
  errorMessage?: string
}

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const REPORT_PATH = path.join(process.cwd(), "data/phone-validation-report.json")

async function validatePhone(phone: string): Promise<Partial<PhoneValidationResult>> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return { isValid: true, errorMessage: "Twilio credentials not configured (skipped)" }
  }

  try {
    const cleanPhone = phone.replace(/\D/g, "")
    const e164 = cleanPhone.startsWith("1") ? `+${cleanPhone}` : `+1${cleanPhone}`

    const response = await fetch(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164)}?Fields=line_type_intelligence`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return { isValid: false, errorMessage: "Phone number not found" }
      }
      throw new Error(`Twilio API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      isValid: data.valid,
      carrier: data.line_type_intelligence?.carrier_name,
      type: data.line_type_intelligence?.type,
    }
  } catch (error) {
    return {
      isValid: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function main() {
  console.log("📞 Running phone validation...")

  const services: Service[] = JSON.parse(readFileSync(SERVICES_PATH, "utf-8"))
  const servicesWithPhones = services.filter((s) => s.phone)

  console.log(`Found ${servicesWithPhones.length} services with phone numbers\n`)

  const results: PhoneValidationResult[] = []

  for (const service of servicesWithPhones) {
    const result = await validatePhone(service.phone!)
    results.push({
      serviceId: service.id,
      serviceName: service.name,
      phone: service.phone!,
      isValid: result.isValid ?? false,
      ...result,
    })

    // Rate limiting
    await new Promise((r) => setTimeout(r, 200))
  }

  const valid = results.filter((r) => r.isValid)
  const invalid = results.filter((r) => !r.isValid)

  console.log("\n📊 Results:")
  console.log(`  ✅ Valid: ${valid.length}`)
  console.log(`  ❌ Invalid: ${invalid.length}`)

  writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        summary: { total: results.length, valid: valid.length, invalid: invalid.length },
        invalid,
      },
      null,
      2
    )
  )
}

main()
```

---

## Phase 12: Partner Organization Dashboard (Est. 3-4 Weeks)

### 12.1 Listing Management (CRUD)

**Goal**: Allow partners to update their own contact info, hours, and eligibility notes via a self-service interface.

#### 12.1.1 User Flow

```
Partner Login → Dashboard → My Listings → Edit Service → Submit Changes → Pending Review
```

#### 12.1.2 Component Architecture

#### [NEW] `app/[locale]/dashboard/services/page.tsx`

```typescript
import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { PartnerServiceList } from "@/components/partner/PartnerServiceList"
import { Skeleton } from "@/components/ui/skeleton"

export async function generateMetadata() {
  const t = await getTranslations("Dashboard")
  return { title: t("services.title") }
}

export default async function PartnerServicesPage() {
  const t = await getTranslations("Dashboard")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("services.title")}</h1>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PartnerServiceList partnerId={user.id} />
      </Suspense>
    </div>
  )
}
```

---

#### [NEW] `components/partner/ServiceEditForm.tsx`

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "next-intl"
import { Save, Loader2 } from "lucide-react"

const ServiceEditSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  name_fr: z.string().min(3, "French name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  description_fr: z.string().min(20, "French description must be at least 20 characters"),
  phone: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  operating_hours: z.string().optional(),
  eligibility_notes: z.string().optional(),
  eligibility_notes_fr: z.string().optional(),
})

type ServiceEditFormData = z.infer<typeof ServiceEditSchema>

interface Props {
  service: ServiceEditFormData & { id: string }
  onSave: (data: ServiceEditFormData) => Promise<void>
}

export function ServiceEditForm({ service, onSave }: Props) {
  const t = useTranslations("Dashboard.services")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ServiceEditFormData>({
    resolver: zodResolver(ServiceEditSchema),
    defaultValues: service,
  })

  const onSubmit = async (data: ServiceEditFormData) => {
    setIsSubmitting(true)
    try {
      await onSave(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* English Name */}
        <div>
          <label className="text-sm font-medium">{t("name")} (EN)</label>
          <Input {...register("name")} />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
        </div>

        {/* French Name */}
        <div>
          <label className="text-sm font-medium">{t("name")} (FR)</label>
          <Input {...register("name_fr")} />
          {errors.name_fr && <p className="mt-1 text-sm text-red-500">{errors.name_fr.message}</p>}
        </div>

        {/* English Description */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium">{t("description")} (EN)</label>
          <Textarea {...register("description")} rows={4} />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* French Description */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium">{t("description")} (FR)</label>
          <Textarea {...register("description_fr")} rows={4} />
          {errors.description_fr && (
            <p className="mt-1 text-sm text-red-500">{errors.description_fr.message}</p>
          )}
        </div>

        {/* Contact Info */}
        <div>
          <label className="text-sm font-medium">{t("phone")}</label>
          <Input {...register("phone")} type="tel" />
        </div>

        <div>
          <label className="text-sm font-medium">{t("website")}</label>
          <Input {...register("url")} type="url" placeholder="https://" />
          {errors.url && <p className="mt-1 text-sm text-red-500">{errors.url.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">{t("address")}</label>
          <Input {...register("address")} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">{t("hours")}</label>
          <Input {...register("operating_hours")} placeholder="Mon-Fri 9am-5pm" />
        </div>

        {/* Eligibility Notes */}
        <div>
          <label className="text-sm font-medium">{t("eligibility")} (EN)</label>
          <Textarea {...register("eligibility_notes")} rows={3} />
        </div>

        <div>
          <label className="text-sm font-medium">{t("eligibility")} (FR)</label>
          <Textarea {...register("eligibility_notes_fr")} rows={3} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("saveChanges")}
        </Button>
      </div>
    </form>
  )
}
```

---

### 12.2 Member Management

**Goal**: Allow organizations to have multiple staff accounts with role-based access.

#### 12.2.1 Role Definitions

| Role | Permissions |
|------|-------------|
| `owner` | Full access, can manage members, delete organization |
| `admin` | Edit all listings, invite members |
| `editor` | Edit assigned listings only |
| `viewer` | Read-only access to analytics |

#### Database Schema

```sql
-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- RLS Policies
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own organization's members
CREATE POLICY "Members can view org members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
    )
  );

-- Only admins/owners can insert
CREATE POLICY "Admins can invite members" ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );
```

---

## Verification Plan

| Phase | Test Type | Method |
|-------|-----------|--------|
| 8.1-8.3 Tests & Scripts | Unit | `npm test` (new test files) |
| 8.4 Health Check Workflow | Manual | Trigger `workflow_dispatch` in GitHub |
| 8.5 Edit Form | E2E | Navigate to `/dashboard/services/[id]/edit` |
| 8.6 Database Migration | Manual | Run migration in Supabase SQL Editor |
| 9.1 Push Notifications | E2E | Playwright tests for permission flow and subscription API |
| 9.2 Background Sync | Integration | Mock SW and verify IndexedDB updates |
| 10.1 Content Audit | Script | `npm run bilingual-check` in CI |
| 10.2 UI Audit | Script | `npm run i18n-audit` in CI |
| 11.1 URL Checker | Integration | Monthly GitHub Action with issue creation |
| 11.2 Phone Validator | Integration | Quarterly manual run (Twilio costs) |
| 12.1 Listing CRUD | E2E | Full edit → submit → approval flow |
| 12.2 Member Management | Unit + E2E | Permission checks and invite flow |

---

## Timeline Summary

| Activity | Duration | Complexity | Dependencies |
|----------|----------|------------|--------------|
| **Phase 8: Foundation Hardening** | **1 Week** | **Low-Medium** | **None (prerequisite)** |
| Phase 9: Mobile Excellence | 2-3 Weeks | High | Phase 8 complete, SW expertise |
| Phase 10: Bilingual Audit | 1-2 Weeks | Medium | Phase 8 scripts ready |
| Phase 11: Verification Bots | 2-3 Weeks | Medium | Twilio API agreement |
| Phase 12: Partner Dashboard | 3-4 Weeks | High | Phase 8 DB migration, Auth system |

> [!NOTE]
> **Recommended Order**: Phase 8 → Phase 10 → Phase 9 → Phase 11 → Phase 12
> 
> Complete Phase 8 first as it has no dependencies and enables all subsequent phases. Phase 10 can run in parallel with Phase 9 since they're independent.

---

## Environment Variables Required

```env
# Push Notifications (Phase 9)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Phone Validation (Phase 11.2)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| VAPID key management | High | Store in GitHub Secrets, rotate annually |
| Twilio costs exceed budget | Medium | Set monthly caps, cache validation results |
| French translation quality | Medium | Partner with local francophone community |
| Service worker conflicts | High | Comprehensive testing, staged rollout |
| Partner abuse (spam edits) | Medium | Moderation queue, rate limiting |
