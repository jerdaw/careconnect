"use client"

import { useEffect, useState, useRef } from "react"
import OneSignal from "react-onesignal"
import { env } from "@/lib/env"

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const initRef = useRef(false)

  useEffect(() => {
    // Client-side only
    if (typeof window === "undefined" || initRef.current) return

    // Check if push is supported
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)

    // Init OneSignal
    const initOneSignal = async () => {
      try {
        if (!env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
          console.warn("[OneSignal] App ID not found.")
          return
        }

        await OneSignal.init({
          appId: env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true, // For dev
        })
        initRef.current = true

        // Initial state check
        const permissionState = Notification.permission
        setPermission(permissionState)

        if (permissionState === "granted") {
          // Check if we have a subscription ID
          const id = await OneSignal.User.PushSubscription.id
          setIsSubscribed(!!id)
        }

        // Listeners for changes
        OneSignal.User.PushSubscription.addEventListener("change", (e) => {
          setIsSubscribed(!!e.current.id)
        })
      } catch (err) {
        console.error("[OneSignal] Init failed", err)
      }
    }

    initOneSignal()
  }, [])

  /**
   * Request permission and subscribe
   */
  const subscribe = async () => {
    if (!initRef.current) return
    try {
      // 1. Request Browser Permission
      await OneSignal.Notifications.requestPermission()

      // 2. Opt In (if not auto-subscribed)
      const pushSubscription = OneSignal.User?.PushSubscription
      if (pushSubscription) {
        await pushSubscription.optIn()
      }

      setPermission(Notification.permission)
    } catch (err) {
      console.error("[OneSignal] Subscription failed", err)
    }
  }

  /**
   * Unsubscribe (Opt Out)
   */
  const unsubscribe = async () => {
    if (!initRef.current) return
    try {
      const pushSubscription = OneSignal.User?.PushSubscription
      if (pushSubscription) {
        await pushSubscription.optOut()
        setIsSubscribed(false)
      }
    } catch (err) {
      console.error("[OneSignal] Unsubscribe failed", err)
    }
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    OneSignal, // Export instance if needed elsewhere
  }
}
