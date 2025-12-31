import "@testing-library/jest-dom"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// Mock Supabase Env Vars for Testing
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-key"

// Cleanup after each test
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

// Mock global.fetch by default to avoid accidental network calls
// Individual tests can override this
global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve("")
} as Response));

// Mock matchMedia
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
window.HTMLElement.prototype.scrollIntoView = vi.fn()
// Mock IntersectionObserver
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
