/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { analyzeEnvVars, parseEnvContent } from "@/scripts/validate-env-config"

describe("validate-env-config helpers", () => {
  it("parses dotenv-style inline comments outside quoted values", () => {
    const vars = parseEnvContent(`
NEXT_PUBLIC_SEARCH_MODE=local # "local" or "server"
QUOTED_VALUE="value # preserved"
QUOTED_WITH_COMMENT="value" # comment
EMPTY_VALUE=
`)

    expect(vars.get("NEXT_PUBLIC_SEARCH_MODE")).toBe("local")
    expect(vars.get("QUOTED_VALUE")).toBe("value # preserved")
    expect(vars.get("QUOTED_WITH_COMMENT")).toBe("value")
    expect(vars.get("EMPTY_VALUE")).toBe("")
  })

  it("does not require variables that are optional or have runtime defaults", () => {
    const envExample = parseEnvContent(`
NEXT_PUBLIC_BASE_URL=http://localhost:3000
APP_VERSION=1.0.0-pilot
NEXT_PUBLIC_SEARCH_MODE=local
NEXT_PUBLIC_ONESIGNAL_APP_ID=
OPERATIONAL_NOTIFICATION_MODE=normal
USER_NOTIFICATION_MODE=normal
HEALTH_PROBE_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
`)

    const result = analyzeEnvVars(envExample, new Map())

    expect(result.missingInLocal).toEqual([])
  })
})
