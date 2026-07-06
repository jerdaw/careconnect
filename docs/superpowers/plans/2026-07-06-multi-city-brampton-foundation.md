# Multi-City Brampton Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Brampton-first multi-city foundation that keeps Kingston live, adds explicit place selection, filters search by service coverage, and prepares a small verified Brampton launch workflow.

**Architecture:** Add a typed place registry and coverage helpers, then route the selected `placeId` through local search, server search, offline export, and UI state. Keep legacy `scope` compatibility during the transition, and make the homepage hero rotate through supported region labels from the place registry while keeping the selected-place control explicit.

**Tech Stack:** Next.js 16 App Router, TypeScript strict mode, React 19, Tailwind CSS v4, Radix UI, next-intl, Vitest, Supabase/PostgreSQL.

---

## Scope Check

This is a master implementation plan with commit-sized tasks. The spec spans data contracts, search, UI, docs, and curation workflow; these areas are coupled by the selected-place and service-coverage contract. Implement tasks in order so each commit leaves the app in a testable state.

Do not add Brampton production service records in the foundation tasks. Brampton records enter only through the draft and L1 review workflow in Task 8.

## File Structure

Create:

- `lib/places/types.ts`: place, bounds, and service coverage type definitions.
- `lib/places/registry.ts`: supported place registry with Kingston and Brampton entries.
- `lib/places/coverage.ts`: legacy scope compatibility, coverage matching, badge labels, and hero place selection helpers.
- `lib/places/selection.ts`: local selected-place storage key and inference helpers.
- `tests/lib/places/coverage.test.ts`: coverage and legacy scope behavior.
- `tests/lib/places/registry.test.ts`: registry shape and hero-visible place behavior.
- `components/home/PlaceSelector.tsx`: accessible selected-place control.
- `components/home/RotatingRegionHero.tsx`: motion-safe homepage region headline.
- `tests/components/home/PlaceSelector.test.tsx`: selector accessibility and callbacks.
- `tests/components/home/RotatingRegionHero.test.tsx`: hero copy, registry source, and reduced-motion behavior.
- `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`: local migration for coverage fields and public view exposure.
- `data/prompts/discover-city-services.md`: city-specific discovery prompt for draft-only research.
- `data/drafts/brampton-on/README.md`: Brampton draft workflow notes.
- `docs/governance/city-expansion-curation.md`: public-safe curation rules for city expansion.

Modify:

- `types/service.ts`: add `ServiceCoverageArea`, `PlaceId`, and `primary_place_id` / `coverage`.
- `types/service-public.ts`: expose public coverage/place fields.
- `types/supabase.ts`: regenerate after local DB migration when the DB lane is available; otherwise update only after `npm run db:types`.
- `lib/schemas/service.ts`: validate `coverage` and `primary_place_id`.
- `lib/schemas/service-create.ts`: allow reviewed service creation with new fields.
- `lib/search/types.ts`: add `placeId` to search options.
- `lib/schemas/search.ts`: add `filters.placeId`.
- `lib/search/index.ts`: filter candidates by selected place.
- `lib/search/client-enhancer.ts`: replace `scope` filtering with coverage filtering.
- `lib/search/map-service-public.ts`: map public coverage fields into `Service`.
- `lib/service-db.ts`: map coverage/place fields to and from DB rows.
- `app/api/v1/search/services/route.ts`: accept `filters.placeId`, filter candidates, and preserve privacy headers.
- `app/api/v1/services/export/route.ts`: include public coverage fields through the existing public export shape.
- `hooks/useSearch.ts`: track selected place and location inference state.
- `hooks/useServices.ts`: pass `placeId` to local and server search.
- `components/home/SearchControls.tsx`: include `PlaceSelector`.
- `app/[locale]/page.tsx`: replace hard-coded `Kingston` hero prefix with `RotatingRegionHero`.
- `components/services/ServiceCard.tsx`: show coverage-aware badges and place fallback labels.
- `messages/*.json`: add place selector, hero, badge, and sparse-result copy in all supported locales.
- `docs/superpowers/specs/2026-07-06-multi-city-brampton-foundation-design.md`: keep this spec unchanged during implementation unless requirements change.

## Task 1: Place Registry And Coverage Helpers

**Files:**

- Create: `lib/places/types.ts`
- Create: `lib/places/registry.ts`
- Create: `lib/places/coverage.ts`
- Modify: `types/service.ts`
- Modify: `lib/schemas/service.ts`
- Test: `tests/lib/places/coverage.test.ts`
- Test: `tests/lib/places/registry.test.ts`

- [ ] **Step 1: Write the failing registry tests**

Create `tests/lib/places/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { getHeroPlaces, getPlaceById, SUPPORTED_PLACES } from "@/lib/places/registry"

describe("place registry", () => {
  it("contains Kingston and Brampton with stable IDs", () => {
    expect(getPlaceById("kingston-on")?.name).toBe("Kingston")
    expect(getPlaceById("brampton-on")?.name).toBe("Brampton")
  })

  it("uses only live or preview places for the homepage hero", () => {
    const heroIds = getHeroPlaces().map((place) => place.id)

    expect(heroIds).toContain("kingston-on")
    expect(heroIds).toContain("brampton-on")
    expect(getHeroPlaces().every((place) => place.status === "live" || place.status === "preview")).toBe(true)
  })

  it("keeps registry IDs unique", () => {
    const ids = SUPPORTED_PLACES.map((place) => place.id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Write the failing coverage tests**

Create `tests/lib/places/coverage.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  getCoverageBadges,
  getPrimaryPlaceLabel,
  normalizeServiceCoverage,
  serviceServesPlace,
} from "@/lib/places/coverage"
import { VerificationLevel, IntentCategory, type Service } from "@/types/service"

const baseService: Service = {
  id: "svc",
  name: "Service",
  description: "A public service record",
  url: "https://example.com",
  verification_level: VerificationLevel.L1,
  intent_category: IntentCategory.Community,
  provenance: {
    verified_by: "jer",
    verified_at: "2026-07-06T00:00:00.000Z",
    evidence_url: "https://example.com",
    method: "manual_review",
  },
  identity_tags: [],
  synthetic_queries: [],
}

describe("coverage helpers", () => {
  it("maps legacy Kingston scope to Kingston local coverage", () => {
    const service = { ...baseService, scope: "kingston" as const }

    expect(normalizeServiceCoverage(service)).toEqual([{ kind: "local", placeIds: ["kingston-on"] }])
    expect(serviceServesPlace(service, "kingston-on")).toBe(true)
    expect(serviceServesPlace(service, "brampton-on")).toBe(false)
  })

  it("maps legacy provincial and national scopes to broad coverage", () => {
    expect(serviceServesPlace({ ...baseService, scope: "ontario" }, "brampton-on")).toBe(true)
    expect(serviceServesPlace({ ...baseService, scope: "canada" }, "kingston-on")).toBe(true)
  })

  it("uses explicit coverage before legacy scope", () => {
    const service: Service = {
      ...baseService,
      scope: "kingston",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    }

    expect(serviceServesPlace(service, "brampton-on")).toBe(true)
    expect(serviceServesPlace(service, "kingston-on")).toBe(false)
  })

  it("returns human-readable coverage badges", () => {
    const service: Service = {
      ...baseService,
      coverage: [
        { kind: "local", placeIds: ["brampton-on"] },
        { kind: "provincial", label: "Ontario-wide" },
      ],
    }

    expect(getCoverageBadges(service).map((badge) => badge.label)).toEqual(["Brampton", "Ontario-wide"])
  })

  it("returns a primary place label when available", () => {
    expect(getPrimaryPlaceLabel({ ...baseService, primary_place_id: "brampton-on" })).toBe("Brampton")
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm test -- tests/lib/places/registry.test.ts tests/lib/places/coverage.test.ts
```

Expected: fail because `@/lib/places/registry` and `@/lib/places/coverage` do not exist.

- [ ] **Step 4: Add place and coverage types**

Modify `types/service.ts` near the current `ServiceScope` definition:

```ts
export type PlaceId = "kingston-on" | "brampton-on"

export type ServiceCoverageKind = "local" | "regional" | "provincial" | "national"

export interface ServiceCoverageArea {
  kind: ServiceCoverageKind
  placeIds?: PlaceId[]
  regionIds?: string[]
  label?: string
  notes?: string
}
```

Add these fields to `Service` near the existing `scope` field:

```ts
  /**
   * Primary place for the service's main physical or local operating context.
   */
  primary_place_id?: PlaceId

  /**
   * Structured geographic availability. New code should use this instead of the legacy `scope` enum.
   */
  coverage?: ServiceCoverageArea[]
```

- [ ] **Step 5: Create `lib/places/types.ts`**

```ts
import type { PlaceId } from "@/types/service"

export type PlaceStatus = "live" | "preview" | "hidden"

export interface PlaceBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface SupportedPlace {
  id: PlaceId
  name: string
  province: "Ontario"
  country: "Canada"
  status: PlaceStatus
  heroLabel: string
  serviceLabel: string
  centroid: {
    lat: number
    lng: number
  }
  bounds: PlaceBounds
}
```

- [ ] **Step 6: Create `lib/places/registry.ts`**

```ts
import type { PlaceId } from "@/types/service"
import type { SupportedPlace } from "@/lib/places/types"

export const SUPPORTED_PLACES: readonly SupportedPlace[] = [
  {
    id: "kingston-on",
    name: "Kingston",
    province: "Ontario",
    country: "Canada",
    status: "live",
    heroLabel: "Kingston",
    serviceLabel: "Kingston",
    centroid: { lat: 44.2312, lng: -76.486 },
    bounds: { north: 44.35, south: 44.12, east: -76.32, west: -76.72 },
  },
  {
    id: "brampton-on",
    name: "Brampton",
    province: "Ontario",
    country: "Canada",
    status: "preview",
    heroLabel: "Brampton",
    serviceLabel: "Brampton",
    centroid: { lat: 43.7315, lng: -79.7624 },
    bounds: { north: 43.86, south: 43.61, east: -79.59, west: -79.89 },
  },
] as const

const PLACE_BY_ID = new Map<PlaceId, SupportedPlace>(SUPPORTED_PLACES.map((place) => [place.id, place]))

export function getPlaceById(placeId: PlaceId | string | undefined): SupportedPlace | undefined {
  if (!placeId) return undefined
  return PLACE_BY_ID.get(placeId as PlaceId)
}

export function getHeroPlaces(): SupportedPlace[] {
  return SUPPORTED_PLACES.filter((place) => place.status === "live" || place.status === "preview")
}

export function isSupportedPlaceId(value: unknown): value is PlaceId {
  return typeof value === "string" && PLACE_BY_ID.has(value as PlaceId)
}
```

- [ ] **Step 7: Create `lib/places/coverage.ts`**

```ts
import type { PlaceId, Service, ServiceCoverageArea } from "@/types/service"
import { getPlaceById } from "@/lib/places/registry"

export interface CoverageBadge {
  key: string
  label: string
  kind: ServiceCoverageArea["kind"]
}

export function normalizeServiceCoverage(service: Pick<Service, "coverage" | "scope">): ServiceCoverageArea[] {
  if (service.coverage && service.coverage.length > 0) {
    return service.coverage
  }

  if (service.scope === "kingston" || !service.scope) {
    return [{ kind: "local", placeIds: ["kingston-on"] }]
  }

  if (service.scope === "ontario") {
    return [{ kind: "provincial", label: "Ontario-wide" }]
  }

  if (service.scope === "canada") {
    return [{ kind: "national", label: "Canada-wide" }]
  }

  return []
}

export function serviceServesPlace(service: Pick<Service, "coverage" | "scope">, placeId: PlaceId): boolean {
  return normalizeServiceCoverage(service).some((coverage) => {
    if (coverage.kind === "provincial" || coverage.kind === "national") {
      return true
    }

    return coverage.placeIds?.includes(placeId) ?? false
  })
}

export function filterServicesByPlace<T extends { service: Pick<Service, "coverage" | "scope"> }>(
  results: T[],
  placeId: PlaceId | undefined
): T[] {
  if (!placeId) return results
  return results.filter((result) => serviceServesPlace(result.service, placeId))
}

export function getPrimaryPlaceLabel(service: Pick<Service, "primary_place_id">): string | undefined {
  return getPlaceById(service.primary_place_id)?.serviceLabel
}

export function getCoverageBadges(service: Pick<Service, "coverage" | "scope">): CoverageBadge[] {
  return normalizeServiceCoverage(service).flatMap((coverage, index) => {
    if (coverage.kind === "provincial") {
      return [{ key: `provincial-${index}`, label: coverage.label ?? "Ontario-wide", kind: coverage.kind }]
    }

    if (coverage.kind === "national") {
      return [{ key: `national-${index}`, label: coverage.label ?? "Canada-wide", kind: coverage.kind }]
    }

    return (coverage.placeIds ?? []).flatMap((placeId) => {
      const place = getPlaceById(placeId)
      if (!place) return []
      return [{ key: `${coverage.kind}-${place.id}`, label: coverage.label ?? place.serviceLabel, kind: coverage.kind }]
    })
  })
}
```

- [ ] **Step 8: Add Zod validation**

Modify `lib/schemas/service.ts` after `ScopeSchema`:

```ts
export const PlaceIdSchema = z.enum(["kingston-on", "brampton-on"])
export const CoverageKindSchema = z.enum(["local", "regional", "provincial", "national"])
export const ServiceCoverageAreaSchema = z.object({
  kind: CoverageKindSchema,
  placeIds: z.array(PlaceIdSchema).optional(),
  regionIds: z.array(z.string().min(1)).optional(),
  label: z.string().optional(),
  notes: z.string().optional(),
})
```

Add to `ServiceSchema` near `scope`:

```ts
    primary_place_id: PlaceIdSchema.optional(),
    coverage: z.array(ServiceCoverageAreaSchema).optional(),
```

- [ ] **Step 9: Run the place tests**

Run:

```bash
npm test -- tests/lib/places/registry.test.ts tests/lib/places/coverage.test.ts
```

Expected: pass.

- [ ] **Step 10: Run type-check**

Run:

```bash
npm run type-check
```

Expected: pass.

- [ ] **Step 11: Commit**

```bash
git add types/service.ts lib/schemas/service.ts lib/places/types.ts lib/places/registry.ts lib/places/coverage.ts tests/lib/places/registry.test.ts tests/lib/places/coverage.test.ts
git commit -m "feat: add place coverage foundation"
```

## Task 2: Local And Server Search Place Filtering

**Files:**

- Modify: `lib/search/types.ts`
- Modify: `lib/schemas/search.ts`
- Modify: `lib/search/index.ts`
- Modify: `lib/search/client-enhancer.ts`
- Modify: `hooks/useServices.ts`
- Modify: `app/api/v1/search/services/route.ts`
- Test: `tests/lib/search/index.test.ts`
- Test: `tests/hooks/useServices.test.ts`
- Test: `tests/api/v1/search-api.test.ts`

- [ ] **Step 1: Add failing local search tests**

Append to `tests/lib/search/index.test.ts`:

```ts
it("filters Kingston-only services out of Brampton searches", async () => {
  ;(loadServices as any).mockResolvedValue([
    {
      id: "kingston-food",
      name: "Kingston Food",
      description: "Food support",
      verification_level: "L1",
      intent_category: "Food",
      coverage: [{ kind: "local", placeIds: ["kingston-on"] }],
    },
    {
      id: "brampton-food",
      name: "Brampton Food",
      description: "Food support",
      verification_level: "L1",
      intent_category: "Food",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    },
    {
      id: "ontario-food",
      name: "Ontario Food Line",
      description: "Food support",
      verification_level: "L1",
      intent_category: "Food",
      coverage: [{ kind: "provincial", label: "Ontario-wide" }],
    },
  ])

  const results = await searchServices("food", { placeId: "brampton-on" })

  expect(results.map((result) => result.service.id)).toEqual(["brampton-food", "ontario-food"])
})
```

- [ ] **Step 2: Add failing server schema/API tests**

Append to `tests/api/v1/search-api.test.ts`:

```ts
it("uses no-store for place-filtered searches", async () => {
  mockQueryResult = {
    data: [createMockService("brampton", { coverage: [{ kind: "local", placeIds: ["brampton-on"] }] } as any)],
    error: null,
  }

  const req = createRequest({
    query: "",
    locale: "en",
    filters: { category: IntentCategory.Food, placeId: "brampton-on" },
  })

  const res = await POST(req)

  expect(res.headers.get("Cache-Control")).toBe("no-store")
})
```

- [ ] **Step 3: Add failing hook propagation test**

Append to `tests/hooks/useServices.test.ts`:

```ts
it("passes selected place through to local and server search", async () => {
  renderHook(() => useServices({ ...defaultProps, query: "food", placeId: "brampton-on" as any }))
  await flushSearchEffect()

  expect(searchServices).toHaveBeenCalledWith(
    "food",
    expect.objectContaining({
      placeId: "brampton-on",
    })
  )

  vi.mocked(getSearchMode).mockReturnValue("server")
  vi.mocked(serverSearch).mockResolvedValue([{ id: "server-brampton" } as any])

  renderHook(() => useServices({ ...defaultProps, query: "food", placeId: "brampton-on" as any }))
  await flushSearchEffect()

  expect(serverSearch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      filters: expect.objectContaining({ placeId: "brampton-on" }),
    })
  )
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run:

```bash
npm test -- tests/lib/search/index.test.ts tests/hooks/useServices.test.ts tests/api/v1/search-api.test.ts
```

Expected: fail because `placeId` is not in the search contracts.

- [ ] **Step 5: Extend search types**

Modify `lib/search/types.ts`:

```ts
import type { PlaceId } from "@/types/service"
```

Add to `SearchOptions`:

```ts
  placeId?: PlaceId
```

Modify `lib/schemas/search.ts`:

```ts
const PlaceIdSchema = z.enum(["kingston-on", "brampton-on"])
```

Add inside `filters`:

```ts
      placeId: PlaceIdSchema.optional(),
```

- [ ] **Step 6: Filter local search candidates**

Modify `lib/search/index.ts` imports:

```ts
import { serviceServesPlace } from "@/lib/places/coverage"
```

After category and open-now filtering, before freshness filtering, add:

```ts
if (options.placeId) {
  filteredServices = filteredServices.filter((service) => serviceServesPlace(service, options.placeId!))
}
```

Add `hasPlace: !!options.placeId` to the final `trackPerformance` metadata object.

- [ ] **Step 7: Replace client enhancer scope filtering**

Modify `lib/search/client-enhancer.ts`:

```ts
import type { PlaceId } from "@/types/service"
import { filterServicesByPlace } from "@/lib/places/coverage"
```

Change the options type:

```ts
  placeId?: PlaceId
```

Update the search callback options to include `placeId?: PlaceId`.

Replace `filterSearchResultsByScope` with:

```ts
export function filterSearchResultsByPlace(results: SearchResult[], placeId?: PlaceId): SearchResult[] {
  return filterServicesByPlace(results, placeId)
}
```

Use `filterSearchResultsByPlace(enhancedResults, placeId)` in `enhanceSearchResults`.

- [ ] **Step 8: Propagate place from `useServices`**

Modify `hooks/useServices.ts`:

```ts
import type { PlaceId } from "@/types/service"
```

Change props:

```ts
  placeId?: PlaceId
```

Pass local search:

```ts
initialResults = await searchServices(query, {
  category,
  location: userLocation,
  placeId,
  openNow,
  onSuggestion: setSuggestion,
})
```

Pass server search:

```ts
            filters: { category, openNow, placeId },
```

Pass enhancer:

```ts
          placeId,
```

Include `placeId` in the effect dependency list.

- [ ] **Step 9: Filter server candidates and privacy headers**

Modify `app/api/v1/search/services/route.ts`:

```ts
import { serviceServesPlace } from "@/lib/places/coverage"
```

After open-now filtering:

```ts
if (filters.placeId) {
  services = services.filter((service) => serviceServesPlace(service, filters.placeId))
}
```

Change cache logic:

```ts
if (query.trim() || location || filters.openNow || filters.placeId || !filters.category) {
  response.headers.set("Cache-Control", "no-store")
} else {
  response.headers.set("Cache-Control", "public, s-maxage=60")
}
```

- [ ] **Step 10: Run targeted tests**

Run:

```bash
npm test -- tests/lib/search/index.test.ts tests/hooks/useServices.test.ts tests/api/v1/search-api.test.ts
```

Expected: pass.

- [ ] **Step 11: Run type-check**

Run:

```bash
npm run type-check
```

Expected: pass.

- [ ] **Step 12: Commit**

```bash
git add lib/search/types.ts lib/schemas/search.ts lib/search/index.ts lib/search/client-enhancer.ts hooks/useServices.ts app/api/v1/search/services/route.ts tests/lib/search/index.test.ts tests/hooks/useServices.test.ts tests/api/v1/search-api.test.ts
git commit -m "feat: filter search by selected place"
```

## Task 3: Selected Place State And Accessible Place Selector

**Files:**

- Create: `lib/places/selection.ts`
- Create: `components/home/PlaceSelector.tsx`
- Modify: `hooks/useSearch.ts`
- Modify: `components/home/SearchControls.tsx`
- Modify: `app/[locale]/page.tsx`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`
- Modify: `messages/zh-Hans.json`
- Modify: `messages/ar.json`
- Modify: `messages/pt.json`
- Modify: `messages/es.json`
- Modify: `messages/pa.json`
- Test: `tests/components/home/PlaceSelector.test.tsx`
- Test: `tests/components/home/SearchControls.test.tsx`

- [ ] **Step 1: Write failing selector tests**

Create `tests/components/home/PlaceSelector.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import PlaceSelector from "@/components/home/PlaceSelector"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const translations: Record<string, string> = {
      label: "Service area",
      change: "Change city",
      useLocation: "Use my location",
      locating: "Finding location",
      selected: `Showing ${values?.place ?? ""}`,
      kingston: "Kingston",
      brampton: "Brampton",
    }
    return translations[key] ?? key
  },
}))

describe("PlaceSelector", () => {
  it("shows the selected place and exposes a change control", async () => {
    const user = userEvent.setup()
    const onPlaceChange = vi.fn()

    render(
      <PlaceSelector
        selectedPlaceId="kingston-on"
        isLocating={false}
        onUseLocation={vi.fn()}
        onPlaceChange={onPlaceChange}
      />
    )

    expect(screen.getByText("Showing Kingston")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Change city" }))
    await user.click(screen.getByRole("option", { name: "Brampton" }))

    expect(onPlaceChange).toHaveBeenCalledWith("brampton-on")
  })

  it("offers explicit geolocation without requiring it", async () => {
    const user = userEvent.setup()
    const onUseLocation = vi.fn()

    render(
      <PlaceSelector
        selectedPlaceId="kingston-on"
        isLocating={false}
        onUseLocation={onUseLocation}
        onPlaceChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Use my location" }))

    expect(onUseLocation).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run selector tests to verify they fail**

Run:

```bash
npm test -- tests/components/home/PlaceSelector.test.tsx
```

Expected: fail because `PlaceSelector` does not exist.

- [ ] **Step 3: Create selected-place helpers**

Create `lib/places/selection.ts`:

```ts
import type { PlaceId } from "@/types/service"
import { getPlaceById, isSupportedPlaceId, SUPPORTED_PLACES } from "@/lib/places/registry"

export const SELECTED_PLACE_STORAGE_KEY = "careconnect_selected_place_id"
export const DEFAULT_PLACE_ID: PlaceId = "kingston-on"

export function getDefaultPlaceId(): PlaceId {
  return DEFAULT_PLACE_ID
}

export function normalizeSelectedPlace(value: unknown): PlaceId {
  return isSupportedPlaceId(value) ? value : DEFAULT_PLACE_ID
}

export function inferPlaceFromCoordinates(
  coordinates: { lat: number; lng: number } | null | undefined
): PlaceId | null {
  if (!coordinates) return null

  const match = SUPPORTED_PLACES.find((place) => {
    const { bounds } = place
    return (
      coordinates.lat <= bounds.north &&
      coordinates.lat >= bounds.south &&
      coordinates.lng <= bounds.east &&
      coordinates.lng >= bounds.west
    )
  })

  return match?.id ?? null
}

export function getSelectedPlaceLabel(placeId: PlaceId): string {
  return getPlaceById(placeId)?.serviceLabel ?? getPlaceById(DEFAULT_PLACE_ID)!.serviceLabel
}
```

- [ ] **Step 4: Create `PlaceSelector`**

Create `components/home/PlaceSelector.tsx`:

```tsx
"use client"

import { MapPin, Navigation } from "lucide-react"
import { useTranslations } from "next-intl"
import type { PlaceId } from "@/types/service"
import { SUPPORTED_PLACES } from "@/lib/places/registry"
import { getSelectedPlaceLabel } from "@/lib/places/selection"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlaceSelectorProps {
  selectedPlaceId: PlaceId
  isLocating: boolean
  onUseLocation: () => void
  onPlaceChange: (placeId: PlaceId) => void
}

export default function PlaceSelector({
  selectedPlaceId,
  isLocating,
  onUseLocation,
  onPlaceChange,
}: PlaceSelectorProps) {
  const t = useTranslations("PlaceSelector")
  const selectedLabel = getSelectedPlaceLabel(selectedPlaceId)

  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-2" aria-label={t("label")}>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/10 dark:text-neutral-200">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {t("selected", { place: selectedLabel })}
      </span>

      <Select value={selectedPlaceId} onValueChange={(value) => onPlaceChange(value as PlaceId)}>
        <SelectTrigger className="h-8 w-[150px]" aria-label={t("change")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_PLACES.filter((place) => place.status === "live" || place.status === "preview").map((place) => (
            <SelectItem key={place.id} value={place.id}>
              {place.serviceLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" variant="ghost" size="sm" className="h-8 px-2.5 text-xs" onClick={onUseLocation}>
        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
        {isLocating ? t("locating") : t("useLocation")}
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Add selected-place state to `useSearch`**

Modify `hooks/useSearch.ts` imports:

```ts
import { useState, useCallback, useEffect } from "react"
import type { PlaceId } from "@/types/service"
import {
  getDefaultPlaceId,
  inferPlaceFromCoordinates,
  normalizeSelectedPlace,
  SELECTED_PLACE_STORAGE_KEY,
} from "@/lib/places/selection"
```

Add state after `scope`:

```ts
const [storedSelectedPlaceId, setStoredSelectedPlaceId] = useLocalStorage<PlaceId>(
  SELECTED_PLACE_STORAGE_KEY,
  getDefaultPlaceId()
)
const selectedPlaceId = normalizeSelectedPlace(storedSelectedPlaceId)
```

Add an explicit setter that normalizes stored values:

```ts
const setSelectedPlaceId = useCallback(
  (placeId: PlaceId) => {
    setStoredSelectedPlaceId(normalizeSelectedPlace(placeId))
  },
  [setStoredSelectedPlaceId]
)
```

Add this callback near `toggleLocation`:

```ts
const useLocationForPlace = useCallback(() => {
  requestLocation()
}, [requestLocation])
```

After `userLocation` is defined, infer selected place in an effect:

```ts
useEffect(() => {
  const inferredPlaceId = inferPlaceFromCoordinates(userLocation)
  if (inferredPlaceId && inferredPlaceId !== selectedPlaceId) {
    setSelectedPlaceId(inferredPlaceId)
  }
}, [selectedPlaceId, setSelectedPlaceId, userLocation])
```

Return:

```ts
    selectedPlaceId,
    setSelectedPlaceId,
    useLocationForPlace,
```

- [ ] **Step 6: Pass selected place through homepage and controls**

Modify `components/home/SearchControls.tsx` props:

```ts
  selectedPlaceId: PlaceId
  setSelectedPlaceId: (placeId: PlaceId) => void
```

Import:

```ts
import type { PlaceId } from "@/types/service"
import PlaceSelector from "@/components/home/PlaceSelector"
```

Render `PlaceSelector` above the utility filter group:

```tsx
<PlaceSelector
  selectedPlaceId={selectedPlaceId}
  isLocating={isLocating}
  onUseLocation={toggleLocation}
  onPlaceChange={setSelectedPlaceId}
/>
```

Modify `app/[locale]/page.tsx` to destructure and pass `selectedPlaceId` and `setSelectedPlaceId`. Pass `placeId={selectedPlaceId}` into `useServices`.

- [ ] **Step 7: Add translations**

Add to every `messages/*.json` file. English canonical values:

```json
"PlaceSelector": {
  "label": "Service area",
  "selected": "Showing {place}",
  "change": "Change city",
  "useLocation": "Use my location",
  "locating": "Finding location"
}
```

For non-English files, use clear equivalent translations and keep the same keys. If exact community translation is not available during this task, use professional plain-language translations consistent with the existing locale file style and run `npm run i18n-audit`.

- [ ] **Step 8: Update existing SearchControls tests**

Modify each `SearchControls` render in `tests/components/home/SearchControls.test.tsx` to include:

```tsx
selectedPlaceId="kingston-on"
setSelectedPlaceId={vi.fn()}
```

Add `PlaceSelector` keys to the mock translation map:

```ts
selected: "Showing Kingston",
change: "Change city",
useLocation: "Use my location",
locating: "Finding location",
```

- [ ] **Step 9: Run targeted tests and i18n audit**

Run:

```bash
npm test -- tests/components/home/PlaceSelector.test.tsx tests/components/home/SearchControls.test.tsx
npm run i18n-audit
```

Expected: pass.

- [ ] **Step 10: Run type-check**

Run:

```bash
npm run type-check
```

Expected: pass.

- [ ] **Step 11: Commit**

```bash
git add lib/places/selection.ts components/home/PlaceSelector.tsx hooks/useSearch.ts components/home/SearchControls.tsx app/[locale]/page.tsx messages tests/components/home/PlaceSelector.test.tsx tests/components/home/SearchControls.test.tsx
git commit -m "feat: add selected place control"
```

## Task 4: Rotating Supported-Region Homepage Hero

**Files:**

- Create: `components/home/RotatingRegionHero.tsx`
- Modify: `app/[locale]/page.tsx`
- Modify: `messages/*.json`
- Test: `tests/components/home/RotatingRegionHero.test.tsx`

- [ ] **Step 1: Write failing hero tests**

Create `tests/components/home/RotatingRegionHero.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import RotatingRegionHero from "@/components/home/RotatingRegionHero"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      accessibleTitle: "CareConnect for supported Ontario communities",
      brand: "CareConnect",
    }
    return translations[key] ?? key
  },
}))

describe("RotatingRegionHero", () => {
  it("renders a stable accessible heading", () => {
    render(<RotatingRegionHero />)

    expect(screen.getByRole("heading", { name: "CareConnect for supported Ontario communities" })).toBeInTheDocument()
  })

  it("renders supported registry region labels visually", () => {
    render(<RotatingRegionHero />)

    expect(screen.getByText("Kingston")).toBeInTheDocument()
    expect(screen.getByText("Brampton")).toBeInTheDocument()
    expect(screen.getByText("CareConnect")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run hero tests to verify they fail**

Run:

```bash
npm test -- tests/components/home/RotatingRegionHero.test.tsx
```

Expected: fail because `RotatingRegionHero` does not exist.

- [ ] **Step 3: Create `RotatingRegionHero`**

Create `components/home/RotatingRegionHero.tsx`:

```tsx
"use client"

import { useTranslations } from "next-intl"
import { motion, useReducedMotion } from "framer-motion"
import { getHeroPlaces } from "@/lib/places/registry"

export default function RotatingRegionHero() {
  const t = useTranslations("Home.hero")
  const reduceMotion = useReducedMotion()
  const places = getHeroPlaces()
  const staticPlace = places[0]?.heroLabel ?? "Kingston"

  return (
    <h1 className="heading-1 heading-display relative text-neutral-900 dark:text-white">
      <span className="sr-only">{t("accessibleTitle")}</span>
      <span aria-hidden="true" className="relative z-10 inline-grid min-w-[11ch] justify-items-center">
        {reduceMotion
          ? staticPlace
          : places.map((place, index) => (
              <motion.span
                key={place.id}
                className="col-start-1 row-start-1"
                initial={{ opacity: index === 0 ? 1 : 0, y: index === 0 ? 0 : 12 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [12, 0, 0, -12],
                }}
                transition={{
                  duration: 4,
                  delay: index * 2.2,
                  repeat: Infinity,
                  repeatDelay: Math.max(0, places.length * 2.2 - 4),
                }}
              >
                {place.heroLabel}
              </motion.span>
            ))}
      </span>
      <span
        aria-hidden="true"
        className="from-primary-600 via-primary-500 to-accent-500 relative z-10 bg-gradient-to-r bg-clip-text text-transparent"
      >
        {" "}
        {t("brand")}
      </span>
      <div className="absolute -inset-x-8 -inset-y-4 -z-10 rounded-[50%] bg-white/30 blur-3xl dark:bg-white/5" />
    </h1>
  )
}
```

- [ ] **Step 4: Replace homepage hard-coded hero**

Modify `app/[locale]/page.tsx` imports:

```ts
import RotatingRegionHero from "../../components/home/RotatingRegionHero"
```

Replace the current `<h1>` block that contains hard-coded `Kingston` with:

```tsx
<RotatingRegionHero />
```

- [ ] **Step 5: Add hero translations**

Modify `messages/en.json` under `Home.hero`:

```json
"accessibleTitle": "CareConnect for supported Ontario communities",
"brand": "CareConnect"
```

Add equivalent keys to all other locale files.

- [ ] **Step 6: Run hero tests**

Run:

```bash
npm test -- tests/components/home/RotatingRegionHero.test.tsx
```

Expected: pass.

- [ ] **Step 7: Run homepage smoke tests**

Run:

```bash
npm test -- tests/components/home/HomeSurfaces.test.tsx tests/components/home/SearchControls.test.tsx
npm run type-check
npm run i18n-audit
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add components/home/RotatingRegionHero.tsx app/[locale]/page.tsx messages tests/components/home/RotatingRegionHero.test.tsx
git commit -m "feat: rotate homepage region hero"
```

## Task 5: Service Public Mapping, Cards, And Sparse Result Copy

**Files:**

- Modify: `types/service-public.ts`
- Modify: `lib/search/map-service-public.ts`
- Modify: `components/services/ServiceCard.tsx`
- Modify: `components/home/SearchResultsList.tsx`
- Modify: `messages/*.json`
- Test: `tests/lib/search/map-service-public.test.ts`
- Test: `tests/components/misc-smoke.test.tsx`

- [ ] **Step 1: Add failing public mapping test**

Append to `tests/lib/search/map-service-public.test.ts`:

```ts
it("maps public coverage and primary place fields", () => {
  const mapped = mapServicePublicToService({
    ...baseService,
    primary_place_id: "brampton-on" as any,
    coverage: [{ kind: "local", placeIds: ["brampton-on"] }] as any,
  })

  expect(mapped.primary_place_id).toBe("brampton-on")
  expect(mapped.coverage).toEqual([{ kind: "local", placeIds: ["brampton-on"] }])
})
```

- [ ] **Step 2: Run mapping test to verify it fails**

Run:

```bash
npm test -- tests/lib/search/map-service-public.test.ts
```

Expected: fail because `ServicePublic` does not expose the new fields.

- [ ] **Step 3: Extend public service type**

Modify `types/service-public.ts` imports and exports:

```ts
  ServiceCoverageArea,
  PlaceId,
```

Add:

```ts
export type ServicePublicPrimaryPlaceId = PlaceId | null
export type ServicePublicCoverage = ServiceCoverageArea[] | null
```

Add to `ServicePublic`:

```ts
  primary_place_id?: ServicePublicPrimaryPlaceId
  coverage?: ServicePublicCoverage
```

- [ ] **Step 4: Map public fields**

Modify `lib/search/map-service-public.ts` return object:

```ts
    primary_place_id: service.primary_place_id ?? undefined,
    coverage: service.coverage ?? undefined,
```

- [ ] **Step 5: Update service card badges**

Modify `components/services/ServiceCard.tsx` imports:

```ts
import { getCoverageBadges, getPrimaryPlaceLabel } from "@/lib/places/coverage"
```

Before return:

```ts
const coverageBadges = getCoverageBadges(service)
const primaryPlaceLabel = getPrimaryPlaceLabel(service)
```

Replace the `service.scope === "ontario"` / `service.scope === "canada"` badge blocks with:

```tsx
{
  coverageBadges.map((badge) => (
    <Badge
      key={badge.key}
      variant="outline"
      size="sm"
      className="border-blue-200 bg-blue-50 px-1.5 py-0 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
    >
      {badge.label}
    </Badge>
  ))
}
```

Replace the meta-row fallback:

```tsx
                    : distance
                      ? `${distance.toFixed(1)} km`
                      : (primaryPlaceLabel ?? t("ServiceDetail.kingston"))}
```

- [ ] **Step 6: Update sparse result copy**

Modify `components/home/SearchResultsList.tsx` to accept `selectedPlaceId?: PlaceId` and use `getSelectedPlaceLabel(selectedPlaceId)` for empty state copy.

Add English keys under `Search`:

```json
"noPlaceResults": "No {place} records match this search yet. Try Ontario-wide services or suggest a local service."
```

Add equivalent keys to all locale files.

- [ ] **Step 7: Run tests and audits**

Run:

```bash
npm test -- tests/lib/search/map-service-public.test.ts tests/components/misc-smoke.test.tsx
npm run i18n-audit
npm run type-check
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add types/service-public.ts lib/search/map-service-public.ts components/services/ServiceCard.tsx components/home/SearchResultsList.tsx messages tests/lib/search/map-service-public.test.ts
git commit -m "feat: show coverage-aware service context"
```

## Task 6: Supabase, DB Mapping, And Offline Export Contract

**Files:**

- Create: `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`
- Modify: `lib/service-db.ts`
- Modify: `app/api/v1/services/export/route.ts`
- Test: `tests/api/v1/services/export.test.ts`
- Test: `tests/db/routes.test.ts`

- [ ] **Step 1: Add failing service DB mapping expectations**

Add unit coverage to an existing service DB test if present. If no focused test exists, create `tests/lib/service-db.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import { mapServicePayloadToUpdate, mapServiceRowToService, mapServiceToDatabaseUpdate } from "@/lib/service-db"

describe("service-db coverage mapping", () => {
  it("maps coverage and primary place from DB rows", () => {
    const mapped = mapServiceRowToService({
      id: "svc",
      name: "Service",
      description: "Description",
      url: "https://example.com",
      phone: null,
      email: null,
      address: null,
      address_fr: null,
      name_fr: null,
      description_fr: null,
      hours: null,
      hours_text: null,
      hours_text_fr: null,
      fees: null,
      fees_fr: null,
      eligibility: null,
      eligibility_fr: null,
      application_process: null,
      application_process_fr: null,
      languages: null,
      bus_routes: null,
      accessibility: null,
      last_verified: null,
      verification_status: "L1",
      category: "Community",
      tags: [],
      scope: "kingston",
      virtual_delivery: false,
      primary_phone_label: null,
      service_area: null,
      coordinates: null,
      resource_indicators: null,
      authority_tier: null,
      synthetic_queries: [],
      synthetic_queries_fr: null,
      access_script: null,
      access_script_fr: null,
      org_id: null,
      plain_language_available: null,
      embedding: null,
      published: true,
      deleted_at: null,
      deleted_by: null,
      admin_notes: null,
      last_admin_review: null,
      reviewed_by: null,
      provenance: null,
      created_at: "2026-07-06T00:00:00.000Z",
      updated_at: "2026-07-06T00:00:00.000Z",
      primary_place_id: "brampton-on",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    } as any)

    expect(mapped.primary_place_id).toBe("brampton-on")
    expect(mapped.coverage).toEqual([{ kind: "local", placeIds: ["brampton-on"] }])
  })

  it("writes coverage and primary place into database updates", () => {
    expect(
      mapServiceToDatabaseUpdate({
        primary_place_id: "brampton-on",
        coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
      } as any)
    ).toEqual({
      primary_place_id: "brampton-on",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    })
  })

  it("accepts payload coverage and primary place", () => {
    expect(
      mapServicePayloadToUpdate({
        primary_place_id: "brampton-on",
        coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
      })
    ).toEqual({
      primary_place_id: "brampton-on",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    })
  })
})
```

- [ ] **Step 2: Run mapping tests to verify they fail**

Run:

```bash
npm test -- tests/lib/service-db.test.ts
```

Expected: fail because `lib/service-db.ts` does not map `coverage` and `primary_place_id`.

- [ ] **Step 3: Add Supabase migration**

Create `supabase/migrations/20260706120000_add_service_coverage_place_fields.sql`:

```sql
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS primary_place_id TEXT,
  ADD COLUMN IF NOT EXISTS coverage JSONB;

UPDATE services
SET
  primary_place_id = COALESCE(primary_place_id, CASE WHEN COALESCE(scope, 'kingston') = 'kingston' THEN 'kingston-on' ELSE NULL END),
  coverage = COALESCE(
    coverage,
    CASE
      WHEN COALESCE(scope, 'kingston') = 'kingston'
        THEN '[{"kind":"local","placeIds":["kingston-on"]}]'::jsonb
      WHEN scope = 'ontario'
        THEN '[{"kind":"provincial","label":"Ontario-wide"}]'::jsonb
      WHEN scope = 'canada'
        THEN '[{"kind":"national","label":"Canada-wide"}]'::jsonb
      ELSE '[]'::jsonb
    END
  )
WHERE coverage IS NULL OR primary_place_id IS NULL;

CREATE OR REPLACE VIEW services_public AS
SELECT
  id,
  name,
  name_fr,
  description,
  description_fr,
  address,
  address_fr,
  phone,
  url,
  email,
  hours,
  hours_text,
  hours_text_fr,
  fees,
  eligibility,
  eligibility_fr,
  eligibility_notes,
  eligibility_notes_fr,
  application_process,
  application_process_fr,
  languages,
  bus_routes,
  accessibility,
  last_verified,
  verification_status,
  category,
  tags,
  scope,
  primary_place_id,
  coverage,
  virtual_delivery,
  primary_phone_label,
  created_at,
  synthetic_queries,
  synthetic_queries_fr,
  authority_tier,
  resource_indicators,
  coordinates,
  CASE
    WHEN provenance ? 'verified_by'
      AND provenance->>'verified_by' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN jsonb_set(provenance, '{verified_by}', to_jsonb('CareConnect Admin'::text))
    ELSE provenance
  END AS provenance,
  access_script,
  access_script_fr
FROM services
WHERE
  published = true
  AND deleted_at IS NULL
  AND verification_status IN ('L1', 'L2', 'L3');

ALTER VIEW services_public SET (security_invoker = true);
GRANT SELECT ON services_public TO anon, authenticated, service_role;
```

- [ ] **Step 4: Map DB fields**

Modify `lib/service-db.ts`:

```ts
  type PlaceId,
  type ServiceCoverageArea,
```

Add normalizers:

```ts
const PLACE_IDS = new Set<PlaceId>(["kingston-on", "brampton-on"])

function normalizePlaceId(value: unknown, fallback?: Service["primary_place_id"]): PlaceId | undefined {
  if (typeof value === "string" && PLACE_IDS.has(value as PlaceId)) {
    return value as PlaceId
  }
  return fallback
}
```

Add to `mapServiceRowToService`:

```ts
    primary_place_id: normalizePlaceId(row.primary_place_id, staticService?.primary_place_id),
    coverage: parseJsonField<ServiceCoverageArea[]>(row.coverage) ?? staticService?.coverage ?? undefined,
```

Add to `mapServiceToDatabaseUpdate`:

```ts
if (service.primary_place_id !== undefined) update.primary_place_id = service.primary_place_id
if (service.coverage !== undefined) update.coverage = service.coverage as unknown as Json
```

Add to `mapServicePayloadToUpdate`:

```ts
maybeSetString("primary_place_id", payload.primary_place_id)

const coverage = toJsonField(payload.coverage)
if (coverage !== undefined) update.coverage = coverage
```

- [ ] **Step 5: Update generated DB types after local migration**

Run only if the local Supabase DB lane is available:

```bash
npm run db:types
```

Expected: `types/supabase.ts` includes `primary_place_id` and `coverage` on `services` and `services_public` rows.

If Docker/local Supabase is unavailable, do not hand-edit `types/supabase.ts`; leave the type-generation task for the worker with DB prerequisites and keep the migration committed.

- [ ] **Step 6: Confirm export includes public fields**

Add to `tests/api/v1/services/export.test.ts` a service fixture with `primary_place_id` and `coverage`, then assert:

```ts
expect(json.services[0]).toMatchObject({
  primary_place_id: "brampton-on",
  coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
})
```

The export route uses `Service`, so no route code should be needed unless sanitization starts stripping these fields.

- [ ] **Step 7: Run tests**

Run:

```bash
npm test -- tests/lib/service-db.test.ts tests/api/v1/services/export.test.ts
npm run type-check
```

Expected: pass after generated DB types are current or the tests use local row casts where needed.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260706120000_add_service_coverage_place_fields.sql lib/service-db.ts app/api/v1/services/export/route.ts tests/lib/service-db.test.ts tests/api/v1/services/export.test.ts types/supabase.ts
git commit -m "feat: expose service coverage data contract"
```

## Task 7: Public Positioning, Copy, And Docs

**Files:**

- Modify: `README.md`
- Modify: `app/[locale]/layout.tsx`
- Modify: `messages/*.json`
- Modify: `docs/governance/standards.md`
- Modify: `docs/governance/verification-protocol.md`
- Create: `docs/governance/city-expansion-curation.md`
- Modify: `docs/faq.md`
- Modify: `docs/faq.fr.md`
- Modify: `docs/user-guide.md`
- Modify: `docs/user-guide.fr.md`
- Modify: `docs/launch-materials/press-kit.md`
- Test: `npm run check:refs`
- Test: `npm run i18n-audit`

- [ ] **Step 1: Update README positioning**

Change the opening description to:

```md
> A verified, governance-first search engine for local social services, currently serving Kingston and preparing a careful Brampton expansion across food security, crisis intervention, housing support, and core community navigation.
```

Change the dataset paragraph to:

```md
We maintain a hand-reviewed dataset of high-impact services for supported Ontario communities. Kingston remains live, Brampton is the next city expansion, and every visible local entry must meet the CareConnect verification and freshness standard before appearing in search.
```

- [ ] **Step 2: Update metadata**

Modify `app/[locale]/layout.tsx` metadata description to:

```ts
description: "Find local support services for food, housing, crisis, and health in supported Ontario communities.",
```

- [ ] **Step 3: Rename governance framing without losing history**

In `docs/governance/standards.md`, change the title to:

```md
# Governance Protocol: The CareConnect Local Verification Standard
```

Add this paragraph after the scope:

```md
This standard supersedes the earlier Kingston-specific framing while preserving the same accuracy-over-coverage rule. Kingston remains a live supported place; Brampton records must meet the same visible-listing threshold before launch.
```

- [ ] **Step 4: Create city expansion curation doc**

Create `docs/governance/city-expansion-curation.md`:

```md
# City Expansion Curation Rules

CareConnect expands one supported place at a time. A place can be added to the app before it has broad coverage, but public copy must be clear when a place is in preview or has a small core-service dataset.

## Rules

1. Visible records must be L1 or higher and within the active freshness window.
2. AI-assisted research can create drafts only.
3. City-specific records require evidence that the service is available to that place.
4. Regional records must not be duplicated as fake city-local services.
5. Province-wide and Canada-wide services should remain canonical records with broad coverage.
6. Local land acknowledgment text must not be published until wording is verified through reliable local or Indigenous-led public sources.

## Brampton Launch Gate

Brampton can move from preview to live when the app has a small reviewed emergency/core-service set, sparse-result copy is in place, and Kingston search behavior remains unchanged.
```

- [ ] **Step 5: Update user-facing docs**

Replace Kingston-only claims in `docs/faq.md`, `docs/faq.fr.md`, `docs/user-guide.md`, and `docs/user-guide.fr.md` with city-aware wording. Keep concrete emergency numbers that are Kingston-specific only where the text explicitly labels them as Kingston resources.

Use this English sentence where a concise description is needed:

```md
CareConnect helps people search verified local and broad-coverage social services in supported Ontario communities. Kingston is live, and Brampton is being added carefully with a small reviewed core-service set first.
```

- [ ] **Step 6: Update press kit positioning**

In `docs/launch-materials/press-kit.md`, replace "Service Area | Kingston, Ontario, Canada" with:

```md
| **Service Area** | Kingston live; Brampton expansion in progress; Ontario-wide and Canada-wide records shown where relevant |
```

Replace "Why only Kingston?" with "Why expand one city at a time?" and use:

```md
Starting city by city lets CareConnect preserve local relevance, governance, and quality. Brampton is the next expansion target, beginning with a small reviewed core-service dataset before broader coverage.
```

- [ ] **Step 7: Run doc and i18n checks**

Run:

```bash
npm run check:refs
npm run i18n-audit
npm run format:check
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add README.md app/[locale]/layout.tsx messages docs/governance/standards.md docs/governance/verification-protocol.md docs/governance/city-expansion-curation.md docs/faq.md docs/faq.fr.md docs/user-guide.md docs/user-guide.fr.md docs/launch-materials/press-kit.md
git commit -m "docs: update positioning for city expansion"
```

## Task 8: Brampton Draft Workflow And Data Gates

**Files:**

- Create: `data/prompts/discover-city-services.md`
- Create: `data/drafts/brampton-on/README.md`
- Modify: `scripts/validate-services.ts` if coverage validation is not already shared through `lib/schemas/service.ts`
- Test: `npm run validate-data`
- Test: `npm run check:embeddings`

- [ ] **Step 1: Create city discovery prompt**

Create `data/prompts/discover-city-services.md`:

````md
# City Service Discovery

You are a social services researcher specializing in Ontario, Canada.

## Task

Research {{count}} services in {{city}}, {{province}} for the **{{vertical}}** category.

## Requirements

- Return draft candidates only.
- Use official provider, municipal, regional, provincial, or Canada-wide sources.
- Include a service only when the source shows it is available to {{city}} residents.
- Do not invent phone numbers, addresses, hours, eligibility, identity tags, or partnerships.
- Do not mark a service visible or verified.
- Prefer emergency and core access services for initial Brampton launch.

## Output Format

Return a JSON array:

```json
[
  {
    "id": "{{city_slug}}-{stable-slug}",
    "name": "Service Name",
    "description": "One or two evidence-based sentences.",
    "phone": "Public phone if listed by source",
    "url": "https://official-source.example",
    "address": "Address if public and relevant",
    "intent_category": "Crisis",
    "primary_place_id": "{{place_id}}",
    "coverage": [{ "kind": "local", "placeIds": ["{{place_id}}"] }],
    "verification_level": "L0",
    "provenance": {
      "verified_by": "draft",
      "verified_at": "{{iso_date}}",
      "evidence_url": "https://official-source.example",
      "method": "draft_research"
    },
    "source_notes": "Short note explaining why this appears to serve {{city}}."
  }
]
```
````

````

- [ ] **Step 2: Create Brampton draft README**

Create `data/drafts/brampton-on/README.md`:

```md
# Brampton Draft Services

This directory is for draft-only Brampton service candidates. Records here are not visible in CareConnect search.

## Review Gate

Before a Brampton record moves into `data/services.json` or the DB import path:

1. Verify the official source URL loads.
2. Confirm the service is available to Brampton residents.
3. Confirm public contact or intake path where relevant.
4. Confirm crisis services have an immediate phone or contact path.
5. Set `verification_level` to `L1` only after review.
6. Record `last_verified` and provenance evidence.
7. Regenerate embeddings after approved data changes.

Do not publish AI-generated service details without human review.
````

- [ ] **Step 3: Ensure validation rejects invalid coverage**

Run:

```bash
npm run validate-data
```

Expected: pass for current data. If current validation script does not use the shared schema, update `scripts/validate-services.ts` to import `ServicesArraySchema` from `lib/schemas/service.ts` and run the same command again.

- [ ] **Step 4: Check embeddings remain in sync**

Run:

```bash
npm run check:embeddings
```

Expected: pass because no visible service data changed in this task.

- [ ] **Step 5: Commit**

```bash
git add data/prompts/discover-city-services.md data/drafts/brampton-on/README.md scripts/validate-services.ts
git commit -m "docs: add brampton draft curation workflow"
```

## Task 9: Final Verification Bundle

**Files:**

- No new source files unless earlier tasks require follow-up fixes.

- [ ] **Step 1: Run targeted unit tests**

Run:

```bash
npm test -- tests/lib/places/registry.test.ts tests/lib/places/coverage.test.ts tests/lib/search/index.test.ts tests/hooks/useServices.test.ts tests/api/v1/search-api.test.ts tests/components/home/PlaceSelector.test.tsx tests/components/home/RotatingRegionHero.test.tsx tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts
```

Expected: pass.

- [ ] **Step 2: Run repo quality gates**

Run:

```bash
npm run lint
npm run type-check
npm run i18n-audit
npm run format:check
npm run validate-data
npm run check:embeddings
```

Expected: pass.

- [ ] **Step 3: Run build if embeddings are not regenerated during postbuild in the environment**

Run:

```bash
SKIP_EMBEDDINGS=1 npm run build
```

Expected: Next.js build passes. `SKIP_EMBEDDINGS=1` avoids regenerating embeddings during code-only foundation verification.

- [ ] **Step 4: Manual accessibility check**

Run the dev server:

```bash
npm run dev
```

Check:

1. Homepage heading is readable and cycles through Kingston and Brampton when motion is allowed.
2. With reduced motion enabled in the OS/browser, the heading is static.
3. The selected-place control remains visible and keyboard usable.
4. Selecting Brampton filters out Kingston-only services.
5. Ontario-wide and Canada-wide records remain visible for both Kingston and Brampton.
6. Geolocation permission denial does not block manual city selection.

- [ ] **Step 5: Commit any verification fixes**

If verification requires code or docs fixes:

```bash
git add <changed-files>
git commit -m "fix: stabilize multi-city foundation"
```

If no fixes are needed, do not create an empty commit.
