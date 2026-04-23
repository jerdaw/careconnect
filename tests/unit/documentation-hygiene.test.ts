/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { lstatSync, readFileSync, readlinkSync } from "node:fs"
import path from "node:path"

function repoRoot() {
  return process.cwd()
}

function readDoc(relPath: string) {
  return readFileSync(path.join(repoRoot(), relPath), "utf8")
}

describe("documentation hygiene", () => {
  it("keeps agent compatibility files as relative symlinks", () => {
    for (const relPath of ["CLAUDE.md", "GEMINI.md"]) {
      const absPath = path.join(repoRoot(), relPath)
      expect(lstatSync(absPath).isSymbolicLink()).toBe(true)
      expect(readlinkSync(absPath)).toBe("AGENTS.md")
    }
  })

  it("uses AGENTS.md as the canonical contributor guide in active entry points", () => {
    const contributing = readDoc("CONTRIBUTING.md")
    const agents = readDoc("AGENTS.md")

    expect(contributing).toContain("Read AGENTS.md")
    expect(contributing).toContain("See [AGENTS.md](AGENTS.md)")
    expect(contributing).toContain("`CLAUDE.md` and `GEMINI.md` are compatibility symlinks to `AGENTS.md`")
    expect(agents).toContain("Do not add AI tool attribution")
    expect(agents).toContain("Keep `CLAUDE.md` and `GEMINI.md` as relative symlinks to `AGENTS.md`")
  })

  it("tracks the live VPS deployment in the roadmap", () => {
    const roadmap = readDoc("docs/planning/roadmap.md")

    expect(roadmap).toContain("https://careconnect.ing")
    expect(roadmap).toContain("Live on the direct-VPS path")
    expect(roadmap).not.toContain("Pre-production (not deployed")
  })

  it("treats push notifications as optional in active operational docs", () => {
    const productionChecklist = readDoc("docs/deployment/production-checklist.md")
    const mobileReady = readDoc("docs/development/mobile-ready.md")

    expect(productionChecklist).toContain("NEXT_PUBLIC_ONESIGNAL_APP_ID` may be unset")
    expect(productionChecklist).not.toContain(
      "NEXT_PUBLIC_SEARCH_MODE|NEXT_PUBLIC_ONESIGNAL_APP_ID|NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING"
    )
    expect(mobileReady).toContain("disabled by default")
  })

  it("removes Vercel rollback instructions from active launch runbooks", () => {
    const monitoring = readDoc("docs/operations/launch-monitoring-checklist.md")
    const rollback = readDoc("docs/operations/launch-rollback-procedures.md")

    expect(monitoring).not.toContain("Vercel deployment status")
    expect(rollback).not.toContain("vercel rollback")
    expect(rollback).toContain("/srv/apps/careconnect-web/releases")
    expect(rollback).toContain("./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env")
  })

  it("keeps active CI documentation aligned with the live workflow runtime stack", () => {
    const roadmap = readDoc("docs/planning/roadmap.md")
    const releaseProcess = readDoc("docs/development/release-process.md")
    const loadTesting = readDoc("docs/testing/load-testing.md")
    const releaseWorkflow = readDoc(".github/workflows/release.yml")

    expect(roadmap).toContain("Workflow runtime hygiene")
    expect(roadmap).not.toContain("Audit the remaining GitHub Actions Node 24 warnings")

    expect(releaseProcess).toContain("gh release create")
    expect(releaseProcess).not.toContain("actions/create-release@v1")

    expect(loadTesting).toContain("actions/checkout@v6")
    expect(loadTesting).toContain("actions/setup-node@v6")
    expect(loadTesting).toContain('node-version: "22"')
    expect(loadTesting).toContain("actions/upload-artifact@v7")
    expect(loadTesting).not.toContain("actions/upload-artifact@v4")

    expect(releaseWorkflow).toContain("gh release create")
    expect(releaseWorkflow).not.toContain("actions/create-release@v1")
  })

  it("keeps active freshness policy docs aligned with runtime governance", () => {
    const standards = readDoc("docs/governance/standards.md")
    const verificationProtocol = readDoc("docs/governance/verification-protocol.md")
    const planningReadme = readDoc("docs/planning/README.md")
    const roadmap = readDoc("docs/planning/roadmap.md")
    const architecture = readDoc("docs/architecture.md")

    expect(standards).toContain("Target re-verification within 90 days")
    expect(standards).toContain("> 180 days is auto-downgraded to **L0**")
    expect(standards).not.toContain("Confirmed active within 90 days")

    expect(verificationProtocol).toContain("current within the 180-day visibility window")
    expect(verificationProtocol).toContain("Target re-verification within 90 days")
    expect(verificationProtocol).toContain("not verified for >180 days are downgraded to L0")
    expect(verificationProtocol).not.toContain(">12 months")

    expect(planningReadme).toContain("Target ~90-day decision review cycle")
    expect(planningReadme).toContain("not a guaranteed delivery schedule")

    expect(roadmap).toContain("180 days as the hard visibility limit")
    expect(roadmap).toContain("review checkpoint rather than a guaranteed build schedule")

    expect(architecture).toContain("Governance Freshness Enforcement")
    expect(architecture).toContain("Result Explainability")
    expect(architecture).toContain("180-day governance limit")
  })

  it("points shared VPS facts to platform-ops in active entry points", () => {
    const readme = readDoc("README.md")
    const agents = readDoc("AGENTS.md")
    const docsIndex = readDoc("docs/README.md")
    const productionChecklist = readDoc("docs/deployment/production-checklist.md")
    const directVpsProof = readDoc("docs/deployment/direct-vps-proof.md")

    for (const content of [readme, agents, docsIndex, productionChecklist, directVpsProof]) {
      expect(content).toContain(
        "/home/jer/repos/vps/platform-ops/docs/standards/PLAT-009-shared-vps-documentation-boundary.md"
      )
    }

    expect(productionChecklist).toContain(
      "Shared host topology, ingress ownership, and other cross-project VPS facts are canonical in `/home/jer/repos/vps/platform-ops`."
    )
    expect(directVpsProof).toContain(
      "Shared host topology, ingress ownership, service inventory, and other cross-project VPS facts are canonical in `/home/jer/repos/vps/platform-ops`."
    )
  })

  it("surfaces implementation docs in the docs index", () => {
    const docsIndex = readDoc("docs/README.md")

    expect(docsIndex).toContain("[`implementation/`](implementation/)")
    expect(docsIndex).toContain("[v22 Gate 0 Controls](implementation/v22-0-gate-0-exit-checklist.md)")
  })

  it("keeps runtime architecture facts aligned with the codebase", () => {
    const architecture = readDoc("docs/architecture.md")
    const routing = readDoc("i18n/routing.ts")
    const serviceTypes = readDoc("types/service.ts")
    const serviceSchema = readDoc("lib/schemas/service.ts")

    expect(architecture).toContain("`@mlc-ai/web-llm` (WebGPU)")
    expect(architecture).not.toContain("TensorFlow.js")
    expect(architecture).toContain("fails closed to keyword-only search")
    expect(architecture).toContain("Manually curated service records remain authoritative")
    expect(architecture).not.toContain("211 Ontario API (Raw Data) + Manual Verification (Golden Dataset)")
    expect(architecture).toContain("not currently represented in runtime types or search scoring")
    expect(architecture).toContain("7-locale switching")
    expect(architecture).toContain("public/sw.js")

    expect(routing).toContain("7 locales")
    expect(routing).not.toContain("5 languages")

    expect(serviceTypes).toContain('L3 = "L3"')
    expect(serviceTypes).not.toContain('L4 = "L4"')
    expect(serviceSchema).toContain('z.enum(["L0", "L1", "L2", "L3"])')
  })

  it("tracks the latest maintenance archive in planning docs", () => {
    const planningIndex = readDoc("docs/planning/README.md")
    const roadmap = readDoc("docs/planning/roadmap.md")

    expect(planningIndex).toContain("2026-04-23-v20-0-quiet-github-automation-and-url-health-hardening.md")
    expect(roadmap).toContain("Quiet GitHub automation and URL health hardening (2026-04-23)")
  })
})
