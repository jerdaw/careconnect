"use client"

import { useState, useEffect, useCallback } from "react"
import { pushManager } from "@/lib/notifications/push-manager"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import type { NotificationCategory } from "@/types/notifications"

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  subscribedCategories: NotificationCategory[]
  isLoading: boolean
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    subscribedCategories: [],
    isLoading: true,
  })

  // We use this to persist user choices *before* we successfully sync with server
  const [preferences, setPreferences] = useLocalStorage<NotificationCategory[]>("preferred_notification_categories", [])

  useEffect(() => {
    const checkState = async () => {
      // Basic browser support check
      if (typeof window === "undefined" || !("PushManager" in window) || !("serviceWorker" in navigator)) {
        setState((prev) => ({ ...prev, isSupported: false, isLoading: false }))
        return
      }

      // Feature support is true
      const permission = await pushManager.getPermissionStatus()
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      setState({
        isSupported: true,
        permission,
        isSubscribed: !!subscription,
        subscribedCategories: preferences,
        isLoading: false,
      })
    }

    checkState()
  }, [preferences]) // Re-run when preferences change to keep UI in sync

  const subscribe = useCallback(
    async (categories: NotificationCategory[]) => {
      setState((prev) => ({ ...prev, isLoading: true }))

      const hasPermission = await pushManager.requestPermission()
      if (!hasPermission) {
        setState((prev) => ({ ...prev, permission: "denied", isLoading: false }))
        return false
      }

      const subscription = await pushManager.subscribe(categories)
      if (subscription) {
        setPreferences(categories)
        setState((prev) => ({
          ...prev,
          permission: "granted",
          isSubscribed: true,
          subscribedCategories: categories,
          isLoading: false,
        }))
        return true
      }

      setState((prev) => ({ ...prev, isLoading: false }))
      return false
    },
    [setPreferences]
  )

  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const success = await pushManager.unsubscribe()
    if (success) {
      setPreferences([])
      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscribedCategories: [],
        isLoading: false,
      }))
      return true
    }
    setState((prev) => ({ ...prev, isLoading: false }))
    return false
  }, [setPreferences])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}
