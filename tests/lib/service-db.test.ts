import { describe, expect, it } from "vitest"
import {
  mapServicePayloadToUpdate,
  mapServiceRowToService,
  mapServiceToDatabaseUpdate,
  type ServiceRow,
} from "@/lib/service-db"

describe("service-db coverage mapping", () => {
  it("maps coverage and primary place from DB rows", () => {
    const mapped = mapServiceRowToService({
      id: "svc",
      name: "Service",
      description: "Description",
      verification_status: "L1",
      category: "Community",
      tags: [],
      scope: "kingston",
      published: true,
      primary_place_id: "brampton-on",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    } as Partial<ServiceRow> as ServiceRow)

    expect(mapped.primary_place_id).toBe("brampton-on")
    expect(mapped.coverage).toEqual([{ kind: "local", placeIds: ["brampton-on"] }])
  })

  it("writes coverage and primary place into database updates", () => {
    expect(
      mapServiceToDatabaseUpdate({
        primary_place_id: "brampton-on",
        coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
      })
    ).toEqual({
      primary_place_id: "brampton-on",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    })
  })

  it("accepts payload coverage and primary place", () => {
    expect(
      mapServicePayloadToUpdate({
        primary_place_id: "brampton-on",
        coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
      })
    ).toEqual({
      primary_place_id: "brampton-on",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    })
  })
})
