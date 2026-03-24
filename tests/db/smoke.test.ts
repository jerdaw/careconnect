import { describe, expect, it } from "vitest"
import { createAnonClient, createServiceRoleClient, seededIds } from "./helpers"

describe("DB smoke", () => {
  it("boots the seeded local Supabase stack", async () => {
    const serviceClient = createServiceRoleClient()
    const anonClient = createAnonClient()

    const { data: seededRows, error: seedError } = await serviceClient.from("services").select("id")
    expect(seedError).toBeNull()
    expect(seededRows?.length).toBe(6)

    const { data: publicRows, error: publicError } = await anonClient.from("services_public").select("id")
    expect(publicError).toBeNull()
    expect(publicRows?.map((row) => row.id).sort()).toEqual(
      [seededIds.crisis988, seededIds.food, seededIds.housingFr].sort()
    )
  })
})
