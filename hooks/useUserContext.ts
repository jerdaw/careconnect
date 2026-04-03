"use client"

import { useLocalStorage } from "./useLocalStorage"
import type { UserContext, AgeGroup, IdentityTag } from "@/types/user-context"
import { LEGACY_BRAND_KEYS } from "@/lib/legacy-brand"

const DEFAULT_CONTEXT: UserContext = {
  ageGroup: null,
  identities: [],
  hasOptedIn: false,
}

export function useUserContext() {
  const [context, setContext, clearContext] = useLocalStorage<UserContext>(
    "careconnect_user_context",
    DEFAULT_CONTEXT,
    {
      legacyKeys: [...LEGACY_BRAND_KEYS.userContext],
    }
  )

  const updateAgeGroup = (ageGroup: AgeGroup | null) => {
    setContext((prev) => ({ ...prev, ageGroup }))
  }

  const toggleIdentity = (tag: IdentityTag) => {
    setContext((prev) => ({
      ...prev,
      identities: prev.identities.includes(tag) ? prev.identities.filter((t) => t !== tag) : [...prev.identities, tag],
    }))
  }

  const optIn = () => setContext((prev) => ({ ...prev, hasOptedIn: true }))
  const optOut = () => clearContext()

  return { context, updateAgeGroup, toggleIdentity, optIn, optOut }
}
