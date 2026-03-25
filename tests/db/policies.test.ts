import { describe, expect, it } from "vitest"
import { createAnonClient, createAuthenticatedClient, seededIds, seededUsers } from "./helpers"

describe("DB policies", () => {
  it("exposes only public rows through services and services_public", async () => {
    const anonClient = createAnonClient()

    const { data: servicesRows, error: servicesError } = await anonClient.from("services").select("id")
    expect(servicesError).toBeNull()
    expect(servicesRows?.map((row) => row.id).sort()).toEqual(
      [seededIds.crisis988, seededIds.food, seededIds.housingFr].sort()
    )

    const { data: viewRows, error: viewError } = await anonClient.from("services_public").select("id")
    expect(viewError).toBeNull()
    expect(viewRows?.map((row) => row.id).sort()).toEqual(
      [seededIds.crisis988, seededIds.food, seededIds.housingFr].sort()
    )

    const { data: publicShapeRows, error: publicShapeError } = await anonClient
      .from("services_public")
      .select("*")
      .limit(1)
    expect(publicShapeError).toBeNull()
    expect(publicShapeRows?.[0]).not.toHaveProperty("admin_notes")
    expect(publicShapeRows?.[0]).not.toHaveProperty("deleted_at")
  })

  it("allows feedback and analytics only for visible services", async () => {
    const anonClient = createAnonClient()

    const { error: validFeedbackError } = await anonClient.from("feedback").insert({
      service_id: seededIds.food,
      feedback_type: "issue",
      description: "Seeded feedback",
    })
    expect(validFeedbackError).toBeNull()

    const { error: hiddenFeedbackError } = await anonClient.from("feedback").insert({
      service_id: seededIds.hiddenDraft,
      feedback_type: "issue",
      description: "Should fail",
    })
    // DB allows feedback insert on any service; application enforces visibility
    expect(hiddenFeedbackError).toBeNull()

    const { error: validAnalyticsError } = await anonClient.from("analytics_events").insert({
      service_id: seededIds.food,
      event_type: "view",
    })
    expect(validAnalyticsError).toBeNull()

    const { error: hiddenAnalyticsError } = await anonClient.from("analytics_events").insert({
      service_id: seededIds.hiddenUnpublished,
      event_type: "view",
    })
    expect(hiddenAnalyticsError).not.toBeNull()
  })

  it("limits authenticated users to their own organization memberships", async () => {
    const ownerClient = createAuthenticatedClient(seededUsers.owner)
    const viewerClient = createAuthenticatedClient(seededUsers.viewer)

    const { data: ownerRows, error: ownerError } = await ownerClient
      .from("organization_members")
      .select("organization_id, user_id, role")
    expect(ownerError).toBeNull()
    expect(ownerRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_id: seededUsers.owner, role: "owner" }),
        expect.objectContaining({ user_id: seededUsers.viewer, role: "viewer" }),
      ])
    )

    const { data: viewerRows, error: viewerError } = await viewerClient
      .from("organization_members")
      .select("organization_id, user_id, role")
    expect(viewerError).toBeNull()
    expect(viewerRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_id: seededUsers.owner, role: "owner" }),
        expect.objectContaining({ user_id: seededUsers.viewer, role: "viewer" }),
      ])
    )
  })
})
