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

const privateBoundaryPathPattern =
  /\/home\/jer\/repos\/vps\/platform-ops\/docs\/standards\/PLAT-009-shared-vps-documentation-boundary\.md/

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
    expect(agents).toContain("no Claude/Codex/Gemini/Copilot author or contributor credits")
    expect(agents).toContain("Keep `CLAUDE.md` and `GEMINI.md` as relative symlinks to `AGENTS.md`")
  })

  it("keeps deployment details behind the public documentation boundary", () => {
    const roadmap = readDoc("docs/planning/roadmap.md")
    const readme = readDoc("README.md")
    const contracts = [readDoc("platform-ops-contract.yaml"), readDoc("platform-ops-contract.example.yaml")]

    expect(readme).toContain("Public Documentation Boundary")
    expect(roadmap).toContain("active deployment facts are maintained privately")
    for (const contract of contracts) {
      expect(contract).toContain("careconnect-example")
      expect(contract).toContain("example.org")
      expect(contract).not.toContain("careconnect" + ".ing")
      expect(contract).not.toMatch(privateBoundaryPathPattern)
    }
    expect(readme).not.toMatch(privateBoundaryPathPattern)
    expect(roadmap).not.toContain("Pre-production (not deployed")
  })

  it("treats push notifications as optional in active operational docs", () => {
    const productionChecklist = readDoc("docs/deployment/production-checklist.md")
    const mobileReady = readDoc("docs/development/mobile-ready.md")

    expect(productionChecklist).toContain("optional integrations remain disabled unless intentionally configured")
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
    expect(rollback).toContain("Exact rollback commands, release roots, host paths")
    expect(rollback).not.toMatch(/\/srv\/apps\//)
    expect(rollback).not.toMatch(/sudo .*deploy-vps-proof\.sh .*env/)
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

  it("keeps private shared-runtime facts out of active public entry points", () => {
    const readme = readDoc("README.md")
    const agents = readDoc("AGENTS.md")
    const docsIndex = readDoc("docs/README.md")
    const productionChecklist = readDoc("docs/deployment/production-checklist.md")
    const directVpsProof = readDoc("docs/deployment/direct-vps-proof.md")

    for (const content of [readme, agents, docsIndex]) {
      expect(content).toContain("Public")
      expect(content).not.toMatch(privateBoundaryPathPattern)
      expect(content).not.toMatch(/\/etc\/projects-/)
      expect(content).not.toMatch(/\/srv\/apps/)
    }

    for (const content of [productionChecklist, directVpsProof]) {
      expect(content).toContain("Public")
      expect(content).not.toMatch(/\/home\/[a-z]+/)
      expect(content).not.toMatch(/\/etc\/projects-/)
      expect(content).not.toMatch(/\/srv\/apps/)
    }

    expect(productionChecklist).toContain("environment-specific production paths are intentionally excluded")
    expect(directVpsProof).toContain("private operations material")
  })

  it("surfaces implementation docs in the docs index", () => {
    const docsIndex = readDoc("docs/README.md")

    expect(docsIndex).toContain("[`implementation/`](implementation/)")
    expect(docsIndex).toContain("[v22 Gate 0 Controls](implementation/v22-0-gate-0-exit-checklist.md)")
    expect(docsIndex).toContain("[Public Documentation Boundary ADR](adr/022-public-documentation-boundary.md)")
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
    const components = readDoc("docs/development/components.md")

    expect(planningIndex).toContain("2026-06-04-public-github-cleanup.md")
    expect(planningIndex).toContain("2026-04-30-v20-0-about-page-polish.md")
    expect(planningIndex).toContain("2026-04-29-v20-0-homepage-search-ux-polish.md")
    expect(planningIndex).toContain("2026-04-23-v20-0-quiet-github-automation-and-url-health-hardening.md")
    expect(planningIndex).toContain("2026-04-28-v22-0-gate-0-prep-and-deploy-contract-alignment.md")
    expect(roadmap).toContain("Public GitHub cleanup (2026-06-05)")
    expect(roadmap).toContain("About page polish (2026-04-30)")
    expect(roadmap).toContain("Homepage search UX polish (2026-04-29)")
    expect(roadmap).toContain("Quiet GitHub automation and URL health hardening (2026-04-23)")
    expect(roadmap).toContain("Gate 0 prep and deploy-contract alignment (2026-04-28)")
    expect(components).toContain("About Page Surfaces")
    expect(components).toContain("AboutTrustOverview")
  })

  it("keeps Gate 0 prep packets from counting as closure evidence", () => {
    const gateTracker = readDoc("docs/implementation/v22-0-gate-0-user-action-tracker.md")
    const gateChecklist = readDoc("docs/implementation/v22-0-gate-0-exit-checklist.md")
    const c1Submission = readDoc("docs/implementation/v22-0-evidence/c1-partner-terms/C1-20260428-submission.md")
    const d4Submission = readDoc("docs/implementation/v22-0-evidence/d4-partner-ops/D4-20260428-submission.md")

    expect(gateTracker).toContain("UA-1")
    expect(gateTracker).toContain("Prep-only packet added")
    expect(gateTracker).toContain("UA-3")
    expect(gateTracker).toContain("execution evidence are still missing")
    expect(gateChecklist).toContain("Gate 0 Exit Decision    | **NO-GO**")
    expect(gateChecklist).toContain("Blocking Checks         | G0-3, G0-8")

    for (const content of [c1Submission, d4Submission]) {
      expect(content).toContain("evidence_status: prep_only")
      expect(content).toContain("Preparation scaffold only")
      expect(content).not.toContain("evidence_status: complete")
    }
  })

  it("keeps C2 retention evidence aligned with its completed Gate 0 status", () => {
    const gateChecklist = readDoc("docs/implementation/v22-0-gate-0-exit-checklist.md")
    const c2Readme = readDoc("docs/implementation/v22-0-evidence/c2-retention/README.md")
    const c2Submission = readDoc("docs/implementation/v22-0-evidence/c2-retention/C2-20260329.md")

    expect(gateChecklist).toContain("G0-4")
    expect(gateChecklist).toContain("C2 retention mapping approved")
    expect(gateChecklist).toContain("Policy approved and dated verification evidence attached")

    expect(c2Readme).toContain("Attached human-supplied artifacts")
    expect(c2Readme).toContain("Dated read-only verification evidence")
    expect(c2Readme).not.toContain("Human-supplied artifacts still required")

    expect(c2Submission).toContain("Verification evidence:")
    expect(c2Submission).toContain("- Status: complete")
    expect(c2Submission).toContain("Observed result:")
    expect(c2Submission).not.toContain("verification_evidence: pending dated read-only query output")
  })

  it("keeps baseline execution evidence distinct from pending formal sign-off", () => {
    const gateChecklist = readDoc("docs/implementation/v22-0-gate-0-exit-checklist.md")
    const baselineReport = readDoc("docs/implementation/v22-0-phase-0-baseline-report-2026-03-09.md")

    expect(gateChecklist).toContain("Baseline M1/M3 execution completed and recorded")
    expect(gateChecklist).toContain("Values are `NULL` due zero denominator in baseline window")

    expect(baselineReport).toContain("| M1")
    expect(baselineReport).toContain("| M3")
    expect(baselineReport).toContain("Executed at (UTC)")
    expect(baselineReport).toContain("Product owner: `pending`")
    expect(baselineReport).toContain("Governance owner: `pending`")
    expect(baselineReport).toContain("M1/M3 execution evidence is recorded above")
    expect(baselineReport).toContain("sign-off fields remain pending and are not used as Gate 0 closure evidence")
    expect(baselineReport).not.toContain("ready for value entry once database execution context is available")
  })

  it("keeps public deploy docs free of live host commands", () => {
    const readme = readDoc("README.md")
    const productionChecklist = readDoc("docs/deployment/production-checklist.md")
    const directVpsProof = readDoc("docs/deployment/direct-vps-proof.md")
    const releaseHelper = readDoc("scripts/archive/release-vps-proof.sh")

    expect(readme).toContain("Public documentation does not include production host paths or release commands")
    expect(productionChecklist).not.toMatch(/\/etc\/projects-/)
    expect(productionChecklist).not.toMatch(/\/srv\/apps/)
    expect(directVpsProof).not.toMatch(/127\.0\.0\.1:3300/)
    expect(releaseHelper).toContain("The optional --deploy mode is only for targets")
  })
})
