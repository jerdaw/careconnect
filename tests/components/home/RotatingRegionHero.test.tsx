import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import RotatingRegionHero from "@/components/home/RotatingRegionHero"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      accessibleTitle: "CareConnect for supported Ontario communities",
      brand: "CareConnect",
    }
    return translations[key] ?? key
  },
}))

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }: React.PropsWithChildren) => <span {...props}>{children}</span>,
  },
  useReducedMotion: () => false,
}))

describe("RotatingRegionHero", () => {
  it("renders a stable accessible heading", () => {
    render(<RotatingRegionHero />)

    expect(screen.getByRole("heading", { name: "CareConnect for supported Ontario communities" })).toBeInTheDocument()
  })

  it("renders supported registry region labels visually", () => {
    render(<RotatingRegionHero />)

    expect(screen.getByText("Kingston")).toBeInTheDocument()
    expect(screen.getByText("Brampton")).toBeInTheDocument()
    expect(screen.getByText("CareConnect")).toBeInTheDocument()
  })
})
