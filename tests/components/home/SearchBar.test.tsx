import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SearchBar from "@/components/home/SearchBar"

// Mock dependencies
vi.mock("@/hooks/useVoiceInput", () => ({
  useVoiceInput: vi.fn(),
}))

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}))

import { useVoiceInput } from "@/hooks/useVoiceInput"
import { useTranslations } from "next-intl"

describe("SearchBar", () => {
  const mockSetQuery = vi.fn()
  const mockHandleSaveSearch = vi.fn()
  const mockOnFocus = vi.fn()
  const mockOnBlur = vi.fn()
  const mockUseVoiceInput = vi.mocked(useVoiceInput)
  const mockUseTranslations = vi.mocked(useTranslations)

  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      start: "Start voice input",
      stop: "Stop listening",
    }
    return translations[key] || key
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTranslations.mockReturnValue(mockT as any)
    mockUseVoiceInput.mockReturnValue({
      state: "idle",
      isSupported: true,
      startListening: vi.fn(),
      stopListening: vi.fn(),
      error: null,
    } as any)
  })

  describe("Rendering", () => {
    it("should render search input", () => {
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByRole("textbox", { name: "Search" })
      expect(input).toBeInTheDocument()
    })

    it("should render search icon", () => {
      const { container } = render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const searchIcon = container.querySelector("svg")
      expect(searchIcon).toBeInTheDocument()
    })

    it("should display placeholder text", () => {
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByPlaceholderText("Search for services...")
      expect(input).toBeInTheDocument()
    })

    it("should have accessible label", () => {
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search for social services"
        />
      )

      const input = screen.getByRole("textbox")
      expect(input).toHaveAccessibleName("Search for social services")
    })
  })

  describe("Input Interaction", () => {
    it("should call setQuery when user types", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByRole("textbox")
      await user.type(input, "test")

      // userEvent.type() triggers onChange for each character typed
      expect(mockSetQuery).toHaveBeenCalled()
      expect(mockSetQuery.mock.calls.length).toBeGreaterThan(0)
    })

    it("should display current query value", () => {
      render(
        <SearchBar
          query="mental health"
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByRole("textbox")
      expect(input).toHaveValue("mental health")
    })

    it("should call onFocus when input is focused", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
          onFocus={mockOnFocus}
        />
      )

      const input = screen.getByRole("textbox")
      await user.click(input)

      expect(mockOnFocus).toHaveBeenCalled()
    })

    it("should call onBlur when input loses focus", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
          onBlur={mockOnBlur}
        />
      )

      const input = screen.getByRole("textbox")
      await user.click(input)
      await user.tab() // Move focus away

      expect(mockOnBlur).toHaveBeenCalled()
    })
  })

  describe("Save Search Button", () => {
    it("should not show save button when query is empty", () => {
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const saveButton = screen.queryByRole("button", { name: /save this search/i })
      expect(saveButton).not.toBeInTheDocument()
    })

    it("should show save button when query has content", () => {
      render(
        <SearchBar
          query="food bank"
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const saveButton = screen.getByRole("button", { name: /save this search/i })
      expect(saveButton).toBeInTheDocument()
    })

    it("should call handleSaveSearch when save button is clicked", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          query="food bank"
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const saveButton = screen.getByRole("button", { name: /save this search/i })
      await user.click(saveButton)

      expect(mockHandleSaveSearch).toHaveBeenCalledTimes(1)
    })

    it("should have heart icon in save button", () => {
      render(
        <SearchBar
          query="food bank"
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const saveButton = screen.getByRole("button", { name: /save this search/i })
      const heartIcon = saveButton.querySelector("svg")
      expect(heartIcon).toBeInTheDocument()
    })
  })

  describe("Voice Search Button", () => {
    it("should render voice button when supported", () => {
      mockUseVoiceInput.mockReturnValue({
        state: "idle",
        isSupported: true,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        error: null,
      } as any)

      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const voiceButton = screen.getByRole("button", { name: /start voice input/i })
      expect(voiceButton).toBeInTheDocument()
    })

    it("should not render voice button when not supported", () => {
      mockUseVoiceInput.mockReturnValue({
        state: "idle",
        isSupported: false,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        error: null,
      } as any)

      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const voiceButton = screen.queryByRole("button", { name: /start voice input/i })
      expect(voiceButton).not.toBeInTheDocument()
    })

    it("should call startListening when voice button clicked in idle state", async () => {
      const user = userEvent.setup()
      const mockStartListening = vi.fn()
      mockUseVoiceInput.mockReturnValue({
        state: "idle",
        isSupported: true,
        startListening: mockStartListening,
        stopListening: vi.fn(),
        error: null,
      } as any)

      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const voiceButton = screen.getByRole("button", { name: /start voice input/i })
      await user.click(voiceButton)

      expect(mockStartListening).toHaveBeenCalled()
    })

    it("should call stopListening when voice button clicked in listening state", async () => {
      const user = userEvent.setup()
      const mockStopListening = vi.fn()
      mockUseVoiceInput.mockReturnValue({
        state: "listening",
        isSupported: true,
        startListening: vi.fn(),
        stopListening: mockStopListening,
        error: null,
      } as any)

      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const voiceButton = screen.getByRole("button", { name: /stop listening/i })
      await user.click(voiceButton)

      expect(mockStopListening).toHaveBeenCalled()
    })

    it("should show pulsing animation when listening", () => {
      mockUseVoiceInput.mockReturnValue({
        state: "listening",
        isSupported: true,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        error: null,
      } as any)

      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const voiceButton = screen.getByRole("button", { name: /stop listening/i })
      expect(voiceButton).toHaveClass("animate-pulse")
    })

    it("should show processing state with spinner", () => {
      mockUseVoiceInput.mockReturnValue({
        state: "processing",
        isSupported: true,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        error: null,
      } as any)

      const { container } = render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const spinner = container.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })

    it("should display error message in tooltip when error occurs", () => {
      mockUseVoiceInput.mockReturnValue({
        state: "idle",
        isSupported: true,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        error: "Microphone access denied",
      } as any)

      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const voiceButton = screen.getByRole("button", { name: "Microphone access denied" })
      expect(voiceButton).toBeInTheDocument()
    })

    it("should call setQuery when voice input provides result", () => {
      let onResultCallback: ((text: string) => void) | undefined

      mockUseVoiceInput.mockImplementation((callback) => {
        onResultCallback = callback
        return {
          state: "idle",
          isSupported: true,
          startListening: vi.fn(),
          stopListening: vi.fn(),
          error: null,
        } as any
      })

      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      // Simulate voice input result
      onResultCallback?.("food assistance")

      expect(mockSetQuery).toHaveBeenCalledWith("food assistance")
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA attributes on input", () => {
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search for services"
        />
      )

      const input = screen.getByRole("textbox")
      expect(input).toHaveAttribute("aria-label", "Search for services")
    })

    it("should have accessible save button", () => {
      render(
        <SearchBar
          query="food bank"
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const saveButton = screen.getByRole("button", { name: /save this search/i })
      expect(saveButton).toHaveAccessibleName()
    })

    it("should support keyboard navigation to save button", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          query="food bank"
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByRole("textbox")
      await user.click(input)
      await user.tab()

      const saveButton = screen.getByRole("button", { name: /save this search/i })
      expect(saveButton).toHaveFocus()
    })

    it("should support keyboard activation of save button", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          query="food bank"
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      // Tab to input, then to save button
      await user.tab()
      await user.tab()

      // Enter should trigger save
      await user.keyboard("{Enter}")
      expect(mockHandleSaveSearch).toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty query string", () => {
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByRole("textbox")
      expect(input).toHaveValue("")
    })

    it("should handle very long query", () => {
      const longQuery = "a".repeat(500)
      render(
        <SearchBar
          query={longQuery}
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByRole("textbox")
      expect(input).toHaveValue(longQuery)
    })

    it("should handle special characters in query", () => {
      const specialQuery = "food & shelter (24/7)"
      render(
        <SearchBar
          query={specialQuery}
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByRole("textbox")
      expect(input).toHaveValue(specialQuery)
    })

    it("should work without onFocus and onBlur callbacks", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          query=""
          setQuery={mockSetQuery}
          handleSaveSearch={mockHandleSaveSearch}
          placeholder="Search for services..."
          label="Search"
        />
      )

      const input = screen.getByRole("textbox")
      await user.click(input)
      await user.tab()

      // Should not throw error
      expect(input).not.toHaveFocus()
    })
  })
})
