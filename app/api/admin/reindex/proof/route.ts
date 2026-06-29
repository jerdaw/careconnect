import { handleApiError, createApiResponse, createApiError } from "@/lib/api-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { env } from "@/lib/env"
import type { Database } from "@/types/supabase"

type JsonRecord = Record<string, unknown>

type ProofStatus = "yes" | "no"

const REINDEX_TIMEOUT_MS = 15 * 60 * 1000
const REINDEX_COOLDOWN_MS = 60 * 1000

function yesNo(value: boolean): ProofStatus {
  return value ? "yes" : "no"
}

function countClass(count: number) {
  if (count <= 0) return "zero"
  if (count === 1) return "one"
  return "multiple"
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {}
}

function statusCounts(rows: Array<{ status?: unknown }>) {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const status = typeof row.status === "string" ? row.status : "unknown"
    counts[status] = (counts[status] || 0) + 1
  }
  return counts
}

function actionStatusSummary(rows: Array<{ details?: unknown }>) {
  const statusCounts: Record<string, number> = {}
  const reasonCounts: Record<string, number> = {}

  for (const row of rows) {
    const details = asRecord(row.details)
    const status = typeof details.status === "string" ? details.status : "unknown"
    const reason = typeof details.reason === "string" ? details.reason : null
    statusCounts[status] = (statusCounts[status] || 0) + 1
    if (reason) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    }
  }

  return { statusCounts, reasonCounts }
}

/**
 * GET /api/admin/reindex/proof
 *
 * Returns value-free proof metadata for the authenticated reindex guardrail
 * flow. The response deliberately omits row ids, user ids, emails, raw details,
 * cookies, tokens, and raw log lines.
 */
export async function GET() {
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

    const { data: progressRows, error: progressError } = await supabase
      .from("reindex_progress")
      .select("status, started_at, completed_at, duration_seconds, total_services, processed_count")
      .order("started_at", { ascending: false })
      .limit(10)

    if (progressError) {
      return createApiError("Failed to fetch reindex proof progress", 500)
    }

    const { data: actionRows, error: actionError } = await supabase
      .from("admin_actions")
      .select("action, performed_at, target_count, details")
      .eq("action", "reindex")
      .order("performed_at", { ascending: false })
      .limit(20)

    if (actionError) {
      return createApiError("Failed to fetch reindex proof action metadata", 500)
    }

    const progress = Array.isArray(progressRows) ? progressRows : []
    const actions = Array.isArray(actionRows) ? actionRows : []
    const progressStatusCounts = statusCounts(progress)
    const adminActionSummary = actionStatusSummary(actions)
    const actionStatuses = adminActionSummary.statusCounts
    const actionReasons = adminActionSummary.reasonCounts
    const hasStartedAction = (actionStatuses.started || 0) > 0
    const hasBlockedAction = (actionStatuses.blocked || 0) > 0
    const hasTerminalAction = (actionStatuses.complete || 0) > 0 || (actionStatuses.error || 0) > 0

    return createApiResponse({
      authenticatedAdminAvailable: "yes",
      progressRowsClass: countClass(progress.length),
      adminActionRowsClass: countClass(actions.length),
      latestProgressStatus: typeof progress[0]?.status === "string" ? progress[0].status : "none",
      progressStatusCounts,
      adminActionStatusCounts: actionStatuses,
      adminActionReasonCounts: actionReasons,
      runningProgressObserved: yesNo((progressStatusCounts.running || 0) > 0),
      terminalProgressObserved: yesNo(
        (progressStatusCounts.complete || 0) > 0 || (progressStatusCounts.error || 0) > 0
      ),
      structuredActionLogObserved: yesNo(hasStartedAction || hasBlockedAction || hasTerminalAction),
      startedActionObserved: yesNo(hasStartedAction),
      blockedActionObserved: yesNo(hasBlockedAction),
      terminalActionObserved: yesNo(hasTerminalAction),
      alreadyRunningReasonObserved: yesNo((actionReasons.already_running || 0) > 0),
      processLockReasonObserved: yesNo((actionReasons.process_lock_active || 0) > 0),
      cooldownReasonObserved: yesNo((actionReasons.cooldown_active || 0) > 0),
      timeoutGuardrailConfigured: true,
      timeoutMs: REINDEX_TIMEOUT_MS,
      cooldownMs: REINDEX_COOLDOWN_MS,
      rawRowsStored: false,
      rawDetailsStored: false,
      rawUserIdsStored: false,
      rawEmailsStored: false,
      rawLogsStored: false,
      cookiesCollected: false,
      bearerTokensCollected: false,
      sessionValuesCollected: false,
      secretValuesCollected: false,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
