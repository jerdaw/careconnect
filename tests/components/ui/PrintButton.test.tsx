import { screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { PrintButton } from "@/components/ui/PrintButton"
import { renderWithProviders } from "../../utils/test-wrapper"
import enMessages from "../../../messages/en.json"

describe("PrintButton", () => {
    it("renders with correct text", () => {
        renderWithProviders(<PrintButton />, { messages: enMessages })
        expect(screen.getByText(/Print Results/i)).toBeDefined()
    })

    it("calls window.print when clicked", () => {
        const printMock = vi.spyOn(window, "print").mockImplementation(() => { })
        renderWithProviders(<PrintButton />, { messages: enMessages })

        fireEvent.click(screen.getByRole("button"))

        expect(printMock).toHaveBeenCalled()
        printMock.mockRestore()
    })
})
