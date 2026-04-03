import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TestWrapper } from "@/tests/utils/test-wrapper"
import BetaBanner from "@/components/layout/BetaBanner"
import { ClientOnly } from "@/components/ui/ClientOnly"

const messages = {
  BetaBanner: {
    title: "Pilot release",
    shareFeedback: "Share feedback",
  },
} as const

describe("Misc smoke coverage", () => {
  it("renders the beta banner feedback affordance", () => {
    render(
      <TestWrapper messages={messages as any}>
        <BetaBanner />
      </TestWrapper>
    )

    expect(screen.getByText("Pilot release")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Share feedback" })).toHaveAttribute(
      "href",
      "mailto:feedback@careconnect.ing?subject=Kingston%20Care%20Connect%20Pilot%20Feedback"
    )
  })

  it("renders client-only content after mount", async () => {
    render(
      <ClientOnly>
        <div>Mounted content</div>
      </ClientOnly>
    )

    expect(await screen.findByText("Mounted content")).toBeInTheDocument()
  })
})
