"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"

interface ReindexProgressData {
  id: string
  status: "running" | "complete" | "error" | "cancelled"
  totalServices: number
  processedCount: number
  progressPercentage: number
  startedAt: string
  completedAt?: string
  elapsedSeconds: number
  durationSeconds?: number
  errorMessage?: string
}

interface ReindexProgressProps {
  progressId: string
  onComplete?: () => void
}

export function ReindexProgress({ progressId, onComplete }: ReindexProgressProps) {
  const t = useTranslations("Admin.reindex")
  const [progress, setProgress] = useState<ReindexProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/admin/reindex/status?progressId=${progressId}`)
        if (!response.ok) {
          throw new Error(t("errors.fetchProgress"))
        }
        const data = (await response.json()) as ReindexProgressData
        setProgress(data)
        setLoading(false)

        // Stop polling if complete, error, or cancelled
        if (data.status !== "running") {
          if (interval) clearInterval(interval)
          if (onComplete) onComplete()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.unknown"))
        setLoading(false)
        if (interval) clearInterval(interval)
      }
    }

    // Fetch immediately
    fetchProgress()

    // Poll every 2 seconds if still running
    interval = setInterval(fetchProgress, 2000)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [progressId, onComplete, t])

  if (loading && !progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-5 w-5" />
            <p>{t("errors.loadProgress", { error })}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!progress) return null

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return t("duration.minutesSeconds", { minutes: mins, seconds: secs })
    }
    return t("duration.seconds", { seconds: secs })
  }

  const getStatusBadge = () => {
    switch (progress.status) {
      case "running":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("status.running")}
          </Badge>
        )
      case "complete":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            {t("status.complete")}
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {t("status.error")}
          </Badge>
        )
      case "cancelled":
        return <Badge variant="outline">{t("status.cancelled")}</Badge>
      default:
        return <Badge variant="outline">{t("status.unknown")}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t("title")}</CardTitle>
            <CardDescription>{t("description", { totalServices: progress.totalServices })}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              {t("labels.processedServices", {
                processed: progress.processedCount,
                total: progress.totalServices,
              })}
            </span>
            <span className="font-medium">{progress.progressPercentage}%</span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
        </div>

        {/* Time Information */}
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Clock className="h-4 w-4" />
          <span>
            {progress.status === "running"
              ? t("labels.elapsed", { duration: formatDuration(progress.elapsedSeconds) })
              : t("labels.completedIn", {
                  duration: formatDuration(progress.durationSeconds || progress.elapsedSeconds),
                })}
          </span>
        </div>

        {/* Error Message */}
        {progress.errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <strong>{t("labels.error")}</strong> {progress.errorMessage}
          </div>
        )}

        {/* Success Message */}
        {progress.status === "complete" && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
            <strong>{t("labels.success")}</strong> {t("success.allEmbeddingsGenerated")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Shows recent reindex history
 */
export function ReindexHistory() {
  const t = useTranslations("Admin.reindex")
  const [operations, setOperations] = useState<ReindexProgressData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/admin/reindex/status")
        if (!response.ok) throw new Error(t("errors.fetchHistory"))
        const data = (await response.json()) as { operations: ReindexProgressData[] }
        setOperations(data.operations || [])
      } catch (error) {
        console.error("Failed to fetch reindex history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [t])

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (operations.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">{t("history.empty")}</p>
  }

  return (
    <div className="space-y-3">
      {operations.map((op) => (
        <div key={op.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {op.status === "complete" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {op.status === "error" && <XCircle className="h-4 w-4 text-red-600" />}
              {op.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              <span className="font-medium">
                {op.processedCount} / {op.totalServices} services
              </span>
            </div>
            <p className="text-xs text-neutral-500">{new Date(op.startedAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <Badge variant={op.status === "complete" ? "default" : "secondary"}>{op.status}</Badge>
            {op.durationSeconds && (
              <p className="mt-1 text-xs text-neutral-500">
                {Math.floor(op.durationSeconds / 60)}m {op.durationSeconds % 60}s
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
