/**
 * Checks if the application is currently offline.
 * Safe to use in both SSR and Client environments.
 */
export const isOffline = (): boolean => {
  if (typeof window === "undefined") return false
  return !window.navigator.onLine
}
