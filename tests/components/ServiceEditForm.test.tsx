import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ServiceEditForm } from "@/components/partner/ServiceEditForm"
import { NextIntlClientProvider } from "next-intl"
import { VerificationLevel, IntentCategory } from "@/types/service"

// Mock translations
const messages = {
  Dashboard: {
    services: {
      name: "Name",
      description: "Description",
      phone: "Phone",
      website: "Website",
      address: "Address",
      hours: "Hours",
      eligibility: "Eligibility",
      saveChanges: "Save Changes",
      englishLabel: "EN",
      frenchLabel: "FR",
    },
  },
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
)

const mockService = {
  id: "1",
  name: "Test Service",
  name_fr: "Service de Test",
  description: "A test service description that is long enough.",
  description_fr: "Une description de service de test assez longue.",
  verification_level: VerificationLevel.L1,
  intent_category: IntentCategory.Food,
  provenance: {
    verified_by: "test",
    verified_at: new Date().toISOString(),
    evidence_url: "http://test.com",
    method: "test",
  },
  synthetic_queries: [],
}

describe("ServiceEditForm", () => {
  it("renders English and French fields", () => {
    render(
      <Wrapper>
        <ServiceEditForm service={mockService} onSave={vi.fn()} />
      </Wrapper>
    )

    // Check for bilingual labels
    expect(screen.getByText("Name (EN)")).toBeDefined()
    expect(screen.getByText("Name (FR)")).toBeDefined()
    expect(screen.getByText("Description (EN)")).toBeDefined()
    expect(screen.getByText("Description (FR)")).toBeDefined()
  })

  it("populates fields with existing data", () => {
    render(
      <Wrapper>
        <ServiceEditForm service={mockService} onSave={vi.fn()} />
      </Wrapper>
    )

    expect(screen.getByDisplayValue("Test Service")).toBeDefined()
    expect(screen.getByDisplayValue("Service de Test")).toBeDefined()
  })
})
