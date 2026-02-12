import { describe, it, expect } from "vitest"
import {
  CSVImportRowSchema,
  validateCSVRow,
  validateCSVBatch,
  normalizeCSVHeaders,
  CSV_FIELD_MAPPING,
} from "@/lib/schemas/service-csv-import"

describe("CSV Import Schema", () => {
  describe("normalizeCSVHeaders", () => {
    it("should normalize common header variations to canonical names", () => {
      const input = ["Name", "Description", "Category", "Phone", "Website"]
      const expected = ["name", "description", "intent_category", "phone", "url"]
      expect(normalizeCSVHeaders(input)).toEqual(expected)
    })

    it("should handle mixed case and variations", () => {
      const input = ["Service Name", "desc", "Type", "Email Address", "website"]
      const expected = ["name", "description", "intent_category", "email", "url"]
      expect(normalizeCSVHeaders(input)).toEqual(expected)
    })

    it("should preserve unknown headers as-is", () => {
      const input = ["name", "custom_field", "description"]
      const expected = ["name", "custom_field", "description"]
      expect(normalizeCSVHeaders(input)).toEqual(expected)
    })

    it("should trim whitespace from headers", () => {
      const input = ["  Name  ", " Description ", "Category"]
      const expected = ["name", "description", "intent_category"]
      expect(normalizeCSVHeaders(input)).toEqual(expected)
    })
  })

  describe("CSVImportRowSchema - Valid Data", () => {
    it("should accept a valid row with all required fields", () => {
      const validRow = {
        name: "Kingston Food Bank",
        description: "Provides emergency food assistance to individuals and families in need",
        intent_category: "Food",
        phone: "613-546-1111",
        address: "100 Main St, Kingston ON",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Kingston Food Bank")
        expect(result.data.intent_category).toBe("Food")
      }
    })

    it("should accept Crisis category with phone number", () => {
      const validRow = {
        name: "Crisis Line",
        description: "24/7 crisis support and intervention services",
        intent_category: "Crisis",
        phone: "1-800-273-8255",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
    })

    it("should transform 'Other' category to 'Community'", () => {
      const validRow = {
        name: "Community Center",
        description: "General community support and programming",
        intent_category: "Other",
        address: "200 Community Dr",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.intent_category).toBe("Community")
      }
    })

    it("should trim whitespace from string fields", () => {
      const validRow = {
        name: "  Service Name  ",
        description: "  Service description with extra spaces  ",
        intent_category: " Food ",
        phone: " 613-546-1111 ",
        email: " test@example.com ",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Service Name")
        expect(result.data.description).toBe("Service description with extra spaces")
        expect(result.data.intent_category).toBe("Food")
        expect(result.data.phone).toBe("613-546-1111")
        expect(result.data.email).toBe("test@example.com")
      }
    })

    it("should accept URL as contact method", () => {
      const validRow = {
        name: "Online Service",
        description: "Virtual support services available online",
        intent_category: "Wellness",
        url: "https://example.com",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
    })

    it("should handle optional fields correctly", () => {
      const validRow = {
        name: "Service with extras",
        description: "Service with optional fields populated",
        intent_category: "Health",
        phone: "613-546-1111",
        fees: "Free",
        eligibility: "Open to all residents",
        hours_text: "Mon-Fri 9am-5pm",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.fees).toBe("Free")
        expect(result.data.eligibility).toBe("Open to all residents")
        expect(result.data.hours_text).toBe("Mon-Fri 9am-5pm")
      }
    })
  })

  describe("CSVImportRowSchema - Invalid Data", () => {
    it("should reject row missing name", () => {
      const invalidRow = {
        description: "Missing name field",
        intent_category: "Food",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("name"))).toBe(true)
      }
    })

    it("should reject row with name too short", () => {
      const invalidRow = {
        name: "",
        description: "Empty name field",
        intent_category: "Food",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
    })

    it("should reject row missing description", () => {
      const invalidRow = {
        name: "Service Name",
        intent_category: "Food",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("description"))).toBe(true)
      }
    })

    it("should reject description too short", () => {
      const invalidRow = {
        name: "Service Name",
        description: "Too short",
        intent_category: "Food",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("at least 10 characters"))).toBe(true)
      }
    })

    it("should reject invalid intent_category", () => {
      const invalidRow = {
        name: "Service Name",
        description: "Valid description here",
        intent_category: "InvalidCategory",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
    })

    it("should reject row with no contact methods", () => {
      const invalidRow = {
        name: "Service Name",
        description: "Valid description without contact info",
        intent_category: "Food",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("contact method"))).toBe(true)
      }
    })

    it("should reject Crisis service without phone number", () => {
      const invalidRow = {
        name: "Crisis Service",
        description: "Crisis service without phone number",
        intent_category: "Crisis",
        url: "https://example.com",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("Crisis services require"))).toBe(true)
      }
    })

    it("should reject invalid email format", () => {
      const invalidRow = {
        name: "Service Name",
        description: "Service with invalid email",
        intent_category: "Food",
        email: "not-an-email",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("Invalid email"))).toBe(true)
      }
    })

    it("should reject invalid URL format", () => {
      const invalidRow = {
        name: "Service Name",
        description: "Service with invalid URL",
        intent_category: "Food",
        url: "not-a-url",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("Invalid URL"))).toBe(true)
      }
    })

    it("should reject invalid phone format", () => {
      const invalidRow = {
        name: "Service Name",
        description: "Service with invalid phone",
        intent_category: "Food",
        phone: "invalid-phone!@#",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("Invalid phone"))).toBe(true)
      }
    })

    it("should reject unknown fields (strict mode)", () => {
      const invalidRow = {
        name: "Service Name",
        description: "Valid description here",
        intent_category: "Food",
        phone: "613-546-1111",
        unknown_field: "should not be here",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
    })
  })

  describe("validateCSVRow", () => {
    it("should return isValid=true for valid row", () => {
      const validRow = {
        name: "Test Service",
        description: "This is a valid test service description",
        intent_category: "Food",
        phone: "613-546-1111",
      }

      const result = validateCSVRow(validRow, 1)
      expect(result.isValid).toBe(true)
      expect(result.rowIndex).toBe(1)
      expect(result.data).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    it("should return isValid=false with errors for invalid row", () => {
      const invalidRow = {
        name: "",
        description: "Short",
        intent_category: "InvalidCategory",
      }

      const result = validateCSVRow(invalidRow, 5)
      expect(result.isValid).toBe(false)
      expect(result.rowIndex).toBe(5)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it("should include field names in error messages", () => {
      const invalidRow = {
        name: "Test",
        description: "Too short",
        intent_category: "Food",
      }

      const result = validateCSVRow(invalidRow, 1)
      expect(result.isValid).toBe(false)
      expect(result.errors?.some((e) => e.field === "description")).toBe(true)
    })
  })

  describe("validateCSVBatch", () => {
    it("should validate multiple rows correctly", () => {
      const rows: Record<string, string>[] = [
        {
          name: "Valid Service 1",
          description: "This is a valid service with proper description",
          intent_category: "Food",
          phone: "613-546-1111",
        },
        {
          name: "",
          description: "Invalid - missing name",
          intent_category: "Food",
          phone: "613-546-1111",
        },
        {
          name: "Valid Service 2",
          description: "Another valid service with good description",
          intent_category: "Health",
          url: "https://example.com",
        },
      ]

      const results = validateCSVBatch(rows)
      expect(results).toHaveLength(3)
      expect(results[0]!.isValid).toBe(true)
      expect(results[1]!.isValid).toBe(false)
      expect(results[2]!.isValid).toBe(true)
    })

    it("should use 1-indexed row numbers", () => {
      const rows: Record<string, string>[] = [
        {
          name: "Test Service",
          description: "Valid description here",
          intent_category: "Food",
          phone: "613-546-1111",
        },
      ]

      const results = validateCSVBatch(rows)
      expect(results[0]!.rowIndex).toBe(1) // 1-indexed, not 0
    })

    it("should handle empty batch", () => {
      const results = validateCSVBatch([])
      expect(results).toHaveLength(0)
    })
  })

  describe("CSV_FIELD_MAPPING", () => {
    it("should include all common header variations", () => {
      expect(CSV_FIELD_MAPPING["name"]).toBe("name")
      expect(CSV_FIELD_MAPPING["Name"]).toBe("name")
      expect(CSV_FIELD_MAPPING["Service Name"]).toBe("name")
      expect(CSV_FIELD_MAPPING["category"]).toBe("intent_category")
      expect(CSV_FIELD_MAPPING["website"]).toBe("url")
      expect(CSV_FIELD_MAPPING["telephone"]).toBe("phone")
    })
  })

  describe("Edge Cases", () => {
    it("should convert empty optional strings to undefined", () => {
      const validRow = {
        name: "Service Name",
        description: "Valid description here",
        intent_category: "Food",
        phone: "613-546-1111",
        email: "",
        fees: "   ",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBeUndefined()
        expect(result.data.fees).toBeUndefined()
      }
    })

    it("should handle very long description within limit", () => {
      const validRow = {
        name: "Service Name",
        description: "A".repeat(2000), // Max 2000 chars
        intent_category: "Food",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
    })

    it("should reject description exceeding limit", () => {
      const invalidRow = {
        name: "Service Name",
        description: "A".repeat(2001), // Over 2000 chars
        intent_category: "Food",
        phone: "613-546-1111",
      }

      const result = CSVImportRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
    })

    it("should accept international phone formats", () => {
      const validRow = {
        name: "Service Name",
        description: "Service with international phone",
        intent_category: "Food",
        phone: "+1 (613) 546-1111",
      }

      const result = CSVImportRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
    })
  })
})
