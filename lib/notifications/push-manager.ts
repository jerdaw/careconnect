"use client"

import type { NotificationCategory, PushSubscription } from "@/types/notifications"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null

  async init(): Promise<boolean> {
    if (typeof window === "undefined" || !("PushManager" in window)) {
      console.warn("[Push] PushManager not supported")
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error("[Push] ServiceWorker registration failed:", error)
      return false
    }
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (typeof window === "undefined") return "default"
    return Notification.permission
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined") return false
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  async subscribe(categories: NotificationCategory[]): Promise<PushSubscription | null> {
    if (!VAPID_PUBLIC_KEY) {
      console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY")
      return null
    }

    if (!this.registration) {
      await this.init()
    }

    if (!this.registration) {
      console.error("Service Worker not ready")
      return null
    }

    try {
      // Check existing subscription first
      let subscription = await this.registration.pushManager.getSubscription()

      // If no subscription, create one
      if (!subscription) {
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
        })
      }

      // Send subscription to server
      const response = await fetch("/api/v1/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          categories,
          locale: document.documentElement.lang || "en",
        }),
      })

      if (!response.ok) throw new Error("Failed to save subscription")

      return (await response.json()) as PushSubscription
    } catch (error) {
      console.error("[Push] Subscription failed:", error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) return false

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()

        // Remove from server
        // Note: We use the endpoint as the ID since that's what we have
        await fetch("/api/v1/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }
      return true
    } catch (error) {
      console.error("[Push] Unsubscribe failed:", error)
      return false
    }
  }

  // Utility to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray as unknown as Uint8Array
  }
}

export const pushManager = new PushNotificationManager()
