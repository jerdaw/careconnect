/** @vitest-environment node */
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const workflow = readFileSync(path.join(process.cwd(), ".github/workflows/supabase-keepalive.yml"), "utf8")

describe("Supabase keepalive workflow", () => {
  it("runs daily and queries both configured projects", () => {
    expect(workflow).toContain('cron: "17 8 * * *"')
    expect(workflow).toContain("NEXT_PUBLIC_SUPABASE_URL")
    expect(workflow).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    expect(workflow).toContain("VISITBRIEF_SUPABASE_URL")
    expect(workflow).toContain("VISITBRIEF_SUPABASE_PUBLISHABLE_KEY")
    expect(workflow).toContain('"services_public"')
    expect(workflow).toContain('"profiles"')
  })

  it("generates user database activity without privileged credentials", () => {
    expect(workflow).toContain("/rest/v1/${resource}?select=id&limit=1")
    expect(workflow).toContain("for attempt in 1 2 3")
    expect(workflow).toContain('if [ "${http_code}" -ne 200 ]')
    expect(workflow).not.toContain("/auth/v1/settings")
    expect(workflow).not.toContain('/rest/v1/"')
    expect(workflow).not.toMatch(/service[_-]?role/i)
  })

  it("opens one persistent issue on failure and closes it after recovery", () => {
    expect(workflow).toContain("issues: write")
    expect(workflow).toContain("continue-on-error: true")
    expect(workflow).toContain("if: always()")
    expect(workflow).toContain('title="Supabase Keepalive Failure"')
    expect(workflow).toContain("gh issue create")
    expect(workflow).toContain("gh issue edit")
    expect(workflow).toContain("gh issue close")
    expect(workflow).toContain("if: steps.data-api.outcome == 'failure'")
  })
})
