#!/usr/bin/env npx tsx
import { fetch211Services } from "../lib/external/211-client"
import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"
import { pathToFileURL } from "node:url"
import type { Service } from "../types/service"
import { logger } from "../lib/logger"

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")

type Sync211Env = Partial<Pick<NodeJS.ProcessEnv, "ALLOW_211_SYNC" | "API_211_KEY">>

export function assert211SyncEnabled(env?: Sync211Env): void {
  const runtimeEnv = env ?? process.env

  if (runtimeEnv.ALLOW_211_SYNC !== "1") {
    throw new Error("211 sync is quarantined. Set ALLOW_211_SYNC=1 for an explicit manual run.")
  }

  if (!runtimeEnv.API_211_KEY) {
    throw new Error("Missing API_211_KEY for manual 211 sync.")
  }
}

export async function main(env?: Sync211Env) {
  assert211SyncEnabled(env)

  logger.info("Fetching services from 211 Ontario", { component: "scripts/sync-211" })
  const newServices = await fetch211Services()

  if (newServices.length === 0) {
    logger.warn("No services fetched from 211 Ontario", { component: "scripts/sync-211" })
    return
  }

  let existing: Service[] = []
  if (existsSync(SERVICES_PATH)) {
    existing = JSON.parse(readFileSync(SERVICES_PATH, "utf-8")) as Service[]
  }

  const existingIds = new Set(existing.map((s: Service) => s.id))

  // Preserve manual edits and tags by appending only previously unseen records.
  const toAdd = newServices.filter((s) => !existingIds.has(s.id))

  if (toAdd.length === 0) {
    logger.info("No new 211 services to add", { component: "scripts/sync-211" })
    return
  }

  const merged = [...existing, ...toAdd]
  writeFileSync(SERVICES_PATH, JSON.stringify(merged, null, 2))
  logger.info("Added new 211 services", { component: "scripts/sync-211", addedCount: toAdd.length })
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    logger.error("211 sync failed", error, { component: "scripts/sync-211" })
    process.exitCode = 1
  })
}
