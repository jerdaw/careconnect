import { describe, it, expect } from "vitest"
import { parseEligibility, checkEligibility } from "@/lib/eligibility/checker"
import { scoreServiceKeyword } from "@/lib/search/scoring"
import type { UserContext } from "@/types/user-context"
import { Service, VerificationLevel, IntentCategory } from "@/types/service"

// --- Mock Data ---

const MOCK_SERVICE: Service = {
    id: "test",
    name: "Test Service",
    description: "Test",
    url: "http://test.com",
    verification_level: VerificationLevel.L1,
    intent_category: IntentCategory.Food,
    provenance: {
        verified_by: "system",
        verified_at: new Date().toISOString(),
        evidence_url: "",
        method: "manual"
    },
    identity_tags: [],
    synthetic_queries: [],
    eligibility_notes: "",
}

const MOCK_USER: UserContext = {
    hasOptedIn: true,
    ageGroup: null,
    identities: [],
}

const createService = (notes: string): Service => ({
    ...MOCK_SERVICE,
    eligibility_notes: notes,
})

const createContext = (overrides: Partial<UserContext> = {}): UserContext => ({
    ...MOCK_USER,
    ...overrides,
})

// --- Tests ---

describe("Eligibility System", () => {

    describe("parseEligibility", () => {
        it("extracts age range from 'Ages 18-29'", () => {
            const criteria = parseEligibility("Ages 18-29 only")
            expect(criteria.minAge).toBe(18)
            expect(criteria.maxAge).toBe(29)
        })

        it("extracts single age from 'Age 55+'", () => {
            const criteria = parseEligibility("Age 55+")
            expect(criteria.minAge).toBe(55)
            expect(criteria.maxAge).toBeUndefined()
        })

        it("detects youth keyword", () => {
            const criteria = parseEligibility("For youth in Kingston")
            expect(criteria.maxAge).toBe(29)
        })

        it("detects senior keyword", () => {
            const criteria = parseEligibility("Senior citizens welcome")
            expect(criteria.minAge).toBe(55)
        })

        it("detects Indigenous identity requirement", () => {
            const criteria = parseEligibility("Must be First Nations, Inuit, or Metis")
            expect(criteria.requiredIdentities).toContain("indigenous")
        })

        it("detects newcomer identity requirement", () => {
            const criteria = parseEligibility("For immigrants and refugees")
            expect(criteria.requiredIdentities).toContain("newcomer")
        })

        it("detects 2SLGBTQI+ identity requirement", () => {
            const criteria = parseEligibility("LGBTQ+ affirming space")
            expect(criteria.requiredIdentities).toContain("2slgbtqi+")
        })
    })

    describe("checkEligibility", () => {
        it("returns 'unknown' when user has not opted in", () => {
            const service = createService("Ages 18-29")
            const context = createContext({ hasOptedIn: false })
            expect(checkEligibility(service, context)).toBe("unknown")
        })

        it("returns 'unknown' when no eligibility notes", () => {
            const service = createService("")
            // Ensure it's falsy or empty
            expect(checkEligibility(service, MOCK_USER)).toBe("unknown")
        })

        it("returns 'eligible' when no restrictions found", () => {
            const service = createService("Open to everyone")
            expect(checkEligibility(service, MOCK_USER)).toBe("eligible")
        })

        it("returns 'eligible' when youth user matches youth service", () => {
            const service = createService("Ages 16-29")
            const context = createContext({ ageGroup: "youth" })
            expect(checkEligibility(service, context)).toBe("eligible")
        })

        it("returns 'ineligible' when senior user doesn't match youth service", () => {
            const service = createService("Ages 16-29")
            const context = createContext({ ageGroup: "senior" })
            expect(checkEligibility(service, context)).toBe("ineligible")
        })

        it("returns 'eligible' when senior user matches senior service", () => {
            const service = createService("Ages 55+")
            const context = createContext({ ageGroup: "senior" })
            expect(checkEligibility(service, context)).toBe("eligible")
        })

        it("returns 'ineligible' when youth user doesn't match senior service", () => {
            const service = createService("Seniors only")
            const context = createContext({ ageGroup: "youth" })
            expect(checkEligibility(service, context)).toBe("ineligible")
        })

        it("returns 'eligible' when user has required identity", () => {
            const service = createService("For Indigenous peoples")
            const context = createContext({ identities: ["indigenous"] })
            expect(checkEligibility(service, context)).toBe("eligible")
        })

        it("returns 'ineligible' when user lacks required identity", () => {
            const service = createService("For Indigenous peoples")
            const context = createContext({ identities: ["newcomer"] })
            expect(checkEligibility(service, context)).toBe("ineligible")
        })
    })
})

describe("Identity-Aware Ranking", () => {
    it("boosts score for matching identity tags", () => {
        const serviceWithTag: Service = {
            ...MOCK_SERVICE,
            // Ensure we have a matchable string for base score
            name: "Indigenous Support Service",
            identity_tags: [{ tag: "Indigenous", evidence_url: "http://example.com" }],
        }

        const tokens = ["indigenous"]

        // Base score (no user context)
        const baseResult = scoreServiceKeyword(serviceWithTag, tokens, undefined, {})

        // Boosted score (with matching identity)
        const boostedResult = scoreServiceKeyword(serviceWithTag, tokens, undefined, {
            userContext: createContext({ identities: ["indigenous"] }),
        })

        expect(baseResult.score).toBeGreaterThan(0)
        expect(boostedResult.score).toBeGreaterThan(baseResult.score)
        expect(boostedResult.reasons.some((r) => r.includes("Identity Boost"))).toBe(true)
    })
})
