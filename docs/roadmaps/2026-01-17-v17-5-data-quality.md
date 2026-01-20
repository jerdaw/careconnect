---
status: planned
last_updated: 2026-01-19
owner: jer
tags: [roadmap, v17.5, data-quality, verification, enrichment]
---

# v17.5: Data Quality & Enrichment

**Priority:** HIGH
**Estimated Effort:** 3-4 weeks (single developer, data-intensive work)
**Dependencies:** v17.4 (dashboard for data entry), v17.0 (soft deletes for data cleanup)
**Impact:** Search accuracy, completeness, geographic coverage

## Executive Summary

Audit and enrich 196 services with critical missing fields. Currently 75-91% of services lack geographic scope, coordinates, and accessibility metadata. This release systematically fills gaps and upgrades verification levels for major providers.

> [!NOTE]
> **Category Expansion** (Phase 7) is moved to ongoing maintenance work rather than a fixed release milestone. Adding new services is continuous, not a one-time task.

## User Review Required

> [!WARNING]
> **Geocoding API Cost**: OpenCage free tier (2,500 calls/day) is sufficient for initial geocoding. If future bulk updates exceed this, consider paid tier (~$50/month for 10,000 calls).

---

## Phase 1: Data Audit & Gap Analysis (2-3 days)

### 1.1 Comprehensive Data Audit

**New file:** `scripts/audit-data-completeness.ts`

```typescript
import { loadServices } from "@/lib/search/data"

async function auditServices() {
  const services = await loadServices()

  const gaps = {
    missing_scope: services.filter((s) => !s.scope).length,
    missing_coordinates: services.filter((s) => !s.latitude || !s.longitude).length,
    missing_access_script: services.filter((s) => !s.access_script).length,
    missing_plain_language: services.filter((s) => !s.plain_language_available).length,
    missing_hours: services.filter((s) => !s.hours).length,
    unverified_l0: services.filter((s) => s.verification_level === "L0").length,
    verification_breakdown: {
      L0: services.filter((s) => s.verification_level === "L0").length,
      L1: services.filter((s) => s.verification_level === "L1").length,
      L2: services.filter((s) => s.verification_level === "L2").length,
      L3: services.filter((s) => s.verification_level === "L3").length,
    },
    category_counts: Object.entries(
      services.reduce((acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1
        return acc
      }, {})
    ),
  }

  console.table(gaps)

  // Generate report by category
  const byCategory = services.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = { total: 0, gaps: [] }
    acc[s.category].total++
    if (!s.scope) acc[s.category].gaps.push(`${s.name}: missing scope`)
    return acc
  }, {})

  return { gaps, byCategory }
}
```

**Run:**

```bash
npx tsx scripts/audit-data-completeness.ts > data-audit.txt
```

**Expected Output:**

```
Missing Scope:             147 (75%)
Missing Coordinates:       179 (91%)
Missing Access Scripts:    143 (73%)
Missing Plain Language:    191 (97%)
Missing Hours:             122 (62%)
L0 (Unverified):           0
L1 (Basic):                196
L2 (Vetted):               0
L3 (Provider-Confirmed):   0
```

### 1.2 Categorized Data Gaps

**New file:** `data/audit/data-gaps-by-category.csv`

Create spreadsheet with:

- Service name
- Category
- Current fields (name, address, phone)
- Missing fields (scope, coordinates, hours)
- Suggested values
- Verification level

**Categories needing expansion:**

- [ ] Transport: 2 services (target: 5+)
- [ ] Financial: 4 services (target: 8+)
- [ ] Indigenous: 3 services (target: 8+)

---

## Phase 2: Scope Assignment (2-3 days)

### 2.1 Add Geographic Scope Field

**Modify:** `types/service.ts`

```typescript
type GeographicScope = "kingston" | "eastern-ontario" | "provincial" | "national"

interface Service {
  // ... existing fields
  scope: GeographicScope
  scope_description?: string // "Serves Kingston and surrounding areas"
}
```

### 2.2 Scope Assignment Rules

**Script:** `scripts/assign-scopes.ts`

```typescript
interface ScopeRules {
  kingston: string[] // Services with Kingston address
  easternOntario: string[] // Regional providers
  provincial: string[] // Serve multiple regions
  national: string[] // Telehealth, online services
}

const scopeRules: ScopeRules = {
  kingston: [
    "Kingston Shelter",
    "KGH Emergency",
    "Community Kitchen",
    // ... 30 local services
  ],
  easternOntario: [
    "Telehealth Ontario",
    "Regional Hospital Network",
    // ... regional providers
  ],
  provincial: [
    "211 Ontario",
    "Ontario Crisis Line",
    // ... province-wide services
  ],
  national: [
    "Kids Help Phone",
    "Talk Suicide Canada",
    "Crisis Text Line",
    // ... 5-10 national services
  ],
}

export async function assignScopes() {
  const services = await loadServices()

  const updated = services.map((service) => {
    // Check rules
    for (const [scope, names] of Object.entries(scopeRules)) {
      if (names.includes(service.name)) {
        return { ...service, scope: scope as GeographicScope }
      }
    }

    // Default based on service type
    if (service.category === "crisis" || service.category === "telehealth") {
      return { ...service, scope: "provincial" }
    }

    return { ...service, scope: "kingston" } // Default local
  })

  // Save back to services.json
  fs.writeFileSync("data/services.json", JSON.stringify(updated, null, 2))

  console.log(`Assigned scopes to ${updated.length} services`)
}
```

**Verification:**

- [ ] Run script
- [ ] Spot-check 20 random services
- [ ] Verify crisis/telehealth services marked provincial
- [ ] Verify local services marked kingston
- [ ] Update any misclassifications manually

---

## Phase 3: Geocoding & Coordinates (3-4 days)

### 3.1 Geocoding Setup

**Choose Geocoding Provider:**

| Option        | API Calls | Cost                         | Accuracy   |
| ------------- | --------- | ---------------------------- | ---------- |
| Google Maps   | 179       | ~$3-5                        | ⭐⭐⭐⭐⭐ |
| OpenCage      | 179       | ~$1-2 (free tier: 2,500/day) | ⭐⭐⭐⭐   |
| OSM Nominatim | 179       | Free (rate-limited)          | ⭐⭐⭐     |

**Recommendation:** OpenCage (free tier sufficient for 179 services)

### 3.2 Implement Geocoding Script

**New file:** `scripts/geocode-services.ts`

```typescript
import axios from "axios"

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY
const GEOCACHE_FILE = "data/geocode-cache.json"

interface GeocoderResult {
  lat: number
  lng: number
  accuracy: string
  formatted: string
}

async function geocodeAddress(address: string): Promise<GeocoderResult | null> {
  try {
    const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: address,
        key: OPENCAGE_API_KEY,
        countrycode: "CA",
        limit: 1,
      },
    })

    const result = response.data.results[0]
    if (!result) return null

    return {
      lat: result.geometry.lat,
      lng: result.geometry.lng,
      accuracy: result.confidence,
      formatted: result.formatted,
    }
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error.message)
    return null
  }
}

async function geocodeAllServices() {
  const services = await loadServices()
  let geocodeCache = loadGeocodeCache()
  let successCount = 0
  let failureCount = 0

  for (const service of services) {
    if (service.latitude && service.longitude) {
      console.log(`✓ ${service.name}: already has coordinates`)
      continue
    }

    // Check cache first
    const cacheKey = service.address
    if (geocodeCache[cacheKey]) {
      service.latitude = geocodeCache[cacheKey].lat
      service.longitude = geocodeCache[cacheKey].lng
      successCount++
      console.log(`✓ ${service.name}: ${geocodeCache[cacheKey].formatted}`)
      continue
    }

    // Geocode
    const result = await geocodeAddress(service.address)
    if (result) {
      service.latitude = result.lat
      service.longitude = result.lng
      geocodeCache[cacheKey] = result
      successCount++
      console.log(`✓ ${service.name}: ${result.formatted}`)
    } else {
      failureCount++
      console.log(`✗ ${service.name}: failed to geocode`)
    }

    // Rate limit: 1 request per second
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  // Save results
  fs.writeFileSync("data/services.json", JSON.stringify(services, null, 2))
  fs.writeFileSync(GEOCACHE_FILE, JSON.stringify(geocodeCache, null, 2))

  console.log(`\nGeocoding complete: ${successCount} success, ${failureCount} failed`)
}
```

**Run:**

```bash
OPENCAGE_API_KEY=xxx npx tsx scripts/geocode-services.ts
```

### 3.3 Manual Geocoding

For 10-20 services with failed geocoding:

**New file:** `data/manual-coordinates.csv`

```
Service Name,Address,Latitude,Longitude,Notes
Kingston Shelter,"123 Main St",44.2314,-76.4860,Verified with Google Street View
...
```

**Script to apply:**

```typescript
const manualCoords = parseCsv("data/manual-coordinates.csv")
const services = await loadServices()

const updated = services.map((service) => {
  const manual = manualCoords.find((m) => m["Service Name"] === service.name)
  if (manual) {
    return {
      ...service,
      latitude: parseFloat(manual.Latitude),
      longitude: parseFloat(manual.Longitude),
    }
  }
  return service
})
```

---

## Phase 4: Accessibility Metadata (2-3 days)

### 4.1 Access Scripts & Phone Anxiety Support

**Add Field:** `types/service.ts`

```typescript
interface Service {
  // ... existing
  access_script?: string // "Tips for calling this service"
  access_script_fr?: string
  phone_anxiety_tips?: string
  plain_language_available?: boolean
}
```

### 4.2 Create Access Scripts

**New file:** `data/access-scripts.ts`

```typescript
// Generic scripts for common service types
export const accessScriptTemplates = {
  crisis_line: `
    When you call:
    1. They will ask your name (you can give a first name only)
    2. Be honest about what you're going through
    3. They are not here to judge - they want to help
    4. The call is free and confidential
    5. You can end the call anytime
  `,

  health_clinic: `
    To book an appointment:
    1. Call the number listed
    2. Tell them you're a new/existing patient
    3. Ask about next available appointment
    4. Ask about fees if you don't have coverage
    5. Ask what documents to bring
  `,

  mental_health: `
    If you're nervous about your first visit:
    1. It's normal to feel anxious - the counselor understands
    2. You don't have to share everything at once
    3. You can ask questions anytime
    4. Everything discussed is confidential (with few exceptions)
    5. If it's not a good fit, you can try a different counselor
  `,
}

export async function assignAccessScripts() {
  const services = await loadServices()

  const scriptsByCategory = {
    crisis: "crisis_line",
    mental_health: "mental_health",
    health: "health_clinic",
  }

  const updated = services.map((service) => {
    const templateKey = scriptsByCategory[service.category]
    if (templateKey && !service.access_script) {
      return {
        ...service,
        access_script: accessScriptTemplates[templateKey],
      }
    }
    return service
  })

  return updated
}
```

### 4.3 Plain Language Audit

**Script:** `scripts/audit-plain-language.ts`

```typescript
// Use readability analysis
import readabilityScores from "reading-level"

async function auditPlainLanguage() {
  const services = await loadServices()

  const audit = services.map((service) => {
    const descriptionScore = readabilityScores(service.description)

    return {
      name: service.name,
      plain_language_score: descriptionScore,
      is_accessible: descriptionScore > 60, // Flesch Reading Ease
      suggestions:
        descriptionScore < 60 ? ["Break into shorter sentences", "Use simpler words", "Define technical terms"] : [],
    }
  })

  // Mark accessible descriptions
  const updated = services.map((service) => {
    const auditResult = audit.find((a) => a.name === service.name)
    return {
      ...service,
      plain_language_available: auditResult.is_accessible,
    }
  })

  return updated
}
```

---

## Phase 5: Hours & Structured Data (2-3 days)

### 5.1 Convert Hours to Structured Format

**Current State:** Hours stored as text string

```
"Mon-Fri 9am-5pm, Sat 10am-3pm, Closed Sunday"
```

**Desired State:** Structured format

```typescript
interface ServiceHours {
  monday: { open: string; close: string }
  tuesday: { open: string; close: string }
  // ... etc
  closed: string[] // ["sunday"]
  notes?: string
}
```

### 5.2 Hours Parser

**New file:** `lib/parsers/hours-parser.ts`

```typescript
export function parseHoursText(text: string): ServiceHours | null {
  if (!text) return null

  const hours: ServiceHours = {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
    closed: [],
  }

  const lines = text.split(",").map((s) => s.trim())

  for (const line of lines) {
    // Match "Mon-Fri 9am-5pm"
    const rangeMatch = line.match(/([A-Za-z\-]+)\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?/)
    if (rangeMatch) {
      const [, days, openHour, openMin, openPeriod, closeHour, closeMin, closePeriod] = rangeMatch
      const dayList = expandDayRange(days)
      const timeObj = {
        open: formatTime(openHour, openMin, openPeriod),
        close: formatTime(closeHour, closeMin, closePeriod),
      }
      for (const day of dayList) {
        hours[day.toLowerCase()] = timeObj
      }
    }

    // Match "Closed Sunday"
    if (line.includes("Closed")) {
      const closedDay = line.replace("Closed", "").trim()
      hours.closed.push(closedDay.toLowerCase())
    }
  }

  return hours
}
```

### 5.3 Batch Conversion

**Script:** `scripts/convert-hours-to-structured.ts`

```typescript
async function convertHoursFormat() {
  const services = await loadServices()

  const updated = services.map((service) => {
    if (service.hours) return service // Already structured

    if (service.hours_text) {
      return {
        ...service,
        hours: parseHoursText(service.hours_text),
      }
    }

    return service
  })

  // Manual audit needed for 20-30 services with complex hours
  const needsManualReview = updated.filter((s) => !s.hours && s.hours_text)
  console.log(`${needsManualReview.length} services need manual hours review`)

  return updated
}
```

### 5.4 "Open Now" Filter Implementation

**Modify:** `lib/search/index.ts`

```typescript
export function isOpenNow(hours: ServiceHours, now = new Date()): boolean {
  const dayName = getDayName(now) // "monday", "tuesday", etc.

  if (hours.closed.includes(dayName)) {
    return false
  }

  const dayHours = hours[dayName]
  if (!dayHours) return null // Unknown hours

  const nowTime = getTimeString(now) // "09:30"
  return nowTime >= dayHours.open && nowTime <= dayHours.close
}

// Then in search filters:
if (filter.openNow) {
  results = results.filter((s) => isOpenNow(s.hours))
}
```

---

## Phase 6: Verification Level Upgrades (2-3 days)

### 6.1 Identify L3 Service Candidates

**New file:** `data/l3-candidates.csv`

Research and identify major providers suitable for L3 status:

```
Service,Category,Reason,Contact Status
Kingston General Hospital,health,Major regional provider,Not yet contacted
Addiction Services Kingston,health,Government funded,Not yet contacted
Kingston Shelter,housing,Essential community service,Not yet contacted
...
```

**Criteria for L3:**

- [ ] Official partnership signed
- [ ] Provider-confirmed information
- [ ] Recent verification (within 6 months)
- [ ] Complete service data
- [ ] High impact services

### 6.2 L3 Partnership Process

1. **Identify target:** Major health/housing/crisis providers
2. **Research:** Find decision-maker contact
3. **Outreach:** Email + phone with partnership offer
4. **Verification call:** Confirm all details
5. **Document:** Store verification proof
6. **Upgrade:** Mark as L3

**Template:** `data/l3-partnership-tracker.csv`

```
Service,Contact Name,Email,Phone,Status,Verified Date,Notes
KGH,Maria Smith,m.smith@kgh.on.ca,613-548-1232,In progress,2026-01-17,Waiting for callback
...
```

### 6.3 Update Verification Multipliers

**Modify:** `lib/search/scoring.ts`

If introducing L4 (Gold Standard):

```typescript
const VERIFICATION_MULTIPLIERS: Record<VerificationLevel, number> = {
  L0: 0, // Filtered out
  L1: 1.0, // Basic
  L2: 1.2, // Vetted
  L3: 1.5, // Provider-confirmed
  L4: 2.0, // Third-party audited (stretch goal)
}
```

---

## Phase 7: Category Expansion (ONGOING - Not Part of v17.5)

> [!NOTE]
> Category expansion is moved to **ongoing maintenance** rather than a release milestone. New services should be added continuously as partnerships are formed and needs are identified.

### Ongoing Goals (Post-v17.5)

| Category   | Current | Target | Priority    |
| ---------- | ------- | ------ | ----------- |
| Transport  | 2       | 5+     | Medium      |
| Financial  | 4       | 8+     | High        |
| Indigenous | 3       | 8+     | High (EDIA) |

### Process for Adding New Services

1. **Research**: Identify potential services through community input, partnerships
2. **Verify**: Contact provider, confirm details
3. **Enter via Dashboard**: Use v17.2 partner dashboard for data entry
4. **Review**: Apply L1 verification, schedule L2 follow-up
5. **Monitor**: Track usage in analytics

### Research Areas (for future reference)

**Transport:**

- Paratransit services
- Medical transportation
- Volunteer driver programs

**Financial:**

- Utility bill assistance
- Rent assistance
- Debt counseling

**Indigenous:**

- Indigenous-led health services
- Cultural centers
- Land-based programs

---

## Verification Plan

### Automated Checks

```bash
# Verify all services have scope
npm run validate-data -- --check-scope

# Verify all have coordinates within Ontario bounds
npm run validate-data -- --check-coordinates

# Verify hours parse correctly
npm run validate-data -- --check-hours

# Verify verification levels valid
npm run validate-data -- --check-verification-levels
```

### Manual Spot-Check (20% sample)

- [ ] Random 40 services
- [ ] Verify address on Google Maps
- [ ] Verify phone number calls correct organization
- [ ] Check hours match website
- [ ] Confirm scope assignment makes sense

### End-to-End Testing

- [ ] Search works without scope filter
- [ ] "Open Now" filter returns correct services at 9am
- [ ] Distance calculations correct
- [ ] Crisis services always appear first
- [ ] Geographic scope filters work

---

## Success Criteria

### Core Data Quality (Must Have)

- [ ] 100% services have `scope` field
- [ ] 90%+ services have coordinates (target: 180/196)
- [ ] 70%+ services have structured hours (target: 140/196)
- [ ] Data validation passes all automated checks

### Enhanced Metadata (Should Have)

- [ ] 50%+ services have access scripts (target: 100/196)
- [ ] 50%+ services marked with plain language availability
- [ ] 10+ services at L3 verification level

### Removed from v17.5 (Ongoing Work)

- ~~5+ transport services~~ → Ongoing
- ~~8+ financial services~~ → Ongoing
- ~~8+ indigenous services~~ → Ongoing

---

## Deliverables

- Updated `data/services.json` with all new fields
- `data/geocode-cache.json` for future updates
- `data/l3-partnerships.csv` documenting partnerships
- `data-audit.md` with before/after metrics
- Updated scripts for future maintenance

---

## Maintenance Plan

After v17.5:

- Monthly staleness audit: identify unverified services
- Quarterly geocode verification: check coordinates still accurate
- Annual verification audit: re-contact L2/L3 providers
