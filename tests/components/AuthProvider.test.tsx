import { render, screen, waitFor } from "@testing-library/react"
import { AuthProvider } from "@/components/AuthProvider"
import { describe, it, expect, vi } from "vitest"

// Hoist mocks to avoid reference error
const { mockGetSession, mockSubscribe } = vi.hoisted(() => {
    return {
        mockGetSession: vi.fn(),
        mockSubscribe: vi.fn()
    }
})

// Setup returns
mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
mockSubscribe.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

vi.mock("@/lib/supabase", () => ({
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
    })
}))

describe("AuthProvider Component", () => {
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
})
