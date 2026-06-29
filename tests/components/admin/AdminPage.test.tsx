import { waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AdminPage from "@/app/[locale]/admin/page"
import enMessages from "@/messages/en.json"
import { renderWithProviders, screen } from "@/tests/utils/test-wrapper"

const service = {
  id: "service-1",
  name: "Test Service",
  description: "A test service",
  url: "https://example.com",
  phone: "555-0100",
  address: "1 Test Street",
  intent_category: "Food",
  verification_level: "L1",
  synthetic_queries: ["food help", "meal support"],
  identity_tags: [],
  provenance: {
    verified_by: "test",
    verified_at: "2026-06-29T00:00:00Z",
    evidence_url: "https://example.com",
    method: "test",
  },
}

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders services from the standard API response envelope", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { services: [service] } }),
    } as Response)

    renderWithProviders(<AdminPage />, { messages: enMessages })

    await waitFor(() => {
      expect(screen.getByText("Test Service")).toBeInTheDocument()
    })
  })

  it("keeps compatibility with a direct services payload", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ services: [service] }),
    } as Response)

    renderWithProviders(<AdminPage />, { messages: enMessages })

    await waitFor(() => {
      expect(screen.getByText("Test Service")).toBeInTheDocument()
    })
  })
})
