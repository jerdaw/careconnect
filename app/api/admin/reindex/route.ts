import { exec } from "child_process"
import util from "util"
import { handleApiError, createApiResponse, createApiError } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"
import { env } from "@/lib/env"
import type { Database } from "@/types/supabase"

const execPromise = util.promisify(exec)
const REINDEX_COMMAND = "npm run generate-embeddings"
const REINDEX_TIMEOUT_MS = 15 * 60 * 1000
const REINDEX_COOLDOWN_MS = 60 * 1000

type ReindexGuardState = {
  inFlight: boolean
  lastStartedAt: number
}

type RunningReindex = {
  id: string
  started_at: string
  status: string
  triggered_by: string | null
}

const globalReindexGuard = globalThis as typeof globalThis & {
  __careconnectReindexGuard?: ReindexGuardState
}

const reindexGuard =
  globalReindexGuard.__careconnectReindexGuard ??
  (globalReindexGuard.__careconnectReindexGuard = {
    inFlight: false,
    lastStartedAt: 0,
  })

function retryAfterSeconds(ms: number) {
  return Math.max(1, Math.ceil(ms / 1000))
}

function cooldownRemaining(now = Date.now()) {
  if (!reindexGuard.lastStartedAt) return 0
  return Math.max(0, REINDEX_COOLDOWN_MS - (now - reindexGuard.lastStartedAt))
}

async function findRunningReindex(supabase: ReturnType<typeof createServerClient>) {
  const { data, error } = await supabase
    .from("reindex_progress")
    .select("id, started_at, status, triggered_by")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Failed to verify active reindex jobs: ${error.message}`)
  }

  return Array.isArray(data) && data.length > 0 ? (data[0] as RunningReindex) : null
}

async function logReindexAdminAction(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  details: Record<string, unknown>,
  targetCount = 0
) {
  const { error } = await supabase.rpc("log_admin_action", {
    p_action: "reindex",
    p_performed_by: userId,
    p_target_count: targetCount,
    p_details: details,
  })

  if (error) {
    logger.error("Admin action log failed for reindex", error, {
      component: "api-admin-reindex",
      action: "POST",
      details,
    })
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL || "",
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return createApiError("Unauthorized", 401)

    await assertAdminRole(supabase, user.id)

    const runningReindex = await findRunningReindex(supabase)
    if (runningReindex) {
      await logReindexAdminAction(supabase, user.id, {
        status: "blocked",
        reason: "already_running",
        active_progress_id: runningReindex.id,
      })

      return createApiError(
        "A reindex job is already running",
        409,
        {
          progressId: runningReindex.id,
          startedAt: runningReindex.started_at,
        },
        { "Retry-After": "60" }
      )
    }

    if (reindexGuard.inFlight) {
      await logReindexAdminAction(supabase, user.id, {
        status: "blocked",
        reason: "process_lock_active",
      })

      return createApiError("A reindex job is already running in this server process", 409, undefined, {
        "Retry-After": "60",
      })
    }

    const remainingCooldown = cooldownRemaining()
    if (remainingCooldown > 0) {
      const retryAfter = retryAfterSeconds(remainingCooldown)
      await logReindexAdminAction(supabase, user.id, {
        status: "blocked",
        reason: "cooldown_active",
        retry_after_seconds: retryAfter,
      })

      return createApiError(
        "Reindex cooldown is active",
        429,
        { retryAfterSeconds: retryAfter },
        { "Retry-After": String(retryAfter) }
      )
    }

    reindexGuard.inFlight = true
    reindexGuard.lastStartedAt = Date.now()

    // Count total services to be indexed
    const { count: totalServices } = await supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)

    // Create progress record
    const { data: progressRecord, error: progressError } = await supabase
      .from("reindex_progress")
      .insert({
        total_services: totalServices || 0,
        triggered_by: user.id,
        service_snapshot_count: totalServices || 0,
        status: "running",
      })
      .select()
      .single()

    if (progressError) {
      reindexGuard.inFlight = false
      return createApiError(`Failed to create progress record: ${progressError.message}`, 500)
    }

    const progressId = progressRecord.id

    await logReindexAdminAction(
      supabase,
      user.id,
      {
        progress_id: progressId,
        status: "started",
        timeout_ms: REINDEX_TIMEOUT_MS,
        cooldown_ms: REINDEX_COOLDOWN_MS,
      },
      totalServices || 0
    )

    // Start reindexing in background (don't await)
    // This allows us to return immediately with the progress ID
    runReindexWithProgress(supabase, progressId, user.id).catch((error) => {
      logger.error("Reindex failed", error, {
        component: "api-admin-reindex",
        action: "POST",
      })
    })

    return createApiResponse({
      success: true,
      progressId,
      message: "Reindexing started. Use the progress ID to track status.",
      timeoutMs: REINDEX_TIMEOUT_MS,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Runs the reindex operation and updates progress
 * This runs in the background after the API response is sent
 */
async function runReindexWithProgress(
  supabase: ReturnType<typeof createServerClient>,
  progressId: string,
  userId: string
) {
  try {
    // Run the embedding generation script
    await execPromise(REINDEX_COMMAND, {
      timeout: REINDEX_TIMEOUT_MS,
      windowsHide: true,
    })

    // Get the final count of services indexed
    const { count: finalCount } = await supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)

    // Mark progress as complete
    await supabase.rpc("update_reindex_progress", {
      p_progress_id: progressId,
      p_processed_count: finalCount || 0,
      p_status: "complete",
    })

    // Audit Log
    await supabase.from("audit_logs").insert({
      table_name: "embeddings",
      record_id: "global",
      operation: "UPDATE",
      performed_by: userId,
      metadata: { action: "reindex", progress_id: progressId },
    })

    // Admin Actions Log
    await supabase.rpc("log_admin_action", {
      p_action: "reindex",
      p_performed_by: userId,
      p_target_count: finalCount || 0,
      p_details: { progress_id: progressId, status: "complete", timeout_ms: REINDEX_TIMEOUT_MS },
    })
  } catch (error) {
    logger.error("Reindex error", error, {
      component: "api-admin-reindex",
      action: "POST",
      progressId,
    })

    // Mark progress as failed
    await supabase.rpc("update_reindex_progress", {
      p_progress_id: progressId,
      p_processed_count: 0,
      p_status: "error",
      p_error_message: error instanceof Error ? error.message : "Unknown error",
    })

    // Log the failure
    await supabase.rpc("log_admin_action", {
      p_action: "reindex",
      p_performed_by: userId,
      p_target_count: 0,
      p_details: {
        progress_id: progressId,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  } finally {
    reindexGuard.inFlight = false
  }
}
