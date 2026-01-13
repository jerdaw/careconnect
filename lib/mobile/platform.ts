import { Capacitor } from "@capacitor/core"

/**
 * Utility to identify the current platform and environment.
 */
export const getPlatform = () => {
  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(), // 'ios', 'android', or 'web'
    isIOS: Capacitor.getPlatform() === "ios",
    isAndroid: Capacitor.getPlatform() === "android",
    isWeb: Capacitor.getPlatform() === "web",
  }
}
