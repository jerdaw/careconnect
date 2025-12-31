import { Service, VerificationLevel, IntentCategory } from "@/types/service"
import { UserContext } from "@/types/user-context"

export const mockService: Service = {
    id: "test-service-id",
    name: "Test Service",
    description: "A description for the test service.",
    url: "https://example.com",
    phone: "555-0123",
    address: "123 Test St",
    verification_level: VerificationLevel.L1,
    intent_category: IntentCategory.Food,
    provenance: {
        verified_by: "tester",
        verified_at: new Date().toISOString(),
        method: "manual",
        evidence_url: "https://example.com/evidence"
    },
    identity_tags: [],
    synthetic_queries: [],
    eligibility_notes: "",
    hours: {},
    coordinates: { lat: 44.2312, lng: -76.4860 }
}

export const mockUserContext: UserContext = {
    hasOptedIn: true,
    ageGroup: null,
    identities: [],
}
