import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LanguageSwitcher from "@/components/layout/LanguageSwitcher"

// Mock dependencies
vi.mock("next-intl", () => ({
  useLocale: vi.fn(),
}))

vi.mock("@/i18n/routing", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}))

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/routing"

describe("LanguageSwitcher", () => {
  const mockUseLocale = vi.mocked(useLocale)
  const mockUsePathname = vi.mocked(usePathname)
  const mockUseRouter = vi.mocked(useRouter)

  const mockRouter = {
    replace: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
    mockUsePathname.mockReturnValue("/")
    mockUseLocale.mockReturnValue("en")
  })

  describe("Rendering", () => {
    it("should render language switcher button", () => {
      render(<LanguageSwitcher />)

      const button = screen.getByRole("button", { name: /select language/i })
      expect(button).toBeInTheDocument()
    })

    it("should have accessible label", () => {
      render(<LanguageSwitcher />)

      const button = screen.getByRole("button", { name: /select language/i })
      expect(button).toHaveAccessibleName("Select Language")
    })

    it("should display Languages icon", () => {
      const { container } = render(<LanguageSwitcher />)

      // Check for icon presence
      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
    })
  })

  describe("Language Selection", () => {
    it("should show all 7 supported locales when opened", async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      expect(screen.getByText("English")).toBeInTheDocument()
      expect(screen.getByText("Français (CA)")).toBeInTheDocument()
      expect(screen.getByText("中文")).toBeInTheDocument()
      expect(screen.getByText("العربية")).toBeInTheDocument()
      expect(screen.getByText("Português")).toBeInTheDocument()
      expect(screen.getByText("Español")).toBeInTheDocument()
      expect(screen.getByText("ਪੰਜਾਬੀ")).toBeInTheDocument()
    })

    it("should mark current locale with checkmark", async () => {
      const user = userEvent.setup()
      mockUseLocale.mockReturnValue("fr")

      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      // Find the French button
      const frenchButton = screen.getByText("Français (CA)").closest("button")
      expect(frenchButton).toBeInTheDocument()

      // Check for checkmark icon - the selected locale should have active styling
      expect(frenchButton).toHaveClass("bg-primary-50")

      // Verify the Check icon is present somewhere in the document
      // (Popover renders in portal, so use document instead of container)
      const allIcons = document.querySelectorAll("svg")
      expect(allIcons.length).toBeGreaterThanOrEqual(2)
    })

    it("should call router.replace when locale is changed", async () => {
      const user = userEvent.setup()
      mockUseLocale.mockReturnValue("en")
      mockUsePathname.mockReturnValue("/about")

      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      // Click on French
      const frenchButton = screen.getByText("Français (CA)")
      await user.click(frenchButton)

      expect(mockRouter.replace).toHaveBeenCalledWith("/about", { locale: "fr" })
    })

    it("should preserve pathname when changing language", async () => {
      const user = userEvent.setup()
      mockUseLocale.mockReturnValue("en")
      mockUsePathname.mockReturnValue("/dashboard/services")

      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      const spanishButton = screen.getByText("Español")
      await user.click(spanishButton)

      expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard/services", { locale: "es" })
    })
  })

  describe("Locale Options", () => {
    it("should display flags for each language", async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      // Flags are emojis/text, check they're present (getAllByText for duplicates)
      expect(screen.getAllByText("🇨🇦").length).toBeGreaterThanOrEqual(2) // English + French
      expect(screen.getByText("🇨🇳")).toBeInTheDocument() // Chinese
      expect(screen.getByText("🇸🇦")).toBeInTheDocument() // Arabic
      expect(screen.getByText("🇵🇹")).toBeInTheDocument() // Portuguese
      expect(screen.getByText("🇪🇸")).toBeInTheDocument() // Spanish
      expect(screen.getByText("🇮🇳")).toBeInTheDocument() // Punjabi
    })

    it("should set RTL direction for Arabic", async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      const arabicButton = screen.getByText("العربية").closest("button")
      expect(arabicButton).toHaveAttribute("dir", "rtl")
    })

    it("should not set dir attribute for LTR languages", async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      const englishButton = screen.getByText("English").closest("button")
      expect(englishButton).not.toHaveAttribute("dir")
    })
  })

  describe("Visual States", () => {
    it("should apply active styles to current locale", async () => {
      const user = userEvent.setup()
      mockUseLocale.mockReturnValue("zh-Hans")

      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      const chineseButton = screen.getByText("中文").closest("button")
      expect(chineseButton).toHaveClass("bg-primary-50")
    })

    it("should not apply active styles to non-current locales", async () => {
      const user = userEvent.setup()
      mockUseLocale.mockReturnValue("en")

      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      const frenchButton = screen.getByText("Français (CA)").closest("button")
      expect(frenchButton).not.toHaveClass("bg-primary-50")
    })
  })

  describe("Interaction", () => {
    it("should allow changing to French locale", async () => {
      const user = userEvent.setup()
      mockUseLocale.mockReturnValue("en")

      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      // Test changing to French
      const frenchButton = screen.getByText("Français (CA)")
      await user.click(frenchButton)
      expect(mockRouter.replace).toHaveBeenCalledWith("/", { locale: "fr" })
    })

    it("should allow changing to Chinese locale", async () => {
      const user = userEvent.setup()
      mockUseLocale.mockReturnValue("en")

      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      const chineseButton = screen.getByText("中文")
      await user.click(chineseButton)
      expect(mockRouter.replace).toHaveBeenCalledWith("/", { locale: "zh-Hans" })
    })
  })

  describe("Accessibility", () => {
    it("should have all language buttons accessible", async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })
      await user.click(triggerButton)

      const languageButtons = screen.getAllByRole("button").slice(1) // Exclude trigger
      expect(languageButtons.length).toBe(7)

      languageButtons.forEach((button) => {
        expect(button).toBeInTheDocument()
      })
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()
      render(<LanguageSwitcher />)

      const triggerButton = screen.getByRole("button", { name: /select language/i })

      // Focus and activate trigger
      await user.tab()
      expect(triggerButton).toHaveFocus()

      await user.keyboard("{Enter}")

      // Popover should be open
      expect(screen.getByText("English")).toBeVisible()
    })
  })
})
