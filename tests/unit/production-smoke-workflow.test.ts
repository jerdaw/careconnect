/** @vitest-environment node */
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const workflow = readFileSync(path.join(process.cwd(), ".github/workflows/production-smoke.yml"), "utf8")

describe("Production Smoke workflow", () => {
  it("remains an active scheduled and operator-dispatchable check", () => {
    expect(workflow).toContain('cron: "17 12 * * *"')
    expect(workflow).toContain("workflow_dispatch:")
  })

  it("checks the exact deployed retirement release", () => {
    expect(workflow).toContain("EXPECTED_PUBLIC_VERSION: ef91ac67c8a7")
    expect(workflow).toContain('payload.get("version") == os.environ["EXPECTED_PUBLIC_VERSION"]')
    expect(workflow).toContain('payload.get("status") in {"healthy", "degraded"}')
  })

  it("enforces locale, emergency, and fail-closed API contracts", () => {
    expect(workflow).toContain("for cc_locale in en fr zh-Hans ar pt es pa")
    expect(workflow).toContain('<html lang="ar" dir="rtl">')
    expect(workflow).toContain('href="tel:911"')
    expect(workflow).toContain('href="tel:988"')
    expect(workflow).toContain('href="sms:988"')
    expect(workflow).toContain('href="tel:211"')
    expect(workflow).toContain('href="https://211ontario.ca/"')
    expect(workflow).toContain("check_gone GET /api/v1/services services")
    expect(workflow).toContain("check_gone GET /api/v1/services/foo.json dotted-services")
    expect(workflow).toContain("check_gone POST /api/v1/search/services search")
    expect(workflow).toContain('test "$cc_status" = 410')
    expect(workflow).toContain("^cache-control: *no-store, *max-age=0$")
  })

  it("enforces retired discovery metadata instead of the former directory sitemap", () => {
    expect(workflow).toContain("grep -Fxq 'Disallow: /' robots.txt")
    expect(workflow).toContain("if grep -Fq 'Sitemap:' robots.txt")
    expect(workflow).toContain("if grep -Fq '<loc>' sitemap.xml")
    expect(workflow).toContain('assert not manifest.get("shortcuts"), manifest')
    expect(workflow).toContain('assert "share_target" not in manifest, manifest')
    expect(workflow).not.toContain("grep -F '<loc>https://careconnect.ing/' sitemap.xml")
  })

  it("surfaces one persistent failure issue and closes it after recovery", () => {
    expect(workflow).toContain("report-smoke-result:")
    expect(workflow).toContain("needs: smoke")
    expect(workflow).toContain("if: always()")
    expect(workflow).toContain("issues: write")
    expect(workflow).toContain("FAILURE_DETECTED: ${{ needs.smoke.result != 'success' }}")
    expect(workflow).toContain('title="Production Smoke Failure"')
    expect(workflow).toContain("gh issue create")
    expect(workflow).toContain("gh issue edit")
    expect(workflow).toContain("gh issue close")
    expect(workflow).toContain("This issue is updated in place and closes automatically after a successful run.")
  })

  it("does not overlap the independent Supabase keepalive contract", () => {
    expect(workflow).not.toMatch(/supabase/i)
    expect(workflow).not.toMatch(/keepalive/i)
    expect(workflow).not.toContain("VISITBRIEF_SUPABASE_URL")
    expect(workflow).not.toMatch(/service[_-]?role/i)
  })
})
