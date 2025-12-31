import { describe, it, expect, vi, beforeEach } from "vitest"
import { searchServices } from "@/lib/search"
import { Service, VerificationLevel, IntentCategory } from "@/types/service"

// Mock the data loader
vi.mock("@/lib/search/data", () => ({
  loadServices: vi.fn(),
}))

import { loadServices } from "@/lib/search/data"

const mockServices: Service[] = [
  {
    id: "ams-food-bank-queens",
    name: "AMS Food Bank (Queen's)",
    description: "Food bank for students.",
    verification_level: VerificationLevel.L1,
    intent_category: IntentCategory.Food,
    eligibility_notes: "Students",
    identity_tags: [],
    synthetic_queries: ["im hungry"],
  } as any,
  {
    id: "amhs-kfla-crisis-line",
    name: "AMHS-KFLA Crisis Line",
    description: "24/7 crisis support.",
    verification_level: VerificationLevel.L1,
    intent_category: IntentCategory.Crisis,
    eligibility_notes: "",
    identity_tags: [],
    synthetic_queries: ["suicide", "kill myself"],
  } as any,
  {
    id: "kingston-youth-shelter",
    name: "Kingston Youth Shelter",
    description: "Emergency shelter for youth.",
    verification_level: VerificationLevel.L1,
    intent_category: IntentCategory.Housing,
    eligibility_notes: "Youth 16-24",
    identity_tags: [],
    synthetic_queries: ["sleep", "homeless"],
  } as any,
]

describe("Search Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
      ; (loadServices as any).mockResolvedValue(mockServices)
  })

  it('should return Food Banks for "hungry"', async () => {
    const results = await searchServices("I am hungry")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.service.id).toBe("ams-food-bank-queens")
  })

  it('should return Crisis Lines for "kill myself"', async () => {
    const results = await searchServices("I want to kill myself")
    // Should be boosted to top by crisis detection
    const topResult = results[0]
    expect(topResult?.service.id).toBe("amhs-kfla-crisis-line")
    expect(topResult?.matchReasons).toContain("Crisis Detected (Safety Boost)")
  })

  it('should return Housing options for "sleep"', async () => {
    const results = await searchServices("Where can I sleep")
    const shelter = results.find((r) => r.service.id === "kingston-youth-shelter")
    expect(shelter).toBeDefined()
  })

  it('should return Queen\'s specific services for "queens"', async () => {
    const results = await searchServices("Queen's")
    const qsService = results.find((r) => r.service.id === "ams-food-bank-queens")
    expect(qsService).toBeDefined()
  })

  it("should return nothing for nonsense queries", async () => {
    const results = await searchServices("xyz123foobar")
    expect(results.length).toBe(0)
  })
})
