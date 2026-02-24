import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SearchChips from "@/components/home/SearchChips"
import { renderWithProviders } from "@/tests/utils/test-wrapper"

const messages = {
  Home: {
    searchChips: {
      savedLabel: "Saved",
      removeSavedSearch: "Remove saved search: {term}",
      quickSearchesLabel: "Popular searches",
      quickSearch: {
        foodBank: "food bank",
        housing: "housing help",
        crisis: "crisis support",
        mentalHealth: "mental health",
        legalAid: "legal aid",
      },
    },
  },
}

function renderChips(props: Partial<React.ComponentProps<typeof SearchChips>> = {}) {
  return renderWithProviders(
    <SearchChips savedSearches={[]} removeSavedSearch={vi.fn()} startSearch={vi.fn()} {...props} />,
    { messages }
  )
}

describe("SearchChips", () => {
  const mockRemoveSavedSearch = vi.fn()
  const mockStartSearch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render quick searches when savedSearches is empty", () => {
      renderChips({ removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      expect(screen.getByText("Popular searches")).toBeInTheDocument()
      expect(screen.queryByText("Saved")).not.toBeInTheDocument()
    })

    it("should render saved searches when provided", () => {
      const savedSearches = ["food bank", "mental health"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      expect(screen.getByText("Saved")).toBeInTheDocument()
      expect(screen.getByText("food bank")).toBeInTheDocument()
      expect(screen.getByText("mental health")).toBeInTheDocument()
    })

    it("should render remove button for each saved search", () => {
      const savedSearches = ["food bank", "crisis support"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      expect(screen.getByRole("button", { name: /remove saved search.*food bank/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /remove saved search.*crisis support/i })).toBeInTheDocument()
    })

    it("should render multiple saved searches", () => {
      const savedSearches = ["search 1", "search 2", "search 3", "search 4"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      savedSearches.forEach((search) => {
        expect(screen.getByText(search)).toBeInTheDocument()
      })
    })
  })

  describe("Search Interaction", () => {
    it("should call startSearch when clicking on a saved search", async () => {
      const user = userEvent.setup()
      const savedSearches = ["food bank"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      const searchButton = screen.getByRole("button", { name: "food bank" })
      await user.click(searchButton)

      expect(mockStartSearch).toHaveBeenCalledWith("food bank")
      expect(mockStartSearch).toHaveBeenCalledTimes(1)
    })

    it("should call startSearch with correct term for each saved search", async () => {
      const user = userEvent.setup()
      const savedSearches = ["food bank", "mental health"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      const foodBankButton = screen.getByRole("button", { name: "food bank" })
      await user.click(foodBankButton)
      expect(mockStartSearch).toHaveBeenCalledWith("food bank")

      const mentalHealthButton = screen.getByRole("button", { name: "mental health" })
      await user.click(mentalHealthButton)
      expect(mockStartSearch).toHaveBeenCalledWith("mental health")
    })
  })

  describe("Remove Interaction", () => {
    it("should call removeSavedSearch when clicking remove button", async () => {
      const user = userEvent.setup()
      const savedSearches = ["food bank"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      const removeButton = screen.getByRole("button", { name: /remove saved search.*food bank/i })
      await user.click(removeButton)

      expect(mockRemoveSavedSearch).toHaveBeenCalledWith("food bank")
      expect(mockRemoveSavedSearch).toHaveBeenCalledTimes(1)
    })

    it("should not trigger startSearch when removing a search", async () => {
      const user = userEvent.setup()
      const savedSearches = ["food bank"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      const removeButton = screen.getByRole("button", { name: /remove saved search.*food bank/i })
      await user.click(removeButton)

      expect(mockRemoveSavedSearch).toHaveBeenCalledTimes(1)
      expect(mockStartSearch).not.toHaveBeenCalled()
    })

    it("should call removeSavedSearch with correct term", async () => {
      const user = userEvent.setup()
      const savedSearches = ["food bank", "crisis support"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      const removeButton = screen.getByRole("button", { name: /remove saved search.*crisis support/i })
      await user.click(removeButton)

      expect(mockRemoveSavedSearch).toHaveBeenCalledWith("crisis support")
    })
  })

  describe("Styling and Layout", () => {
    it("should display 'Saved' label when searches exist", () => {
      const savedSearches = ["food bank"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      const savedLabel = screen.getByText("Saved")
      expect(savedLabel).toBeInTheDocument()
      expect(savedLabel).toHaveClass("uppercase")
    })

    it("should render chips in a flex container", () => {
      const savedSearches = ["food bank", "mental health"]

      const { container } = renderChips({
        savedSearches,
        removeSavedSearch: mockRemoveSavedSearch,
        startSearch: mockStartSearch,
      })

      const chipContainer = container.querySelector(".flex.flex-wrap")
      expect(chipContainer).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have accessible remove buttons", () => {
      const savedSearches = ["food bank", "mental health"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      const removeButtons = screen.getAllByRole("button", { name: /remove saved search/i })
      expect(removeButtons).toHaveLength(2)

      removeButtons.forEach((button) => {
        expect(button).toHaveAccessibleName()
      })
    })

    it("should have accessible search buttons", () => {
      const savedSearches = ["food bank"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      const searchButton = screen.getByRole("button", { name: "food bank" })
      expect(searchButton).toHaveAccessibleName("food bank")
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()
      const savedSearches = ["food bank"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      // Tab to search button
      await user.tab()
      const searchButton = screen.getByRole("button", { name: "food bank" })
      expect(searchButton).toHaveFocus()

      // Enter should trigger search
      await user.keyboard("{Enter}")
      expect(mockStartSearch).toHaveBeenCalledWith("food bank")
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty string in savedSearches", () => {
      const savedSearches = [""]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      expect(screen.getByText("Saved")).toBeInTheDocument()
    })

    it("should handle very long search terms", () => {
      const savedSearches = ["This is a very long search term that might wrap or overflow"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      expect(screen.getByText("This is a very long search term that might wrap or overflow")).toBeInTheDocument()
    })

    it("should handle special characters in search terms", () => {
      const savedSearches = ["food & shelter", "mental health (crisis)"]

      renderChips({ savedSearches, removeSavedSearch: mockRemoveSavedSearch, startSearch: mockStartSearch })

      expect(screen.getByText("food & shelter")).toBeInTheDocument()
      expect(screen.getByText("mental health (crisis)")).toBeInTheDocument()
    })
  })
})
