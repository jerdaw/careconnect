import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

describe("Popover", () => {
    it("renders trigger and opens content on click", () => {
        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>Content</PopoverContent>
            </Popover>
        )

        const trigger = screen.getByText("Open")
        expect(trigger).toBeInTheDocument()

        // Radix Popover might need some time or specific events
        fireEvent.click(trigger)

        // Content should be visible
        // Radix renders content in a portal usually.
        // In JSDOM, we can check if it exists.
        expect(screen.getByText("Content")).toBeInTheDocument()
    })
})
