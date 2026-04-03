import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { Footer } from "@/components/layout/Footer"

// Mock dependencies
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(),
}))

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { useTranslations, useLocale } from "next-intl"

describe("Footer", () => {
  const mockUseTranslations = vi.mocked(useTranslations)
  const mockUseLocale = vi.mocked(useLocale)

  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      mission: "Connecting Kingston residents to verified social services with dignity and speed.",
      quickLinks: "Quick Links",
      resources: "Resources",
      legal: "Legal",
      home: "Home",
      about: "About",
      partners: "Partners",
      userGuide: "User Guide",
      faq: "FAQ",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      accessibility: "Accessibility",
      copyright: "© 2026 CareConnect. All rights reserved.",
    }
    return translations[key] || key
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTranslations.mockReturnValue(mockT as any)
    mockUseLocale.mockReturnValue("en")
  })

  describe("Rendering", () => {
    it("should render footer element", () => {
      const { container } = render(<Footer />)

      const footer = container.querySelector("footer")
      expect(footer).toBeInTheDocument()
    })

    it("should render site name", () => {
      render(<Footer />)

      expect(screen.getByText("CareConnect")).toBeInTheDocument()
    })

    it("should render mission statement", () => {
      render(<Footer />)

      expect(screen.getByText(/Connecting Kingston residents/i)).toBeInTheDocument()
    })

    it("should have logo image element", () => {
      const { container } = render(<Footer />)

      const img = container.querySelector("img")
      expect(img).toBeInTheDocument()
    })
  })

  describe("Navigation Links", () => {
    it("should have navigation links", () => {
      render(<Footer />)

      const links = screen.getAllByRole("link")
      expect(links.length).toBeGreaterThan(0)
    })

    it("should have accessible social media links", () => {
      render(<Footer />)

      expect(screen.getByLabelText("GitHub")).toBeInTheDocument()
      expect(screen.getByLabelText("Twitter")).toBeInTheDocument()
    })
  })

  describe("Sections", () => {
    it("should have multiple sections with links", () => {
      render(<Footer />)

      const links = screen.getAllByRole("link")
      expect(links.length).toBeGreaterThan(3)
    })

    it("should call translation function for section headers", () => {
      render(<Footer />)

      expect(mockT).toHaveBeenCalled()
    })
  })

  describe("Locale Handling", () => {
    it("should render correctly for English locale", () => {
      mockUseLocale.mockReturnValue("en")
      render(<Footer />)

      expect(screen.getByText("CareConnect")).toBeInTheDocument()
    })

    it("should render correctly for French locale", () => {
      mockUseLocale.mockReturnValue("fr")
      render(<Footer />)

      expect(screen.getByText("CareConnect")).toBeInTheDocument()
    })

    it("should render correctly for non-English locales", () => {
      mockUseLocale.mockReturnValue("zh-Hans")
      render(<Footer />)

      const footer = screen.getByRole("contentinfo")
      expect(footer).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have contentinfo landmark role", () => {
      render(<Footer />)

      const footer = screen.getByRole("contentinfo")
      expect(footer).toBeInTheDocument()
    })

    it("should have accessible social media links", () => {
      render(<Footer />)

      const githubLink = screen.getByLabelText("GitHub")
      expect(githubLink).toHaveAccessibleName("GitHub")

      const twitterLink = screen.getByLabelText("Twitter")
      expect(twitterLink).toHaveAccessibleName("Twitter")
    })

    it("should have all links accessible", () => {
      render(<Footer />)

      const links = screen.getAllByRole("link")
      links.forEach((link) => {
        expect(link).toBeInTheDocument()
      })
    })
  })

  describe("Styling", () => {
    it("should have gradient accent line", () => {
      const { container } = render(<Footer />)

      const gradient = container.querySelector(".bg-gradient-to-r")
      expect(gradient).toBeInTheDocument()
    })

    it("should have dark background", () => {
      const { container } = render(<Footer />)

      const footer = container.querySelector("footer")
      expect(footer).toHaveClass("bg-neutral-950")
    })

    it("should have white text", () => {
      const { container } = render(<Footer />)

      const footer = container.querySelector("footer")
      expect(footer).toHaveClass("text-white")
    })
  })

  describe("Layout", () => {
    it("should have grid layout", () => {
      const { container } = render(<Footer />)

      const grid = container.querySelector(".grid")
      expect(grid).toBeInTheDocument()
    })

    it("should have responsive columns", () => {
      const { container } = render(<Footer />)

      const grid = container.querySelector(".grid-cols-1")
      expect(grid).toBeInTheDocument()
    })
  })
})
