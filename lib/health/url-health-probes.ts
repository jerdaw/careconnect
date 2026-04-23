export type UrlHealthProbeSource = "service_url" | "official_override"

export interface UrlHealthProbeConfig {
  probeUrl: string
  source: UrlHealthProbeSource
  reason?: string
}

interface UrlHealthProbeOverride {
  probeUrl: string
  reason: string
}

const OFFICIAL_URL_HEALTH_PROBE_OVERRIDES: Record<string, UrlHealthProbeOverride> = {
  "crisis-telehealth-ontario": {
    probeUrl: "https://www.ontario.ca/page/your-health",
    reason:
      "Health811 occasionally blocks automated requests on the chat domain; verify against Ontario's official service overview instead.",
  },
  "law-society-referral-service": {
    probeUrl: "https://lsrs.lso.ca/lsrs/",
    reason:
      "The Law Society Referral Service intake portal is a more stable official probe target than the public information page.",
  },
  "ontario-victim-support-line": {
    probeUrl: "https://www.ontario.ca/page/victimwitness-assistance-program",
    reason:
      "Verify against Ontario's official Victim Support Line documentation when the directory host rate-limits automation.",
  },
  "red-cross-kingston": {
    probeUrl: "https://www.redcross.ca/in-your-community/ontario/community-support-services",
    reason:
      "The Ontario community support services page is the most stable official Red Cross landing page for automation checks.",
  },
  "resolve-counselling": {
    probeUrl: "https://resolvecounselling.org/contact-us/",
    reason:
      "Resolve's homepage intermittently times out from CI; the official contact page is a more reliable probe target.",
  },
}

export function resolveUrlHealthProbe(serviceId: string, serviceUrl: string): UrlHealthProbeConfig {
  const override = OFFICIAL_URL_HEALTH_PROBE_OVERRIDES[serviceId]

  if (!override) {
    return {
      probeUrl: serviceUrl,
      source: "service_url",
    }
  }

  return {
    probeUrl: override.probeUrl,
    source: "official_override",
    reason: override.reason,
  }
}
