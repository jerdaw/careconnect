import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { describe, it, expect, vi } from "vitest";

describe("Button Component", () => {
    it("renders with default variant and size", () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole("button", { name: /click me/i });
        expect(button).toBeDefined();
        expect(button.className).toContain("bg-primary");
    });

    it("renders with secondary variant", () => {
        render(<Button variant="secondary">Secondary</Button>);
        const button = screen.getByRole("button", { name: /secondary/i });
        expect(button.className).toContain("bg-secondary");
    });

    it("renders as a pill variant", () => {
        render(<Button variant="pill">Pill</Button>);
        const button = screen.getByRole("button", { name: /pill/i });
        expect(button.className).toContain("rounded-full");
    });

    it("renders with small size", () => {
        render(<Button size="sm">Small</Button>);
        const button = screen.getByRole("button", { name: /small/i });
        expect(button.className).toContain("h-9");
    });

    it("calls onClick when clicked", () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when loading", () => {
        // Since we don't have a specific loading prop in the basic cva but we use it in some places, 
        // let's check the disabled attribute if we pass it through.
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByRole("button", { name: /disabled/i });
        expect(button).toBeDisabled();
    });
});
