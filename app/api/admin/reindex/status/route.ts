import { NextRequest } from "next/server"
import { handleApiError, createApiResponse, createApiError } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { env } from "@/lib/env"

/**
 * GET /api/admin/reindex/status?progressId=xxx
 *
 * Retrieves the current status of a reindex operation
 * Returns progress information including percentage complete, elapsed time, and status
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    // Get progress ID from query params
    const { searchParams } = new URL(req.url)
    const progressId = searchParams.get("progressId")

    // If no progressId, return recent history
    if (!progressId) {
      const { data: operations, error } = await supabase
        .from("reindex_progress")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10)

      if (error) {
        return createApiError(`Failed to fetch reindex history: ${error.message}`, 500)
      }

      return createApiResponse({
        operations: operations || [],
      })
    }

    // Fetch specific progress record
    const { data: progress, error } = await supabase.from("reindex_progress").select("*").eq("id", progressId).single()

    if (error || !progress) {
      return createApiError("Progress record not found", 404)
    }

    // Calculate additional metrics
    const progressPercentage =
      progress.total_services > 0 ? Math.round((progress.processed_count / progress.total_services) * 100) : 0

    const elapsedSeconds = progress.completed_at
      ? Math.floor((new Date(progress.completed_at).getTime() - new Date(progress.started_at).getTime()) / 1000)
      : Math.floor((Date.now() - new Date(progress.started_at).getTime()) / 1000)

    return createApiResponse({
      id: progress.id,
      status: progress.status,
      totalServices: progress.total_services,
      processedCount: progress.processed_count,
      progressPercentage,
      startedAt: progress.started_at,
      completedAt: progress.completed_at,
      elapsedSeconds,
      durationSeconds: progress.duration_seconds,
      errorMessage: progress.error_message,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
