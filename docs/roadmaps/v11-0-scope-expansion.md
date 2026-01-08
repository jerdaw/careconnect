# v11.0: Ontario Scope Expansion (Implementation Plan)

> **Status**: ✅ Complete  
> **Target Version**: v11.0  
> **Completed**: 2026-01-08  
> **Focus**: Expanding from "Kingston-only" to "Applies to Kingston (Ontario-wide)"  
> **Philosophy**: Manual Curation > Automatic Dump. Trust > Volume.

---

## 0) Executive Summary

We are expanding Kingston Care Connect to support **Ontario-wide services** that are relevant to Kingston residents (e.g., Telehealth, Provincial Crisis Lines, Legal Aid). This is **NOT** a pivot to become a generic "Ontario directory"; it is an expansion of _resources available to our users_ regardless of their physical location within the province.

**Key Constraints:**

1. **Maintain Trust**: We will not bulk-ingest thousands of unverified records.
2. **Hybrid Curation**: We will use AI (ChatGPT/Gemini) to _prospect_ and _draft_ services, but Humans must _verify_ and _publish_.
3. **Privacy First**: Geolocation remains client-side. No user tracking.
4. **211 Deferred**: No 211 Ontario API access yet; manual curation and AI research are primary methods.

---

## 1) Taxonomy & Data Architecture

### 1.1 Scope Definitions

| Scope      | Description                                        | Example                           |
| :--------- | :------------------------------------------------- | :-------------------------------- |
| `kingston` | Physically located in Kingston/KFL&A               | Kingston Food Bank                |
| `ontario`  | Available to anyone in Ontario (virtual/toll-free) | Telehealth Ontario, ConnexOntario |
| `canada`   | Available nationally (deferred to v12+)            | Kids Help Phone, Trans Lifeline   |

### 1.2 Database Schema Changes

**New Migration**: `supabase/migrations/20260108_add_scope_enum.sql`

```sql
-- 1. Create the scope enum type
CREATE TYPE service_scope AS ENUM ('kingston', 'ontario', 'canada');

-- 2. Add scope column to services table
ALTER TABLE services
ADD COLUMN scope service_scope DEFAULT 'kingston';

-- 3. Migrate existing is_provincial data
UPDATE services SET scope = 'ontario' WHERE is_provincial = true;

-- 4. Add new fields
ALTER TABLE services ADD COLUMN IF NOT EXISTS virtual_delivery BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS primary_phone_label TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_area TEXT;

-- 5. Update the public view to expose scope
DROP VIEW IF EXISTS services_public;
CREATE VIEW services_public AS
SELECT
  id, name, name_fr, description, description_fr,
  address, address_fr, phone, url, email,
  hours, fees, eligibility, application_process,
  languages, bus_routes, accessibility,
  last_verified, verification_status, category, tags,
  scope,                    -- NEW
  virtual_delivery,         -- NEW
  primary_phone_label,      -- NEW
  created_at
FROM services
WHERE
  published = true
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));

-- 6. Grant access
GRANT SELECT ON services_public TO anon;
GRANT SELECT ON services_public TO authenticated;
```

### 1.3 TypeScript Type Changes

**File**: `types/service.ts`

```typescript
// Add new type
export type ServiceScope = 'kingston' | 'ontario' | 'canada';

// Add to Service interface (after is_provincial)
scope?: ServiceScope;
virtual_delivery?: boolean;
primary_phone_label?: string;
service_area?: string;
```

**File**: `types/service-public.ts`

```typescript
// Add to ServicePublic interface
scope: string | null
virtual_delivery: boolean | null
primary_phone_label: string | null
```

**File**: `lib/schemas/service.ts`

```typescript
// Add new schema
export const ScopeSchema = z.enum(['kingston', 'ontario', 'canada']);

// Update ServiceSchema object to include:
scope: ScopeSchema.optional(),
virtual_delivery: z.boolean().optional(),
primary_phone_label: z.string().optional(),
service_area: z.string().optional(),
```

### 1.4 Governance Taxonomy

| Level               | Verification Requirement                     | Example          |
| :------------------ | :------------------------------------------- | :--------------- |
| **L0 (Unverified)** | AI-researched draft. Hidden/Draft only.      | Initial scrape   |
| **L1 (Basic)**      | Existence checked via official URL/Registry. | Federal benefits |
| **L2 (Vetted)**     | Contact confirmed (phone/email).             | Crisis lines     |
| **L3 (Partner)**    | Direct relationship.                         | Partner agencies |

---

## 2) Ingestion Strategy: "The Librarian's Assistant" (AI-Augmented)

### 2.1 Data Sources (Priority Order)

1. **Official Government Pages**: `ontario.ca`, Ministry of Health, Legal Aid Ontario
2. **Verified Directories**: 211ontario.ca (manual browsing, no API)
3. **AI Deep Research**: ChatGPT and Gemini Deep Research for discovery

### 2.2 Workflow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. DISCOVERY   │ -> │  2. ENRICHMENT  │ -> │  3. GOVERNANCE  │
│    (AI/Manual)  │    │    (AI)         │    │    (Human)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Step 1: Discovery (AI-Assisted)

**Script**: `scripts/ingest/prospector.ts`

- **Input**: Vertical category (e.g., "crisis", "legal", "health")
- **Method**: Use ChatGPT/Gemini to research Ontario-wide services
- **Output**: Draft JSON files in `data/drafts/ontario/`

```bash
# CLI Usage
npx tsx scripts/ingest/prospector.ts --vertical=crisis --llm=gemini
```

**Draft File Format** (`data/drafts/ontario/crisis/draft-988.json`):

```json
{
  "id": "ontario-988",
  "name": "988 Suicide Crisis Helpline",
  "name_fr": "Ligne de crise suicide 988",
  "description": "...",
  "phone": "988",
  "url": "https://988.ca",
  "scope": "ontario",
  "virtual_delivery": true,
  "intent_category": "Crisis",
  "verification_level": "L0",
  "_meta": {
    "source": "Gemini Deep Research",
    "researched_at": "2026-01-07T21:00:00Z",
    "confidence": 0.95,
    "needs_review": true
  }
}
```

#### Step 2: Enrichment (AI)

**Script**: `scripts/ingest/enrich-ai.ts`

- **LLM**: ChatGPT-4-turbo (primary) or Gemini 1.5 Pro (backup)
- **Tasks**:
  - Extract structured `hours` from website
  - Generate `eligibility_notes`
  - Create `synthetic_queries` (EN/FR)
  - Generate French translations (`name_fr`, `description_fr`)
  - Assign `identity_tags` with evidence URLs

**Prompt Template** (`data/prompts/enrich-service.md`):

```markdown
You are a social services researcher. Given this Ontario service:
Name: {{name}}
URL: {{url}}

Extract:

1. Operating hours (structured JSON)
2. Eligibility criteria (plain language)
3. 5 search queries a user might type to find this
4. French translation of name and description
5. Identity tags (e.g., "Youth", "Indigenous", "2SLGBTQI+")

Return as JSON matching this schema: ...
```

#### Step 3: Governance (Human Review)

**Script**: `scripts/verify-drafts.ts`

```bash
npx tsx scripts/verify-drafts.ts
```

**CLI Flow**:

1. List pending drafts from `data/drafts/ontario/`
2. For each draft:
   - Display diff against schema
   - Open URL in browser for manual verification
   - Prompt: `[A]pprove / [E]dit / [R]eject / [S]kip`
3. On Approve:
   - Set `verification_level: "L1"`
   - Move to `data/services.json` or insert to Supabase
   - Delete draft file

---

## 3) User Experience (UX)

### 3.1 "Kingston First, Ontario Supported"

The UI must clearly distinguish between a service _physically in Kingston_ and a service _available to Kingston residents_.

### 3.2 Badge Display

**File**: `components/ServiceCard.tsx`

| Scope      | Badge Text     | Badge Style                                      |
| :--------- | :------------- | :----------------------------------------------- |
| `kingston` | _(none)_       | N/A                                              |
| `ontario`  | "Ontario-wide" | `bg-blue-50 text-blue-700 border-blue-200`       |
| `canada`   | "Canada-wide"  | `bg-purple-50 text-purple-700 border-purple-200` |

**Code Change**:

```tsx
// Replace is_provincial check with scope
{
  service.scope === "ontario" && (
    <Badge variant="outline" size="sm" className="border-blue-200 bg-blue-50 text-blue-700">
      {t("Badges.ontarioWide")}
    </Badge>
  )
}
{
  service.scope === "canada" && (
    <Badge variant="outline" size="sm" className="border-purple-200 bg-purple-50 text-purple-700">
      {t("Badges.canadaWide")}
    </Badge>
  )
}
```

**i18n Additions** (`messages/en.json`):

```json
{
  "Badges": {
    "ontarioWide": "Ontario-wide",
    "canadaWide": "Canada-wide"
  }
}
```

**i18n Additions** (`messages/fr.json`):

```json
{
  "Badges": {
    "ontarioWide": "À l'échelle de l'Ontario",
    "canadaWide": "À l'échelle du Canada"
  }
}
```

### 3.3 Distance Display Logic

**File**: `components/ServiceCard.tsx` (distance display section)

```tsx
// For non-local services, show "Available across Ontario" instead of distance
{
  service.scope === "kingston" ? (
    <span>{distance ? `${distance.toFixed(1)} km` : "Kingston"}</span>
  ) : service.scope === "ontario" ? (
    <span>{t("Distance.ontarioWide")}</span>
  ) : (
    <span>{t("Distance.canadaWide")}</span>
  )
}
```

### 3.4 Search Filter

**File**: `components/SearchFilters.tsx`

Add scope filter dropdown:

```tsx
<Select value={scopeFilter} onValueChange={setScopeFilter}>
  <SelectItem value="all">{t("Filters.scopeAll")}</SelectItem>
  <SelectItem value="kingston">{t("Filters.scopeLocal")}</SelectItem>
  <SelectItem value="ontario">{t("Filters.scopeOntario")}</SelectItem>
</Select>
```

**URL Params**: `?scope=ontario` persists filter state.

### 3.5 Zero Results Fallback

**File**: `components/SearchResults.tsx`

When local search returns 0 results but provincial services exist:

```tsx
{
  results.length === 0 && provincialResults.length > 0 && (
    <div className="py-4 text-center">
      <p>{t("Search.noLocalResults")}</p>
      <Button variant="link" onClick={() => setScopeFilter("ontario")}>
        {t("Search.showOntarioResults", { count: provincialResults.length })}
      </Button>
    </div>
  )
}
```

---

## 4) Phased Implementation

### Phase A: Architecture & Migration (The Foundation) ✅

**Goal**: Schema supports scopes; existing data migrated.

| Task                                     | File                                              | Status |
| :--------------------------------------- | :------------------------------------------------ | :----- |
| Create SQL migration                     | `supabase/migrations/20260108_add_scope_enum.sql` | [x]    |
| Update Service type                      | `types/service.ts`                                | [x]    |
| Update ServicePublic type                | `types/service-public.ts`                         | [x]    |
| Update Zod schema                        | `lib/schemas/service.ts`                          | [x]    |
| Update services_public view              | (in migration)                                    | [x]    |
| Migrate 16 provincial services           | `UPDATE services SET scope='ontario'`             | [x]    |
| Update ServiceCard badge                 | `components/ServiceCard.tsx`                      | [x]    |
| Add deprecation comment to is_provincial | `types/service.ts`                                | [x]    |

### Phase B: Ingestion Pipeline (The Tooling) ✅

**Goal**: Tooling to ingest provincial data efficiently.

| Task                           | File                              | Status |
| :----------------------------- | :-------------------------------- | :----- |
| Create prospector CLI          | `scripts/ingest/prospector.ts`    | [x]    |
| Create AI enrichment script    | `scripts/ingest/enrich-prompt.ts` | [x]    |
| Create prompt templates        | `data/prompts/enrich-service.md`  | [x]    |
| Create verify-drafts CLI       | `scripts/verify-drafts.ts`        | [x]    |
| Create bulk-import CLI         | `scripts/ingest/bulk-import.ts`   | [x]    |
| Create drafts folder structure | `data/drafts/ontario/`            | [x]    |
| Document draft format          | `docs/data/draft-format.md`       | [x]    |

### Phase C: Content Expansion (Verticals) 🚧

**Goal**: Populate high-impact verticals.

| Vertical                                    | Target Count | Actual                   | Status |
| :------------------------------------------ | :----------- | :----------------------- | :----- |
| Crisis & Helplines                          | 20 services  | 25 (16 new + 9 existing) | [x]    |
| Health Connect (Telehealth, Poison Control) | 15 services  | 0                        | [ ]    |
| Legal & Rights (Legal Aid, HRTO)            | 10 services  | 0                        | [ ]    |

### Phase D: UI Polish & Launch

**Goal**: Users understand the new scope. Services display correctly based on their geographic availability.

---

#### D.1 Scope Filter in SearchControls

**File**: `components/home/SearchControls.tsx`

Add a scope toggle alongside the existing "Open Now" and "Location" filters.

**Component Changes**:

```tsx
// Add to SearchControlsProps interface
scope: 'all' | 'kingston' | 'provincial';  // 'provincial' = ontario + canada
setScope: (scope: 'all' | 'kingston' | 'provincial') => void;

// Add scope toggle button group (after Location Toggle)
<div className="flex items-center gap-1 rounded-full bg-muted p-1">
  <Button
    variant={scope === 'all' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setScope('all')}
    className="rounded-full px-3 h-8"
  >
    {t('scope.all')}
  </Button>
  <Button
    variant={scope === 'kingston' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setScope('kingston')}
    className="rounded-full px-3 h-8"
  >
    {t('scope.local')}
  </Button>
  <Button
    variant={scope === 'provincial' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setScope('provincial')}
    className="rounded-full px-3 h-8"
  >
    {t('scope.provincial')}
  </Button>
</div>
```

**i18n Keys** (`messages/en.json`):

```json
{
  "Search": {
    "scope": {
      "all": "All",
      "local": "Local",
      "provincial": "Province-wide"
    }
  }
}
```

**i18n Keys** (`messages/fr.json`):

```json
{
  "Search": {
    "scope": {
      "all": "Tout",
      "local": "Local",
      "provincial": "Provincial"
    }
  }
}
```

| Task                       | Status |
| :------------------------- | :----- |
| Add scope state to page    | [x]    |
| Update SearchControlsProps | [x]    |
| Add toggle button group    | [x]    |
| Add i18n keys              | [x]    |

---

#### D.2 URL Param Persistence

**File**: `hooks/useServices.ts` (or create `hooks/useScopeFilter.ts`)

Persist scope filter in URL for shareability and back-button support.

**Implementation**:

```tsx
// Use Next.js useSearchParams + useRouter
const searchParams = useSearchParams()
const router = useRouter()
const pathname = usePathname()

// Read from URL
const scopeFromUrl = searchParams.get("scope") as "all" | "kingston" | "provincial" | null
const [scope, setScopeState] = useState(scopeFromUrl || "all")

// Sync to URL on change
const setScope = (newScope: "all" | "kingston" | "provincial") => {
  setScopeState(newScope)
  const params = new URLSearchParams(searchParams)
  if (newScope === "all") {
    params.delete("scope")
  } else {
    params.set("scope", newScope)
  }
  router.replace(`${pathname}?${params.toString()}`, { scroll: false })
}
```

**URL Examples**:

- Default (all): `/` or `/?q=food`
- Local only: `/?scope=kingston&q=food`
- Provincial: `/?scope=provincial`

| Task                                 | Status |
| :----------------------------------- | :----- |
| Add scope to useSearchParams         | [x]    |
| Sync scope state to URL              | [x]    |
| Apply scope filter to search results | [x]    |

---

#### D.3 Distance Display Logic

**File**: `components/ServiceCard.tsx`

Replace distance calculation with scope-aware display.

**Current Logic** (line ~150):

```tsx
{
  distance && <span>{distance.toFixed(1)} km</span>
}
```

**New Logic**:

```tsx
{
  /* Distance / Scope Display */
}
{
  service.scope === "kingston" ? (
    distance ? (
      <span className="text-muted-foreground text-xs">
        <MapPin className="mr-1 inline h-3 w-3" />
        {distance.toFixed(1)} km
      </span>
    ) : (
      <span className="text-muted-foreground text-xs">Kingston</span>
    )
  ) : service.scope === "ontario" ? (
    <span className="text-xs text-blue-600 dark:text-blue-400">{t("Distance.ontarioWide")}</span>
  ) : service.scope === "canada" ? (
    <span className="text-xs text-purple-600 dark:text-purple-400">{t("Distance.canadaWide")}</span>
  ) : null
}
```

**i18n Keys** (already added in Phase A):

```json
{
  "Distance": {
    "ontarioWide": "Available across Ontario",
    "canadaWide": "Available across Canada"
  }
}
```

| Task                           | Status |
| :----------------------------- | :----- |
| Update distance display logic  | [x]    |
| Handle null scope (legacy)     | [x]    |
| Test badge + distance together | [x]    |

---

#### D.4 Zero-Results Fallback

**File**: `components/home/SearchResultsList.tsx`

When local search returns 0 results but provincial services exist, offer to expand scope.

**Implementation**:

```tsx
// In SearchResultsList, after checking results.length === 0
{
  results.length === 0 && scope === "kingston" && provincialCount > 0 && (
    <div className="py-8 text-center">
      <p className="text-muted-foreground mb-4">{t("Search.noLocalResults")}</p>
      <Button variant="outline" onClick={() => setScope("all")}>
        {t("Search.showAllResults", { count: provincialCount })}
      </Button>
    </div>
  )
}
```

**i18n Keys**:

```json
{
  "Search": {
    "noLocalResults": "No local services found for this search.",
    "showAllResults": "Show {count} province-wide results"
  }
}
```

| Task                        | Status |
| :-------------------------- | :----- |
| Count provincial results    | [x]    |
| Add fallback UI             | [x]    |
| Wire up scope change button | [x]    |
| Add i18n keys               | [x]    |

---

#### D.5 Filtering Logic in useServices

**File**: `hooks/useServices.ts`

Apply scope filter before returning results.

**Implementation**:

```tsx
// Filter by scope
const filterByScope = (services: Service[], scope: string) => {
  if (scope === "all") return services
  if (scope === "kingston") return services.filter((s) => s.scope === "kingston" || !s.scope)
  if (scope === "provincial") return services.filter((s) => s.scope === "ontario" || s.scope === "canada")
  return services
}

// Apply in search pipeline
const filteredResults = filterByScope(searchResults, scope)
```

| Task                                   | Status |
| :------------------------------------- | :----- |
| Add filterByScope function             | [x]    |
| Integrate with search pipeline         | [x]    |
| Calculate provincialCount for fallback | [x]    |

---

#### D.6 Final Checklist

| Task                               | File                                    | Status |
| :--------------------------------- | :-------------------------------------- | :----- |
| Add scope filter to SearchControls | `components/home/SearchControls.tsx`    | [x]    |
| Add scope to URL params            | `hooks/useServices.ts`                  | [x]    |
| Update zero-results fallback       | `components/home/SearchResultsList.tsx` | [x]    |
| Update distance display logic      | `components/ServiceCard.tsx`            | [x]    |
| Add i18n keys for filters          | `messages/en.json`, `messages/fr.json`  | [x]    |
| Update bilingual-dev-guide         | `bilingual-dev-guide.md`                | [x]    |

---

## 5) Canada-Wide Services (Deferred)

> [!NOTE]
> Canada-wide services are **deferred to v12+** but tracked here for future implementation.

**Tracking File**: `data/deferred/canada-wide-services.md`

### Known Canada-Wide Services to Add Later

| Service                           | Phone          | Category            | Notes                    |
| :-------------------------------- | :------------- | :------------------ | :----------------------- |
| Kids Help Phone                   | 1-800-668-6868 | Crisis              | Already in services.json |
| Trans Lifeline                    | 1-877-330-6366 | Crisis              | Already in services.json |
| Hope for Wellness                 | 1-855-242-3310 | Crisis (Indigenous) | Already in services.json |
| Veterans Affairs Crisis Line      | 1-800-268-7708 | Crisis              | To research              |
| Canada Suicide Prevention Service | 1-833-456-4566 | Crisis              | To research              |
| Service Canada                    | 1-800-622-6232 | Government          | To research              |
| Immigration Refugees Citizenship  | Various        | Newcomers           | To research              |

---

## 6) Success Metrics (Definition of Done)

- [ ] Schema supports `scope` enum (`kingston`, `ontario`, `canada`)
- [ ] All 16 existing provincial services migrated to `scope: 'ontario'`
- [ ] 45+ Ontario-wide services ingested and verified (L1+)
- [ ] Search "Legal Aid" returns verified provincial option + local clinics
- [ ] Search filter UI allows toggling Local / Ontario-wide / All
- [ ] "Ontario-wide" badge displays correctly in EN and FR
- [ ] No degradation in search performance
- [ ] All new services have EN and FR fields
- [ ] `is_provincial` deprecated with comment

---

## 7) Verification Plan

### Automated Tests

| Test Type   | File                                 | Description                            |
| :---------- | :----------------------------------- | :------------------------------------- |
| Unit        | `tests/lib/schemas/service.test.ts`  | Validate `scope` enum parsing with Zod |
| Unit        | `tests/lib/search/ranking.test.ts`   | Test scope-aware search ranking        |
| Integration | `tests/integration/services.test.ts` | Test scope filter in API               |
| E2E         | `tests/e2e/search-scope.spec.ts`     | Filter toggle + badge visibility       |

**Commands**:

```bash
# Unit tests
npm test -- service.test.ts

# E2E tests
npx playwright test search-scope.spec.ts
```

### Manual Verification

1. **Badge Display**:

   - Search "ConnexOntario"
   - Verify "Ontario-wide" badge appears
   - Switch to French locale
   - Verify "À l'échelle de l'Ontario" appears

2. **Scope Filter**:

   - Search "legal aid"
   - Toggle to "Local Only"
   - Verify provincial services disappear
   - Verify filter persists in URL (`?scope=kingston`)

3. **Distance Display**:

   - View a Kingston service → shows "2.3 km"
   - View an Ontario service → shows "Available across Ontario"

4. **Zero Results Fallback**:
   - Search "obscure local service"
   - Verify fallback offers to show Ontario-wide results
