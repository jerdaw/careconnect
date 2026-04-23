export type UrlHealthClassification = "healthy" | "broken" | "inconclusive"

export interface UrlCheckOutcome {
  status: number | "error"
  errorCode?: string
  errorMessage?: string
}

const BROKEN_ERROR_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "ERR_INVALID_URL"])
const INCONCLUSIVE_ERROR_CODES = new Set([
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET",
  "EAI_AGAIN",
  "ECONNRESET",
  "ECONNABORTED",
  "ETIMEDOUT",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "CERT_HAS_EXPIRED",
])

export function classifyUrlCheckOutcome(outcome: UrlCheckOutcome): UrlHealthClassification {
  if (typeof outcome.status === "number") {
    if (outcome.status < 400) {
      return "healthy"
    }

    if (outcome.status === 403 || outcome.status === 429 || outcome.status >= 500) {
      return "inconclusive"
    }

    return "broken"
  }

  if (outcome.errorCode && BROKEN_ERROR_CODES.has(outcome.errorCode)) {
    return "broken"
  }

  if (outcome.errorCode && INCONCLUSIVE_ERROR_CODES.has(outcome.errorCode)) {
    return "inconclusive"
  }

  const errorDetails = `${outcome.errorCode ?? ""} ${outcome.errorMessage ?? ""}`.toLowerCase()

  if (
    errorDetails.includes("redirect count exceeded") ||
    errorDetails.includes("timeout") ||
    errorDetails.includes("certificate") ||
    errorDetails.includes("leaf signature") ||
    errorDetails.includes("aborted") ||
    errorDetails.includes("socket")
  ) {
    return "inconclusive"
  }

  if (
    errorDetails.includes("enotfound") ||
    errorDetails.includes("not found") ||
    errorDetails.includes("econnrefused") ||
    errorDetails.includes("invalid url")
  ) {
    return "broken"
  }

  return "inconclusive"
}
