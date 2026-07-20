export const DEFAULT_AUTH_REDIRECT = "/en/dashboard"

const CONTROL_CHARACTER_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/

export function safeRelativeRedirect(value: string | null, baseUrl: string, fallback = DEFAULT_AUTH_REDIRECT): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || CONTROL_CHARACTER_OR_BACKSLASH.test(value)) {
    return fallback
  }

  try {
    const base = new URL(baseUrl)
    const resolved = new URL(value, base)

    if (resolved.origin !== base.origin) {
      return fallback
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return fallback
  }
}
