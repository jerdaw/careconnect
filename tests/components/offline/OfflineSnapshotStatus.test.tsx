import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { OfflineSnapshotStatus } from "@/components/offline/OfflineSnapshotStatus"

vi.mock("next-intl", () => ({
  useLocale: vi.fn(() => "en"),
  useTranslations: vi.fn(),
}))

vi.mock("@/lib/offline/db", () => ({
  getMeta: vi.fn(),
}))

import { useTranslations } from "next-intl"
import { getMeta } from "@/lib/offline/db"

describe("OfflineSnapshotStatus", () => {
  const mockUseTranslations = vi.mocked(useTranslations)
  const mockGetMeta = vi.mocked(getMeta)
  let dateNowSpy: ReturnType<typeof vi.spyOn> | undefined

  const mockT = vi.fn((key: string, values?: Record<string, string>) => {
    const translations: Record<string, string> = {
      snapshotUpdated: `Last offline update: ${values?.timeAgo} (${values?.date}).`,
      snapshotUnavailable: "Last offline update time unavailable.",
      snapshotStaleWarning:
        "This offline copy may be outdated. Confirm hours, availability, and directions before relying on it.",
    }

    return translations[key] || key
  })

  beforeEach(() => {
    vi.clearAllMocks()
    dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-04-04T12:00:00.000Z"))
    mockUseTranslations.mockReturnValue(mockT as any)
  })

  afterEach(() => {
    dateNowSpy?.mockRestore()
  })

  it("shows a stale warning when the offline snapshot is older than 24 hours", async () => {
    mockGetMeta.mockResolvedValue("2026-04-02T08:00:00.000Z" as any)

    render(<OfflineSnapshotStatus />)

    await waitFor(() => {
      expect(screen.getByText(/Last offline update:/)).toBeInTheDocument()
    })

    expect(screen.getByText(/This offline copy may be outdated/)).toBeInTheDocument()
  })

  it("shows an unavailable message when no timestamp exists", async () => {
    mockGetMeta.mockResolvedValue(undefined)

    render(<OfflineSnapshotStatus variant="banner" />)

    await waitFor(() => {
      expect(screen.getByText("Last offline update time unavailable.")).toBeInTheDocument()
    })
  })
})
