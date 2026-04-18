/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest"
import {
  consumeShareTargetQueryFromDocument,
  serializeShareTargetPayload,
  SHARE_TARGET_QUERY_COOKIE_NAME,
} from "@/lib/share-target"

describe("share-target cookie helpers", () => {
  it("hydrates the shared query from the cookie and clears it immediately", () => {
    let cookieValue = `${SHARE_TARGET_QUERY_COOKIE_NAME}=${serializeShareTargetPayload({ query: "food bank" })}`
    const writes: string[] = []
    const mockDocument = {} as Document

    Object.defineProperty(mockDocument, "cookie", {
      get: () => cookieValue,
      set: (value: string) => {
        writes.push(value)
        cookieValue = value
      },
      configurable: true,
    })

    Object.defineProperty(mockDocument, "defaultView", {
      value: { location: { protocol: "http:" } },
      configurable: true,
    })

    expect(consumeShareTargetQueryFromDocument(mockDocument)).toBe("food bank")
    expect(writes.at(-1)).toBe(`${SHARE_TARGET_QUERY_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`)
  })
})
