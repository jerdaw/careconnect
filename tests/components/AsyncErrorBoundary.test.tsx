import { render, screen, fireEvent } from "@testing-library/react"
import { AsyncErrorBoundary } from "@/components/AsyncErrorBoundary"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { logger } from "@/lib/logger"

// Mock logger
vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
    },
}))

// Mock clipboard
const mockWriteText = vi.fn()
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText
    }
})

const ThrowError = () => {
    throw new Error("Async Error failure")
}

describe("AsyncErrorBoundary Component", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, "error").mockImplementation(() => { })
    })

    afterEach(() => {
        (console.error as any).mockRestore()
    })

    it("renders children when valid", () => {
        render(
            <AsyncErrorBoundary>
                <div>Valid Content</div>
            </AsyncErrorBoundary>
        )
        expect(screen.getByText("Valid Content")).toBeInTheDocument()
    })

    it("catches error and displays error UI", () => {
        render(
            <AsyncErrorBoundary>
                <ThrowError />
            </AsyncErrorBoundary>
        )
        expect(screen.getByText("Something went wrong")).toBeInTheDocument()
        expect(screen.getByText("Async Error failure")).toBeInTheDocument()
    })

    it("calls onReset when retry clicked", () => {
        const onReset = vi.fn()
        render(
            <AsyncErrorBoundary onReset={onReset}>
                <ThrowError />
            </AsyncErrorBoundary>
        )

        fireEvent.click(screen.getByText("Retry"))
        expect(onReset).toHaveBeenCalled()
        // Should try to re-render, but ThrowError will throw again immediately unless controlled.
        // We just check onReset was called.
    })

    it("copies error ID", () => {
        render(
            <AsyncErrorBoundary>
                <ThrowError />
            </AsyncErrorBoundary>
        )

        // Find copy button by text ID: or similar
        // The button text is "ID: ERR-ASYNC-..."
        const copyBtn = screen.getByText(/ID:/i)
        fireEvent.click(copyBtn)

        expect(mockWriteText).toHaveBeenCalled()
    })
})
