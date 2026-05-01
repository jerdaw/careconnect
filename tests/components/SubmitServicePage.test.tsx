import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import SubmitServiceForm from "@/components/forms/SubmitServiceForm"
import { NextIntlClientProvider } from "next-intl"

// Mock translations
const messages = {
  SubmitService: {
    title: "Submit a Service",
    description: "Help us grow our database",
    formTitle: "Service details",
    formDescription: "Share what you know.",
    requiredNote: "Fields marked with * are required.",
    serviceName: "Service Name",
    serviceNamePlaceholder: "Kingston Youth Shelter",
    serviceDesc: "Description",
    serviceDescPlaceholder: "Briefly describe the service.",
    serviceDescHint: "Include useful review context.",
    phone: "Phone",
    phonePlaceholder: "(613) 555-0100",
    website: "Website",
    websitePlaceholder: "https://example.org",
    address: "Address",
    addressPlaceholder: "123 Example St, Kingston",
    submitterEmail: "Your email (optional)",
    submitterEmailPlaceholder: "you@example.com",
    submitterEmailHint: "Only used for follow-up.",
    privacyTitle: "Privacy note",
    privacyText: "Do not include sensitive information.",
    submit: "Submit",
    submitting: "Submitting...",
    errorTitle: "Submission problem",
    genericError: "We could not submit this suggestion. Please try again.",
    successTitle: "Success!",
    successMessage: "Thank you for your submission.",
    submitAnother: "Submit Another",
  },
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
)

describe("SubmitServiceForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it("renders form fields correctly", () => {
    render(
      <Wrapper>
        <SubmitServiceForm />
      </Wrapper>
    )

    expect(screen.getByLabelText(/Service Name/i)).toBeDefined()
    expect(screen.getByLabelText(/Description/i)).toBeDefined()
    expect(screen.getByLabelText(/Phone/i)).toBeDefined()
    expect(screen.getByLabelText(/Website/i)).toBeDefined()
    expect(screen.getByLabelText(/Address/i)).toBeDefined()
    expect(screen.getByLabelText(/Your email/i)).toBeDefined()
    expect(screen.getByText("Privacy note")).toBeDefined()
    expect(screen.getByRole("button", { name: "Submit" })).toBeDefined()
  })

  it("handles successful submission", async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <Wrapper>
        <SubmitServiceForm />
      </Wrapper>
    )

    // Fill out form
    fireEvent.change(screen.getByLabelText(/Service Name/i), { target: { value: "Test Service" } })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "A very good service description that is long enough." },
    })
    fireEvent.change(screen.getByLabelText(/Your email/i), {
      target: { value: "submitter@example.org" },
    })

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeDefined()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/submissions",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Service",
          description: "A very good service description that is long enough.",
          submitted_by_email: "submitter@example.org",
        }),
      })
    )
  })

  it("omits optional email when it is not entered", async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <Wrapper>
        <SubmitServiceForm />
      </Wrapper>
    )

    fireEvent.change(screen.getByLabelText(/Service Name/i), { target: { value: "Test Service" } })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "A service description for review." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeDefined()
    })

    const [, options] = (global.fetch as any).mock.calls[0]
    const payload = JSON.parse(options.body)
    expect(payload).not.toHaveProperty("submitted_by_email")
  })

  it("resets form after success", async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <Wrapper>
        <SubmitServiceForm />
      </Wrapper>
    )

    fireEvent.change(screen.getByLabelText(/Service Name/i), { target: { value: "Test Service" } })
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Description text" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeDefined()
    })

    fireEvent.click(screen.getByText("Submit Another"))

    expect(screen.getByLabelText(/Service Name/i)).toBeDefined()
    // Should be empty or reset state
    expect((screen.getByLabelText(/Service Name/i) as HTMLInputElement).value).toBe("")
  })

  it("shows a server error message without clearing the form", async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: "Failed to save submission" }),
    })

    render(
      <Wrapper>
        <SubmitServiceForm />
      </Wrapper>
    )

    fireEvent.change(screen.getByLabelText(/Service Name/i), { target: { value: "Test Service" } })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "A service description for review." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      expect(screen.getByText("Submission problem")).toBeDefined()
      expect(screen.getByText("Failed to save submission")).toBeDefined()
    })

    expect((screen.getByLabelText(/Service Name/i) as HTMLInputElement).value).toBe("Test Service")
  })
})
