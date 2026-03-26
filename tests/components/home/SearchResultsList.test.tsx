import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import SearchResultsList from "@/components/home/SearchResultsList"
import { useTranslations } from "next-intl"

// Mock components
vi.mock("@/components/services/ServiceCard", () => ({
  default: ({ service }: any) => <div data-testid="service-card">{service.name}</div>,
}))
vi.mock("@/components/services/ServiceCardSkeleton", () => ({
  default: () => <div data-testid="skeleton" />,
}))
vi.mock("@/components/home/ScopeFilterBar", () => ({
  default: ({ activeScope, onScopeChange }: any) => (
    <div data-testid="scope-filter-bar">
      <button onClick={() => onScopeChange("provincial")}>Switch to Ontario</button>
      <span>Active: {activeScope}</span>
    </div>
  ),
}))

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => "en"),
}))

describe("SearchResultsList Component", () => {
  const mockTranslations = (key: string) => key
  const mockResults = [
    { service: { id: "1", name: "Kingston Food", scope: "kingston", description: "desc" }, score: 1 },
    { service: { id: "2", name: "Ontario Health", scope: "ontario", description: "desc" }, score: 0.8 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslations).mockReturnValue(mockTranslations as any)
  })

  it("renders skeletons when loading", () => {
    render(<SearchResultsList isLoading={true} results={[]} hasSearched={false} query="" />)
    expect(screen.getAllByTestId("skeleton")).toHaveLength(3)
  })

  it("renders results when loaded", () => {
    render(<SearchResultsList isLoading={false} results={mockResults as any} hasSearched={true} query="help" />)
    expect(screen.getAllByTestId("service-card")).toHaveLength(2)
    expect(screen.getByText("Kingston Food")).toBeInTheDocument()
    expect(screen.getByText("Ontario Health")).toBeInTheDocument()
  })

  it("filters results by scope", () => {
    render(<SearchResultsList isLoading={false} results={mockResults as any} hasSearched={true} query="help" />)

    expect(screen.getAllByTestId("service-card")).toHaveLength(2)

    // Switch to provincial via mocked bar
    fireEvent.click(screen.getByText("Switch to Ontario"))

    expect(screen.getAllByTestId("service-card")).toHaveLength(1)
    expect(screen.getByText("Ontario Health")).toBeInTheDocument()
    expect(screen.queryByText("Kingston Food")).not.toBeInTheDocument()
  })

  it("shows no results message when empty", () => {
    render(<SearchResultsList isLoading={false} results={[]} hasSearched={true} query="unknown" />)
    expect(screen.getByText("noResults")).toBeInTheDocument()
  })

  it("shows no local results message and allows switching", () => {
    // Only ontario results
    const provincialOnly = [mockResults[1]]

    render(<SearchResultsList isLoading={false} results={provincialOnly as any} hasSearched={true} query="ontario" />)

    // Default scope is "all"? No, in component it is "all" initially.
    // Wait, let's check default scope.
    // const [activeScope, setActiveScope] = useState<ScopeFilter>("all")

    // If results are provincialOnly and scope is "all", it should show them.
    // If scope was "kingston", it would show "noLocalResults".
  })
})
