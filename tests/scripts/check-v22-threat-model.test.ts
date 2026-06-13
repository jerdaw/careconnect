import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const scriptPath = path.join(process.cwd(), "scripts/check-v22-threat-model.sh")

const tempRoots: string[] = []

function createFixtureRoot() {
  const root = mkdtempSync(path.join(tmpdir(), "careconnect-threat-model-"))
  tempRoots.push(root)
  return root
}

function writeThreatModel(
  root: string,
  options: {
    criticalVerified?: "yes" | "no"
    criticalOutcome?: "GO" | "NO-GO"
    highOwner?: string
    highDueDate?: string
    highPlan?: string
    highOutcome?: "GO" | "NO-GO"
    signoffLine?: string
    signoffOutcome?: "GO" | "NO-GO"
  } = {}
) {
  const criticalVerified = options.criticalVerified
  const criticalOutcome = options.criticalOutcome ?? "GO"
  const highOwner = options.highOwner ?? "Engineering"
  const highDueDate = options.highDueDate ?? "2026-03-21"
  const highPlan = options.highPlan ?? "Minimize payload fields and keep identifiers non-personal"
  const highOutcome = options.highOutcome ?? "GO"
  const signoffLine = options.signoffLine ?? "- Security/governance owner review: `jer` (2026-03-09)"
  const signoffOutcome = options.signoffOutcome ?? "GO"

  const mitigationRows = [
    "| Finding ID | Severity | Mitigation Plan | Owner | Due Date | Verification Method | Verified |",
    "| ---------- | -------- | --------------- | ----- | -------- | ------------------- | -------- |",
    `| F1 | high | ${highPlan} | ${highOwner} | ${highDueDate} | Schema + payload inspection | no |`,
    "| F2 | medium | Define local corruption recovery steps | Engineering | 2026-03-21 | Dry-run execution | no |",
  ]

  if (criticalVerified) {
    mitigationRows.push(
      `| F9 | critical | Resolve critical local-data issue | Engineering | 2026-03-21 | Security review | ${criticalVerified} |`
    )
  }

  writeFileSync(
    path.join(root, "threat-model.md"),
    [
      "# Threat Model",
      "",
      "## Mitigation Tracking",
      "",
      ...mitigationRows,
      "",
      "## 2026-06-12 Mitigation Evidence Audit",
      "",
      "| Finding ID | Evidence Inspected | Current Result |",
      "| ---------- | ------------------ | -------------- |",
      "| F1 | `lib/schemas/privacy-guards.ts` | Partially mitigated; Verified stays `no`. |",
      "",
      "## Sign-Off",
      "",
      signoffLine,
      "",
      "## Gate 0 Security Outcome",
      "",
      "| Criterion | Status |",
      "| --------- | ------ |",
      `| Critical findings resolved | ${criticalOutcome} |`,
      `| High findings have owners and mitigation plans | ${highOutcome} |`,
      `| Threat model signed by security/governance owner | ${signoffOutcome} |`,
    ].join("\n")
  )
}

function runThreatModelCheck(root: string) {
  return spawnSync("bash", [scriptPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      V22_THREAT_MODEL_PATH: path.join(root, "threat-model.md"),
    },
    encoding: "utf8",
  })
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true })
  }
})

describe("check-v22-threat-model", () => {
  it("passes when high findings are unverified but have owners, due dates, and mitigation plans", () => {
    const root = createFixtureRoot()
    writeThreatModel(root)

    const result = runThreatModelCheck(root)

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain("OK: v22.0 threat-model Gate 0 security outcome is internally consistent.")
  })

  it("fails unresolved critical findings", () => {
    const root = createFixtureRoot()
    writeThreatModel(root, { criticalVerified: "no" })

    const result = runThreatModelCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("Unresolved critical findings block Gate 0 security outcome: F9")
  })

  it("fails high findings without complete mitigation ownership metadata", () => {
    const root = createFixtureRoot()
    writeThreatModel(root, { highOwner: "pending", highDueDate: "TBD", highPlan: "" })

    const result = runThreatModelCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("F1 must include a mitigation plan")
    expect(result.stdout).toContain("F1 must include an owner")
    expect(result.stdout).toContain("F1 must include a due date")
    expect(result.stdout).toContain("High findings are missing owner, due date, or mitigation plan: F1")
  })

  it("fails when the Gate 0 outcome contradicts the mitigation matrix", () => {
    const root = createFixtureRoot()
    writeThreatModel(root, { criticalOutcome: "NO-GO", highOutcome: "NO-GO" })

    const result = runThreatModelCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("Critical findings resolved must be GO")
    expect(result.stdout).toContain("High findings have owners and mitigation plans must be GO")
  })

  it("fails a GO sign-off outcome without a concrete sign-off line", () => {
    const root = createFixtureRoot()
    writeThreatModel(root, { signoffLine: "- Security/governance owner review: pending" })

    const result = runThreatModelCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("sign-off line is missing or placeholder")
  })
})
