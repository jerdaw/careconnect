import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/db/setup.ts"],
    include: ["tests/db/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", ".next/**"],
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
  },
})
