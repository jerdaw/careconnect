import { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "ca.careconnect.app",
  appName: "CareConnect",
  webDir: "out", // Next.js static export
  server: {
    // For development, point to local Next.js server
    url: process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined,
    cleartext: process.env.NODE_ENV === "development",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e3a5f", // CareConnect brand color
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
}

export default config
