import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useServiceFeedback } from "@/hooks/useServiceFeedback"
import { supabase } from "@/lib/supabase"

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe("useServiceFeedback", () => {
  const serviceId = "svc-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("initializes with loading state", () => {
    const { result } = renderHook(() => useServiceFeedback(serviceId))
    expect(result.current.loading).toBe(true)
    expect(result.current.stats).toBe(null)
  })

  it("fetches stats successfully", async () => {
    const mockData = {
      service_id: serviceId,
      helpful_yes_count: 10,
      helpful_no_count: 2,
      open_issues_count: 1,
      last_feedback_at: "2026-01-01T00:00:00Z",
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null })
    ;(supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }))

    const { result } = renderHook(() => useServiceFeedback(serviceId))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stats).toEqual(mockData)
    expect(result.current.helpfulPercentage).toBe(83)
    expect(result.current.totalVotes).toBe(12)
  })

  it("handles missing stats (PGRST116) by returning zeros", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "Not found" },
    })
    ;(supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }))

    const { result } = renderHook(() => useServiceFeedback(serviceId))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stats).toEqual({
      helpful_yes_count: 0,
      helpful_no_count: 0,
      open_issues_count: 0,
      last_feedback_at: null,
    })
    expect(result.current.helpfulPercentage).toBe(null)
  })

  it("handles errors", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "500", message: "Database error" },
    })
    ;(supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }))

    const { result } = renderHook(() => useServiceFeedback(serviceId))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeDefined()
    expect(result.current.stats).toBe(null)
  })
})
