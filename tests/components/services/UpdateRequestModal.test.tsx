import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { renderWithProviders, screen, waitFor } from "@/tests/utils/test-wrapper"
import { UpdateRequestModal } from "@/components/services/UpdateRequestModal"
import { useToast } from "@/components/ui/use-toast"

vi.mock("@/components/ui/use-toast", () => ({
  useToast: vi.fn(),
}))

const mockToast = vi.fn()
const mockFetch = vi.fn()

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
}

const getValueInput = () => {
  const [input] = screen.getAllByRole("textbox")
  expect(input).toBeDefined()
  return input as HTMLElement
}

describe("UpdateRequestModal", () => {
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

  it("submits a structured single-field payload and closes on success", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    renderWithProviders(
      <UpdateRequestModal serviceId="svc-123" serviceName="Test Service" isOpen={true} onClose={onClose} />,
      { messages }
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: "Phone" }))

    await user.type(getValueInput(), "613-555-1234")
    await user.type(screen.getByLabelText("Source / Justification"), "Official provider update")
    await user.click(screen.getByRole("button", { name: "Submit Update Request" }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const requestInit = mockFetch.mock.calls[0]?.[1] as RequestInit | undefined
    if (!requestInit) {
      throw new Error("Expected fetch request init to be defined")
    }
    expect(JSON.parse(requestInit.body as string)).toEqual({
      field_updates: { phone: "613-555-1234" },
      justification: "Official provider update",
    })
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Request Submitted",
      })
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  }, 10000)

  it("sends null when clearing an optional field", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <UpdateRequestModal serviceId="svc-123" serviceName="Test Service" isOpen={true} onClose={vi.fn()} />,
      { messages }
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: "Phone" }))
    await user.click(screen.getByRole("checkbox", { name: "Clear this field" }))
    await user.click(screen.getByRole("button", { name: "Submit Update Request" }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const requestInit = mockFetch.mock.calls[0]?.[1] as RequestInit | undefined
    if (!requestInit) {
      throw new Error("Expected fetch request init to be defined")
    }
    expect(JSON.parse(requestInit.body as string)).toEqual({
      field_updates: { phone: null },
    })
  })

  it("keeps submit disabled until a field and value are provided", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <UpdateRequestModal serviceId="svc-123" serviceName="Test Service" isOpen={true} onClose={vi.fn()} />,
      { messages }
    )

    const submitButton = screen.getByRole("button", { name: "Submit Update Request" })
    expect(submitButton).toBeDisabled()

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: "Service Name" }))
    expect(submitButton).toBeDisabled()

    await user.type(getValueInput(), "New Name")
    expect(submitButton).not.toBeDisabled()
  })

  it("shows the auth-required error toast on 401 responses", async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({
        error: { message: "Unauthorized" },
      }),
    })

    renderWithProviders(
      <UpdateRequestModal serviceId="svc-123" serviceName="Test Service" isOpen={true} onClose={vi.fn()} />,
      { messages }
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: "Phone" }))
    await user.type(getValueInput(), "613-555-1234")
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
  })

  it("shows API error messages in the destructive toast", async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: { message: "Invalid update data" },
      }),
    })

    renderWithProviders(
      <UpdateRequestModal serviceId="svc-123" serviceName="Test Service" isOpen={true} onClose={vi.fn()} />,
      { messages }
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: "Website" }))
    await user.type(getValueInput(), "not-a-url")
    await user.click(screen.getByRole("button", { name: "Submit Update Request" }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "Invalid update data",
          variant: "destructive",
        })
      )
    })
  })
})
