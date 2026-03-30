import type { ServiceCreateInput } from "@/lib/schemas/service-create"
import { normalizeProvenance } from "@/lib/provenance"
import {
  IntentCategory,
  VerificationLevel,
  type AuthorityTier,
  type IdentityTag,
  type ResourceIndicators,
  type Service,
  type ServiceHours,
  type ServiceScope,
} from "@/types/service"
import type { Database, Json } from "@/types/supabase"

export type ServiceRow = Database["public"]["Tables"]["services"]["Row"]
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"]
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"]

const SERVICE_CATEGORIES = new Set<string>(Object.values(IntentCategory))
const SERVICE_SCOPES = new Set<ServiceScope>(["kingston", "ontario", "canada"])
const VERIFICATION_LEVELS = new Set<string>(Object.values(VerificationLevel))
const AUTHORITY_TIERS = new Set<AuthorityTier>([
  "government",
  "healthcare",
  "established_nonprofit",
  "community",
  "unverified",
])

function parseJsonField<T>(value: unknown): T | undefined {
  if (value == null) return undefined

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return undefined
    }
  }

  return value as T
}

function toJsonField(value: unknown): Json | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  const parsed = parseJsonField<Json>(value)
  if (parsed !== undefined) {
    return parsed
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (Array.isArray(value) || typeof value === "object") {
    return value as Json
  }

  return undefined
}

function toStringArray(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  const parsed = typeof value === "string" ? parseJsonField<unknown>(value) : value
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    return undefined
  }

  return parsed
}

function isIdentityTag(value: unknown): value is IdentityTag {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { tag?: unknown }).tag === "string" &&
    typeof (value as { evidence_url?: unknown }).evidence_url === "string"
  )
}

function normalizeIdentityTags(value: unknown): IdentityTag[] {
  const parsed = typeof value === "string" ? parseJsonField<unknown>(value) : value

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.flatMap((tag) => {
    if (typeof tag === "string") {
      return [{ tag, evidence_url: "" }]
    }

    if (isIdentityTag(tag)) {
      return [tag]
    }

    return []
  })
}

function normalizeVerificationLevel(value: unknown, fallback?: Service["verification_level"]): VerificationLevel {
  if (typeof value === "string" && VERIFICATION_LEVELS.has(value)) {
    return value as VerificationLevel
  }

  if (value === "unverified") {
    return VerificationLevel.L0
  }

  if (fallback) {
    return fallback
  }

  return VerificationLevel.L0
}

function normalizeCategory(value: unknown, fallback?: Service["intent_category"]): IntentCategory {
  if (typeof value === "string" && SERVICE_CATEGORIES.has(value)) {
    return value as IntentCategory
  }

  if (fallback) {
    return fallback
  }

  return IntentCategory.Community
}

function normalizeScope(value: unknown, fallback?: Service["scope"]): ServiceScope | undefined {
  if (typeof value === "string" && SERVICE_SCOPES.has(value as ServiceScope)) {
    return value as ServiceScope
  }

  return fallback
}

function normalizeAuthorityTier(value: unknown, fallback?: Service["authority_tier"]): AuthorityTier | undefined {
  if (typeof value === "string" && AUTHORITY_TIERS.has(value as AuthorityTier)) {
    return value as AuthorityTier
  }

  return fallback
}

export function mapServiceRowToService(
  row: ServiceRow,
  options: { staticService?: Service; fallbackEmbedding?: number[] } = {}
): Service {
  const { staticService, fallbackEmbedding } = options

  return {
    ...staticService,
    id: row.id,
    name: row.name,
    name_fr: row.name_fr ?? staticService?.name_fr ?? undefined,
    description: row.description ?? staticService?.description ?? "",
    description_fr: row.description_fr ?? staticService?.description_fr ?? undefined,
    address: row.address ?? staticService?.address ?? undefined,
    address_fr: row.address_fr ?? staticService?.address_fr ?? undefined,
    phone: row.phone ?? staticService?.phone ?? undefined,
    url: row.url ?? staticService?.url ?? "",
    email: row.email ?? staticService?.email ?? undefined,
    verification_level: normalizeVerificationLevel(row.verification_status, staticService?.verification_level),
    intent_category: normalizeCategory(row.category, staticService?.intent_category),
    provenance: normalizeProvenance(row.provenance, {
      fallback: staticService?.provenance,
    }),
    identity_tags: normalizeIdentityTags(row.tags ?? staticService?.identity_tags),
    synthetic_queries: row.synthetic_queries ?? staticService?.synthetic_queries ?? [],
    synthetic_queries_fr: row.synthetic_queries_fr ?? staticService?.synthetic_queries_fr ?? undefined,
    eligibility_notes: staticService?.eligibility_notes,
    eligibility_notes_fr: staticService?.eligibility_notes_fr,
    access_script: staticService?.access_script,
    access_script_fr: staticService?.access_script_fr,
    org_id: row.org_id ?? staticService?.org_id ?? undefined,
    plain_language_available: row.plain_language_available ?? staticService?.plain_language_available ?? undefined,
    status: staticService?.status,
    hours: parseJsonField<ServiceHours>(row.hours) ?? staticService?.hours,
    hours_text: row.hours_text ?? staticService?.hours_text ?? undefined,
    hours_text_fr: row.hours_text_fr ?? staticService?.hours_text_fr ?? undefined,
    fees: row.fees ?? staticService?.fees ?? undefined,
    fees_fr: row.fees_fr ?? staticService?.fees_fr ?? undefined,
    eligibility: row.eligibility ?? staticService?.eligibility ?? undefined,
    eligibility_fr: row.eligibility_fr ?? staticService?.eligibility_fr ?? undefined,
    application_process: row.application_process ?? staticService?.application_process ?? undefined,
    application_process_fr: row.application_process_fr ?? staticService?.application_process_fr ?? undefined,
    documents_required: staticService?.documents_required,
    documents_required_fr: staticService?.documents_required_fr,
    languages: row.languages ?? staticService?.languages ?? undefined,
    bus_routes: row.bus_routes ?? staticService?.bus_routes ?? undefined,
    accessibility:
      parseJsonField<Record<string, boolean>>(row.accessibility) ?? staticService?.accessibility ?? undefined,
    last_verified: row.last_verified ?? staticService?.last_verified ?? undefined,
    embedding: parseJsonField<number[]>(row.embedding) ?? fallbackEmbedding ?? staticService?.embedding,
    coordinates:
      parseJsonField<{ lat: number; lng: number }>(row.coordinates) ?? staticService?.coordinates ?? undefined,
    cultural_safety: staticService?.cultural_safety,
    scope: normalizeScope(row.scope, staticService?.scope),
    virtual_delivery: row.virtual_delivery ?? staticService?.virtual_delivery ?? undefined,
    primary_phone_label: row.primary_phone_label ?? staticService?.primary_phone_label ?? undefined,
    service_area: row.service_area ?? staticService?.service_area ?? undefined,
    is_provincial: staticService?.is_provincial,
    published: row.published,
    authority_tier: normalizeAuthorityTier(row.authority_tier, staticService?.authority_tier),
    resource_indicators:
      parseJsonField<ResourceIndicators>(row.resource_indicators) ?? staticService?.resource_indicators ?? undefined,
    deleted_at: row.deleted_at,
    deleted_by: row.deleted_by,
    admin_notes: row.admin_notes ?? staticService?.admin_notes ?? undefined,
    last_admin_review: row.last_admin_review ?? staticService?.last_admin_review ?? undefined,
    reviewed_by: row.reviewed_by ?? staticService?.reviewed_by ?? undefined,
  }
}

export function mapServiceToDatabaseUpdate(service: Partial<Service>): ServiceUpdate {
  const update: ServiceUpdate = {}

  if (service.name !== undefined) update.name = service.name
  if (service.name_fr !== undefined) update.name_fr = service.name_fr
  if (service.description !== undefined) update.description = service.description
  if (service.description_fr !== undefined) update.description_fr = service.description_fr
  if (service.address !== undefined) update.address = service.address
  if (service.address_fr !== undefined) update.address_fr = service.address_fr
  if (service.phone !== undefined) update.phone = service.phone
  if (service.url !== undefined) update.url = service.url
  if (service.email !== undefined) update.email = service.email
  if (service.hours !== undefined) update.hours = service.hours as unknown as Json
  if (service.hours_text !== undefined) update.hours_text = service.hours_text
  if (service.hours_text_fr !== undefined) update.hours_text_fr = service.hours_text_fr
  if (service.fees !== undefined) update.fees = service.fees
  if (service.fees_fr !== undefined) update.fees_fr = service.fees_fr
  if (service.eligibility !== undefined) update.eligibility = service.eligibility
  if (service.eligibility === undefined && service.eligibility_notes !== undefined) {
    update.eligibility = service.eligibility_notes
  }
  if (service.eligibility_fr !== undefined) update.eligibility_fr = service.eligibility_fr
  if (service.application_process !== undefined) update.application_process = service.application_process
  if (service.application_process_fr !== undefined) update.application_process_fr = service.application_process_fr
  if (service.languages !== undefined) update.languages = service.languages
  if (service.bus_routes !== undefined) update.bus_routes = service.bus_routes
  if (service.accessibility !== undefined) update.accessibility = service.accessibility as unknown as Json
  if (service.last_verified !== undefined) update.last_verified = service.last_verified
  if (service.verification_level !== undefined) update.verification_status = service.verification_level
  if (service.intent_category !== undefined) update.category = service.intent_category
  if (service.identity_tags !== undefined) update.tags = service.identity_tags as unknown as Json
  if (service.scope !== undefined) update.scope = service.scope
  if (service.virtual_delivery !== undefined) update.virtual_delivery = service.virtual_delivery
  if (service.primary_phone_label !== undefined) update.primary_phone_label = service.primary_phone_label
  if (service.service_area !== undefined) update.service_area = service.service_area
  if (service.authority_tier !== undefined) update.authority_tier = service.authority_tier
  if (service.resource_indicators !== undefined) {
    update.resource_indicators = service.resource_indicators as unknown as Json
  }
  if (service.synthetic_queries !== undefined) update.synthetic_queries = service.synthetic_queries
  if (service.synthetic_queries_fr !== undefined) update.synthetic_queries_fr = service.synthetic_queries_fr
  if (service.coordinates !== undefined) update.coordinates = service.coordinates as unknown as Json
  if (service.embedding !== undefined) update.embedding = service.embedding as unknown as Json
  if (service.plain_language_available !== undefined) {
    update.plain_language_available = service.plain_language_available
  }
  if (service.org_id !== undefined) update.org_id = service.org_id
  if (service.published !== undefined) update.published = service.published
  if (service.deleted_at !== undefined) update.deleted_at = service.deleted_at
  if (service.deleted_by !== undefined) update.deleted_by = service.deleted_by
  if (service.admin_notes !== undefined) update.admin_notes = service.admin_notes
  if (service.last_admin_review !== undefined) update.last_admin_review = service.last_admin_review
  if (service.reviewed_by !== undefined) update.reviewed_by = service.reviewed_by
  if (service.provenance !== undefined) update.provenance = service.provenance as unknown as Json

  return update
}

export function mapServiceToDatabaseUpsert(service: Partial<Service> & Pick<Service, "id" | "name">): ServiceInsert {
  return {
    id: service.id,
    name: service.name,
    ...mapServiceToDatabaseUpdate(service),
  }
}

export function mapCreateInputToServiceInsert(
  input: ServiceCreateInput,
  options: {
    id: string
    orgId?: string
    verifiedBy: string
    verifiedAt?: string
    verificationStatus?: string
    published?: boolean
    provenanceMethod?: string
  }
): ServiceInsert {
  const verifiedAt = options.verifiedAt ?? new Date().toISOString()

  const insert = mapServiceToDatabaseUpsert({
    id: options.id,
    name: input.name,
    name_fr: input.name_fr,
    description: input.description,
    description_fr: input.description_fr,
    address: input.address,
    address_fr: input.address_fr,
    phone: input.phone,
    url: input.url,
    email: input.email,
    hours: input.hours,
    hours_text: input.hours_text,
    fees: input.fees,
    eligibility: input.eligibility,
    eligibility_notes: input.eligibility_notes,
    application_process: input.application_process,
    languages: input.languages,
    bus_routes: input.bus_routes,
    intent_category: normalizeCategory(input.intent_category),
    identity_tags: input.identity_tags ?? [],
    scope: input.scope,
    virtual_delivery: input.virtual_delivery,
    coordinates: input.coordinates,
    org_id: options.orgId ?? input.org_id,
    plain_language_available: input.plain_language_available,
    verification_level: normalizeVerificationLevel(options.verificationStatus),
    provenance: {
      verified_by: options.verifiedBy,
      verified_at: verifiedAt,
      evidence_url: input.url || "",
      method: options.provenanceMethod ?? "partner_submission",
    },
    synthetic_queries: [],
  })

  if (options.published !== undefined) {
    insert.published = options.published
  }

  return insert
}

export function mapServicePayloadToUpdate(payload: Record<string, unknown>): ServiceUpdate {
  const update: ServiceUpdate = {}

  const maybeSetString = <Key extends keyof ServiceUpdate>(key: Key, value: unknown) => {
    if (typeof value === "string" || value === null) {
      update[key] = value as ServiceUpdate[Key]
    }
  }

  maybeSetString("name", payload.name)
  maybeSetString("name_fr", payload.name_fr)
  maybeSetString("description", payload.description)
  maybeSetString("description_fr", payload.description_fr)
  maybeSetString("address", payload.address)
  maybeSetString("address_fr", payload.address_fr)
  maybeSetString("phone", payload.phone)
  maybeSetString("url", payload.url)
  maybeSetString("email", payload.email)
  maybeSetString("hours_text", payload.hours_text)
  maybeSetString("hours_text_fr", payload.hours_text_fr)
  maybeSetString("fees", payload.fees)
  maybeSetString("fees_fr", payload.fees_fr)
  maybeSetString("eligibility", payload.eligibility)
  if (update.eligibility === undefined) {
    maybeSetString("eligibility", payload.eligibility_notes)
  }
  maybeSetString("eligibility_fr", payload.eligibility_fr)
  maybeSetString("application_process", payload.application_process)
  maybeSetString("application_process_fr", payload.application_process_fr)
  maybeSetString("last_verified", payload.last_verified)
  maybeSetString("verification_status", payload.verification_status)
  if (update.verification_status === undefined) {
    maybeSetString("verification_status", payload.verification_level)
  }
  maybeSetString("category", payload.category)
  if (update.category === undefined) {
    maybeSetString("category", payload.intent_category)
  }
  maybeSetString("scope", payload.scope)
  maybeSetString("primary_phone_label", payload.primary_phone_label)
  maybeSetString("service_area", payload.service_area)
  maybeSetString("authority_tier", payload.authority_tier)
  maybeSetString("org_id", payload.org_id)
  maybeSetString("deleted_at", payload.deleted_at)
  maybeSetString("deleted_by", payload.deleted_by)
  maybeSetString("admin_notes", payload.admin_notes)
  maybeSetString("last_admin_review", payload.last_admin_review)
  maybeSetString("reviewed_by", payload.reviewed_by)

  if (typeof payload.virtual_delivery === "boolean") {
    update.virtual_delivery = payload.virtual_delivery
  }
  if (typeof payload.plain_language_available === "boolean") {
    update.plain_language_available = payload.plain_language_available
  }
  if (typeof payload.published === "boolean") {
    update.published = payload.published
  }

  const hours = toJsonField(payload.hours)
  if (hours !== undefined) update.hours = hours

  const accessibility = toJsonField(payload.accessibility)
  if (accessibility !== undefined) update.accessibility = accessibility

  const tags = toJsonField(payload.tags ?? payload.identity_tags)
  if (tags !== undefined) update.tags = tags

  const resourceIndicators = toJsonField(payload.resource_indicators)
  if (resourceIndicators !== undefined) update.resource_indicators = resourceIndicators

  const coordinates = toJsonField(payload.coordinates)
  if (coordinates !== undefined) update.coordinates = coordinates

  const embedding = toJsonField(payload.embedding)
  if (embedding !== undefined) update.embedding = embedding

  const provenance = toJsonField(payload.provenance)
  if (provenance !== undefined) update.provenance = provenance

  const languages = toStringArray(payload.languages)
  if (languages !== undefined) update.languages = languages

  const busRoutes = toStringArray(payload.bus_routes)
  if (busRoutes !== undefined) update.bus_routes = busRoutes

  const syntheticQueries = toStringArray(payload.synthetic_queries)
  if (syntheticQueries !== undefined) update.synthetic_queries = syntheticQueries

  const syntheticQueriesFr = toStringArray(payload.synthetic_queries_fr)
  if (syntheticQueriesFr !== undefined) update.synthetic_queries_fr = syntheticQueriesFr

  return update
}
