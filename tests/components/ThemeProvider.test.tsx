import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "@/components/ThemeProvider"
import { describe, it, expect } from "vitest"

describe("ThemeProvider Component", () => {
    it("renders children", () => {
        render(
            <ThemeProvider attribute="class">
                <div>Child Content</div>
            </ThemeProvider>
        )
        expect(screen.getByText("Child Content")).toBeInTheDocument()
    })
})
