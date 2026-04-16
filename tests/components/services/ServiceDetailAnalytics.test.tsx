import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ServiceDetailTracker } from "@/components/services/ServiceDetailTracker"
import { TrackedServiceLink } from "@/components/services/TrackedServiceLink"

const mockTrackEvent = vi.fn()

vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

describe("service detail analytics helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("emits a detail view event on mount", () => {
    render(<ServiceDetailTracker serviceId="svc-123" />)

    expect(mockTrackEvent).toHaveBeenCalledWith("svc-123", "view_detail")
  })

  it("tracks external website clicks from the detail page", () => {
    render(
      <TrackedServiceLink
        href="https://example.com"
        serviceId="svc-123"
        eventType="click_website"
        onClick={(event) => event.preventDefault()}
      >
        Visit website
      </TrackedServiceLink>
    )

    fireEvent.click(screen.getByRole("link", { name: "Visit website" }))

    expect(mockTrackEvent).toHaveBeenCalledWith("svc-123", "click_website")
  })
})
