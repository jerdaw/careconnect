/**
 * Verification Levels for the Kingston 150 Governance Schema.
 */
export enum VerificationLevel {
    L0 = 'L0', // Unverified
    L1 = 'L1', // Basic Verification (Existence confirmed)
    L2 = 'L2', // Vetted (Contact made)
    L3 = 'L3', // Provider Confirmed (Official partnership or direct confirmation)
}

/**
 * Intent Categories for organizing services.
 */
export enum IntentCategory {
    Food = 'Food',
    Crisis = 'Crisis',
    Housing = 'Housing',
    Health = 'Health',
    Legal = 'Legal',
    Wellness = 'Wellness',
    Financial = 'Financial',
    Employment = 'Employment',
    Community = 'Community',
}

/**
 * Identity Tag with evidence.
 */
export interface IdentityTag {
    tag: string;
    /** The URL where this specific eligibility or tag was confirmed. */
    evidence_url: string;
}

/**
 * Provenance information for data lineage.
 */
export interface Provenance {
    /** The author or system that verified the data. */
    verified_by: string;
    /** ISO timestamp of when the verification occurred. */
    verified_at: string;
    /** The URL where eligibility or existence was confirmed. */
    evidence_url: string;
    /** Method of verification (e.g., 'phone', 'email', 'scrape'). */
    method: string;
}

/**
 * Service object definition.
 */
export interface Service {
    // Core Identity
    id: string;
    name: string;
    name_fr?: string; // French translation
    description: string;
    description_fr?: string; // French translation

    /** Website URL */
    url: string;

    /** Contact Email */
    email?: string;

    /** Contact Phone */
    phone?: string;

    /** Physical Address */
    address?: string;
    address_fr?: string; // French translation (if format differs)

    /** The verification level of this data record. */
    verification_level: VerificationLevel;

    /** The primary category of intent this service addresses. */
    intent_category: IntentCategory;

    /** Data provenance and governance details. */
    provenance: Provenance;

    /** 
     * Tags identifying specific communities or eligibility groups.
     */
    identity_tags: IdentityTag[];

    /**
     * AI-generated enrichment data (e.g. synthetic queries for semantic search).
     */
    synthetic_queries: string[];

    /**
     * Summarized eligibility criteria (e.g. "Students only. No fees.").
     */
    eligibility_notes?: string;

    /**
     * A self-advocacy script for reducing phone anxiety.
     */
    access_script?: string;

    // --- Expanded Fields for Migration ---
    hours?: string;
    fees?: string;
    eligibility?: string; // Raw text eligibility
    application_process?: string;
    languages?: string[];
    bus_routes?: string[];
    accessibility?: any; // Keeping loose for now, strictly it's Record<string, boolean>
    last_verified?: string;
    embedding?: number[]; // Vector embedding
    coordinates?: {
        lat: number;
        lng: number;
    };
}
