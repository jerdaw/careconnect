import "@testing-library/jest-dom"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"
import type { MockInstance } from "vitest"

const silentConsoleMethods = ["log", "info", "warn", "error", "debug"] as const
const shouldSilenceTestConsole = process.env.VITEST_VERBOSE_LOGS !== "1"
const consoleSilencers: Partial<Record<(typeof silentConsoleMethods)[number], MockInstance>> = {}

function createStorageMock() {
  const store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
}

function ensureLocalStorage() {
  if (typeof window === "undefined") return
  if (typeof window.localStorage?.clear === "function") return

  const storage = createStorageMock()
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  })
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  })
}

// Mock Supabase Env Vars for Testing
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-key"

beforeEach(() => {
  ensureLocalStorage()
  if (!shouldSilenceTestConsole) return

  for (const method of silentConsoleMethods) {
    consoleSilencers[method] = vi.spyOn(console, method).mockImplementation(() => {})
  }
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  for (const method of silentConsoleMethods) {
    consoleSilencers[method]?.mockRestore()
    delete consoleSilencers[method]
  }
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  ensureLocalStorage()
})

// Mock global.fetch by default to avoid accidental network calls
// Individual tests can override this
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  } as Response)
)

// Mock matchMedia
if (typeof window !== "undefined") {
  ensureLocalStorage()

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock scrollIntoView
  if (window.HTMLElement) {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  }
}

// Mock IntersectionObserver
if (typeof global !== "undefined") {
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
    root: null,
    rootMargin: "",
    thresholds: [],
  })) as unknown as typeof IntersectionObserver

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

// Global Next.js mocks
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}))
