import { describe, it, expect } from "vitest"
import { parseEligibility, checkEligibility } from "@/lib/eligibility/checker"
import type { UserContext } from "@/types/user-context"
import type { Service } from "@/types/service"

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
    const createService = (notes: string): Service => ({
        id: "test",
        name: "Test Service",
        description: "Test",
        verification_level: "L1",
        intent_category: "Other",
        eligibility_notes: notes,
    }) as unknown as Service

    const createContext = (overrides: Partial<UserContext> = {}): UserContext => ({
        ageGroup: null,
        identities: [],
        hasOptedIn: true,
        ...overrides,
    })

    it("returns 'unknown' when user has not opted in", () => {
        const service = createService("Ages 18-29")
        const context = createContext({ hasOptedIn: false })
        expect(checkEligibility(service, context)).toBe("unknown")
    })

    it("returns 'unknown' when no eligibility notes", () => {
        const service = createService("")
        service.eligibility_notes = undefined as any
        const context = createContext()
        expect(checkEligibility(service, context)).toBe("unknown")
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
