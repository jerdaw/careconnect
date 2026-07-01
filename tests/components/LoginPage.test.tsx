import type { ReactNode } from "react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import enMessages from "@/messages/en.json"
import LoginPage from "@/app/[locale]/login/page"
import { renderWithProviders, screen, waitFor } from "@/tests/utils/test-wrapper"
import { hasSupabaseCredentials, supabase } from "@/lib/supabase"

const mockSearchParams = vi.hoisted(() => new URLSearchParams())

vi.mock("@/components/layout/Header", () => ({
  Header: () => <header data-testid="login-header" />,
}))

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="login-footer" />,
}))

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}))

vi.mock("@/lib/supabase", () => ({
  hasSupabaseCredentials: vi.fn(() => false),
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
    },
  },
}))

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.delete("next")
    vi.mocked(hasSupabaseCredentials).mockReturnValue(false)
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null })
  })

  it("centers the email icon inside the email input", () => {
    const { container } = renderWithProviders(<LoginPage />, { messages: enMessages })

    const emailInput = screen.getByLabelText(/Email address/)
    const mailIcon = emailInput.parentElement?.querySelector(".lucide-mail")
    const iconWrapper = mailIcon?.parentElement

    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveClass("h-12")
    expect(emailInput).toHaveClass("pl-12")
    expect(mailIcon).toBeInTheDocument()
    expect(iconWrapper).toHaveClass("absolute")
    expect(iconWrapper).toHaveClass("top-1/2")
    expect(iconWrapper).toHaveClass("-translate-y-1/2")
    expect(container.querySelector(".-mt-12")).not.toBeInTheDocument()
  })

  it("renders the polished partner access layout and localized unavailable state", () => {
    renderWithProviders(<LoginPage />, { messages: enMessages })

    expect(screen.getByText("Partner access")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Access stays focused" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Sign in with email" })).toBeInTheDocument()
    expect(screen.getByText("Sign-in is unavailable on this deployment.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Sign in with Email/ })).toBeDisabled()
  })

  it("submits a configured magic-link request and shows localized success copy", async () => {
    const user = userEvent.setup()
    vi.mocked(hasSupabaseCredentials).mockReturnValue(true)
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null })

    renderWithProviders(<LoginPage />, { messages: enMessages })

    await user.type(screen.getByLabelText(/Email address/), "partner@example.org")
    await user.click(screen.getByRole("button", { name: /Sign in with Email/ }))

    await waitFor(() => {
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "partner@example.org",
        options: {
          emailRedirectTo: "https://careconnect.ing/en/auth/callback?next=%2Fen%2Fdashboard",
        },
      })
    })
    expect(screen.getByText("Magic link sent! Check your email to sign in.")).toBeInTheDocument()
  })

  it("preserves a safe next path in the magic-link callback URL", async () => {
    const user = userEvent.setup()
    mockSearchParams.set("next", "/en/admin")
    vi.mocked(hasSupabaseCredentials).mockReturnValue(true)
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null })

    renderWithProviders(<LoginPage />, { messages: enMessages })

    await user.type(screen.getByLabelText(/Email address/), "partner@example.org")
    await user.click(screen.getByRole("button", { name: /Sign in with Email/ }))

    await waitFor(() => {
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "partner@example.org",
        options: {
          emailRedirectTo: "https://careconnect.ing/en/auth/callback?next=%2Fen%2Fadmin",
        },
      })
    })
  })

  it("falls back to the public dashboard when next is an absolute internal URL", async () => {
    const user = userEvent.setup()
    mockSearchParams.set("next", "http://0.0.0.0:3000/en/admin")
    vi.mocked(hasSupabaseCredentials).mockReturnValue(true)
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null })

    renderWithProviders(<LoginPage />, { messages: enMessages })

    await user.type(screen.getByLabelText(/Email address/), "partner@example.org")
    await user.click(screen.getByRole("button", { name: /Sign in with Email/ }))

    await waitFor(() => {
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "partner@example.org",
        options: {
          emailRedirectTo: "https://careconnect.ing/en/auth/callback?next=%2Fen%2Fdashboard",
        },
      })
    })
  })

  it("does not pass protocol-relative next paths into the magic-link callback URL", async () => {
    const user = userEvent.setup()
    mockSearchParams.set("next", "//evil.example/en/admin")
    vi.mocked(hasSupabaseCredentials).mockReturnValue(true)
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null })

    renderWithProviders(<LoginPage />, { messages: enMessages })

    await user.type(screen.getByLabelText(/Email address/), "partner@example.org")
    await user.click(screen.getByRole("button", { name: /Sign in with Email/ }))

    await waitFor(() => {
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "partner@example.org",
        options: {
          emailRedirectTo: "https://careconnect.ing/en/auth/callback?next=%2Fen%2Fdashboard",
        },
      })
    })
  })

  it("routes the new-partner CTA to the existing reference sources page", () => {
    renderWithProviders(<LoginPage />, { messages: enMessages })

    const partnerCta = screen.getByRole("link", { name: "Learn how source review works" })

    expect(partnerCta).toHaveAttribute("href", "/about/partners")
    expect(partnerCta).not.toHaveAttribute("href", "/contact")
  })
})
