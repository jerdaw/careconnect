import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We will add image domains here later (e.g. forSupabase storage)
  images: {
    domains: [],
  },
};

// Polyfill for Node 25+ localStorage crash
if (typeof global !== 'undefined' && !global.localStorage) {
  // It might be already defined but broken, so we force a mock
}
// Force mock if we are in Node
if (typeof window === 'undefined') {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    length: 0,
    key: () => null,
  };
}

export default nextConfig;
