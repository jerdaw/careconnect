import crypto from "crypto"

/**
 * Generates an anonymous pattern hash from query tokens.
 * This allows us to detect repeated searches for the same concept without
 * storing the potentially sensitive query text.
 *
 * e.g., "suicide help" -> hash(["suicide", "help"])
 *
 * @param tokens List of tokenized query words
 * @returns SHA-256 hash of sorted tokens
 */
export async function detectQueryPattern(tokens: string[]): Promise<string> {
  if (tokens.length === 0) return ""

  // Sort tokens to make "food bank" and "bank food" generating the same hash
  const sortedDetails = [...tokens].sort().join("|")

  // Create SHA-256 hash
  const encoded = new TextEncoder().encode(sortedDetails)
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}
