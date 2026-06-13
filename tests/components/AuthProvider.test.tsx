import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/components/layout/AuthProvider"
import { PILOT_DRAFT_STORAGE_PREFIX } from "@/lib/offline/pilot-draft-cleanup"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Hoist mocks to avoid reference error
const { mockGetSession, mockHasSupabaseCredentials, mockSignOut, mockSubscribe } = vi.hoisted(() => {
  return {
    mockGetSession: vi.fn(),
    mockSubscribe: vi.fn(),
    mockSignOut: vi.fn(),
    mockHasSupabaseCredentials: vi.fn(),
  }
})

// Setup returns
mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
mockSubscribe.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
mockSignOut.mockResolvedValue({ error: null })
mockHasSupabaseCredentials.mockReturnValue(true)

vi.mock("@/lib/supabase", () => ({
  hasSupabaseCredentials: mockHasSupabaseCredentials,
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockSubscribe,
      signOut: mockSignOut,
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

function SignOutButton() {
  const { signOut } = useAuth()
  return <button onClick={() => void signOut()}>Sign out</button>
}

describe("AuthProvider Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSubscribe.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    mockSignOut.mockResolvedValue({ error: null })
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

  it("clears reserved pilot draft storage during sign out", async () => {
    const draftKey = `${PILOT_DRAFT_STORAGE_PREFIX}contact-attempt`
    localStorage.setItem(draftKey, "{}")
    localStorage.setItem("careconnect-high-contrast", "true")

    render(
      <AuthProvider>
        <SignOutButton />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText("Sign out"))

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
    expect(localStorage.getItem(draftKey)).toBeNull()
    expect(localStorage.getItem("careconnect-high-contrast")).toBe("true")
  })
})
