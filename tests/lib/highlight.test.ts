import { describe, it, expect } from "vitest"
import { highlightMatches } from "@/lib/search/highlight"

describe("highlightMatches", () => {
  describe("basic functionality", () => {
    it("should return empty string for empty/null text", () => {
      expect(highlightMatches("", ["test"])).toBe("")
      // @ts-expect-error Testing null input
      expect(highlightMatches(null, ["test"])).toBe("")
    })

    it("should return escaped text if no tokens provided", () => {
      expect(highlightMatches("Hello World", [])).toBe("Hello World")
      // @ts-expect-error Testing null tokens
      expect(highlightMatches("Hello World", null)).toBe("Hello World")
    })

    it("should wrap matching tokens in mark tags", () => {
      const result = highlightMatches("Hello World", ["World"])
      expect(result).toContain('<mark class="bg-yellow-200')
      expect(result).toContain(">World</mark>")
    })

    it("should match case-insensitively", () => {
      const result = highlightMatches("Hello WORLD", ["world"])
      expect(result).toContain(">WORLD</mark>")
    })
  })

  describe("XSS prevention", () => {
    it("should escape HTML entities in text", () => {
      const result = highlightMatches("<script>alert(1)</script>", [])
      expect(result).toBe("&lt;script&gt;alert(1)&lt;/script&gt;")
      expect(result).not.toContain("<script>")
    })

    it("should escape HTML entities before highlighting", () => {
      const result = highlightMatches("<b>Hello</b> World", ["World"])
      expect(result).toContain("&lt;b&gt;Hello&lt;/b&gt;")
      expect(result).toContain(">World</mark>")
      expect(result).not.toContain("<b>Hello</b>")
    })

    it("should escape ampersands", () => {
      const result = highlightMatches("Tom & Jerry", [])
      expect(result).toBe("Tom &amp; Jerry")
    })

    it("should escape quotes", () => {
      const result = highlightMatches('Say "Hello"', [])
      expect(result).toBe("Say &quot;Hello&quot;")
    })

    it("should escape single quotes", () => {
      const result = highlightMatches("It's fine", [])
      expect(result).toBe("It&#039;s fine")
    })

    it("should handle malicious input with script tags and highlighting", () => {
      const maliciousInput = '<img src=x onerror="alert(1)">'
      const result = highlightMatches(maliciousInput, ["alert"])
      // The < and > should be escaped, alert should be highlighted
      expect(result).not.toContain("<img")
      expect(result).toContain("&lt;img")
      expect(result).toContain(">alert</mark>")
    })
  })

  describe("regex special characters", () => {
    it("should handle tokens with regex special chars", () => {
      const result = highlightMatches("Price is $100.00", ["$100.00"])
      expect(result).toContain(">$100.00</mark>")
    })

    it("should handle parentheses in tokens", () => {
      const result = highlightMatches("Call (613) 555-1234", ["(613)"])
      expect(result).toContain(">(613)</mark>")
    })
  })
})
