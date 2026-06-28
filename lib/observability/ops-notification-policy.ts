import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"

export type NotificationTier = "P0" | "P1" | "P2" | "P3"
export type NotificationMode = "normal" | "critical_only"

export interface OpsNotificationPolicy {
  tier: NotificationTier
  incidentKey: string
  isRecovery?: boolean
  channel?: "slack" | "push" | "email"
  mode?: NotificationMode
}

const criticalTiers = new Set<NotificationTier>(["P0", "P1"])
const inMemoryNotifiedIncidents = new Set<string>()

function normalizeNotificationMode(value: string | undefined): NotificationMode {
  return value === "critical_only" ? "critical_only" : "normal"
}

export function getOperationalNotificationMode(): NotificationMode {
  return normalizeNotificationMode(process.env.OPERATIONAL_NOTIFICATION_MODE)
}

export function getUserNotificationMode(): NotificationMode {
  return normalizeNotificationMode(process.env.USER_NOTIFICATION_MODE)
}

export function shouldSendOpsNotification(policy: OpsNotificationPolicy): boolean {
  const mode = policy.mode ?? getOperationalNotificationMode()
  if (mode === "critical_only") {
    return criticalTiers.has(policy.tier)
  }
  return true
}

function createOpsStateClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceKey) {
    return null
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function markOpsIncidentNotified(policy: OpsNotificationPolicy): Promise<void> {
  if (!criticalTiers.has(policy.tier)) {
    return
  }

  inMemoryNotifiedIncidents.add(policy.incidentKey)
  const client = createOpsStateClient()
  if (!client) {
    return
  }

  const now = new Date().toISOString()
  const { error } = await client.from("ops_alert_state").upsert({
    incident_key: policy.incidentKey,
    channel: policy.channel ?? "slack",
    notification_tier: policy.tier,
    active: true,
    opened_at: now,
    last_notified_at: now,
    updated_at: now,
  })

  if (error) {
    logger.error("Failed to persist ops alert notification state", {
      component: "ops-notification-policy",
      incidentKey: policy.incidentKey,
      error: error.message,
    })
  }
}

export async function wasOpsIncidentNotified(incidentKey: string): Promise<boolean> {
  if (inMemoryNotifiedIncidents.has(incidentKey)) {
    return true
  }

  const client = createOpsStateClient()
  if (!client) {
    return false
  }

  const { data, error } = await client
    .from("ops_alert_state")
    .select("incident_key")
    .eq("incident_key", incidentKey)
    .eq("active", true)
    .in("notification_tier", ["P0", "P1"])
    .maybeSingle()

  if (error) {
    logger.error("Failed to read ops alert notification state", {
      component: "ops-notification-policy",
      incidentKey,
      error: error.message,
    })
    return false
  }

  return Boolean(data)
}

export async function resolveOpsIncident(incidentKey: string): Promise<void> {
  inMemoryNotifiedIncidents.delete(incidentKey)
  const client = createOpsStateClient()
  if (!client) {
    return
  }

  const { error } = await client
    .from("ops_alert_state")
    .update({
      active: false,
      last_resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("incident_key", incidentKey)

  if (error) {
    logger.error("Failed to resolve ops alert notification state", {
      component: "ops-notification-policy",
      incidentKey,
      error: error.message,
    })
  }
}
