import { z } from "zod"

const HTTP_URL_PROTOCOLS = new Set(["http:", "https:"])

function getUrlProtocol(value: string): string | null {
  try {
    return new URL(value).protocol
  } catch {
    return null
  }
}

export function httpUrl(message = "URL must use http or https") {
  return z
    .string()
    .trim()
    .url("Invalid URL")
    .refine((value) => {
      const protocol = getUrlProtocol(value)
      return protocol !== null && HTTP_URL_PROTOCOLS.has(protocol)
    }, message)
}

export const HttpUrlOrEmptySchema = httpUrl().optional().or(z.literal(""))
export const NullableHttpUrlSchema = httpUrl().nullable().optional()
