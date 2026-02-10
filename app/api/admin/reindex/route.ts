import { exec } from "child_process"
import util from "util"
import { handleApiError, createApiResponse, createApiError } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

const execPromise = util.promisify(exec)

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

    // Count total services to be indexed
    const { count: totalServices } = await supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)

    // Create progress record
    const { data: progressRecord, error: progressError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("reindex_progress") as any)
        .insert({
          total_services: totalServices || 0,
          triggered_by: user.id,
          service_snapshot_count: totalServices || 0,
        })
        .select()
        .single()

    if (progressError) {
      return createApiError(`Failed to create progress record: ${progressError.message}`, 500)
    }

    const progressId = progressRecord.id

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  progressId: string,
  userId: string
) {
  try {
    // Run the embedding generation script
    await execPromise("npm run generate-embeddings")

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
      p_details: { progress_id: progressId, status: "complete" },
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
  }
}
