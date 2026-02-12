import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

const NO_ROWS_FOUND_ERROR_CODES = ["PGRST116", "406"]

function calculateHelpfulPercentage(yesCount: number, noCount: number): number | null {
  const totalVotes = yesCount + noCount
  if (totalVotes === 0) return null
  return Math.round((yesCount / totalVotes) * 100)
}

interface ServiceFeedbackStats {
  helpful_yes_count: number
  helpful_no_count: number
  open_issues_count: number
  last_feedback_at: string | null
}

export function useServiceFeedback(serviceId: string) {
  const [stats, setStats] = useState<ServiceFeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchStats() {
      if (!serviceId) return

      try {
        setLoading(true)
        // Query the materialized view

        const { data, error } = await supabase
          .from("feedback_aggregations")
          .select("*")
          .eq("service_id", serviceId)
          .single()

        if (error) {
          if (NO_ROWS_FOUND_ERROR_CODES.includes(error.code)) {
            setStats({
              helpful_yes_count: 0,
              helpful_no_count: 0,
              open_issues_count: 0,
              last_feedback_at: null,
            })
          } else {
            logger.error("Error fetching feedback stats", error)
            setError(error as unknown as Error)
          }
        } else {
          setStats(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [serviceId])

  const helpfulPercentage = stats ? calculateHelpfulPercentage(stats.helpful_yes_count, stats.helpful_no_count) : null

  return {
    stats,
    loading,
    error,
    helpfulPercentage,
    totalVotes: stats ? stats.helpful_yes_count + stats.helpful_no_count : 0,
  }
}
