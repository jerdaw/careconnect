import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

describe("UI Primitives", () => {
    describe("Button", () => {
        it("renders children correctly", () => {
            render(<Button>Click me</Button>)
            expect(screen.getByText("Click me")).toBeInTheDocument()
        })

        it("handles click events", () => {
            const handleClick = vi.fn()
            render(<Button onClick={handleClick}>Click me</Button>)
            fireEvent.click(screen.getByText("Click me"))
            expect(handleClick).toHaveBeenCalledTimes(1)
        })

        it("can be disabled", () => {
            render(<Button disabled>Disabled</Button>)
            expect(screen.getByRole("button")).toBeDisabled()
        })
    })

    describe("Badge", () => {
        it("renders children correctly", () => {
            render(<Badge>New</Badge>)
            expect(screen.getByText("New")).toBeInTheDocument()
        })

        it("applies variant classes", () => {
            const { container } = render(<Badge variant="destructive">Error</Badge>)
            expect(container.firstChild).toHaveClass("bg-destructive")
        })
    })

    describe("Input", () => {
        it("renders and accepts value", () => {
            render(<Input placeholder="Enter name" />)
            const input = screen.getByPlaceholderText("Enter name")
            fireEvent.change(input, { target: { value: "John" } })
            expect((input as HTMLInputElement).value).toBe("John")
        })

        it("can be disabled", () => {
            render(<Input disabled placeholder="Disabled" />)
            expect(screen.getByPlaceholderText("Disabled")).toBeDisabled()
        })
    })

    describe("Card", () => {
        it("renders card structure correctly", () => {
            render(
                <Card>
                    <CardHeader>
                        <CardTitle>Title</CardTitle>
                    </CardHeader>
                    <CardContent>Content</CardContent>
                    <CardFooter>Footer</CardFooter>
                </Card>
            )
            expect(screen.getByText("Title")).toBeInTheDocument()
            expect(screen.getByText("Content")).toBeInTheDocument()
            expect(screen.getByText("Footer")).toBeInTheDocument()
        })
    })
})
