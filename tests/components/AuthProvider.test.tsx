import { render, screen, waitFor } from "@testing-library/react"
import { AuthProvider } from "@/components/layout/AuthProvider"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Hoist mocks to avoid reference error
const { mockGetSession, mockHasSupabaseCredentials, mockSubscribe } = vi.hoisted(() => {
  return {
    mockGetSession: vi.fn(),
    mockSubscribe: vi.fn(),
    mockHasSupabaseCredentials: vi.fn(),
  }
})

// Setup returns
mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
mockSubscribe.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
mockHasSupabaseCredentials.mockReturnValue(true)

vi.mock("@/lib/supabase", () => ({
  hasSupabaseCredentials: mockHasSupabaseCredentials,
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockSubscribe,
      signOut: vi.fn(),
    },
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe("AuthProvider Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSubscribe.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    mockHasSupabaseCredentials.mockReturnValue(true)
  })

  it("renders children", async () => {
    render(
      <AuthProvider>
        <div>Child Content</div>
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByText("Child Content")).toBeInTheDocument())
  })

  it("initializes supabase auth listener", async () => {
    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )
    await waitFor(() => expect(mockGetSession).toHaveBeenCalled())
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it("skips auth bootstrap when Supabase is not configured", async () => {
    mockHasSupabaseCredentials.mockReturnValue(false)

    render(
      <AuthProvider>
        <div>Child Content</div>
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByText("Child Content")).toBeInTheDocument())
    expect(mockGetSession).not.toHaveBeenCalled()
    expect(mockSubscribe).not.toHaveBeenCalled()
  })
})
