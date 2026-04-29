import { describe, it, expect, vi } from "vitest"
import { fireEvent } from "@testing-library/react"
import { renderWithProviders, screen } from "@/tests/utils/test-wrapper"
import CategoryBrowseGrid from "@/components/home/CategoryBrowseGrid"
import CareConnectBoundaries from "@/components/about/CareConnectBoundaries"
import HomeStats from "@/components/home/HomeStats"
import HowItWorks from "@/components/home/HowItWorks"
import PartnerCTA from "@/components/home/PartnerCTA"
import SafetyAlert from "@/components/home/SafetyAlert"
import SourceGovernanceBand from "@/components/about/SourceGovernanceBand"
import ModelStatus from "@/components/home/ModelStatus"
import ScopeFilterBar from "@/components/home/ScopeFilterBar"

const messages = {
  Search: {
    crisis: "Crisis",
    health: "Health",
    community: "Community",
    legal: "Legal",
    food: "Food",
    housing: "Housing",
    employment: "Employment",
    wellness: "Wellness",
    education: "Education",
    financial: "Financial",
    indigenous: "Indigenous",
    transport: "Transport",
    resultSingular: "Result",
    resultPlural: "Results",
    scope: {
      all: "All",
      local: "Kingston",
      provincial: "Provincial",
    },
  },
  Home: {
    categoryGrid: {
      groupLabel: "Service categories",
      ariaLabel: "Browse {category} services",
    },
    stats: {
      servicesValue: "196",
      services: "Services",
      categoriesValue: "12",
      categories: "Categories",
      languagesValue: "7",
      languages: "Languages",
    },
    partnerCta: {
      title: "Work with CareConnect",
      description: "Suggest updates or learn more about the source model.",
      suggestButton: "Suggest a service",
      learnMoreButton: "Learn more",
    },
    howItWorks: {
      title: "How it works",
      subtitle: "Search privately, filter for what fits, then contact the provider directly.",
      steps: {
        privateSearch: {
          title: "Private Search",
          description: "No account. No search history.",
          details: {
            0: "Searches stay on your device",
            1: "Use the directory without signing in",
          },
          cardTitle: "Private by default",
        },
        filterResults: {
          title: "Filter Results",
          description: "Cut the list to services that fit your situation.",
          details: {
            0: "Open Now and Near Me",
            1: "Category and support filters",
          },
          cardTitle: "Narrow quickly",
        },
        connect: {
          title: "Connect",
          description: "Use the listing to take the next step directly.",
          details: {
            0: "Call, directions, and website links",
            1: "Confirm hours before you go",
          },
          cardTitle: "Ready to contact",
        },
      },
    },
    modelStatus: {
      privacyFirst: "Privacy-first search ready",
      neuralSearchActive: "Neural search active",
    },
  },
  About: {
    howItWorks: {
      title: "How it works",
      subtitle: "Three steps",
      step1: { title: "Search", description: "Use keywords, categories, or plain language." },
      step2: { title: "Narrow", description: "Filter by hours, location, and support type." },
      step3: { title: "Connect", description: "Call, get directions, or visit the service website." },
    },
    sourceGovernance: {
      eyebrow: "Source review",
      title: "Built for verified, private discovery",
      description: "CareConnect is a directory.",
      items: {
        sources: {
          title: "Reference sources",
          description: "See sources used for review.",
        },
        review: {
          title: "Manual review",
          description: "Listings are checked.",
        },
        privacy: {
          title: "No search tracking",
          description: "Searches stay private.",
        },
        languages: {
          title: "Accessible by design",
          description: "Seven languages are supported.",
        },
      },
    },
    boundaries: {
      eyebrow: "Clear boundaries",
      title: "What CareConnect does and doesn't do",
      description: "Find the next step.",
      does: {
        title: "CareConnect helps you",
        items: {
          0: "Search verified listings",
          1: "Keep searches private",
          2: "Find contact actions",
          3: "See why results matched",
        },
      },
      doesnt: {
        title: "CareConnect does not",
        items: {
          0: "Dispatch emergency help",
          1: "Guarantee availability",
          2: "Replace provider confirmation",
          3: "Profile public searches",
        },
      },
      note: "Verify details with the provider.",
    },
  },
  CrisisAlert: {
    title: "Immediate help is available",
    message: "If this is urgent, call now.",
    disclaimer: "CareConnect is informational only.",
    callButton: "Call 911",
    crisisLine: "Call 988",
  },
} as const

describe("Home surface smoke coverage", () => {
  it("renders the category shortcut rail and forwards category selection", () => {
    const onCategorySelect = vi.fn()

    renderWithProviders(<CategoryBrowseGrid onCategorySelect={onCategorySelect} />, { messages })

    expect(screen.getByRole("group", { name: "Service categories" })).toBeInTheDocument()
    expect(screen.queryByText("Browse common needs")).not.toBeInTheDocument()
    expect(screen.queryByText("More needs")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /browse employment services/i }))
    expect(onCategorySelect).toHaveBeenCalledWith("Employment")
  })

  it("renders home stats, how-it-works, partner CTA, and trust items", () => {
    const { rerender } = renderWithProviders(
      <div>
        <HomeStats />
        <HowItWorks />
        <PartnerCTA />
      </div>,
      { messages }
    )

    expect(screen.getByText("196")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Private Search" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Filter Results" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Connect" })).toBeInTheDocument()
    expect(screen.getByText("Searches stay on your device")).toBeInTheDocument()
    expect(screen.getByText("Confirm hours before you go")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Suggest a service" })).toHaveAttribute("href", "/submit-service")

    rerender(<div />)
  })

  it("renders about credibility sections", () => {
    renderWithProviders(
      <div>
        <SourceGovernanceBand />
        <CareConnectBoundaries />
      </div>,
      { messages }
    )

    expect(screen.getByRole("heading", { name: "Built for verified, private discovery" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "What CareConnect does and doesn't do" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Reference sources/i })).toHaveAttribute("href", "/en/about/partners")
  })

  it("shows the crisis safety alert for crisis-like queries", () => {
    renderWithProviders(<SafetyAlert query="need suicide help now" />, { messages })

    expect(screen.getByText("Immediate help is available")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Call 911" })).toHaveAttribute("href", "tel:911")
    expect(screen.getByRole("link", { name: "Call 988" })).toHaveAttribute("href", "tel:988")
  })

  it("renders the model status surface", () => {
    renderWithProviders(<ModelStatus isReady={false} />, { messages })

    expect(screen.getByText("Privacy-first search ready")).toBeInTheDocument()
  })

  it("renders both homogeneous and mixed scope filter states", () => {
    const onScopeChange = vi.fn()
    const { rerender } = renderWithProviders(
      <ScopeFilterBar
        counts={{ all: 5, local: 5, provincial: 0 }}
        activeScope="all"
        onScopeChange={onScopeChange}
        totalCount={5}
      />,
      { messages }
    )

    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("Results")).toBeInTheDocument()

    rerender(
      <ScopeFilterBar
        counts={{ all: 8, local: 5, provincial: 3 }}
        activeScope="all"
        onScopeChange={onScopeChange}
        totalCount={8}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Provincial 3/i }))
    expect(onScopeChange).toHaveBeenCalledWith("provincial")
  })
})
