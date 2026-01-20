import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import ChatAssistant from "@/components/ai/ChatAssistant"
import { useAI } from "@/hooks/useAI"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { useTranslations } from "next-intl"
import { aiEngine } from "@/lib/ai/engine"

// Mock hooks
vi.mock("@/hooks/useAI", () => ({
  useAI: vi.fn(),
}))
vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}))
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}))

// Mock AI Engine
vi.mock("@/lib/ai/engine", () => ({
  aiEngine: {
    unload: vi.fn(),
    reset: vi.fn(),
    init: vi.fn(),
    refineSearchQuery: vi.fn(),
  },
}))

// Mock Search
vi.mock("@/lib/search", () => ({
  searchServices: vi.fn(),
}))

describe("ChatAssistant Component", () => {
  const mockTranslations = (key: string) => key

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
    vi.mocked(useNetworkStatus).mockReturnValue({ isOffline: false } as any)
    vi.mocked(useAI).mockReturnValue({
      isReady: false,
      isLoading: false,
      progress: 0,
      text: "",
      error: null,
      initAI: vi.fn(),
      stop: vi.fn(),
    } as any)

    // Default to closed for some tests, open for others
    // We'll manage state via fireEvent
  })

  it("renders the floating action button", () => {
    render(<ChatAssistant />)
    expect(screen.getByLabelText("Toggle AI Assistant")).toBeInTheDocument()
  })

  it("opens the chat window when clicked", async () => {
    render(<ChatAssistant />)
    const button = screen.getByLabelText("Toggle AI Assistant")
    fireEvent.click(button)

    expect(screen.getByRole("complementary")).toHaveTextContent("title")
  })

  it("shows enable button when not ready", () => {
    render(<ChatAssistant />)
    fireEvent.click(screen.getByLabelText("Toggle AI Assistant"))

    expect(screen.getByText("enable")).toBeInTheDocument()
  })

  it("calls initAI when enable button is clicked", () => {
    const mockInitAI = vi.fn()
    vi.mocked(useAI).mockReturnValue({
      isReady: false,
      isLoading: false,
      progress: 0,
      text: "",
      error: null,
      initAI: mockInitAI,
      stop: vi.fn(),
    } as any)

    render(<ChatAssistant />)
    fireEvent.click(screen.getByLabelText("Toggle AI Assistant"))
    fireEvent.click(screen.getByText("enable"))

    expect(mockInitAI).toHaveBeenCalled()
  })

  it("shows initialization progress", () => {
    vi.mocked(useAI).mockReturnValue({
      isReady: false,
      isLoading: true,
      progress: 0.45,
      text: "Loading model...",
      error: null,
      initAI: vi.fn(),
      stop: vi.fn(),
    } as any)

    render(<ChatAssistant />)
    fireEvent.click(screen.getByLabelText("Toggle AI Assistant"))

    expect(screen.getByText("45%")).toBeInTheDocument()
    expect(screen.getByText("Loading model...")).toBeInTheDocument()
  })

  it("handles user input and search when ready", async () => {
    vi.mocked(useAI).mockReturnValue({
      isReady: true,
      isLoading: false,
      progress: 1,
      text: "",
      error: null,
      initAI: vi.fn(),
      stop: vi.fn(),
    } as any)

    const { searchServices } = await import("@/lib/search")
    vi.mocked(searchServices).mockResolvedValue([
      { service: { id: "svc-1", name: "Test Service", description: "Test Desc" }, score: 1 },
    ] as any)

    render(<ChatAssistant />)
    fireEvent.click(screen.getByLabelText("Toggle AI Assistant"))

    const input = screen.getByPlaceholderText("placeholderReady")
    fireEvent.change(input, { target: { value: "I need help" } })
    fireEvent.click(screen.getByLabelText("ariaSendMessage"))

    await waitFor(() => {
      expect(screen.getByText("Test Service")).toBeInTheDocument()
    })
  })

  it("detects crisis and shows emergency modal", async () => {
    vi.mocked(useAI).mockReturnValue({
      isReady: true,
      isLoading: false,
      progress: 1,
      text: "",
      error: null,
      initAI: vi.fn(),
      stop: vi.fn(),
    } as any)

    render(<ChatAssistant />)
    fireEvent.click(screen.getByLabelText("Toggle AI Assistant"))

    const input = screen.getByPlaceholderText("placeholderReady")
    // Use a crisis keyword
    fireEvent.change(input, { target: { value: "I want to kill myself" } })
    fireEvent.click(screen.getByLabelText("ariaSendMessage"))

    await waitFor(() => {
      expect(screen.getByText("crisisBlocked")).toBeInTheDocument()
    })
  })

  it("handles offline state", () => {
    vi.mocked(useNetworkStatus).mockReturnValue({ isOffline: true } as any)
    vi.mocked(useAI).mockReturnValue({ isReady: true } as any)

    render(<ChatAssistant />)
    fireEvent.click(screen.getByLabelText("Toggle AI Assistant"))

    const input = screen.getByPlaceholderText("unavailableOffline")
    expect(input).toBeDisabled()
  })
})
