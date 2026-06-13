import { describe, it, expect } from "vitest"
import { findDisallowedPrivacyKeyPaths } from "@/lib/schemas/privacy-guards"

describe("privacy-guards", () => {
  it("finds disallowed keys at top level", () => {
    const result = findDisallowedPrivacyKeyPaths({
      query_text: "need shelter",
      pilot_cycle_id: "v22-cycle-1",
    })

    expect(result).toContain("query_text")
  })

  it("finds disallowed keys in nested objects and arrays", () => {
    const result = findDisallowedPrivacyKeyPaths({
      context: {
        details: {
          notes: "private text",
        },
      },
      events: [{ message: "do not store this" }],
    })

    expect(result).toContain("context.details.notes")
    expect(result).toContain("events.0.message")
  })

  it("finds raw personal contact and free-text fields", () => {
    const result = findDisallowedPrivacyKeyPaths({
      client: {
        full_name: "Example Person",
        email_address: "person@example.test",
        phone_number: "555-0100",
        home_address: "1 Example Street",
      },
      free_text: "unstructured personal context",
      outreach: [{ contact_phone: "555-0101" }],
      comments: "do not persist this",
    })

    expect(result).toContain("client.full_name")
    expect(result).toContain("client.email_address")
    expect(result).toContain("client.phone_number")
    expect(result).toContain("client.home_address")
    expect(result).toContain("free_text")
    expect(result).toContain("outreach.0.contact_phone")
    expect(result).toContain("comments")
  })

  it("returns an empty array when no disallowed keys exist", () => {
    const result = findDisallowedPrivacyKeyPaths({
      pilot_cycle_id: "v22-cycle-1",
      referral_state: "initiated",
    })

    expect(result).toEqual([])
  })
})
