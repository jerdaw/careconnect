import { describe, it, expect } from "vitest"
import { checkEligibility, parseEligibility } from "../../lib/eligibility/checker"
import { Service } from "../../types/service"
import { UserContext } from "../../types/user-context"

const MOCK_SERVICE: Service = {
  id: "test",
  name: "Test Service",
  description: "Test",
  url: "http://test.com",
  verification_level: "L1",
  intent_category: "Food",
  provenance: {} as any,
  identity_tags: [],
  synthetic_queries: [],
  eligibility_notes: "",
  verified_date: new Date().toISOString(),
} as any

const MOCK_USER: UserContext = {
  hasOptedIn: true,
  ageGroup: null,
  identities: [],
}

describe("Eligibility Checker", () => {
  describe("parseEligibility", () => {
    it("parses age ranges", () => {
      const result = parseEligibility("Ages 18-29")
      expect(result.minAge).toBe(18)
      expect(result.maxAge).toBe(29)
    })

    it("parses single keywords", () => {
      const result = parseEligibility("Youth only")
      expect(result.maxAge).toBe(29)
    })

    it("parses identities", () => {
      const result = parseEligibility("Must be Indigenous or First Nations")
      expect(result.requiredIdentities).toContain("indigenous")
    })
  })

  describe("checkEligibility", () => {
    it("returns unknown if user not opted in", () => {
      const result = checkEligibility(MOCK_SERVICE, { ...MOCK_USER, hasOptedIn: false })
      expect(result).toBe("unknown")
    })

    it("returns unknown if service has no notes", () => {
      const result = checkEligibility({ ...MOCK_SERVICE, eligibility_notes: "" }, MOCK_USER)
      expect(result).toBe("unknown")
    })

    it("returns eligible if no restrictions", () => {
      const result = checkEligibility({ ...MOCK_SERVICE, eligibility_notes: "Open to all" }, MOCK_USER)
      expect(result).toBe("eligible")
    })

    it("returns ineligible if age mismatch", () => {
      const service = { ...MOCK_SERVICE, eligibility_notes: "Ages 18-29" }
      const result = checkEligibility(service, { ...MOCK_USER, ageGroup: "senior" }) // Senior is 55+
      expect(result).toBe("ineligible")
    })

    it("returns eligible if age matches", () => {
      const service = { ...MOCK_SERVICE, eligibility_notes: "Ages 55+" }
      const result = checkEligibility(service, { ...MOCK_USER, ageGroup: "senior" })
      expect(result).toBe("eligible")
    })

    it("returns ineligible if identity missing", () => {
      const service = { ...MOCK_SERVICE, eligibility_notes: "Indigenous peoples only" }
      const result = checkEligibility(service, { ...MOCK_USER, identities: [] })
      expect(result).toBe("ineligible")
    })

    it("returns eligible if identity present", () => {
      const service = { ...MOCK_SERVICE, eligibility_notes: "Indigenous peoples only" }
      const result = checkEligibility(service, { ...MOCK_USER, identities: ["indigenous"] })
      expect(result).toBe("eligible")
    })
  })
})
