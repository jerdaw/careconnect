import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import SearchBar from "@/components/home/SearchBar"
import { useVoiceInput } from "@/hooks/useVoiceInput"
import { useTranslations } from "next-intl"

// Mock hooks
vi.mock("@/hooks/useVoiceInput", () => ({
  useVoiceInput: vi.fn(),
}))
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}))

describe("SearchBar Component", () => {
  const mockSetQuery = vi.fn()
  const mockHandleSaveSearch = vi.fn()
  const mockTranslations = (key: string) => key

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
    vi.mocked(useVoiceInput).mockReturnValue({
      state: "idle",
      isSupported: true,
      startListening: vi.fn(),
      stopListening: vi.fn(),
      error: null,
    } as any)
  })

  it("renders with placeholder and label", () => {
    render(
      <SearchBar
        query=""
        setQuery={mockSetQuery}
        handleSaveSearch={mockHandleSaveSearch}
        placeholder="Search services"
        label="Service search"
      />
    )
    const input = screen.getByLabelText("Service search")
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute("placeholder", "Search services")
  })

  it("updates query on input change", () => {
    render(
      <SearchBar
        query=""
        setQuery={mockSetQuery}
        handleSaveSearch={mockHandleSaveSearch}
        placeholder="Search services"
        label="Service search"
      />
    )
    const input = screen.getByLabelText("Service search")
    fireEvent.change(input, { target: { value: "food" } })
    expect(mockSetQuery).toHaveBeenCalledWith("food")
  })

  it("shows save search button when query is not empty", () => {
    render(
      <SearchBar
        query="food"
        setQuery={mockSetQuery}
        handleSaveSearch={mockHandleSaveSearch}
        placeholder="Search"
        label="Search"
      />
    )
    const saveButton = screen.getByLabelText("Save this search")
    expect(saveButton).toBeInTheDocument()
    fireEvent.click(saveButton)
    expect(mockHandleSaveSearch).toHaveBeenCalled()
  })

  it("hides save search button when query is empty", () => {
    render(
      <SearchBar
        query=""
        setQuery={mockSetQuery}
        handleSaveSearch={mockHandleSaveSearch}
        placeholder="Search"
        label="Search"
      />
    )
    expect(screen.queryByLabelText("Save this search")).not.toBeInTheDocument()
  })

  it("starts voice input when mic button is clicked", () => {
    const mockStart = vi.fn()
    vi.mocked(useVoiceInput).mockReturnValue({
      state: "idle",
      isSupported: true,
      startListening: mockStart,
      stopListening: vi.fn(),
      error: null,
    } as any)

    render(
      <SearchBar
        query=""
        setQuery={mockSetQuery}
        handleSaveSearch={mockHandleSaveSearch}
        placeholder="Search"
        label="Search"
      />
    )
    const micButton = screen.getByLabelText("start")
    fireEvent.click(micButton)
    expect(mockStart).toHaveBeenCalled()
  })
})
