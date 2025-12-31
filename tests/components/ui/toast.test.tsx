import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"

describe("Toast", () => {
    it("renders toast content", () => {
        render(
            <ToastProvider>
                <Toast>
                    <ToastTitle>Title</ToastTitle>
                    <ToastDescription>Description</ToastDescription>
                    <ToastClose />
                </Toast>
                <ToastViewport />
            </ToastProvider>
        )
        expect(screen.getByText("Title")).toBeInTheDocument()
        expect(screen.getByText("Description")).toBeInTheDocument()
    })

    it("Toaster renders without crashing", () => {
        render(<Toaster />)
        // Toaster uses useToast which returns empty array by default if no toasts triggered
        // Just verify it doesn't crash
    })
})
