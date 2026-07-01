/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

const VOID_TAGS = new Set(["br", "hr", "img", "input", "link", "meta"])
const TAG_PATTERN = /<\/?([A-Za-z][A-Za-z0-9-]*)(?:\s[^>]*)?>/g
const HAS_TAG_PATTERN = /<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^>]*)?>/

interface TaggedMessage {
  file: string
  keyPath: string
  value: string
}

function collectTaggedMessages(value: unknown, file: string, keyPath: string[] = []): TaggedMessage[] {
  if (typeof value === "string") {
    return HAS_TAG_PATTERN.test(value) ? [{ file, keyPath: keyPath.join("."), value }] : []
  }

  if (!value || typeof value !== "object") {
    return []
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    collectTaggedMessages(nestedValue, file, [...keyPath, key])
  )
}

function validateBalancedTags(message: string): string[] {
  const stack: string[] = []
  const issues: string[] = []
  const matches = message.matchAll(TAG_PATTERN)

  for (const match of matches) {
    const rawTag = match[0]
    const tagName = match[1]?.toLowerCase()

    if (!tagName || VOID_TAGS.has(tagName) || rawTag.endsWith("/>")) {
      continue
    }

    if (rawTag.startsWith("</")) {
      const expected = stack.pop()
      if (expected !== tagName) {
        issues.push(`expected </${expected ?? "none"}> but found </${tagName}>`)
      }
      continue
    }

    stack.push(tagName)
  }

  if (stack.length > 0) {
    issues.push(`unclosed tags: ${stack.join(", ")}`)
  }

  return issues
}

describe("localized rich text messages", () => {
  it("keeps markup tags balanced in translated message strings", () => {
    const messagesDir = path.join(process.cwd(), "messages")
    const taggedMessages = readdirSync(messagesDir)
      .filter((entry) => entry.endsWith(".json"))
      .flatMap((file) => {
        const content = JSON.parse(readFileSync(path.join(messagesDir, file), "utf8")) as unknown
        return collectTaggedMessages(content, file)
      })

    expect(taggedMessages.length).toBeGreaterThan(0)

    const failures = taggedMessages.flatMap((message) =>
      validateBalancedTags(message.value).map((issue) => `${message.file}:${message.keyPath}: ${issue}`)
    )

    expect(failures).toEqual([])
  })
})
