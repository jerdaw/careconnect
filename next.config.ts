import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

// Security headers configuration
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://onesignal.com https://cdn.onesignal.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
]

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
  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
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
