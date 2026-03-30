import {
  IntentCategory,
  VerificationLevel,
  type AuthorityTier,
  type IdentityTag,
  type Service,
  type ServiceScope,
} from "@/types/service"
import { normalizeProvenance } from "@/lib/provenance"
import {
  SERVICE_PUBLIC_CATEGORIES,
  SERVICE_PUBLIC_VERIFICATION_LEVELS,
  type ServicePublic,
  type ServicePublicAuthorityTier,
  type ServicePublicCategory,
  type ServicePublicScope,
  type ServicePublicTags,
  type ServicePublicVerificationStatus,
} from "@/types/service-public"

const SERVICE_SCOPES = new Set<ServiceScope>(["kingston", "ontario", "canada"])
const AUTHORITY_TIERS = new Set<AuthorityTier>([
  "government",
  "healthcare",
  "established_nonprofit",
  "community",
  "unverified",
])

function normalizeCategory(category: ServicePublicCategory): IntentCategory {
  if (category && SERVICE_PUBLIC_CATEGORIES.has(category)) {
    return category
  }

  return IntentCategory.Community
}

function normalizeVerificationLevel(status: ServicePublicVerificationStatus): VerificationLevel {
  if (status && SERVICE_PUBLIC_VERIFICATION_LEVELS.has(status)) {
    return status
  }

  return VerificationLevel.L1
}

function normalizeScope(scope: ServicePublicScope): ServiceScope | undefined {
  if (scope && SERVICE_SCOPES.has(scope)) {
    return scope
  }

  return undefined
}

function normalizeAuthorityTier(authorityTier: ServicePublicAuthorityTier): AuthorityTier | undefined {
  if (authorityTier && AUTHORITY_TIERS.has(authorityTier)) {
    return authorityTier
  }

  return undefined
}

function isIdentityTag(value: unknown): value is IdentityTag {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { tag?: unknown }).tag === "string" &&
    typeof (value as { evidence_url?: unknown }).evidence_url === "string"
  )
}

function normalizeIdentityTags(tags: ServicePublicTags): IdentityTag[] {
  if (!Array.isArray(tags)) {
    return []
  }

  return tags.flatMap((tag) => {
    if (typeof tag === "string") {
      return [{ tag, evidence_url: "" }]
    }

    if (isIdentityTag(tag)) {
      return [tag]
    }

    return []
  })
}

export function mapServicePublicToService(service: ServicePublic): Service {
  return {
    id: service.id,
    name: service.name,
    name_fr: service.name_fr ?? undefined,
    description: service.description ?? "",
    description_fr: service.description_fr ?? undefined,
    address: service.address ?? undefined,
    address_fr: service.address_fr ?? undefined,
    phone: service.phone ?? undefined,
    url: service.url ?? "",
    email: service.email ?? undefined,
    hours: service.hours ?? undefined,
    fees: service.fees ?? undefined,
    eligibility: service.eligibility ?? undefined,
    eligibility_notes: service.eligibility_notes ?? undefined,
    eligibility_notes_fr: service.eligibility_notes_fr ?? undefined,
    application_process: service.application_process ?? undefined,
    languages: service.languages ?? undefined,
    bus_routes: service.bus_routes ?? undefined,
    accessibility: service.accessibility ?? undefined,
    last_verified: service.last_verified ?? undefined,
    verification_level: normalizeVerificationLevel(service.verification_status),
    intent_category: normalizeCategory(service.category),
    identity_tags: normalizeIdentityTags(service.tags),
    synthetic_queries: service.synthetic_queries ?? [],
    synthetic_queries_fr: service.synthetic_queries_fr ?? undefined,
    provenance: normalizeProvenance(service.provenance),
    scope: normalizeScope(service.scope),
    virtual_delivery: service.virtual_delivery ?? undefined,
    primary_phone_label: service.primary_phone_label ?? undefined,
    authority_tier: normalizeAuthorityTier(service.authority_tier ?? null),
    resource_indicators: service.resource_indicators ?? undefined,
    coordinates: service.coordinates ?? undefined,
  }
}
