import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TranslationBanner } from "@/components/layout/TranslationBanner"

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: vi.fn(),
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      title: "Translation Notice",
      message: "This page uses AI-assisted translations.",
      dismiss: "Got it",
    }
    return translations[key] || key
  }),
}))

import { useLocale } from "next-intl"

describe("TranslationBanner", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("renders for EDIA locales (ar)", () => {
    vi.mocked(useLocale).mockReturnValue("ar")
    render(<TranslationBanner />)
    expect(screen.getByText("Translation Notice")).toBeInTheDocument()
  })

  it("renders for EDIA locales (zh-Hans)", () => {
    vi.mocked(useLocale).mockReturnValue("zh-Hans")
    render(<TranslationBanner />)
    expect(screen.getByText("Translation Notice")).toBeInTheDocument()
  })

  it("renders for EDIA locales (es)", () => {
    vi.mocked(useLocale).mockReturnValue("es")
    render(<TranslationBanner />)
    expect(screen.getByText("Translation Notice")).toBeInTheDocument()
  })

  it("does NOT render for English locale", () => {
    vi.mocked(useLocale).mockReturnValue("en")
    const { container } = render(<TranslationBanner />)
    expect(container.firstChild).toBeNull()
  })

  it("does NOT render for French locale", () => {
    vi.mocked(useLocale).mockReturnValue("fr")
    const { container } = render(<TranslationBanner />)
    expect(container.firstChild).toBeNull()
  })

  it("can be dismissed and stays dismissed", () => {
    vi.mocked(useLocale).mockReturnValue("ar")
    const { rerender } = render(<TranslationBanner />)
    
    // Find and click the dismiss button
    const dismissButton = screen.getByRole("button", { name: /got it/i })
    fireEvent.click(dismissButton)
    
    // Check localStorage was set
    expect(localStorage.getItem("kcc-translation-banner-dismissed")).toBe("true")
    
    // Re-render and check it doesn't show
    rerender(<TranslationBanner />)
    expect(screen.queryByText("Translation Notice")).not.toBeInTheDocument()
  })
})
