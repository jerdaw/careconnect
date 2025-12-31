import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { AnalyticsCard } from "@/components/AnalyticsCard"
import { NextIntlClientProvider } from "next-intl"

// Mock translations
const messages = {
  Analytics: {
    vsPeriod: "vs {period}",
    totalAllTime: "Total all time",
  },
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
)

describe("AnalyticsCard", () => {
  it("renders title and value", () => {
    render(
      <Wrapper>
        <AnalyticsCard title="Test Metric" value={123} />
      </Wrapper>
    )
    expect(screen.getByText("Test Metric")).toBeDefined()
    expect(screen.getByText("123")).toBeDefined()
  })

  it("renders loading state", () => {
    const { container } = render(
      <Wrapper>
        <AnalyticsCard title="Test" value={0} loading={true} />
      </Wrapper>
    )
    expect(container.getElementsByClassName("animate-pulse").length).toBeGreaterThan(0)
  })

  it("renders positive change", () => {
    render(
      <Wrapper>
        <AnalyticsCard title="Test" value={100} change={15} />
      </Wrapper>
    )
    expect(screen.getByText("15%")).toBeDefined()
    // Check for green color class
    const percentage = screen.getByText("15%")
    expect(percentage.className).toContain("text-green-600")
  })

  it("renders negative change", () => {
    render(
      <Wrapper>
        <AnalyticsCard title="Test" value={100} change={-5} />
      </Wrapper>
    )
    expect(screen.getByText("5%")).toBeDefined() // Math.abs
    const percentage = screen.getByText("5%")
    expect(percentage.className).toContain("text-red-600")
  })
})
