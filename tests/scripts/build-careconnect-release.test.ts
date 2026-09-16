import { createHash } from "node:crypto"
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync, type SpawnSyncReturns } from "node:child_process"
import { afterEach, describe, expect, it, vi } from "vitest"

const repoRoot = resolve(__dirname, "../..")
const builder = join(repoRoot, "scripts/releases/build-careconnect-release.py")
const temporaryRoots: string[] = []

interface BuilderResult {
  artifact: string
  inventory: string
  manifest: string
  signature: string
  [key: string]: string | boolean
}

interface ReleaseInventory {
  artifacts: {
    manifest: { sha256: string }
    signature: { sha256: string }
  }
  [key: string]: unknown
}

function temporaryRoot(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `careconnect-${label}-`))
  temporaryRoots.push(root)
  return root
}

function run(command: string, args: string[], cwd?: string, input?: Buffer): SpawnSyncReturns<string> {
  // Git hooks export repository-local variables, including GIT_INDEX_FILE.
  // Fixture commands (and the builder's child Git processes) must use only
  // their disposable repository, never the invoking commit's index or refs.
  const env = { ...process.env }
  for (const key of Object.keys(env)) {
    if (key.startsWith("GIT_")) delete env[key]
  }
  return spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    input,
    timeout: 120_000,
  })
}

function runGit(cwd: string, ...args: string[]): string {
  const result = run("git", args, cwd)
  expect(result.status, result.stderr).toBe(0)
  return result.stdout.trim()
}

function writeRequiredSource(source: string): void {
  mkdirSync(join(source, "scripts/archive"), { recursive: true })
  writeFileSync(join(source, "package.json"), '{"name":"careconnect-release-test"}\n')
  writeFileSync(join(source, "package-lock.json"), '{"name":"careconnect-release-test","lockfileVersion":3}\n')
  writeFileSync(join(source, "Dockerfile"), "FROM scratch\n")
  writeFileSync(join(source, "scripts/deploy-vps-proof.sh"), "#!/bin/sh\nexit 0\n")
  writeFileSync(join(source, "scripts/archive/deploy-vps-proof.sh"), "#!/bin/sh\nexit 0\n")
  chmodSync(join(source, "scripts/deploy-vps-proof.sh"), 0o755)
  chmodSync(join(source, "scripts/archive/deploy-vps-proof.sh"), 0o755)
  writeFileSync(join(source, ".env.example"), "PLACEHOLDER=value\n")
  writeFileSync(join(source, ".gitignore"), "node_modules/\npnpm-lock.yaml\n")
  writeFileSync(join(source, "AGENTS.md"), "# Test instructions\n")
  symlinkSync("AGENTS.md", join(source, "CLAUDE.md"))
  symlinkSync("AGENTS.md", join(source, "GEMINI.md"))
}

function makeSource(root: string): { source: string; revision: string; tree: string } {
  const source = join(root, "source")
  const hooks = join(root, "empty-hooks")
  mkdirSync(source, { recursive: true })
  mkdirSync(hooks)
  writeRequiredSource(source)
  runGit(source, "init", "-b", "main")
  // Disposable fixture commits must not inherit workstation-global project hooks.
  runGit(source, "config", "core.hooksPath", hooks)
  runGit(source, "config", "user.name", "Release Test")
  runGit(source, "config", "user.email", "release-test@example.invalid")
  runGit(source, "add", ".")
  runGit(source, "commit", "-m", "test: create release fixture")
  runGit(source, "remote", "add", "origin", source)
  runGit(source, "update-ref", "refs/remotes/origin/main", "HEAD")
  expect(runGit(source, "status", "--porcelain=v1", "--untracked-files=all")).toBe("")
  return {
    source,
    revision: runGit(source, "rev-parse", "HEAD"),
    tree: runGit(source, "rev-parse", "HEAD^{tree}"),
  }
}

function makeSigningKey(root: string): string {
  const key = join(root, "signing_ed25519")
  const result = run("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", "release-test", "-f", key])
  expect(result.status, result.stderr).toBe(0)
  chmodSync(key, 0o600)
  return key
}

function build(
  source: string,
  revision: string,
  outDir: string,
  key: string,
  extra: string[] = ["--allow-ephemeral-output-for-testing"]
): SpawnSyncReturns<string> {
  return run("python3", [builder, source, revision, outDir, key, ...extra])
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe("CareConnect signed release builder", () => {
  it("isolates disposable Git fixtures from the invoking hook environment", () => {
    const root = temporaryRoot("release-git-environment")
    const callerIndex = join(root, "caller-index")
    writeFileSync(callerIndex, "caller index sentinel")
    vi.stubEnv("GIT_INDEX_FILE", callerIndex)
    vi.stubEnv("GIT_DIR", join(root, "not-the-fixture-repository"))
    vi.stubEnv("GIT_WORK_TREE", root)
    try {
      const { source } = makeSource(root)
      expect(runGit(source, "rev-parse", "--show-toplevel")).toBe(realpathSync(source))
      expect(readFileSync(callerIndex, "utf8")).toBe("caller index sentinel")
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it("creates and verifies a reproducible exact-main source release", () => {
    const root = temporaryRoot("release-main")
    const { source, revision, tree } = makeSource(root)
    const key = makeSigningKey(root)
    const firstOut = join(root, "out-first")
    const secondOut = join(root, "out-second")

    const first = build(source, revision, firstOut, key)
    expect(first.status, first.stderr).toBe(0)
    const result = JSON.parse(first.stdout) as BuilderResult
    expect(result).toMatchObject({
      ok: true,
      releaseMode: "exact-main",
      revision,
      secretValuesCollected: false,
      signatureVerified: true,
      sourceTree: tree,
    })

    const artifact = join(firstOut, String(result.artifact))
    const manifest = join(firstOut, String(result.manifest))
    const signature = join(firstOut, String(result.signature))
    const inventory = join(firstOut, String(result.inventory))
    for (const path of [artifact, manifest, signature, inventory]) {
      expect(statSync(path).mode & 0o777).toBe(0o600)
    }

    const manifestPayload = JSON.parse(readFileSync(manifest, "utf8"))
    expect(manifestPayload).toEqual({
      artifacts: [{ path: String(result.artifact), sha256: sha256(artifact) }],
      generatedAt: expect.any(String),
      revision,
      schemaVersion: "prod-ai-release-artifact-v1",
      service: "careconnect-web",
    })
    const inventoryPayload = JSON.parse(readFileSync(inventory, "utf8")) as ReleaseInventory
    expect(inventoryPayload).toMatchObject({
      releaseMode: "exact-main",
      schemaVersion: "careconnect-release-inventory-v1",
      service: "careconnect-web",
      source: { mainRevision: revision, revision, tree },
      verification: {
        archiveMembersMatchSource: true,
        archiveSha256Verified: true,
        executableImagePreserved: false,
        executableRollbackProven: false,
        signatureVerified: true,
        sourceClean: true,
      },
    })
    expect(inventoryPayload.artifacts.manifest.sha256).toBe(sha256(manifest))
    expect(inventoryPayload.artifacts.signature.sha256).toBe(sha256(signature))

    const members = run("tar", ["-tzf", artifact])
    expect(members.status, members.stderr).toBe(0)
    expect(members.stdout).toContain("package.json")
    expect(members.stdout).toContain("scripts/archive/deploy-vps-proof.sh")
    expect(members.stdout).not.toContain(".env.local")
    expect(members.stdout).not.toContain("node_modules")

    const allowedSigners = join(root, "allowed-signers")
    writeFileSync(allowedSigners, `prod-ai-maintenance ${readFileSync(`${key}.pub`, "utf8").trim()}\n`)
    const verify = run(
      "ssh-keygen",
      [
        "-Y",
        "verify",
        "-f",
        allowedSigners,
        "-I",
        "prod-ai-maintenance",
        "-n",
        "prod-ai-release-artifact",
        "-s",
        signature,
      ],
      undefined,
      readFileSync(manifest)
    )
    expect(verify.status, verify.stderr).toBe(0)

    const second = build(source, revision, secondOut, key)
    expect(second.status, second.stderr).toBe(0)
    const secondResult = JSON.parse(second.stdout) as BuilderResult
    expect(sha256(join(secondOut, secondResult.artifact))).toBe(sha256(artifact))
  })

  it("requires an explicit expected tree for a verified ancestor rollback", () => {
    const root = temporaryRoot("release-rollback")
    const { source, revision: rollbackRevision, tree: rollbackTree } = makeSource(root)
    const key = makeSigningKey(root)
    writeFileSync(join(source, "later.txt"), "later main source\n")
    runGit(source, "add", "later.txt")
    runGit(source, "commit", "-m", "test: advance main")
    runGit(source, "update-ref", "refs/remotes/origin/main", "HEAD")
    const mainRevision = runGit(source, "rev-parse", "HEAD")

    const missingTree = build(source, rollbackRevision, join(root, "missing-tree"), key, [
      "--release-mode",
      "verified-ancestor-rollback",
      "--allow-ephemeral-output-for-testing",
    ])
    expect(missingTree.status).toBe(2)
    expect(missingTree.stderr).toContain("requires --expected-tree")

    const wrongTree = build(source, rollbackRevision, join(root, "wrong-tree"), key, [
      "--release-mode",
      "verified-ancestor-rollback",
      "--expected-tree",
      "0".repeat(40),
      "--allow-ephemeral-output-for-testing",
    ])
    expect(wrongTree.status).toBe(2)
    expect(wrongTree.stderr).toContain("does not match the expected tree")

    const accepted = build(source, rollbackRevision, join(root, "accepted"), key, [
      "--release-mode",
      "verified-ancestor-rollback",
      "--expected-tree",
      rollbackTree,
      "--allow-ephemeral-output-for-testing",
    ])
    expect(accepted.status, accepted.stderr).toBe(0)
    const result = JSON.parse(accepted.stdout) as BuilderResult
    expect(result.artifact).toContain("careconnect-web-rollback-")
    const inventory = JSON.parse(readFileSync(join(root, "accepted", result.inventory), "utf8"))
    expect(inventory).toMatchObject({
      releaseMode: "verified-ancestor-rollback",
      source: { mainRevision, revision: rollbackRevision, tree: rollbackTree },
      verification: { expectedTreeMatched: true, executableRollbackProven: false },
    })
  })

  it("rejects a non-ancestor rollback revision", () => {
    const root = temporaryRoot("release-non-ancestor")
    const fixture = makeSource(root)
    const key = makeSigningKey(root)
    const unrelatedRevision = runGit(fixture.source, "commit-tree", "HEAD^{tree}", "-m", "unrelated commit")
    const rejected = build(fixture.source, unrelatedRevision, join(root, "out"), key, [
      "--release-mode",
      "verified-ancestor-rollback",
      "--expected-tree",
      fixture.tree,
      "--allow-ephemeral-output-for-testing",
    ])
    expect(rejected.status).toBe(2)
    expect(rejected.stderr).toContain("is not a verified ancestor")
  })

  it("rejects a dirty source checkout", () => {
    const dirtyRoot = temporaryRoot("release-dirty")
    const dirtySource = makeSource(dirtyRoot)
    const dirtyKey = makeSigningKey(dirtyRoot)
    writeFileSync(join(dirtySource.source, "untracked.txt"), "dirty\n")
    const dirty = build(dirtySource.source, dirtySource.revision, join(dirtyRoot, "out"), dirtyKey)
    expect(dirty.status).toBe(2)
    expect(dirty.stderr).toContain("source repository must be clean")
  })

  it("rejects a source checkout ahead of origin/main", () => {
    const driftRoot = temporaryRoot("release-drift")
    const driftSource = makeSource(driftRoot)
    const driftKey = makeSigningKey(driftRoot)
    writeFileSync(join(driftSource.source, "unpushed.txt"), "unpushed\n")
    runGit(driftSource.source, "add", "unpushed.txt")
    runGit(driftSource.source, "commit", "-m", "test: leave main ahead")
    const drift = build(
      driftSource.source,
      runGit(driftSource.source, "rev-parse", "HEAD"),
      join(driftRoot, "out"),
      driftKey
    )
    expect(drift.status).toBe(2)
    expect(drift.stderr).toContain("must match HEAD and origin/main")
  })

  it("rejects tracked env and secret-like members", () => {
    const root = temporaryRoot("release-secret")
    const fixture = makeSource(root)
    const key = makeSigningKey(root)
    writeFileSync(join(fixture.source, ".env.local"), "DO_NOT_PACKAGE=test\n")
    runGit(fixture.source, "add", ".env.local")
    runGit(fixture.source, "commit", "-m", "test: add forbidden env")
    runGit(fixture.source, "update-ref", "refs/remotes/origin/main", "HEAD")
    const rejected = build(fixture.source, runGit(fixture.source, "rev-parse", "HEAD"), join(root, "out"), key)
    expect(rejected.status).toBe(2)
    expect(rejected.stderr).toContain("env-like file")
  })

  it("rejects a group-writable signing key", () => {
    const root = temporaryRoot("release-key-mode")
    const fixture = makeSource(root)
    const key = makeSigningKey(root)
    chmodSync(key, 0o620)
    const rejected = build(fixture.source, fixture.revision, join(root, "out"), key)
    expect(rejected.status).toBe(2)
    expect(rejected.stderr).toContain("must not be group/world writable")
  })

  it("rejects temporary-only retention unless the test flag is explicit", () => {
    const root = temporaryRoot("release-retention")
    const fixture = makeSource(root)
    const key = makeSigningKey(root)
    const rejected = build(fixture.source, fixture.revision, join(root, "out"), key, [])
    expect(rejected.status).toBe(2)
    expect(rejected.stderr).toContain("temporary output is allowed only for disposable-key tests")
  })

  it("does not overwrite or remove an existing release output", () => {
    const root = temporaryRoot("release-existing")
    const fixture = makeSource(root)
    const key = makeSigningKey(root)
    const outDir = join(root, "out")
    mkdirSync(outDir, { mode: 0o700 })
    const manifest = join(outDir, `careconnect-web-${fixture.revision.slice(0, 12)}.manifest.json`)
    writeFileSync(manifest, "owner-retained\n", { mode: 0o600 })

    const rejected = build(fixture.source, fixture.revision, outDir, key)
    expect(rejected.status).toBe(2)
    expect(rejected.stderr).toContain("release output already exists")
    expect(readFileSync(manifest, "utf8")).toBe("owner-retained\n")
  })
})
