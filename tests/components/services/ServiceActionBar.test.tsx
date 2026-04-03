import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { render, screen } from "@testing-library/react"
import { ServiceActionBar } from "@/components/services/ServiceActionBar"

const shareMock = vi.fn()
const toastMock = vi.fn()

vi.mock("@/hooks/useShare", () => ({
  useShare: () => ({
    share: shareMock,
  }),
}))

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}))

describe("ServiceActionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shareMock.mockResolvedValue({ type: "copy", success: true })
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "https://careconnect.ing/en/service/test-service-id" },
    })
  })

  it("renders its core actions and handles share fallback", async () => {
    const user = userEvent.setup()

    render(
      <ServiceActionBar
        serviceId="test-service-id"
        serviceName="Test Service"
        plainLanguageLabel="Plain language"
        shareLabel="Share"
        printLabel="Print"
      />
    )

    expect(screen.getByRole("link", { name: /Plain language/i })).toHaveAttribute("href", "?view=simple")
    expect(screen.getByRole("link", { name: /Print/i })).toHaveAttribute(
      "href",
      "/api/v1/services/test-service-id/printable"
    )

    await user.click(screen.getByRole("button", { name: /Share/i }))

    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Service",
        url: "https://careconnect.ing/en/service/test-service-id",
      })
    )
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Link Copied",
      })
    )
  })
})
