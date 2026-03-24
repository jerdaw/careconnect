import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { seededIds } from "./helpers"

describe("DB-backed routes", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("serves public list and detail retrieval from the database", async () => {
    const { GET: listServices } = await import("@/app/api/v1/services/route")
    const { GET: getService } = await import("@/app/api/v1/services/[id]/route")

    const listRequest = new NextRequest("http://localhost/api/v1/services?q=food&limit=1&offset=0")
    const listResponse = await listServices(listRequest)
    const listBody = (await listResponse.json()) as { data: Array<{ id: string }>; meta: { total: number } }

    expect(listResponse.status).toBe(200)
    expect(listBody.data.map((service) => service.id)).toEqual([seededIds.food])
    expect(listBody.meta.total).toBe(1)
    expect(listResponse.headers.get("Cache-Control")).toContain("s-maxage=60")

    const detailRequest = new NextRequest(`http://localhost/api/v1/services/${seededIds.food}`)
    const detailResponse = await getService(detailRequest, { params: Promise.resolve({ id: seededIds.food }) })
    const detailBody = (await detailResponse.json()) as { data: { id: string } }

    expect(detailResponse.status).toBe(200)
    expect(detailBody.data.id).toBe(seededIds.food)
    expect(detailResponse.headers.get("Cache-Control")).toContain("s-maxage=300")

    const hiddenResponse = await getService(detailRequest, {
      params: Promise.resolve({ id: seededIds.hiddenDeleted }),
    })
    expect(hiddenResponse.status).toBe(404)

    const unpublishedResponse = await getService(detailRequest, {
      params: Promise.resolve({ id: seededIds.hiddenUnpublished }),
    })
    expect(unpublishedResponse.status).toBe(404)

    const missingResponse = await getService(detailRequest, {
      params: Promise.resolve({ id: "missing-service" }),
    })
    expect(missingResponse.status).toBe(404)

    const categoryListRequest = new NextRequest("http://localhost/api/v1/services?category=Housing&limit=10&offset=0")
    const categoryListResponse = await listServices(categoryListRequest)
    const categoryListBody = (await categoryListResponse.json()) as {
      data: Array<{ id: string }>
      meta: { total: number }
    }

    expect(categoryListResponse.status).toBe(200)
    expect(categoryListBody.data.map((service) => service.id)).toEqual([seededIds.housingFr])
    expect(categoryListBody.meta.total).toBe(1)
  })

  it("exports only public services and supports ETag short-circuiting", async () => {
    const { GET } = await import("@/app/api/v1/services/export/route")

    const exportRequest = new Request("http://localhost/api/v1/services/export")
    const exportResponse = await GET(exportRequest)
    const exportBody = (await exportResponse.json()) as {
      count: number
      services: Array<Record<string, unknown>>
      embeddings: Array<{ id: string; embedding: number[] }>
    }

    expect(exportResponse.status).toBe(200)
    expect(exportBody.count).toBe(3)
    expect(exportBody.services.map((service) => service.id).sort()).toEqual(
      [seededIds.crisis988, seededIds.food, seededIds.housingFr].sort()
    )
    expect(exportBody.services[0]).not.toHaveProperty("admin_notes")
    expect(exportBody.embeddings.map((item) => item.id).sort()).toEqual(
      [seededIds.crisis988, seededIds.food, seededIds.housingFr].sort()
    )

    const etag = exportResponse.headers.get("ETag")
    expect(etag).toBeTruthy()

    const cachedResponse = await GET(
      new Request("http://localhost/api/v1/services/export", {
        headers: {
          "If-None-Match": etag!,
        },
      })
    )
    expect(cachedResponse.status).toBe(304)
  })

  it("uses the DB-backed search candidate set and preserves retrieval safeguards", async () => {
    const { POST } = await import("@/app/api/v1/search/services/route")

    const englishSearch = await POST(
      new NextRequest("http://localhost/api/v1/search/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "food",
          locale: "en",
          filters: {},
          options: { limit: 10, offset: 0 },
        }),
      })
    )

    const englishBody = (await englishSearch.json()) as { data: Array<{ id: string }>; meta: { total: number } }
    expect(englishSearch.status).toBe(200)
    expect(englishBody.data.map((service) => service.id)).toContain(seededIds.food)
    expect(englishBody.data.map((service) => service.id)).not.toContain(seededIds.hiddenDraft)
    expect(englishSearch.headers.get("Cache-Control")).toBe("no-store")
    expect(englishBody.meta.total).toBeGreaterThanOrEqual(1)

    const frenchSearch = await POST(
      new NextRequest("http://localhost/api/v1/search/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "logement",
          locale: "fr",
          filters: {},
          options: { limit: 10, offset: 0 },
        }),
      })
    )
    const frenchBody = (await frenchSearch.json()) as { data: Array<{ id: string }> }
    expect(frenchBody.data.map((service) => service.id)).toContain(seededIds.housingFr)

    const categorySearch = await POST(
      new NextRequest("http://localhost/api/v1/search/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "",
          locale: "en",
          filters: { category: "Housing" },
          options: { limit: 1, offset: 0 },
        }),
      })
    )
    const categoryBody = (await categorySearch.json()) as {
      data: Array<{ id: string }>
      meta: { total: number; offset: number }
    }
    expect(categorySearch.status).toBe(200)
    expect(categoryBody.data.map((service) => service.id)).toEqual([seededIds.housingFr])
    expect(categoryBody.meta.total).toBe(1)
    expect(categoryBody.meta.offset).toBe(0)
    expect(categorySearch.headers.get("Cache-Control")).toBe("public, s-maxage=60")

    const crisisSearch = await POST(
      new NextRequest("http://localhost/api/v1/search/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "9-8-8",
          locale: "en",
          filters: {},
          options: { limit: 10, offset: 0 },
        }),
      })
    )
    const crisisBody = (await crisisSearch.json()) as { data: Array<{ id: string; scope: string }> }
    expect(crisisBody.data[0]).toEqual(
      expect.objectContaining({
        id: seededIds.crisis988,
        scope: "canada",
      })
    )
  })
})
