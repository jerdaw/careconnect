import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { renderWithProviders, screen, waitFor } from "@/tests/utils/test-wrapper"
import { PartnerActionsPanel } from "@/components/services/PartnerActionsPanel"
import { useToast } from "@/components/ui/use-toast"

vi.mock("@/components/ui/use-toast", () => ({
  useToast: vi.fn(),
}))

const mockToast = vi.fn()
const mockFetch = vi.fn()
const INTERACTION_TEST_TIMEOUT_MS = 60000

if (!HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: () => false,
  })
}

if (!HTMLElement.prototype.setPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  })
}

if (!HTMLElement.prototype.releasePointerCapture) {
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: vi.fn(),
  })
}

const messages = {
  ServiceDetail: {
    claimText: "Do you manage this service?",
  },
  ClaimFlow: {
    button: "Claim Listing",
    title: "Claim your listing",
    description: "Verify your connection",
    step1: "Terms",
    step2: "Email",
    termsTitle: "Terms",
    agreeLabel: "I agree",
    submit: "Continue",
    emailLabel: "Work email",
    emailHint: "We will verify this domain",
    success: "Submitted",
  },
  Feedback: {
    requestUpdateTitle: "Request Data Update",
    requestUpdateDesc: "Suggest changes for {service}. These will be reviewed by an administrator.",
    fieldSelectorLabel: "Field to update",
    fieldSelectorPlaceholder: "Select a field...",
    fieldValueLabel: "Updated value",
    fieldValuePlaceholder: "Enter the updated value...",
    updateRequestValuePlaceholder: "Enter the updated {field}...",
    clearFieldLabel: "Clear this field",
    clearFieldHint: "Use this when the existing information should be removed.",
    justificationLabel: "Source / Justification",
    justificationPlaceholder: "e.g. Official update from our executive director...",
    submitRequest: "Submit Update Request",
    cancel: "Cancel",
    requestSuccessTitle: "Request Submitted",
    requestSuccessMessage: "Your update request has been received and is pending review.",
    errorTitle: "Error",
    errorMessage: "Something went wrong. Please try again.",
    authRequiredMessage: "Please log in as a partner to request updates.",
    fieldRequiredMessage: "Select a field to update.",
    valueRequiredMessage: "Enter an updated value or clear the field.",
    updateRequestFields: {
      name: "Service Name",
      name_fr: "Service Name (French)",
      description: "Description",
      description_fr: "Description (French)",
      phone: "Phone",
      email: "Email",
      url: "Website",
      address: "Address",
      hours_text: "Hours",
      hours_text_fr: "Hours (French)",
      eligibility_notes: "Eligibility Notes",
      eligibility_notes_fr: "Eligibility Notes (French)",
      access_script: "Access Script",
      access_script_fr: "Access Script (French)",
      status: "Status",
    },
  },
} as const

describe("PartnerActionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: { success: true, message: "Update request submitted" },
      }),
    })
    vi.stubGlobal("fetch", mockFetch)
  })

  it("renders the claim flow and the update request action", () => {
    renderWithProviders(<PartnerActionsPanel serviceId="svc-123" serviceName="Test Service" showClaimAction={true} />, {
      messages,
    })

    expect(screen.getByText("Do you manage this service?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Claim Listing" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Request Data Update" })).toBeInTheDocument()
  })

  it(
    "submits an update request from the live partner action entrypoint",
    async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <PartnerActionsPanel serviceId="svc-123" serviceName="Test Service" showClaimAction={false} />,
        {
          messages,
        }
      )

      await user.click(screen.getByRole("button", { name: "Request Data Update" }))
      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByRole("option", { name: "Website" }))
      await user.type(screen.getAllByRole("textbox")[0]!, "https://example.org/updated")
      await user.click(screen.getByRole("button", { name: "Submit Update Request" }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/v1/services/svc-123/update-request",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              field_updates: { url: "https://example.org/updated" },
            }),
          })
        )
      })
    },
    INTERACTION_TEST_TIMEOUT_MS
  )

  it(
    "shows the auth-required error when the live entrypoint returns 401",
    async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: { message: "Unauthorized" } }),
      })

      renderWithProviders(
        <PartnerActionsPanel serviceId="svc-123" serviceName="Test Service" showClaimAction={false} />,
        {
          messages,
        }
      )

      await user.click(screen.getByRole("button", { name: "Request Data Update" }))
      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByRole("option", { name: "Phone" }))
      await user.type(screen.getAllByRole("textbox")[0]!, "613-555-1234")
      await user.click(screen.getByRole("button", { name: "Submit Update Request" }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error",
            description: "Please log in as a partner to request updates.",
            variant: "destructive",
          })
        )
      })
    },
    INTERACTION_TEST_TIMEOUT_MS
  )

  it(
    "resets the modal after closing and reopening",
    async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <PartnerActionsPanel serviceId="svc-123" serviceName="Test Service" showClaimAction={false} />,
        {
          messages,
        }
      )

      await user.click(screen.getByRole("button", { name: "Request Data Update" }))
      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByRole("option", { name: "Service Name" }))
      await user.type(screen.getAllByRole("textbox")[0]!, "Updated Service")
      await user.click(screen.getByRole("button", { name: "Cancel" }))
      await user.click(screen.getByRole("button", { name: "Request Data Update" }))

      expect(screen.getByText("Select a field...")).toBeInTheDocument()
      expect(screen.getAllByRole("textbox")[0]).toHaveValue("")
    },
    INTERACTION_TEST_TIMEOUT_MS
  )
})
