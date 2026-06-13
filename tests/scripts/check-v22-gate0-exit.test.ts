import { spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const scriptPath = path.join(process.cwd(), "scripts/check-v22-gate0-exit.sh")

const tempRoots: string[] = []

function createFixtureRoot() {
  const root = mkdtempSync(path.join(tmpdir(), "careconnect-gate0-exit-"))
  tempRoots.push(root)

  mkdirSync(path.join(root, "docs", "implementation", "v22-0-evidence", "c1-partner-terms"), {
    recursive: true,
  })
  mkdirSync(path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops"), {
    recursive: true,
  })

  return root
}

function writeChecklist(
  root: string,
  options: {
    decision: "GO" | "NO-GO"
    g03?: "pass" | "pending" | "fail"
    g08?: "pass" | "pending" | "fail"
    blockingChecks?: string
  }
) {
  const g03 = options.g03 ?? "pending"
  const g08 = options.g08 ?? "pending"
  const blockingChecks = options.blockingChecks ?? "G0-3, G0-8"

  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-gate-0-exit-checklist.md"),
    [
      "| Check ID | Requirement | Current Status (`pass` \\| `fail` \\| `pending`) | Evidence | Notes |",
      "| -------- | ----------- | ------------------------------------------------ | -------- | ----- |",
      "| G0-1 | Step 1 approvals D1-D7 locked | pass | approvals | note |",
      "| G0-2 | Baseline execution recorded | pass | baseline | note |",
      `| G0-3 | C1 legal clause review complete | ${g03} | C1 | note |`,
      "| G0-4 | C2 retention mapping approved | pass | C2 | note |",
      "| G0-5 | C3 activation guard in force | pass | C3 | note |",
      "| G0-6 | External claim revalidation closed | pass | claims | note |",
      "| G0-7 | Threat model critical findings resolved | pass | threat model | note |",
      `| G0-8 | D4 partner ops execution evidence attached | ${g08} | D4 | note |`,
      "",
      "| Field | Value |",
      "| ----- | ----- |",
      `| Gate 0 Exit Decision | **${options.decision}** |`,
      `| Blocking Checks | ${blockingChecks} |`,
    ].join("\n")
  )
}

function writeTracker(
  root: string,
  options: {
    ua1?: "pending" | "in_progress" | "complete"
    ua3?: "pending" | "in_progress" | "complete"
    c1Result?: "pending" | "complete"
  } = {}
) {
  const ua1 = options.ua1 ?? "pending"
  const ua3 = options.ua3 ?? "pending"
  const c1Result = options.c1Result ?? "pending"

  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-gate-0-user-action-tracker.md"),
    [
      "| Action ID | Gate Check | Owner | Required Evidence | Current Status (`pending` \\| `in_progress` \\| `complete`) | Due Date | Last Update | Blocking If Missing (`yes` \\| `no`) | Notes |",
      "| --------- | ---------- | ----- | ----------------- | --------------------------------------------------------- | -------- | ----------- | ----------------------------------- | ----- |",
      `| UA-1 | G0-3 (C1 legal clause review) | jer | C1 evidence | ${ua1} | 2026-03-21 | 2026-06-12 | yes | note |`,
      `| UA-3 | G0-8 (D4 partner ops execution evidence) | jer | D4 evidence | ${ua3} | 2026-03-21 | 2026-06-12 | yes | note |`,
    ].join("\n")
  )

  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-control-c1-legal-review.md"),
    ["# C1 Control", "", "## Decision", "", `- Result: \`${c1Result}\``].join("\n")
  )
}

function writeCompleteEvidence(root: string) {
  const c1Dir = path.join(root, "docs", "implementation", "v22-0-evidence", "c1-partner-terms")
  const d4Dir = path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops")

  writeFileSync(
    path.join(c1Dir, "C1-20260612-submission.md"),
    [
      "Submission ID: C1-20260612",
      "Submitted by: jer",
      "Reviewer: jer",
      "Date: 2026-06-12",
      "Partner: candidate partner",
      "Partner artifact bundle location: C1-20260612-terms.pdf",
      "Final legal recommendation: acceptable",
      "Decision owner: jer",
      "Sign-off date: 2026-06-12",
    ].join("\n")
  )

  writeFileSync(
    path.join(c1Dir, "C1-20260612-clause-matrix.md"),
    [
      "| Clause ID | Source artifact | Source section / page | Requirement under review | Outcome | Notes / rationale | Required mitigation or fallback |",
      "| --------- | --------------- | --------------------- | ------------------------ | ------- | ----------------- | ------------------------------- |",
      "| C1-1 | C1-20260612-terms.pdf | section 1 | No raw query text | pass | ok | none |",
      "| C1-2 | C1-20260612-terms.pdf | section 2 | No identifying telemetry | pass | ok | none |",
      "| C1-3 | C1-20260612-terms.pdf | section 3 | No re-identification | pass | ok | none |",
      "| C1-4 | C1-20260612-terms.pdf | section 4 | No governance conflict | pass | ok | none |",
    ].join("\n")
  )

  writeFileSync(
    path.join(c1Dir, "C1-20260612-artifact-inventory.md"),
    [
      "| Artifact ID | Filename / location | Artifact type | Source / owner | Date received | Used in clause matrix | Notes |",
      "| ----------- | ------------------- | ------------- | -------------- | ------------- | --------------------- | ----- |",
      "| C1-A1 | C1-20260612-terms.pdf | contract and API terms | candidate partner | 2026-06-12 | yes | reviewed source |",
    ].join("\n")
  )

  writeFileSync(
    path.join(d4Dir, "D4-20260612-submission.md"),
    [
      "Submission ID: D4-20260612",
      "Submitted by: jer",
      "Date: 2026-06-12",
      "Outreach owner: jer",
      "Number of dated contact attempts recorded: 1",
      "Number of partners targeted: 5",
      "Number of organizations targeted: 2",
      "Is D4 auditable from the attached artifacts? yes",
    ].join("\n")
  )

  writeFileSync(
    path.join(d4Dir, "D4-20260612-partner-list.md"),
    [
      "| Organization / Partner | Partner type | Primary contact | Contact channel | Priority | Status | Notes |",
      "| ---------------------- | ------------ | --------------- | --------------- | -------- | ------ | ----- |",
      "| Provider 1 | provider | contact | email | primary | planned | note |",
      "| Provider 2 | provider | contact | email | primary | planned | note |",
      "| Provider 3 | provider | contact | email | primary | planned | note |",
      "| Provider 4 | provider | contact | email | primary | planned | note |",
      "| Provider 5 | provider | contact | email | primary | planned | note |",
      "| Frontline 1 | frontline organization | contact | email | primary | planned | note |",
      "| Frontline 2 | frontline organization | contact | email | primary | planned | note |",
    ].join("\n")
  )

  writeFileSync(
    path.join(d4Dir, "D4-20260612-outreach-log.csv"),
    [
      "date,organization_or_partner,contact_name,contact_role,channel,owner,attempt_number,outcome,next_step,source_artifact",
      "2026-06-12,Provider 1,Contact,Role,email,jer,1,sent,follow up,D4-20260612-email.pdf",
    ].join("\n")
  )

  writeFileSync(
    path.join(d4Dir, "D4-20260612-artifact-inventory.md"),
    [
      "| Artifact ID | Filename / location | Artifact type | Source / owner | Date captured | Supports outreach-log row | Notes |",
      "| ----------- | ------------------- | ------------- | -------------- | ------------- | ------------------------- | ----- |",
      "| D4-A1 | D4-20260612-email.pdf | email export | jer | 2026-06-12 | yes | outreach source |",
    ].join("\n")
  )
}

function runGateCheck(root: string) {
  return spawnSync("bash", [scriptPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      GATE0_CHECKLIST_PATH: path.join(root, "docs", "implementation", "v22-0-gate-0-exit-checklist.md"),
      GATE0_TRACKER_PATH: path.join(root, "docs", "implementation", "v22-0-gate-0-user-action-tracker.md"),
      GATE0_C1_CONTROL_PATH: path.join(root, "docs", "implementation", "v22-0-control-c1-legal-review.md"),
      GATE0_C1_EVIDENCE_DIR: path.join(root, "docs", "implementation", "v22-0-evidence", "c1-partner-terms"),
      GATE0_D4_EVIDENCE_DIR: path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops"),
    },
    encoding: "utf8",
  })
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true })
  }
})

describe("check-v22-gate0-exit", () => {
  it("blocks current NO-GO state when blocking checks match non-pass statuses", () => {
    const root = createFixtureRoot()
    writeChecklist(root, { decision: "NO-GO" })
    writeTracker(root)

    const result = runGateCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("BLOCKED: v22.0 Gate 0 decision is 'NO-GO'")
    expect(result.stdout).toContain("Blocking checks: G0-3, G0-8")
    expect(result.stdout).not.toContain("does not match required-check statuses")
  })

  it("reports stale NO-GO blocking checks", () => {
    const root = createFixtureRoot()
    writeChecklist(root, { decision: "NO-GO", blockingChecks: "G0-3" })
    writeTracker(root)

    const result = runGateCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("ERROR: Gate 0 Blocking Checks row does not match required-check statuses.")
    expect(result.stdout).toContain("Expected blocking checks: G0-3,G0-8")
    expect(result.stdout).toContain("Actual blocking checks: G0-3")
  })

  it("blocks GO when any required check is still non-pass", () => {
    const root = createFixtureRoot()
    writeChecklist(root, { decision: "GO", g03: "pass", g08: "pending", blockingChecks: "G0-8" })
    writeTracker(root, { ua1: "complete", ua3: "pending", c1Result: "complete" })
    writeCompleteEvidence(root)

    const result = runGateCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("BLOCKED: Gate 0 decision is GO but required checks are not all pass.")
    expect(result.stdout).toContain("G0-8:PENDING")
  })

  it("passes GO only when all required checks pass and evidence is structurally complete", () => {
    const root = createFixtureRoot()
    writeChecklist(root, { decision: "GO", g03: "pass", g08: "pass", blockingChecks: "" })
    writeTracker(root, { ua1: "complete", ua3: "complete", c1Result: "complete" })
    writeCompleteEvidence(root)

    const result = runGateCheck(root)

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain("OK: v22.0 Gate 0 decision is GO and all required checks are pass.")
  })
})
