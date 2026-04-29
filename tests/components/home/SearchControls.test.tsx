import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SearchControls from "@/components/home/SearchControls"
import { IntentCategory } from "@/types/service"

// Mock dependencies
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}))

vi.mock("@/components/settings", () => ({
  ProfileSettings: () => <button data-testid="profile-settings">Profile</button>,
}))

import { useTranslations } from "next-intl"

describe("SearchControls", () => {
  const mockUseTranslations = vi.mocked(useTranslations)
  const mockToggleLocation = vi.fn()
  const mockSetCategory = vi.fn()
  const mockSetOpenNow = vi.fn()

  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      openNow: "Open Now",
      nearMe: "Near Me",
      useLocation: "Use Location",
      clearLocation: "Clear Location",
      filterByLocation: "Filter by Location",
      label: "Filter by category",
      utilityFilters: "Utility filters",
      categoryFilters: "Filter by category",
      all: "All",
      crisis: "Crisis",
      food: "Food",
      housing: "Housing",
      health: "Health",
      financial: "Financial",
      legal: "Legal",
      education: "Education",
      transport: "Transport",
      employment: "Employment",
      wellness: "Wellness",
      community: "Community",
      indigenous: "Indigenous",
    }
    return translations[key] || key
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTranslations.mockReturnValue(mockT as any)
  })

  describe("Rendering", () => {
    it("should render all control buttons", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      expect(screen.getByRole("button", { name: /open now/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /filter by location/i })).toBeInTheDocument()
      expect(screen.getByTestId("profile-settings")).toBeInTheDocument()
    })

    it("should render all category buttons", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Crisis" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Food" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Housing" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Health" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Financial" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Legal" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Education" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Transport" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Employment" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Wellness" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Community" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Indigenous" })).toBeInTheDocument()
    })

    it("should show loading state when locating", () => {
      const { container } = render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={true}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const spinner = container.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })
  })

  describe("Open Now Toggle", () => {
    it("should call setOpenNow when clicked", async () => {
      const user = userEvent.setup()
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const openNowButton = screen.getByRole("button", { name: /open now/i })
      await user.click(openNowButton)

      expect(mockSetOpenNow).toHaveBeenCalledWith(true)
    })

    it("should toggle open now state", async () => {
      const user = userEvent.setup()
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={true}
          setOpenNow={mockSetOpenNow}
        />
      )

      const openNowButton = screen.getByRole("button", { name: /open now/i })
      await user.click(openNowButton)

      expect(mockSetOpenNow).toHaveBeenCalledWith(false)
    })

    it("should have aria-pressed attribute", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={true}
          setOpenNow={mockSetOpenNow}
        />
      )

      const openNowButton = screen.getByRole("button", { name: /open now/i })
      expect(openNowButton).toHaveAttribute("aria-pressed", "true")
    })
  })

  describe("Location Toggle", () => {
    it("should call toggleLocation when clicked", async () => {
      const user = userEvent.setup()
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const locationButton = screen.getByRole("button", { name: /filter by location/i })
      await user.click(locationButton)

      expect(mockToggleLocation).toHaveBeenCalledTimes(1)
    })

    it("should show 'Near Me' when location is set", () => {
      render(
        <SearchControls
          userLocation={{ lat: 44.23, lng: -76.48 }}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      expect(screen.getByText("Near Me")).toBeInTheDocument()
    })

    it("should show 'Use Location' when location is not set", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      expect(screen.getByText("Use Location")).toBeInTheDocument()
    })

    it("should have correct aria-label when location is set", () => {
      render(
        <SearchControls
          userLocation={{ lat: 44.23, lng: -76.48 }}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const locationButton = screen.getByRole("button", { name: /clear location/i })
      expect(locationButton).toHaveAccessibleName("Clear Location")
    })
  })

  describe("Category Selection", () => {
    it("should call setCategory when All button is clicked", async () => {
      const user = userEvent.setup()
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={IntentCategory.Food}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const allButton = screen.getByRole("button", { name: "All" })
      await user.click(allButton)

      expect(mockSetCategory).toHaveBeenCalledWith(undefined)
    })

    it("should call setCategory when category button is clicked", async () => {
      const user = userEvent.setup()
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const foodButton = screen.getByRole("button", { name: "Food" })
      await user.click(foodButton)

      expect(mockSetCategory).toHaveBeenCalledWith(IntentCategory.Food)
    })

    it("should toggle category when clicking selected category", async () => {
      const user = userEvent.setup()
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={IntentCategory.Food}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const foodButton = screen.getByRole("button", { name: "Food" })
      await user.click(foodButton)

      expect(mockSetCategory).toHaveBeenCalledWith(undefined)
    })

    it("should have aria-pressed attribute on selected category", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={IntentCategory.Food}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const foodButton = screen.getByRole("button", { name: "Food" })
      expect(foodButton).toHaveAttribute("aria-pressed", "true")
    })

    it("should have aria-pressed=false on unselected categories", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={IntentCategory.Food}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const housingButton = screen.getByRole("button", { name: "Housing" })
      expect(housingButton).toHaveAttribute("aria-pressed", "false")
    })
  })

  describe("Crisis Category Styling", () => {
    it("should apply special styling to Crisis category when unselected", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const crisisButton = screen.getByRole("button", { name: "Crisis" })
      expect(crisisButton).toHaveClass("border-red-200")
    })

    it("should apply selected styling to Crisis category when selected", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={IntentCategory.Crisis}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const crisisButton = screen.getByRole("button", { name: "Crisis" })
      expect(crisisButton).toHaveClass("bg-red-600")
    })
  })

  describe("Accessibility", () => {
    it("should have category group with accessible label", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const categoryGroup = screen.getByRole("group", { name: /filter by category/i })
      expect(categoryGroup).toBeInTheDocument()
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      // Tab to first button
      await user.tab()
      const openNowButton = screen.getByRole("button", { name: /open now/i })
      expect(openNowButton).toHaveFocus()

      // Enter should activate
      await user.keyboard("{Enter}")
      expect(mockSetOpenNow).toHaveBeenCalled()
    })

    it("should have accessible icon buttons", () => {
      const { container } = render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      const icons = container.querySelectorAll("svg")
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe("Translation", () => {
    it("should call translation function for all categories", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      expect(mockT).toHaveBeenCalledWith("all")
      expect(mockT).toHaveBeenCalledWith("crisis")
      expect(mockT).toHaveBeenCalledWith("food")
      expect(mockT).toHaveBeenCalledWith("housing")
    })

    it("should call translation function for button labels", () => {
      render(
        <SearchControls
          userLocation={undefined}
          toggleLocation={mockToggleLocation}
          isLocating={false}
          category={undefined}
          setCategory={mockSetCategory}
          openNow={false}
          setOpenNow={mockSetOpenNow}
        />
      )

      expect(mockT).toHaveBeenCalledWith("openNow")
      expect(mockT).toHaveBeenCalledWith("useLocation")
      expect(mockT).toHaveBeenCalledWith("utilityFilters")
      expect(mockT).toHaveBeenCalledWith("categoryFilters")
    })
  })
})
