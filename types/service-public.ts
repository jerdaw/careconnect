import type {
  AuthorityTier,
  IdentityTag,
  Provenance,
  ResourceIndicators,
  Service,
  ServiceHours,
  ServiceScope,
} from "./service"
import { IntentCategory, VerificationLevel } from "./service"

export type ServicePublicCategory = IntentCategory | null
export type ServicePublicVerificationStatus = VerificationLevel | null
export type ServicePublicTags = Array<IdentityTag | string> | null
export type ServicePublicHours = ServiceHours | null
export type ServicePublicAccessibility = Service["accessibility"] | null
export type ServicePublicScope = ServiceScope | null
export type ServicePublicCoordinates = Service["coordinates"] | null
export type ServicePublicAuthorityTier = AuthorityTier | null
export type ServicePublicProvenance = Provenance | null

export const SERVICE_PUBLIC_CATEGORIES = new Set<string>(Object.values(IntentCategory))
export const SERVICE_PUBLIC_VERIFICATION_LEVELS = new Set<string>(Object.values(VerificationLevel))

export interface ServicePublic {
  id: string
  name: string
  name_fr: string | null
  description: string | null
  description_fr: string | null
  address: string | null
  address_fr: string | null
  phone: string | null
  url: string | null
  email: string | null
  hours: ServicePublicHours
  hours_text?: string | null
  hours_text_fr?: string | null
  fees: string | null
  eligibility: string | null
  eligibility_fr?: string | null
  eligibility_notes: string | null
  eligibility_notes_fr: string | null
  application_process: string | null
  application_process_fr?: string | null
  languages: string[] | null
  bus_routes: string[] | null
  accessibility: ServicePublicAccessibility
  last_verified: string | null
  verification_status: ServicePublicVerificationStatus
  category: ServicePublicCategory
  tags: ServicePublicTags
  scope: ServicePublicScope
  virtual_delivery: boolean | null
  primary_phone_label: string | null
  created_at: string
  synthetic_queries?: string[] | null
  synthetic_queries_fr?: string[] | null
  authority_tier?: ServicePublicAuthorityTier
  resource_indicators?: ResourceIndicators | null
  coordinates?: ServicePublicCoordinates
  provenance?: ServicePublicProvenance
  access_script?: string | null
  access_script_fr?: string | null
}
