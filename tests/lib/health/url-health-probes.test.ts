/** @vitest-environment node */
import { describe, expect, it } from "vitest"

import { resolveUrlHealthProbe } from "@/lib/health/url-health-probes"

describe("resolveUrlHealthProbe", () => {
  it("defaults to probing the public service URL", () => {
    expect(resolveUrlHealthProbe("kids-help-phone", "https://kidshelpphone.ca/")).toEqual({
      probeUrl: "https://kidshelpphone.ca/",
      source: "service_url",
    })
  })

  it("returns official override probes for bot-hostile services", () => {
    expect(resolveUrlHealthProbe("crisis-telehealth-ontario", "https://health811.ontario.ca")).toMatchObject({
      probeUrl: "https://www.ontario.ca/page/your-health",
      source: "official_override",
    })

    expect(resolveUrlHealthProbe("law-society-referral-service", "https://findlegalhelp.ca")).toMatchObject({
      probeUrl: "https://lsrs.lso.ca/lsrs/",
      source: "official_override",
    })
  })
})
