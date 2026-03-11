import { describe, it, expect } from "vitest"
import { generateFeedbackLink } from "@/lib/feedback"
import type { Service } from "@/types/service"

describe("generateFeedbackLink", () => {
  const mockService = {
    id: "test-service-123",
    name: "Test Food Bank",
  } as Service

  it("generates a valid mailto link", () => {
    const link = generateFeedbackLink(mockService)

    expect(link).toMatch(/^mailto:/)
    expect(link).toContain("feedback@helpbridge.ca")
  })

  it("includes service name and ID in subject", () => {
    const link = generateFeedbackLink(mockService)

    expect(link).toContain("subject=")
    expect(link).toContain(encodeURIComponent("Test Food Bank"))
    expect(link).toContain(encodeURIComponent("test-service-123"))
  })

  it("includes service ID in body", () => {
    const link = generateFeedbackLink(mockService)

    expect(link).toContain("body=")
    expect(link).toContain(encodeURIComponent("Service ID: test-service-123"))
  })

  it("includes issue type checkboxes in body", () => {
    const link = generateFeedbackLink(mockService)
    const body = decodeURIComponent(link.split("body=")[1] || "")

    expect(body).toContain("[ ] Wrong Phone Number")
    expect(body).toContain("[ ] Wrong Address")
    expect(body).toContain("[ ] Service Closed")
    expect(body).toContain("[ ] Other")
  })

  it("includes source attribution", () => {
    const link = generateFeedbackLink(mockService)
    const body = decodeURIComponent(link.split("body=")[1] || "")

    expect(body).toContain("HelpBridge")
  })

  it("properly URL encodes special characters in service name", () => {
    const serviceWithSpecialChars: Service = {
      ...mockService,
      name: "St. Mary's Food Bank & Pantry",
      id: "special-chars-123",
    }

    const link = generateFeedbackLink(serviceWithSpecialChars)

    // Subject should contain the encoded service name
    expect(link).toContain(encodeURIComponent("St. Mary's Food Bank & Pantry"))
    // Verify ampersand in service name is encoded (important for URL safety)
    const subjectPart = link.split("?subject=")[1]?.split("&body=")[0] || ""
    expect(subjectPart).toContain("%26") // Encoded & from service name
  })

  it("handles service names with unicode characters", () => {
    const serviceWithUnicode: Service = {
      ...mockService,
      name: "Café de la Paix — Kingston",
      id: "unicode-123",
    }

    const link = generateFeedbackLink(serviceWithUnicode)

    expect(link).toContain(encodeURIComponent("Café de la Paix — Kingston"))
  })
})
