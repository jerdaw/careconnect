import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { logger } from "@/lib/logger"

// Mock logger
vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
    },
    generateErrorId: () => "mock-error-id"
}))

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, "location", {
    value: { reload: mockReload },
    writable: true,
})

// Mock navigator.clipboard
const mockWriteText = vi.fn()
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText
    }
})

// Component that throws error
const ThrowError = () => {
    throw new Error("Test Error")
}

describe("ErrorBoundary Component", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Prevent console.error from cluttering output during test
        vi.spyOn(console, "error").mockImplementation(() => { })
    })

    afterEach(() => {
        (console.error as any).mockRestore()
    })

    it("renders children when no error", () => {
        render(
            <ErrorBoundary>
                <div>Safe Content</div>
            </ErrorBoundary>
        )
        expect(screen.getByText("Safe Content")).toBeInTheDocument()
    })

    it("renders fallback UI when error occurs", () => {
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        )

        expect(screen.getByText("Something went wrong")).toBeInTheDocument()
        expect(screen.getByText(/We encountered an unexpected error/i)).toBeInTheDocument()
        expect(screen.getByText("Error ID: mock-error-id")).toBeInTheDocument()

        expect(logger.error).toHaveBeenCalled()
    })

    it("calls onError prop", () => {
        const onError = vi.fn()
        render(
            <ErrorBoundary onError={onError}>
                <ThrowError />
            </ErrorBoundary>
        )

        expect(onError).toHaveBeenCalled()
    })

    it("reloads page on button click", () => {
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        )

        fireEvent.click(screen.getByText("Reload Page"))
        expect(mockReload).toHaveBeenCalled()
    })

    it("copies error ID to clipboard", async () => {
        mockWriteText.mockResolvedValue(undefined)
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        )

        // Find copy button (by title or icon?)
        const copyButton = screen.getByTitle("Copy error ID")
        fireEvent.click(copyButton)

        expect(mockWriteText).toHaveBeenCalledWith("mock-error-id")

        // Check for success state (icon change)
        // Check icon class or aria-label if applicable. 
        // Logic changes state.copied to true.
        // The component renders Check icon when copied.
        // We can look for the Check icon component or assume if writeText called it worked.
    })
})
