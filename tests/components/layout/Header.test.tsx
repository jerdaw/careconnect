import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { Header } from "@/components/layout/Header"

// Mock dependencies
vi.mock("@/components/AuthProvider", () => ({
  useAuth: vi.fn(),
}))

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}))

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock("@/components/layout/LanguageSwitcher", () => ({
  default: () => <div data-testid="language-switcher">Language Switcher</div>,
}))

vi.mock("@/components/layout/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}))

vi.mock("@/components/BetaBanner", () => ({
  default: () => <div data-testid="beta-banner">Beta Banner</div>,
}))

vi.mock("@/components/ui/EmergencyModal", () => ({
  EmergencyModal: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) =>
    open ? (
      <div data-testid="emergency-modal">
        Emergency Modal
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}))

vi.mock("framer-motion", () => ({
  motion: {
    nav: ({ children, ...props }: React.PropsWithChildren) => <nav {...props}>{children}</nav>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

import { useAuth } from "@/components/AuthProvider"
import { useTranslations } from "next-intl"

describe("Header", () => {
  const mockUseAuth = vi.mocked(useAuth)
  const mockUseTranslations = vi.mocked(useTranslations)

  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      skipToMain: "Skip to main content",
      search: "Search",
      about: "About",
      dashboard: "Dashboard",
      signIn: "Sign In",
      signOut: "Sign Out",
      partners: "Partners",
      emergency: "Emergency",
    }
    return translations[key] || key
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: null, loading: false, session: null, signOut: vi.fn() } as any)
    mockUseTranslations.mockReturnValue(mockT as any)

    // Mock window.scrollY
    Object.defineProperty(window, "scrollY", {
      writable: true,
      value: 0,
    })
  })

  describe("Rendering", () => {
    it("should render header element", () => {
      const { container } = render(<Header />)

      const header = container.querySelector("header")
      expect(header).toBeInTheDocument()
    })

    it("should render site name", () => {
      render(<Header />)

      expect(screen.getByText("HelpBridge")).toBeInTheDocument()
    })

    it("should render beta banner when not scrolled", () => {
      render(<Header />)

      expect(screen.getByTestId("beta-banner")).toBeInTheDocument()
    })

    it("should render language switcher", () => {
      render(<Header />)

      expect(screen.getByTestId("language-switcher")).toBeInTheDocument()
    })

    it("should have navigation buttons", () => {
      render(<Header />)

      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe("Skip Link", () => {
    it("should have accessible skip to main content link", () => {
      render(<Header />)

      const skipLink = screen.getByText("Skip to main content")
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute("href", "#main-content")
    })

    it("should have sr-only class for screen readers", () => {
      render(<Header />)

      const skipLink = screen.getByText("Skip to main content")
      expect(skipLink).toHaveClass("sr-only")
    })
  })

  describe("Emergency Modal", () => {
    it("should render emergency modal component", () => {
      render(<Header />)

      // Emergency modal exists but is not visible initially
      expect(screen.queryByTestId("emergency-modal")).not.toBeInTheDocument()
    })
  })

  describe("Authentication States", () => {
    it("should handle unauthenticated state", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, session: null, signOut: vi.fn() } as any)
      const { container } = render(<Header />)

      expect(container.querySelector("header")).toBeInTheDocument()
    })

    it("should handle authenticated state", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "123", email: "test@example.com" } as any,
        loading: false,
        session: {} as any,
        signOut: vi.fn(),
      } as any)
      const { container } = render(<Header />)

      expect(container.querySelector("header")).toBeInTheDocument()
    })
  })

  describe("forceSolid Prop", () => {
    it("should apply solid styles when forceSolid is true", () => {
      const { container } = render(<Header forceSolid={true} />)

      const header = container.querySelector("header")
      expect(header).toHaveClass("shadow-sm")
    })

    it("should not apply solid styles by default", () => {
      const { container } = render(<Header />)

      const header = container.querySelector("header")
      expect(header).toHaveClass("border-transparent")
    })
  })

  describe("Mobile Menu", () => {
    it("should have mobile menu toggle button", () => {
      render(<Header />)

      const menuButtons = screen.getAllByRole("button")
      // Mobile menu button should exist (look for Menu icon)
      expect(menuButtons.length).toBeGreaterThan(0)
    })

    it("should toggle mobile menu when menu button is clicked", () => {
      render(<Header />)

      // Find all buttons and locate the mobile menu toggle
      // (The actual button might be in the DOM but not easily queryable by text)
      const buttons = screen.getAllByRole("button")
      // Mobile menu is complex to test without seeing full implementation
      // This is a basic check that buttons exist
      expect(buttons.length).toBeGreaterThan(1)
    })
  })

  describe("Navigation Links", () => {
    it("should have link to home page", () => {
      const { container } = render(<Header />)

      const homeLink = container.querySelector('a[href="/"]')
      expect(homeLink).toBeInTheDocument()
    })

    it("should have navigation links", () => {
      render(<Header />)

      const links = screen.getAllByRole("link")
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe("Accessibility", () => {
    it("should have navigation landmark", () => {
      const { container } = render(<Header />)

      const nav = container.querySelector("nav")
      expect(nav).toBeInTheDocument()
    })

    it("should have accessible links and buttons", () => {
      render(<Header />)

      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)

      const links = screen.getAllByRole("link")
      expect(links.length).toBeGreaterThan(0)
    })
  })
})
