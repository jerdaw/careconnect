import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { ExternalMapPanel } from "@/components/services/ExternalMapPanel"

describe("ExternalMapPanel", () => {
  it("does not load the external map until the user opts in", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ExternalMapPanel
        mapTitle="Map location for Test Service"
        embedUrl="https://maps.google.com/maps?q=123%20Test%20St&output=embed"
        loadMapLabel="Load map preview"
        privacyDescription="No external map is loaded unless you choose to view it."
        externalNotice="Loading the preview shares data with Google Maps, such as your IP address."
      />
    )

    expect(screen.getByText("No external map is loaded unless you choose to view it.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Load map preview" })).toBeInTheDocument()
    expect(container.querySelector("iframe")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Load map preview" }))

    expect(screen.getByTitle("Map location for Test Service")).toHaveAttribute(
      "src",
      "https://maps.google.com/maps?q=123%20Test%20St&output=embed"
    )
  })
})
