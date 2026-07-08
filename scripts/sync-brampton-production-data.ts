import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"

import {
  assertBramptonSyncApplyApproval,
  buildBramptonProductionSyncPlan,
  isUsableSupabaseSecretKey,
  parseBramptonSyncArgs,
} from "./lib/brampton-production-sync"
import type { Service } from "../types/service"
import type { Database } from "../types/supabase"

type ExistingServiceIdRow = Pick<Database["public"]["Tables"]["services"]["Row"], "id">

async function main(): Promise<void> {
  const { mode } = parseBramptonSyncArgs(process.argv.slice(2))

  if (mode === "apply") {
    assertBramptonSyncApplyApproval(process.env.BRAMPTON_SYNC_APPROVAL)
  }

  loadEnvironment()

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = requiredEnv("SUPABASE_SECRET_KEY")
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)
  const services = readJson<Service[]>("data/services.json")
  const embeddings = readJson<Record<string, number[]>>("data/embeddings.json")
  const plan = buildBramptonProductionSyncPlan({ services, embeddings })

  const beforeExistingIds = await fetchExistingIds(supabase, plan.ids)
  const beforeMissingIds = missingIds(plan.ids, beforeExistingIds)

  if (mode === "dry-run") {
    printJson({
      mode,
      writesEnabled: false,
      targetHost: hostFromUrl(supabaseUrl),
      selectedIds: plan.ids,
      existingIds: beforeExistingIds,
      missingIds: beforeMissingIds,
      rowCount: plan.rows.length,
      summary: plan.summary,
    })
    return
  }

  const { error } = await supabase.from("services").upsert(plan.rows, { onConflict: "id" })
  if (error) {
    throw new Error(`Brampton production upsert failed: ${error.message}`)
  }

  const afterExistingIds = await fetchExistingIds(supabase, plan.ids)

  printJson({
    mode,
    writesEnabled: true,
    targetHost: hostFromUrl(supabaseUrl),
    selectedIds: plan.ids,
    beforeExistingIds,
    beforeMissingIds,
    afterExistingIds,
    afterMissingIds: missingIds(plan.ids, afterExistingIds),
    rowCount: plan.rows.length,
    summary: plan.summary,
  })
}

function loadEnvironment(): void {
  const envFile = process.env.CARECONNECT_ENV_FILE ?? ".env.local"

  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, quiet: true })
    return
  }

  if (process.env.CARECONNECT_ENV_FILE) {
    throw new Error(`CARECONNECT_ENV_FILE was set but the file was not found: ${envFile}`)
  }
}

function requiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SECRET_KEY"): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  if (name === "SUPABASE_SECRET_KEY" && !isUsableSupabaseSecretKey(value)) {
    throw new Error(
      "SUPABASE_SECRET_KEY is missing or still contains a placeholder; provide a valid service-role/secret key or use the Supabase CLI/operator dry-run path"
    )
  }
  return value
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8")) as T
}

async function fetchExistingIds(
  supabase: ReturnType<typeof createClient<Database>>,
  approvedIds: string[]
): Promise<string[]> {
  const { data, error } = await supabase.from("services").select("id").in("id", approvedIds)
  if (error) {
    throw new Error(`Brampton production read failed: ${error.message}`)
  }

  const existingIds = ((data ?? []) as ExistingServiceIdRow[]).map((row) => row.id)
  return approvedIds.filter((id) => existingIds.includes(id))
}

function missingIds(approvedIds: string[], existingIds: string[]): string[] {
  return approvedIds.filter((id) => !existingIds.includes(id))
}

function hostFromUrl(value: string): string {
  try {
    return new URL(value).host
  } catch {
    return "invalid-url"
  }
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
