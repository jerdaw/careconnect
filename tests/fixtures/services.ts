import { Service, VerificationLevel, IntentCategory } from "@/types/service"

export const mockServiceL3: Service = {
  id: "test-service-1",
  name: "Food Bank",
  description: "Community food bank.",
  url: "https://example.com",
  intent_category: IntentCategory.Food,
  verification_level: VerificationLevel.L3,
  provenance: {
    verified_by: "staff",
    verified_at: "2025-01-01T00:00:00Z",
    evidence_url: "https://example.com",
    method: "phone",
  },
  identity_tags: [],
  synthetic_queries: ["food", "hungry"],
  scope: "kingston",
}

export const mockServiceL2: Service = {
  id: "test-service-2",
  name: "Health Clinic",
  description: "Walk-in clinic.",
  url: "https://example.com",
  intent_category: IntentCategory.Health,
  verification_level: VerificationLevel.L2,
  provenance: {
    verified_by: "staff",
    verified_at: "2025-01-01T00:00:00Z",
    evidence_url: "https://example.com",
    method: "phone",
  },
  identity_tags: [],
  synthetic_queries: ["doctor"],
  scope: "kingston",
}

export const mockServiceL1: Service = {
  id: "test-service-3",
  name: "Info Line",
  description: "General information.",
  url: "https://example.com",
  intent_category: IntentCategory.Wellness,
  verification_level: VerificationLevel.L1,
  provenance: {
    verified_by: "staff",
    verified_at: "2025-01-01T00:00:00Z",
    evidence_url: "https://example.com",
    method: "phone",
  },
  identity_tags: [],
  synthetic_queries: [],
  scope: "kingston",
}

export const mockServiceL0: Service = {
  id: "test-service-0",
  name: "Unverified Service",
  description: "Not checked.",
  url: "https://example.com",
  intent_category: IntentCategory.Community,
  verification_level: VerificationLevel.L0,
  provenance: {
    verified_by: "scrape",
    verified_at: "2024-01-01T00:00:00Z",
    evidence_url: "https://example.com",
    method: "scrape",
  },
  identity_tags: [],
  synthetic_queries: [],
  scope: "kingston",
}

export const mockCrisisService: Service = {
  id: "test-service-crisis",
  name: "Crisis Line",
  description: "24/7 support.",
  url: "https://example.com",
  intent_category: IntentCategory.Crisis,
  verification_level: VerificationLevel.L3,
  provenance: {
    verified_by: "staff",
    verified_at: "2025-01-01T00:00:00Z",
    evidence_url: "https://example.com",
    method: "phone",
  },
  identity_tags: [],
  synthetic_queries: ["suicide", "help"],
  scope: "ontario", // Fixed: provincial scope
}

export const mockClosedService: Service = {
  id: "test-service-closed",
  name: "Closed Service",
  description: "No longer operating.",
  url: "https://example.com",
  intent_category: IntentCategory.Community,
  verification_level: VerificationLevel.L1,
  provenance: {
    verified_by: "staff",
    verified_at: "2025-01-01T00:00:00Z",
    evidence_url: "https://example.com",
    method: "phone",
  },
  identity_tags: [],
  synthetic_queries: [],
  status: "Permanently Closed",
  scope: "kingston",
}

export const createMockService = (overrides: Partial<Service>): Service => ({
  ...mockServiceL3,
  id: `test-service-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  ...overrides,
})

export const mockProvincialService: Service = {
  id: "test-service-provincial",
  name: "Ontario Health",
  description: "Provincial health service.",
  url: "https://ontario.ca",
  intent_category: IntentCategory.Health,
  verification_level: VerificationLevel.L3,
  provenance: {
    verified_by: "staff",
    verified_at: "2025-01-01T00:00:00Z",
    evidence_url: "https://example.com",
    method: "phone",
  },
  identity_tags: [],
  synthetic_queries: [],
  scope: "ontario",
}

export const mockCrisisServiceHighPriority: Service = {
  id: "test-service-crisis-high",
  name: "Emergency Shelter",
  description: "Immediate housing.",
  url: "https://example.com",
  intent_category: IntentCategory.Crisis,
  verification_level: VerificationLevel.L3,
  provenance: {
    verified_by: "staff",
    verified_at: "2025-01-01T00:00:00Z",
    evidence_url: "https://example.com",
    method: "phone",
  },
  identity_tags: [],
  synthetic_queries: [],
  scope: "kingston",
}
