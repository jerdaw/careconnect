export const BRAND_NAME = "CareConnect" as const
export const BRAND_SLUG = "careconnect" as const
export const CANONICAL_HOST = "careconnect.ing" as const
export const CANONICAL_URL = `https://${CANONICAL_HOST}` as const
export const APP_ID = "ca.careconnect.app" as const
export const REPOSITORY_URL = "https://github.com/jerdaw/careconnect" as const

function normalizeUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "")
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function getPublicBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ? normalizeUrl(process.env.NEXT_PUBLIC_BASE_URL) : CANONICAL_URL
}

export function getPublicAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL)
  }

  if (process.env.VERCEL_URL) {
    return normalizeUrl(process.env.VERCEL_URL)
  }

  return CANONICAL_URL
}
