import { describe, expect, it } from "vitest"
import { insertContactAttempt } from "@/lib/pilot/storage"
import {
  createAuthenticatedClient,
  createServiceRoleClient,
  seededIds,
  seededOrganizations,
  seededUsers,
} from "./helpers"

const replayEventId = "33333333-3333-4333-8333-333333333333"
const replayPayload = {
  id: replayEventId,
  pilot_cycle_id: "db-pilot-replay-evidence",
  service_id: seededIds.food,
  recorded_by_org_id: seededOrganizations.primary,
  entity_key_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  attempt_channel: "phone" as const,
  attempt_outcome: "no_response" as const,
  attempted_at: "2026-07-10T16:00:00.000Z",
}

describe("pilot replay persistence", () => {
  it("atomically suppresses concurrent supplied-ID contact attempt retries", async () => {
    const serviceClient = createServiceRoleClient()
    const ownerClient = createAuthenticatedClient(seededUsers.owner)
    const cleanupReplayEvent = async () => {
      const { error } = await serviceClient.from("pilot_contact_attempt_events").delete().eq("id", replayEventId)
      if (error) throw new Error(`Failed to clean up pilot replay fixture: ${error.message}`)
    }

    await cleanupReplayEvent()

    try {
      const writes = await Promise.all([
        insertContactAttempt(ownerClient, replayPayload),
        insertContactAttempt(ownerClient, replayPayload),
      ])
      const successfulWrites = writes.filter((result) => !result.duplicate)
      const duplicateWrites = writes.filter((result) => result.duplicate)
      const persisted = await serviceClient.from("pilot_contact_attempt_events").select("id").eq("id", replayEventId)

      expect(successfulWrites).toHaveLength(1)
      expect(successfulWrites[0]).toMatchObject({
        data: { id: replayEventId },
        duplicate: false,
        error: null,
        missingTable: false,
      })
      expect(duplicateWrites).toEqual([
        {
          data: null,
          duplicate: true,
          error: null,
          missingTable: false,
        },
      ])
      expect(persisted.error).toBeNull()
      expect(persisted.data).toEqual([{ id: replayEventId }])
    } finally {
      await cleanupReplayEvent()
    }
  })
})
