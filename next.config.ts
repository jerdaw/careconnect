import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  // We will add image domains here later (e.g. forSupabase storage)
  images: {
    domains: [],
  },
  transpilePackages: [],
  serverExternalPackages: ["@xenova/transformers"],
  webpack: (config) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    }
    return config
  },
}

import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || !!process.env.CI,
  register: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    importScripts: ["/custom-sw.js"],
    runtimeCaching: [
      {
        urlPattern: /\/api\/services/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "services-api-cache",
          expiration: { maxAgeSeconds: 86400 }, // 24 hours
        },
      },
      {
        urlPattern: /\.json$/,
        handler: "CacheFirst",
        options: {
          cacheName: "json-cache",
          expiration: { maxAgeSeconds: 604800 }, // 7 days
        },
      },
    ],
  },
})

const finalConfig = withPWA(withNextIntl(nextConfig))

export default finalConfig
