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
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

const nextConfig: NextConfig = {
  // Vercel optimization: reduce deployment size by ~40%
  output: "standalone",

  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,

  // Enable compression for static files
  compress: true,

  // We will add image domains here later (e.g. forSupabase storage)
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"], // Modern formats for better compression
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  transpilePackages: [],
  serverExternalPackages: ["@xenova/transformers"],

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-switch",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "lucide-react",
    ],
  },

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
        // iOS Universal Links requires this file to be served as JSON (no extension).
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
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
        // Next.js build output (hashed + immutable)
        urlPattern: /\/_next\/static\//,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [200],
          },
        },
      },
      {
        // Next.js image optimizer
        urlPattern: /\/_next\/image(\?|\/)/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-image",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          },
          cacheableResponse: {
            statuses: [200],
          },
        },
      },
      {
        // Ensure the Workbox navigation fallback is available offline
        urlPattern: /\/offline(\?.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offline-fallback",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 5,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [200],
          },
        },
      },
      {
        // Store-quality install assets (manifest, icons, screenshots)
        urlPattern: /\/(manifest\.json|icons\/|screenshots\/)/,
        handler: "CacheFirst",
        options: {
          cacheName: "pwa-assets",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [200],
          },
        },
      },
      {
        // Offline-first bulk export (only caches successful GETs; 401/403 won't be cached)
        urlPattern: /\/api\/v1\/services\/export(\?.*)?$/,
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "services-export",
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 2,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          cacheableResponse: {
            statuses: [200],
          },
        },
      },
      {
        // Services API GET responses (public data only; excludes export endpoint above)
        urlPattern: /\/api\/v1\/services(?!\/export)(\/|$)/,
        handler: "StaleWhileRevalidate",
        method: "GET",
        options: {
          cacheName: "services-api",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          cacheableResponse: {
            statuses: [200],
          },
        },
      },
    ],
  },
})

// Bundle analyzer configuration (enabled when ANALYZE=true)
import withBundleAnalyzer from "@next/bundle-analyzer"

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false, // Don't auto-open browser in CI
})

const finalConfig = withAnalyzer(withPWA(withNextIntl(nextConfig)))

export default finalConfig
