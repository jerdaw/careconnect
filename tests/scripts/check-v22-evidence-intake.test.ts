import { spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const scriptPath = path.join(process.cwd(), "scripts/check-v22-evidence-intake.sh")

const tempRoots: string[] = []

function createFixtureRoot() {
  const root = mkdtempSync(path.join(tmpdir(), "careconnect-gate0-"))
  tempRoots.push(root)

  mkdirSync(path.join(root, "docs", "implementation", "v22-0-evidence", "c1-partner-terms"), {
    recursive: true,
  })
  mkdirSync(path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops"), {
    recursive: true,
  })

  return root
}

function writeBaseDocs(
  root: string,
  options: {
    c1Gate?: string
    c1Action?: string
    c1Result?: string
    d4Gate?: string
    d4Action?: string
  } = {}
) {
  const c1Gate = options.c1Gate ?? "pending"
  const c1Action = options.c1Action ?? "pending"
  const c1Result = options.c1Result ?? "pending"
  const d4Gate = options.d4Gate ?? "pending"
  const d4Action = options.d4Action ?? "pending"

  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-gate-0-exit-checklist.md"),
    [
      "| Check ID | Requirement | Current Status (`pass` \\| `fail` \\| `pending`) | Evidence | Notes |",
      "| -------- | ----------- | ------------------------------------------------ | -------- | ----- |",
      `| G0-3 | C1 legal clause review complete | ${c1Gate} | C1 | note |`,
      `| G0-8 | D4 partner ops execution evidence attached | ${d4Gate} | D4 | note |`,
    ].join("\n")
  )

  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-gate-0-user-action-tracker.md"),
    [
      "| Action ID | Gate Check | Owner | Required Evidence | Current Status (`pending` \\| `in_progress` \\| `complete`) | Due Date | Last Update | Blocking If Missing (`yes` \\| `no`) | Notes |",
      "| --------- | ---------- | ----- | ----------------- | --------------------------------------------------------- | -------- | ----------- | ----------------------------------- | ----- |",
      `| UA-1 | G0-3 (C1 legal clause review) | jer | C1 evidence | ${c1Action} | 2026-03-21 | 2026-06-12 | yes | note |`,
      `| UA-3 | G0-8 (D4 partner ops execution evidence) | jer | D4 evidence | ${d4Action} | 2026-03-21 | 2026-06-12 | yes | note |`,
    ].join("\n")
  )

  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-control-c1-legal-review.md"),
    ["# C1 Control", "", "## Decision", "", `- Result: \`${c1Result}\``].join("\n")
  )
}

function writePrepEvidence(root: string) {
  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-evidence", "c1-partner-terms", "C1-20260428-submission.md"),
    ["---", "evidence_status: prep_only", "---", "", "Final legal recommendation: pending"].join("\n")
  )

  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops", "D4-20260428-submission.md"),
    ["---", "evidence_status: prep_only", "---", "", "Outreach owner:"].join("\n")
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

function overwriteD4OutreachLog(root: string, rows: string[]) {
  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops", "D4-20260612-outreach-log.csv"),
    rows.join("\n")
  )
}

function overwriteC1Submission(root: string, rows: string[]) {
  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-evidence", "c1-partner-terms", "C1-20260612-submission.md"),
    rows.join("\n")
  )
}

function overwriteC1ClauseMatrix(root: string, rows: string[]) {
  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-evidence", "c1-partner-terms", "C1-20260612-clause-matrix.md"),
    rows.join("\n")
  )
}

function overwriteC1ArtifactInventory(root: string, rows: string[]) {
  writeFileSync(
    path.join(
      root,
      "docs",
      "implementation",
      "v22-0-evidence",
      "c1-partner-terms",
      "C1-20260612-artifact-inventory.md"
    ),
    rows.join("\n")
  )
}

function overwriteD4Submission(root: string, rows: string[]) {
  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops", "D4-20260612-submission.md"),
    rows.join("\n")
  )
}

function overwriteD4PartnerList(root: string, rows: string[]) {
  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops", "D4-20260612-partner-list.md"),
    rows.join("\n")
  )
}

function overwriteD4ArtifactInventory(root: string, rows: string[]) {
  writeFileSync(
    path.join(root, "docs", "implementation", "v22-0-evidence", "d4-partner-ops", "D4-20260612-artifact-inventory.md"),
    rows.join("\n")
  )
}

function runEvidenceCheck(root: string) {
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

describe("check-v22-evidence-intake", () => {
  it("passes when C1 and D4 are still pending with prep-only evidence", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root)
    writePrepEvidence(root)

    const result = runEvidenceCheck(root)

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain("OK: v22.0 Gate 0 C1/D4 evidence intake is internally consistent.")
  })

  it("fails when C1 is marked complete but only prep-only evidence exists", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, { c1Gate: "pass", c1Action: "complete", c1Result: "complete" })
    writePrepEvidence(root)

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("no non-prep C1 submission exists")
  })

  it("fails when D4 is marked complete but only prep-only evidence exists", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, { d4Gate: "pass", d4Action: "complete" })
    writePrepEvidence(root)

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("no non-prep D4 submission exists")
  })

  it("passes when C1 and D4 are complete with non-prep closure evidence", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)

    const result = runEvidenceCheck(root)

    expect(result.status, result.stdout + result.stderr).toBe(0)
  })

  it("passes when canonical Markdown table headers are formatter-aligned", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteC1ClauseMatrix(root, [
      "| Clause ID | Source artifact        | Source section / page | Requirement under review | Outcome | Notes / rationale | Required mitigation or fallback |",
      "| --------- | ---------------------- | --------------------- | ------------------------ | ------- | ----------------- | ------------------------------- |",
      "| C1-1 | C1-20260612-terms.pdf | section 1 | No raw query text | pass | ok | none |",
      "| C1-2 | C1-20260612-terms.pdf | section 2 | No identifying telemetry | pass | ok | none |",
      "| C1-3 | C1-20260612-terms.pdf | section 3 | No re-identification | pass | ok | none |",
      "| C1-4 | C1-20260612-terms.pdf | section 4 | No governance conflict | pass | ok | none |",
    ])
    overwriteC1ArtifactInventory(root, [
      "| Artifact ID | Filename / location    | Artifact type          | Source / owner    | Date received | Used in clause matrix | Notes           |",
      "| ----------- | ---------------------- | ---------------------- | ----------------- | ------------- | --------------------- | --------------- |",
      "| C1-A1 | C1-20260612-terms.pdf | contract and API terms | candidate partner | 2026-06-12 | yes | reviewed source |",
    ])
    overwriteD4PartnerList(root, [
      "| Organization / Partner | Partner type          | Primary contact | Contact channel | Priority | Status  | Notes |",
      "| ---------------------- | --------------------- | --------------- | --------------- | -------- | ------- | ----- |",
      "| Provider 1 | provider | contact | email | primary | planned | note |",
      "| Provider 2 | provider | contact | email | primary | planned | note |",
      "| Provider 3 | provider | contact | email | primary | planned | note |",
      "| Provider 4 | provider | contact | email | primary | planned | note |",
      "| Provider 5 | provider | contact | email | primary | planned | note |",
      "| Frontline 1 | frontline organization | contact | email | primary | planned | note |",
      "| Frontline 2 | frontline organization | contact | email | primary | planned | note |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status, result.stdout + result.stderr).toBe(0)
  })

  it("passes when a C1 conditional clause includes rationale and fallback", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteC1Submission(root, [
      "Submission ID: C1-20260612",
      "Submitted by: jer",
      "Reviewer: jer",
      "Date: 2026-06-12",
      "Partner: candidate partner",
      "Partner artifact bundle location: C1-20260612-terms.pdf",
      "Final legal recommendation: acceptable_with_conditions",
      "Decision owner: jer",
      "Sign-off date: 2026-06-12",
    ])
    overwriteC1ClauseMatrix(root, [
      "| Clause ID | Source artifact | Source section / page | Requirement under review | Outcome | Notes / rationale | Required mitigation or fallback |",
      "| --------- | --------------- | --------------------- | ------------------------ | ------- | ----------------- | ------------------------------- |",
      "| C1-1 | C1-20260612-terms.pdf | section 1 | No raw query text | pass | ok | none |",
      "| C1-2 | C1-20260612-terms.pdf | section 2 | No identifying telemetry | pass | ok | none |",
      "| C1-3 | C1-20260612-terms.pdf | section 3 | No re-identification | acceptable_with_conditions | clause narrowed by addendum | disable integration until addendum signed |",
      "| C1-4 | C1-20260612-terms.pdf | section 4 | No governance conflict | pass | ok | none |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status, result.stdout + result.stderr).toBe(0)
  })

  it("fails when a C1 non-pass clause omits rationale or fallback", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteC1ClauseMatrix(root, [
      "| Clause ID | Source artifact | Source section / page | Requirement under review | Outcome | Notes / rationale | Required mitigation or fallback |",
      "| --------- | --------------- | --------------------- | ------------------------ | ------- | ----------------- | ------------------------------- |",
      "| C1-1 | C1-20260612-terms.pdf | section 1 | No raw query text | pass | ok | none |",
      "| C1-2 | C1-20260612-terms.pdf | section 2 | No identifying telemetry | pass | ok | none |",
      "| C1-3 | C1-20260612-terms.pdf | section 3 | No re-identification | fail |  |  |",
      "| C1-4 | C1-20260612-terms.pdf | section 4 | No governance conflict | pass | ok | none |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("row C1-3 must include notes / rationale for non-pass outcomes")
    expect(result.stdout).toContain("row C1-3 must include required mitigation or fallback for non-pass outcomes")
  })

  it("fails when the C1 clause matrix does not use the canonical header", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteC1ClauseMatrix(root, [
      "| Clause ID | Source artifact | Source section / page | Outcome |",
      "| --------- | --------------- | --------------------- | ------- |",
      "| C1-1 | C1-20260612-terms.pdf | section 1 | pass |",
      "| C1-2 | C1-20260612-terms.pdf | section 2 | pass |",
      "| C1-3 | C1-20260612-terms.pdf | section 3 | pass |",
      "| C1-4 | C1-20260612-terms.pdf | section 4 | pass |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("canonical C1 clause matrix header")
  })

  it("fails when the C1 clause matrix repeats a required clause row", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteC1ClauseMatrix(root, [
      "| Clause ID | Source artifact | Source section / page | Requirement under review | Outcome | Notes / rationale | Required mitigation or fallback |",
      "| --------- | --------------- | --------------------- | ------------------------ | ------- | ----------------- | ------------------------------- |",
      "| C1-1 | C1-20260612-terms.pdf | section 1 | No raw query text | pass | ok | none |",
      "| C1-2 | C1-20260612-terms.pdf | section 2 | No identifying telemetry | pass | ok | none |",
      "| C1-3 | C1-20260612-terms.pdf | section 3 | No re-identification | pass | ok | none |",
      "| C1-3 | C1-20260612-terms.pdf | section 3 addendum | No re-identification | pass | ok | none |",
      "| C1-4 | C1-20260612-terms.pdf | section 4 | No governance conflict | pass | ok | none |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("must include exactly one row for C1-3; found 2")
  })

  it("fails when C1 closure evidence is missing the artifact inventory", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    rmSync(
      path.join(
        root,
        "docs",
        "implementation",
        "v22-0-evidence",
        "c1-partner-terms",
        "C1-20260612-artifact-inventory.md"
      ),
      { force: true }
    )

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("C1 artifact inventory not found")
  })

  it("fails when C1 matrix source artifacts are absent from the inventory", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteC1ArtifactInventory(root, [
      "| Artifact ID | Filename / location | Artifact type | Source / owner | Date received | Used in clause matrix | Notes |",
      "| ----------- | ------------------- | ------------- | -------------- | ------------- | --------------------- | ----- |",
      "| C1-A2 | C1-20260612-addendum.pdf | addendum | candidate partner | 2026-06-12 | yes | reviewed source |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("source artifact 'C1-20260612-terms.pdf'")
    expect(result.stdout).toContain("must appear as an Artifact ID or Filename / location")
  })

  it("fails when the C1 submission ID does not match the filename", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteC1Submission(root, [
      "Submission ID: C1-20260613",
      "Submitted by: jer",
      "Reviewer: jer",
      "Date: 2026-06-12",
      "Partner: candidate partner",
      "Partner artifact bundle location: C1-20260612-terms.pdf",
      "Final legal recommendation: acceptable",
      "Decision owner: jer",
      "Sign-off date: 2026-06-12",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("Submission ID 'C1-20260613'")
    expect(result.stdout).toContain("filename-derived ID 'C1-20260612'")
  })

  it("fails when C1 submission dates are not YYYY-MM-DD", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteC1Submission(root, [
      "Submission ID: C1-20260612",
      "Submitted by: jer",
      "Reviewer: jer",
      "Date: June 12, 2026",
      "Partner: candidate partner",
      "Partner artifact bundle location: C1-20260612-terms.pdf",
      "Final legal recommendation: acceptable",
      "Decision owner: jer",
      "Sign-off date: 06/12/2026",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("'Date' value in YYYY-MM-DD format")
    expect(result.stdout).toContain("'Sign-off date' value in YYYY-MM-DD format")
  })

  it("fails when D4 submission counts are not positive integers", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4Submission(root, [
      "Submission ID: D4-20260612",
      "Submitted by: jer",
      "Date: 2026-06-12",
      "Outreach owner: jer",
      "Number of dated contact attempts recorded: many",
      "Number of partners targeted: 0",
      "Number of organizations targeted: two",
      "Is D4 auditable from the attached artifacts? yes",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("positive integer 'Number of dated contact attempts recorded'")
    expect(result.stdout).toContain("positive integer 'Number of partners targeted'")
    expect(result.stdout).toContain("positive integer 'Number of organizations targeted'")
  })

  it("fails when the D4 submission ID does not match the filename", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4Submission(root, [
      "Submission ID: D4-20260613",
      "Submitted by: jer",
      "Date: 2026-06-12",
      "Outreach owner: jer",
      "Number of dated contact attempts recorded: 1",
      "Number of partners targeted: 5",
      "Number of organizations targeted: 2",
      "Is D4 auditable from the attached artifacts? yes",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("Submission ID 'D4-20260613'")
    expect(result.stdout).toContain("filename-derived ID 'D4-20260612'")
  })

  it("fails when D4 submitted counts do not match attached artifacts", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4Submission(root, [
      "Submission ID: D4-20260612",
      "Submitted by: jer",
      "Date: 2026-06-12",
      "Outreach owner: jer",
      "Number of dated contact attempts recorded: 2",
      "Number of partners targeted: 6",
      "Number of organizations targeted: 3",
      "Is D4 auditable from the attached artifacts? yes",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("must match outreach log execution rows (1)")
    expect(result.stdout).toContain("must match provider rows in the partner list (5)")
    expect(result.stdout).toContain("must match frontline organization rows in the partner list (2)")
  })

  it("fails when D4 closure evidence is missing the artifact inventory", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    rmSync(
      path.join(
        root,
        "docs",
        "implementation",
        "v22-0-evidence",
        "d4-partner-ops",
        "D4-20260612-artifact-inventory.md"
      ),
      { force: true }
    )

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("D4 artifact inventory not found")
  })

  it("fails when D4 outreach source artifacts are absent from the inventory", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4ArtifactInventory(root, [
      "| Artifact ID | Filename / location | Artifact type | Source / owner | Date captured | Supports outreach-log row | Notes |",
      "| ----------- | ------------------- | ------------- | -------------- | ------------- | ------------------------- | ----- |",
      "| D4-A2 | D4-20260612-follow-up.pdf | email export | jer | 2026-06-12 | yes | different source |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("source_artifact 'D4-20260612-email.pdf'")
    expect(result.stdout).toContain("must appear as an Artifact ID or Filename / location")
  })

  it("fails when D4 partner list does not use the canonical header", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4PartnerList(root, [
      "| Organization | Type | Status |",
      "| ------------ | ---- | ------ |",
      "| Provider 1 | provider | planned |",
      "| Provider 2 | provider | planned |",
      "| Provider 3 | provider | planned |",
      "| Provider 4 | provider | planned |",
      "| Provider 5 | provider | planned |",
      "| Frontline 1 | frontline organization | planned |",
      "| Frontline 2 | frontline organization | planned |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("canonical D4 partner-list header")
  })

  it("fails when D4 partner list rows use loose partner types", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4PartnerList(root, [
      "| Organization / Partner | Partner type | Primary contact | Contact channel | Priority | Status | Notes |",
      "| ---------------------- | ------------ | --------------- | --------------- | -------- | ------ | ----- |",
      "| Provider 1 | provider candidate | contact | email | primary | planned | note |",
      "| Provider 2 | provider | contact | email | primary | planned | note |",
      "| Provider 3 | provider | contact | email | primary | planned | note |",
      "| Provider 4 | provider | contact | email | primary | planned | note |",
      "| Provider 5 | provider | contact | email | primary | planned | note |",
      "| Frontline 1 | frontline organization / provider | contact | email | primary | planned | note |",
      "| Frontline 2 | frontline organization | contact | email | primary | planned | note |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("partner type other than provider or frontline organization")
  })

  it("fails when D4 partner list repeats an organization", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4PartnerList(root, [
      "| Organization / Partner | Partner type | Primary contact | Contact channel | Priority | Status | Notes |",
      "| ---------------------- | ------------ | --------------- | --------------- | -------- | ------ | ----- |",
      "| Provider 1 | provider | contact | email | primary | planned | note |",
      "| Provider 1 | provider | contact | email | primary | planned | note |",
      "| Provider 2 | provider | contact | email | primary | planned | note |",
      "| Provider 3 | provider | contact | email | primary | planned | note |",
      "| Provider 4 | provider | contact | email | primary | planned | note |",
      "| Provider 5 | provider | contact | email | primary | planned | note |",
      "| Frontline 1 | frontline organization | contact | email | primary | planned | note |",
      "| Frontline 2 | frontline organization | contact | email | primary | planned | note |",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("duplicate organization / partner row")
  })

  it("fails when D4 outreach log does not use the canonical header", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4OutreachLog(root, ["date,organization,owner,outcome", "2026-06-12,Provider 1,jer,sent"])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("canonical D4 outreach CSV header")
  })

  it("fails when D4 outreach log dates are not YYYY-MM-DD", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4OutreachLog(root, [
      "date,organization_or_partner,contact_name,contact_role,channel,owner,attempt_number,outcome,next_step,source_artifact",
      "06/12/2026,Provider 1,Contact,Role,email,jer,1,sent,follow up,D4-20260612-email.pdf",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("non-YYYY-MM-DD date")
  })

  it("fails when D4 outreach log rows omit attempt number or source artifact", () => {
    const root = createFixtureRoot()
    writeBaseDocs(root, {
      c1Gate: "pass",
      c1Action: "complete",
      c1Result: "complete",
      d4Gate: "pass",
      d4Action: "complete",
    })
    writeCompleteEvidence(root)
    overwriteD4OutreachLog(root, [
      "date,organization_or_partner,contact_name,contact_role,channel,owner,attempt_number,outcome,next_step,source_artifact",
      "2026-06-12,Provider 1,Contact,Role,email,jer,0,sent,follow up,",
    ])

    const result = runEvidenceCheck(root)

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("missing or non-positive attempt_number")
    expect(result.stdout).toContain("missing source_artifact traceability")
  })

  it("is wired into the Gate 0 release guard", () => {
    const result = spawnSync("bash", [path.join(process.cwd(), "scripts/check-v22-gate0-exit.sh")], {
      cwd: process.cwd(),
      encoding: "utf8",
    })

    expect(result.status).toBe(1)
    expect(result.stdout).toContain("OK: v22.0 Gate 0 C1/D4 evidence intake is internally consistent.")
    expect(result.stdout).toContain("BLOCKED: v22.0 Gate 0 decision is 'NO-GO'")
  })
})
