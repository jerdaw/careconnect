"use client"

import { Share } from "@capacitor/share"
import { Capacitor } from "@capacitor/core"

interface ShareOptions {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
}

export function useShare() {
  const isSupported = async () => {
    // Web Share API is available in most modern browsers
    if (Capacitor.getPlatform() === "web") {
      return !!navigator.share
    }
    return true // Capacitor Share plugin handles native platforms
  }

  const share = async (options: ShareOptions) => {
    try {
      const canShare = await isSupported()
      
      if (!canShare) {
        // Fallback for browsers that don't support Web Share API
        // Copy to clipboard or show a custom dialog
        if (options.url) {
           await navigator.clipboard.writeText(options.url)
           return { type: "copy", success: true }
        }
        return { type: "none", success: false }
      }

      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle || "Share this service",
      })

      return { type: "share", success: true }
    } catch (err) {
      // User cancelled share is often an error, but not a failure of the app
      console.warn("[useShare] Share failed or cancelled", err)
      return { type: "error", success: false, error: err }
    }
  }

  return { share, isSupported }
}
