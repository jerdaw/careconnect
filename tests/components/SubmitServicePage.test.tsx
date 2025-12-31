import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import SubmitServicePage from "@/app/[locale]/submit-service/page"
import { NextIntlClientProvider } from "next-intl"

// Mock translations
const messages = {
  SubmitService: {
    title: "Submit a Service",
    description: "Help us grow our database",
    serviceName: "Service Name",
    serviceDesc: "Description",
    phone: "Phone",
    website: "Website",
    address: "Address",
    submit: "Submit",
    submitting: "Submitting...",
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

describe("SubmitServicePage", () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it("renders form fields correctly", () => {
    render(
      <Wrapper>
        <SubmitServicePage />
      </Wrapper>
    )

    expect(screen.getByLabelText("Service Name")).toBeDefined()
    expect(screen.getByLabelText("Description")).toBeDefined()
    expect(screen.getByLabelText("Phone")).toBeDefined()
    expect(screen.getByLabelText("Website")).toBeDefined()
    expect(screen.getByLabelText("Address")).toBeDefined()
    expect(screen.getByRole("button", { name: "Submit" })).toBeDefined()
  })

  it("handles successful submission", async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <Wrapper>
        <SubmitServicePage />
      </Wrapper>
    )

    // Fill out form
    fireEvent.change(screen.getByLabelText("Service Name"), { target: { value: "Test Service" } })
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "A very good service description that is long enough." },
    })

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    // Check for loading state (optional, might happen too fast)
    // expect(screen.getByText('Submitting...')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeDefined()
    })
  })

  it("resets form after success", async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <Wrapper>
        <SubmitServicePage />
      </Wrapper>
    )

    fireEvent.change(screen.getByLabelText("Service Name"), { target: { value: "Test Service" } })
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Description text" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeDefined()
    })

    fireEvent.click(screen.getByText("Submit Another"))

    expect(screen.getByLabelText("Service Name")).toBeDefined()
    // Should be empty or reset state
    expect((screen.getByLabelText("Service Name") as HTMLInputElement).value).toBe("")
  })
})
