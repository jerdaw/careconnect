import { spawn, ChildProcess } from "node:child_process"
import { cpSync, existsSync } from "node:fs"
import path from "node:path"

const [, , suitePath, ...forwardedArgs] = process.argv
const hasExplicitProject = forwardedArgs.some((arg) => arg === "--project" || arg.startsWith("--project="))

if (!suitePath) {
  console.error("Usage: node --import tsx scripts/run-playwright-with-server.ts <suitePath> [playwright args...]")
  process.exit(1)
}

const SERVER_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const READY_URL = `${SERVER_URL}/en`
const SERVER_START_TIMEOUT_MS = 60_000
const POLL_INTERVAL_MS = 500
const STANDALONE_DIR = path.join(process.cwd(), ".next", "standalone")
const STATIC_ASSETS_SOURCE = path.join(process.cwd(), ".next", "static")
const STATIC_ASSETS_TARGET = path.join(STANDALONE_DIR, ".next", "static")
const PUBLIC_ASSETS_SOURCE = path.join(process.cwd(), "public")
const PUBLIC_ASSETS_TARGET = path.join(STANDALONE_DIR, "public")

function spawnInherited(command: string, args: string[], env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  })
}

async function waitForServer(url: string, timeoutMs: number) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "follow" })
      if (response.ok) {
        return
      }
    } catch {
      // Retry until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  throw new Error(`Timed out waiting for standalone server at ${url}`)
}

function syncStandaloneAssets() {
  if (existsSync(STATIC_ASSETS_SOURCE)) {
    cpSync(STATIC_ASSETS_SOURCE, STATIC_ASSETS_TARGET, { recursive: true, force: true })
  }

  if (existsSync(PUBLIC_ASSETS_SOURCE)) {
    cpSync(PUBLIC_ASSETS_SOURCE, PUBLIC_ASSETS_TARGET, { recursive: true, force: true })
  }
}

async function main() {
  syncStandaloneAssets()

  const server = spawnInherited("node", [".next/standalone/server.js"], {
    ...process.env,
    PORT: "3000",
  })

  let shuttingDown = false

  const stopServer = () => {
    if (shuttingDown) return
    shuttingDown = true

    if (!server.killed) {
      server.kill("SIGTERM")
    }
  }

  const cleanupAndExit = (code: number) => {
    stopServer()
    process.exit(code)
  }

  process.on("SIGINT", () => cleanupAndExit(130))
  process.on("SIGTERM", () => cleanupAndExit(143))

  server.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`Standalone server exited before tests completed (code=${code}, signal=${signal})`)
      process.exit(code ?? 1)
    }
  })

  try {
    await waitForServer(READY_URL, SERVER_START_TIMEOUT_MS)
  } catch (error) {
    stopServer()
    throw error
  }

  const projectArgs = hasExplicitProject ? [] : ["--project=chromium"]
  const playwright = spawnInherited("npx", ["playwright", "test", suitePath, ...projectArgs, ...forwardedArgs], {
    ...process.env,
    PLAYWRIGHT_BASE_URL: SERVER_URL,
  })

  playwright.on("exit", (code) => {
    stopServer()
    process.exit(code ?? 1)
  })
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
