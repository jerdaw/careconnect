import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // We will add image domains here later (e.g. forSupabase storage)
  images: {
    domains: [],
  },
  serverExternalPackages: ['@xenova/transformers'],
  webpack: (config) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    }
    return config;
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
});

const finalConfig = withPWA(withNextIntl(nextConfig));

// LocalStorage Polyfill for Node 25+ (SSR Safety)
// In Node 25, a global localStorage may exist but can be broken or incomplete in Next.js SSR.
if (typeof window === 'undefined') {
  const mockStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    length: 0,
    key: () => null,
  };

  if (!global.localStorage || typeof global.localStorage.getItem !== 'function') {
    (global as any).localStorage = mockStorage;
  }
}

export default finalConfig;
