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

    expect(roadmap).toContain("https://helpbridge.ca")
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
    expect(rollback).toContain("/srv/apps/helpbridge-web/releases")
    expect(rollback).toContain("./scripts/deploy-vps-proof.sh /etc/projects-merge/env/helpbridge-web.env")
  })

  it("points shared VPS facts to platform-ops in active entry points", () => {
    const readme = readDoc("README.md")
    const agents = readDoc("AGENTS.md")
    const docsIndex = readDoc("docs/README.md")
    const productionChecklist = readDoc("docs/deployment/production-checklist.md")
    const directVpsProof = readDoc("docs/deployment/direct-vps-proof.md")

    for (const content of [readme, agents, docsIndex, productionChecklist, directVpsProof]) {
      expect(content).toContain("/home/jer/repos/platform-ops/PLAT-009-shared-vps-documentation-boundary.md")
    }

    expect(productionChecklist).toContain(
      "Shared host topology, ingress ownership, and other cross-project VPS facts are canonical in `/home/jer/repos/platform-ops`."
    )
    expect(directVpsProof).toContain(
      "Shared host topology, ingress ownership, service inventory, and other cross-project VPS facts are canonical in `/home/jer/repos/platform-ops`."
    )
  })

  it("surfaces implementation docs in the docs index", () => {
    const docsIndex = readDoc("docs/README.md")

    expect(docsIndex).toContain("[`implementation/`](implementation/)")
    expect(docsIndex).toContain("[v22 Gate 0 Controls](implementation/v22-0-gate-0-exit-checklist.md)")
  })
})
