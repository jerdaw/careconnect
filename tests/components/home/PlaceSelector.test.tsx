import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import PlaceSelector from "@/components/home/PlaceSelector"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const translations: Record<string, string> = {
      label: "Service area",
      selected: `Showing ${values?.place ?? ""}`,
      change: "Change city",
      useLocation: "Use my location",
      locating: "Finding location",
    }
    return translations[key] ?? key
  },
}))

if (!HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: () => false,
  })
}

if (!HTMLElement.prototype.setPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  })
}

if (!HTMLElement.prototype.releasePointerCapture) {
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: vi.fn(),
  })
}

describe("PlaceSelector", () => {
  it("shows the selected place and exposes a change control", async () => {
    const user = userEvent.setup()
    const onPlaceChange = vi.fn()

    render(
      <PlaceSelector
        selectedPlaceId="kingston-on"
        isLocating={false}
        onUseLocation={vi.fn()}
        onPlaceChange={onPlaceChange}
      />
    )

    expect(screen.getByRole("group", { name: "Service area" })).toBeInTheDocument()
    expect(screen.getByText("Showing Kingston")).toBeInTheDocument()

    await user.click(screen.getByRole("combobox", { name: "Change city" }))
    await user.click(await screen.findByRole("option", { name: "Brampton" }))

    expect(onPlaceChange).toHaveBeenCalledWith("brampton-on")
  })

  it("offers explicit geolocation without requiring it", async () => {
    const user = userEvent.setup()
    const onUseLocation = vi.fn()

    render(
      <PlaceSelector
        selectedPlaceId="kingston-on"
        isLocating={false}
        onUseLocation={onUseLocation}
        onPlaceChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Use my location" }))

    expect(onUseLocation).toHaveBeenCalledTimes(1)
  })
})
