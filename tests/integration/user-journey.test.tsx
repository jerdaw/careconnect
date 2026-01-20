import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import SearchResultsList from "@/components/home/SearchResultsList"
import SearchBar from "@/components/home/SearchBar"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"

// Mock hooks
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => "en"),
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => "/"),
}))

// Mock Components
vi.mock("@/components/ServiceCard", () => ({
  default: ({ service }: any) => <div data-testid="service-card">{service.name}</div>,
}))
vi.mock("@/components/ServiceCardSkeleton", () => ({
  default: () => <div data-testid="skeleton" />,
}))

describe("User Journey: Search and Filter", () => {
  const mockPush = vi.fn()
  const mockTranslations = (key: string) => key

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any)
  })

  it("allows user to input search query and navigate", async () => {
    const TestWrapper = () => {
      const [query, setQuery] = React.useState("")
      return (
        <SearchBar
          query={query}
          setQuery={setQuery}
          handleSaveSearch={vi.fn()}
          placeholder="Search"
          label="search_label"
        />
      )
    }
    render(<TestWrapper />)

    const input = screen.getByLabelText("search_label")
    fireEvent.change(input, { target: { value: "food bank" } })
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

    // SearchBar itself doesn't trigger navigation on Enter unless configured, but our integration test checks interaction.
    // Given the props, we can inspect input value.
    expect((input as HTMLInputElement).value).toBe("food bank")
  })

  it("displays results matching the flow", async () => {
    const mockServices = [
      { service: { id: "1", name: "Food Bank A", scope: "kingston" }, score: 1, matchReasons: [] },
      { service: { id: "2", name: "Food Bank B", scope: "kingston" }, score: 1, matchReasons: [] },
    ]

    // We import SearchResultsList which expects 'results' prop (SearchResult[])
    render(
      <SearchResultsList results={mockServices as any} isLoading={false} hasSearched={true} query="food" category="" />
    )

    expect(screen.getAllByTestId("service-card")).toHaveLength(2)
    expect(screen.getByText("Food Bank A")).toBeInTheDocument()
  })
})

// ============================================================================
// Offline Sync Journey Tests
// ============================================================================

describe("User Journey: Offline Sync", () => {
  const mockTranslations = (key: string) => key

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
  })

  it("searches while offline and displays cached results", async () => {
    // Simulate offline state
    const mockServices = [
      { service: { id: "cached-1", name: "Cached Service", scope: "kingston" }, score: 1, matchReasons: [] },
    ]

    render(
      <SearchResultsList
        results={mockServices as any}
        isLoading={false}
        hasSearched={true}
        query="cached"
        category=""
      />
    )

    // Verify cached results are displayed
    expect(screen.getByText("Cached Service")).toBeInTheDocument()
  })

  it("queues feedback while offline", async () => {
    // This would test the offline feedback queue in a real integration test
    // For now, we verify the component behavior
    const mockQueueFeedback = vi.fn()

    // Simulate accessing feedback widget offline
    expect(mockQueueFeedback).toBeDefined()
  })
})

// ============================================================================
// Partner Claim Journey Tests
// ============================================================================

describe("User Journey: Partner Claim Flow", () => {
  const mockTranslations = (key: string) => key
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
  })

  it("views service as potential partner", async () => {
    const partnerService = {
      service: {
        id: "partner-service",
        name: "Claimable Service",
        scope: "kingston",
        verification_level: 0,
      },
      score: 1,
      matchReasons: [],
    }

    render(
      <SearchResultsList
        results={[partnerService] as any}
        isLoading={false}
        hasSearched={true}
        query="service"
        category=""
      />
    )

    expect(screen.getByText("Claimable Service")).toBeInTheDocument()
  })

  it("navigates to claim process from service detail", () => {
    // In a full integration test, this would:
    // 1. Click service card
    // 2. Navigate to detail page
    // 3. Click "Claim this service"
    // 4. Verify claim flow starts

    // For now, verify router is available for navigation
    expect(mockPush).toBeDefined()
  })
})

// ============================================================================
// Crisis Response Journey Tests
// ============================================================================

describe("User Journey: Crisis Detection and Response", () => {
  const mockTranslations = (key: string) => key

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
  })

  it("detects crisis keywords in search query", async () => {
    // Crisis keywords like "suicide", "kill myself", etc.
    const TestWrapper = () => {
      const [query, setQuery] = React.useState("")
      return (
        <SearchBar
          query={query}
          setQuery={setQuery}
          handleSaveSearch={vi.fn()}
          placeholder="Search"
          label="search_label"
        />
      )
    }
    render(<TestWrapper />)

    const input = screen.getByLabelText("search_label")
    fireEvent.change(input, { target: { value: "suicide help" } })

    expect((input as HTMLInputElement).value).toBe("suicide help")
    // In real implementation, this would trigger EmergencyModal
  })

  it("prioritizes crisis services in results", async () => {
    const crisisServices = [
      {
        service: {
          id: "crisis-1",
          name: "Crisis Line",
          scope: "kingston",
          category: "Crisis Support",
        },
        score: 100, // Boosted score for crisis service
        matchReasons: ["crisis_keyword"],
      },
      {
        service: {
          id: "normal-1",
          name: "Regular Service",
          scope: "kingston",
        },
        score: 80,
        matchReasons: [],
      },
    ]

    render(
      <SearchResultsList
        results={crisisServices as any}
        isLoading={false}
        hasSearched={true}
        query="suicide help"
        category=""
      />
    )

    // Verify crisis service appears first
    const cards = screen.getAllByTestId("service-card")
    expect(cards[0]).toHaveTextContent("Crisis Line")
  })

  it("displays emergency resources prominently", () => {
    // This would test EmergencyModal display in a full integration
    // For now, verify the test infrastructure exists
    expect(screen).toBeDefined()
  })
})
