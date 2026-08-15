export type PublicServiceMode = "active" | "retired"

/**
 * Source-controlled public-service release mode.
 *
 * The retirement branch is intentionally armed, but the built release must
 * not be deployed until the approval gates in the retirement disposition pass.
 */
export const PUBLIC_SERVICE_MODE: PublicServiceMode = "retired"
