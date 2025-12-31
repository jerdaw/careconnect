import { screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { FreshnessBadge } from "@/components/ui/FreshnessBadge"
import { renderWithProviders } from "../../utils/test-wrapper"
import enMessages from "../../../messages/en.json"

describe("FreshnessBadge", () => {
    it("renders 'fresh' state for today", () => {
        const today = new Date().toISOString()
        renderWithProviders(<FreshnessBadge lastVerified={today} />, { messages: enMessages })
        expect(screen.getByText(/Verified today/i)).toBeDefined()
    })

    it("renders 'recent' state for 2 months ago", () => {
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        renderWithProviders(<FreshnessBadge lastVerified={sixtyDaysAgo.toISOString()} />, { messages: enMessages })
        expect(screen.getByText(/Verified 2 months ago/i)).toBeDefined()
    })

    it("renders 'stale' state for 6 months ago", () => {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        renderWithProviders(<FreshnessBadge lastVerified={sixMonthsAgo.toISOString()} />, { messages: enMessages })
        expect(screen.getByText(/Verified last year|6 months ago/i)).toBeDefined()
    })

    it("renders 'unknown' state when lastVerified is missing", () => {
        renderWithProviders(<FreshnessBadge />, { messages: enMessages })
        expect(screen.getByText(/Verified Not verified/i)).toBeDefined()
    })
})
