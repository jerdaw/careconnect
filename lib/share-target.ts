import { z } from "zod"

export const SHARE_TARGET_QUERY_COOKIE_NAME = "careconnect_share_query"
export const SHARE_TARGET_QUERY_COOKIE_MAX_AGE_SECONDS = 60

export const ShareTargetPayloadSchema = z.object({
  query: z.string().trim().min(1).max(500),
})

export type ShareTargetPayload = z.infer<typeof ShareTargetPayloadSchema>

function normalizeShareTargetCandidate(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function selectShareTargetQuery(input: { text?: unknown; title?: unknown; url?: unknown }): string {
  return (
    normalizeShareTargetCandidate(input.text) ||
    normalizeShareTargetCandidate(input.title) ||
    normalizeShareTargetCandidate(input.url) ||
    ""
  )
}

export function serializeShareTargetPayload(payload: ShareTargetPayload): string {
  return encodeURIComponent(JSON.stringify(payload))
}

export function parseShareTargetPayload(rawValue: string | null): ShareTargetPayload | null {
  if (!rawValue) {
    return null
  }

  try {
    const decoded = decodeURIComponent(rawValue)
    const parsed = JSON.parse(decoded) as unknown
    const validation = ShareTargetPayloadSchema.safeParse(parsed)
    return validation.success ? validation.data : null
  } catch {
    return null
  }
}

export function getCookieValue(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(";")

  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.trim().split("=")
    if (cookieName === name) {
      return valueParts.join("=")
    }
  }

  return null
}

export function consumeShareTargetQueryFromDocument(doc: Document = document): string | null {
  const rawValue = getCookieValue(doc.cookie, SHARE_TARGET_QUERY_COOKIE_NAME)
  const payload = parseShareTargetPayload(rawValue)

  const secureAttribute = doc.defaultView?.location.protocol === "https:" ? "; Secure" : ""
  doc.cookie = `${SHARE_TARGET_QUERY_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${secureAttribute}`

  return payload?.query ?? null
}
