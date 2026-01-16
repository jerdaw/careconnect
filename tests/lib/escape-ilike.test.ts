import { describe, it, expect } from "vitest"

/**
 * Tests for ILIKE escaping in search APIs.
 * The escapeIlike function is inline in the route handlers,
 * so we test the logic directly here.
 */
describe("escapeIlike", () => {
  // Mirror the inline function from the API routes
  const escapeIlike = (value: string) => value.replace(/[%_\\]/g, "\\$&")

  describe("wildcard escaping", () => {
    it("should escape percent signs", () => {
      expect(escapeIlike("100%")).toBe("100\\%")
      expect(escapeIlike("50% off")).toBe("50\\% off")
    })

    it("should escape underscores", () => {
      expect(escapeIlike("hello_world")).toBe("hello\\_world")
      expect(escapeIlike("_private")).toBe("\\_private")
    })

    it("should escape backslashes", () => {
      expect(escapeIlike("path\\to\\file")).toBe("path\\\\to\\\\file")
    })

    it("should escape multiple special characters", () => {
      expect(escapeIlike("50%_discount\\special")).toBe("50\\%\\_discount\\\\special")
    })
  })

  describe("normal text", () => {
    it("should not modify normal text", () => {
      expect(escapeIlike("Hello World")).toBe("Hello World")
      expect(escapeIlike("food bank")).toBe("food bank")
      expect(escapeIlike("mental health")).toBe("mental health")
    })

    it("should preserve spaces and punctuation", () => {
      expect(escapeIlike("Kingston, ON")).toBe("Kingston, ON")
      expect(escapeIlike("Call 613-555-1234")).toBe("Call 613-555-1234")
    })
  })

  describe("edge cases", () => {
    it("should handle empty string", () => {
      expect(escapeIlike("")).toBe("")
    })

    it("should handle string with only special chars", () => {
      expect(escapeIlike("%_%")).toBe("\\%\\_\\%")
    })
  })
})
