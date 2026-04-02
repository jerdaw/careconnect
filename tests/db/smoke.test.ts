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

  it("exposes the extended pilot metric source tables and contact-attempt entity hash column", async () => {
    const serviceClient = createServiceRoleClient()

    const contactAttempts = await serviceClient
      .from("pilot_contact_attempt_events")
      .select("id, entity_key_hash")
      .limit(1)
    const connections = await serviceClient.from("pilot_connection_events").select("id").limit(1)
    const scope = await serviceClient.from("pilot_service_scope").select("id").limit(1)
    const statusEvents = await serviceClient.from("service_operational_status_events").select("id").limit(1)
    const dataDecayAudits = await serviceClient.from("pilot_data_decay_audits").select("id").limit(1)
    const preferenceFit = await serviceClient.from("pilot_preference_fit_events").select("id").limit(1)

    expect(contactAttempts.error).toBeNull()
    expect(connections.error).toBeNull()
    expect(scope.error).toBeNull()
    expect(statusEvents.error).toBeNull()
    expect(dataDecayAudits.error).toBeNull()
    expect(preferenceFit.error).toBeNull()
  })
})
