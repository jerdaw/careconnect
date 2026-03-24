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
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "tests/db/**", ".next/**"],
    coverage: {
      reporter: ["text", "json", "html"],
      // IMPORTANT: These thresholds are ENFORCED in CI (see .github/workflows/ci.yml)
      // Any PR that reduces coverage below these levels will fail the build
      thresholds: {
        // Global thresholds: Set to current baseline to prevent regression
        // Target: Incrementally increase to 75% statements as B4-B9 tests are added
        // Last updated: 2026-02-12 (baseline: 53.97% statements, 82.21% branches)
        global: {
          branches: 80, // Current: 82.21%, set to 80 to allow minor variation
          functions: 80, // Current: 82.12%, set to 80 to allow minor variation
          lines: 50, // Current: 53.97%, set to 50 to prevent major regression
          statements: 50, // Current: 53.97%, set to 50 to prevent major regression
        },
        // Per-file thresholds for critical paths (higher standards)
        "lib/search/**": {
          statements: 90, // Critical search logic requires high coverage
          branches: 85,
        },
        "lib/eligibility/**": {
          statements: 95, // Eligibility logic must be thoroughly tested
        },
        "lib/ai/**": {
          statements: 65, // AI features can be harder to test
        },
        "hooks/**": {
          statements: 75, // Hooks require good coverage
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
