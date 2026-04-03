/**
 * Intentional one-way compatibility with pre-CareConnect client storage.
 * These values must remain stable until legacy browser data has been migrated.
 */
export const LEGACY_BRAND_KEYS = {
  translationBannerDismissed: ["helpbridge-translation-banner-dismissed", "kcc-translation-banner-dismissed"],
  highContrast: ["helpbridge-high-contrast", "kcc-high-contrast"],
  savedSearches: ["helpbridge_saved_searches", "kcc_saved_searches"],
  userContext: ["helpbridge_user_context", "kcc_user_context"],
  servicesCache: ["helpbridge-services-cache", "kcc-services-cache"],
  offlineDbNames: ["helpbridge-offline-v1", "kcc-offline-v1"],
  vectorDbNames: ["helpbridge-vector-store"],
} as const
