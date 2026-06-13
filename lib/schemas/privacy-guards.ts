const DISALLOWED_PRIVACY_KEYS = new Set([
  "client_address",
  "client_name",
  "comment",
  "comments",
  "contact_email",
  "contact_name",
  "contact_phone",
  "email",
  "email_address",
  "first_name",
  "free_text",
  "full_name",
  "home_address",
  "last_name",
  "message",
  "note",
  "notes",
  "person_name",
  "phone",
  "phone_number",
  "query",
  "query_text",
  "street_address",
  "user_text",
])

function walk(value: unknown, path: string[] = [], found: string[] = []): string[] {
  if (!value || typeof value !== "object") {
    return found
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, [...path, String(index)], found))
    return found
  }

  const record = value as Record<string, unknown>
  for (const [key, nestedValue] of Object.entries(record)) {
    const nextPath = [...path, key]
    if (DISALLOWED_PRIVACY_KEYS.has(key.toLowerCase())) {
      found.push(nextPath.join("."))
    }
    walk(nestedValue, nextPath, found)
  }

  return found
}

export function findDisallowedPrivacyKeyPaths(payload: unknown): string[] {
  return walk(payload)
}
