import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PublicServiceRetired, type PublicServiceRetiredContent } from "@/components/retirement/PublicServiceRetired"
import enMessages from "@/messages/en.json"

const content = enMessages.Retirement satisfies PublicServiceRetiredContent & {
  metadataDescription: string
  metadataTitle: string
}

describe("PublicServiceRetired", () => {
  it("presents a semantic non-directory surface with emergency and official navigation", () => {
    const { container } = render(<PublicServiceRetired content={content} />)

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content")
    expect(screen.getByRole("heading", { level: 1, name: content.title })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: content.safetyTitle })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: content.skipToContent })).toHaveAttribute("href", "#main-content")
    expect(screen.getByRole("link", { name: content.call911 })).toHaveAttribute("href", "tel:911")
    expect(screen.getByRole("link", { name: content.call988 })).toHaveAttribute("href", "tel:988")
    expect(screen.getByRole("link", { name: content.text988 })).toHaveAttribute("href", "sms:988")
    expect(screen.getByRole("link", { name: content.call211 })).toHaveAttribute("href", "tel:211")
    expect(screen.getByRole("link", { name: content.visit211 })).toHaveAttribute("href", "https://211ontario.ca/")
    expect(screen.getByRole("button", { name: content.exportLocalData })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: content.clearLocalData })).toBeInTheDocument()

    expect(container.querySelector("form")).toBeNull()
    expect(container.querySelector("input, textarea, select")).toBeNull()
    expect(container.querySelector('a[href^="/service/"]')).toBeNull()
    expect(container).not.toHaveTextContent("204")
    expect(container).not.toHaveTextContent("verified services")
  })
})
