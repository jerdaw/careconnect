import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", ".next/**"],
    coverage: {
      reporter: ["text", "json", "html"],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75,
        },
        // Per-file thresholds for critical paths only
        "lib/search/**": {
          statements: 65, // Starting low provided current state, will ramp up
          branches: 70,
        },
        "lib/eligibility/**": {
          statements: 95,
        },
        "lib/ai/**": {
          statements: 65,
        },
        "hooks/**": {
          statements: 75,
        },
      },
      exclude: [
        "node_modules/**",
        "dist/**",
        ".next/**",
        "**/*.d.ts",
        "tests/**",
        // Legitimately untestable via Unit Tests
        "scripts/**",
        "app/**/page.tsx",
        "app/**/layout.tsx",
        "middleware.ts",
        "*.config.*",
        "public/**",
        "lp-items.tsx",
        "i18n/**",
        "app/api/**", // Covered by integration tests mostly
        "lib/external/**", // Mocked boundaries
      ],
    },
    deps: {
      optimizer: {
        web: {
          include: ["vitest-canvas-mock"],
        },
      },
    },
    server: {
      deps: {
        inline: ["next-intl", "next"],
      },
    },
    alias: {
      "next/navigation": "next/navigation.js",
      "next/headers": "next/headers.js",
    },
  },
})
