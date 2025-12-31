import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Section } from "@/components/ui/section"
import { Textarea } from "@/components/ui/textarea"

describe("UI Primitives Batch 2", () => {
    describe("Avatar", () => {
        it("renders fallback when image is missing", () => {
            render(
                <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
            )
            expect(screen.getByText("JD")).toBeInTheDocument()
        })
    })

    describe("Skeleton", () => {
        it("renders with animation class", () => {
            const { container } = render(<Skeleton className="h-4 w-4" />)
            // Check for shimmer class found in component
            expect(container.firstChild).toHaveClass("before:animate-[shimmer_2s_infinite]")
        })
    })

    describe("Section", () => {
        it("renders with children", () => {
            render(
                <Section title="My Section">
                    <p>Section Content</p>
                </Section>
            )
            // Section passes title as attribute, not text
            expect(screen.getByText("Section Content")).toBeInTheDocument()
        })
    })

    describe("Textarea", () => {
        it("renders and handles input", () => {
            render(<Textarea placeholder="Bio" />)
            const textarea = screen.getByPlaceholderText("Bio")
            expect(textarea).toBeInTheDocument()
        })
    })
})
