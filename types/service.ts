/**
 * Verification Levels for the Kingston 150 Governance Schema.
 */
export enum VerificationLevel {
  L0 = "L0", // Unverified
  L1 = "L1", // Basic Verification (Existence confirmed)
  L2 = "L2", // Vetted (Contact made)
  L3 = "L3", // Provider Confirmed (Official partnership or direct confirmation)
}

/**
 * Intent Categories for organizing services.
 */
export enum IntentCategory {
  Food = "Food",
  Crisis = "Crisis",
  Housing = "Housing",
  Health = "Health",
  Legal = "Legal",
  Wellness = "Wellness",
  Financial = "Financial",
  Employment = "Employment",
  Education = "Education",
  Transport = "Transport",
  Community = "Community",
  Indigenous = "Indigenous",
}

/**
 * Service Scope for geographic availability.
 * v11.0: Replaces is_provincial boolean with explicit scope enum.
 */
export type ServiceScope = "kingston" | "ontario" | "canada"

/**
 * Identity Tag with evidence.
 */
export interface IdentityTag {
  tag: string
  /** The URL where this specific eligibility or tag was confirmed. */
  evidence_url: string
}

/**
 * Provenance information for data lineage.
 */
export interface Provenance {
  /** The author or system that verified the data. */
  verified_by: string
  /** ISO timestamp of when the verification occurred. */
  verified_at: string
  /** The URL where eligibility or existence was confirmed. */
  evidence_url: string
  /** Method of verification (e.g., 'phone', 'email', 'scrape'). */
  method: string
}

/**
 * Service object definition.
 */
/**
 * Structured operating hours.
 * 24-hour format "HH:MM".
 */
export interface ServiceHours {
  monday?: { open: string; close: string }
  tuesday?: { open: string; close: string }
  wednesday?: { open: string; close: string }
  thursday?: { open: string; close: string }
  friday?: { open: string; close: string }
  saturday?: { open: string; close: string }
  sunday?: { open: string; close: string }
  notes?: string // e.g., "Closed on public holidays"
}

/**
 * Service object definition.
 */
export interface Service {
  // ... existing fields ...
  // Core Identity
  id: string
  name: string
  name_fr?: string // French translation
  description: string
  description_fr?: string // French translation

  /** Website URL */
  url: string

  /** Contact Email */
  email?: string

  /** Contact Phone */
  phone?: string

  /** Physical Address */
  address?: string
  address_fr?: string // French translation (if format differs)

  /** The verification level of this data record. */
  verification_level: VerificationLevel

  /** The primary category of intent this service addresses. */
  intent_category: IntentCategory

  /** Data provenance and governance details. */
  provenance: Provenance

  /**
   * Tags identifying specific communities or eligibility groups.
   */
  identity_tags: IdentityTag[]

  /**
   * AI-generated enrichment data (e.g. synthetic queries for semantic search).
   */
  synthetic_queries: string[]
  synthetic_queries_fr?: string[]

  /**
   * Summarized eligibility criteria (e.g. "Students only. No fees.").
   */
  eligibility_notes?: string
  eligibility_notes_fr?: string

  /**
   * A self-advocacy script for reducing phone anxiety.
   */
  access_script?: string
  access_script_fr?: string
  org_id?: string

  // --- Expanded Fields for Migration ---
  /**
   * Operational status of the service (e.g., "Active", "Permanently Closed", "Merged").
   */
  status?: string

  hours?: ServiceHours // Updated from string to structured object
  
  /**
   * Human-readable hours text (e.g. "Mon-Fri 9-5 (Closed 12-1)")
   */
  hours_text?: string
  hours_text_fr?: string
  
  fees?: string
  fees_fr?: string

  eligibility?: string // Raw text eligibility
  eligibility_fr?: string

  application_process?: string
  application_process_fr?: string

  documents_required?: string
  documents_required_fr?: string

  languages?: string[]
  bus_routes?: string[]
  accessibility?: Record<string, boolean>
  last_verified?: string
  embedding?: number[] // Vector embedding
  coordinates?: {
    lat: number
    lng: number
  }

  /**
   * Indicates service has stated cultural safety protocols for Indigenous peoples.
   */
  cultural_safety?: boolean

  /**
   * Geographic scope of service availability.
   * v11.0: Replaces is_provincial boolean.
   */
  scope?: ServiceScope

  /**
   * If true, service is delivered virtually (phone/online) with no physical location required.
   */
  virtual_delivery?: boolean

  /**
   * Label for primary phone (e.g., "Provincial Toll-Free", "Kingston Local").
   */
  primary_phone_label?: string

  /**
   * Geographic service area description.
   */
  service_area?: string

  /**
   * @deprecated Use `scope` field instead. Will be removed in v12.0.
   * If true, this service is available province-wide, not just Kingston.
   */
  is_provincial?: boolean

  /**
   * If true, the service is visible in the public index.
   * Defaults to true. Set to false to hide without deleting.
   */
  published?: boolean
}

