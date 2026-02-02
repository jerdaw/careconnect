"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircuitBreakerStats } from "@/lib/resilience/supabase-breaker"
import { CircuitState } from "@/lib/resilience/circuit-breaker"
import { MetricsSummary } from "@/lib/performance/metrics"

interface HealthSummaryProps {
  circuitBreaker: CircuitBreakerStats
  metrics: MetricsSummary
}

export function HealthSummary({ circuitBreaker, metrics }: HealthSummaryProps) {
  const overallStatus = circuitBreaker.state === CircuitState.CLOSED ? "healthy" : "degraded"
  const statusColor = overallStatus === "healthy" ? "bg-green-500" : "bg-yellow-500"

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">Overall platform status</p>
        </div>
        <Badge className={`${statusColor} px-4 py-2 text-lg text-white`}>
          {overallStatus === "healthy" ? "✅ Operational" : "⚠️ Degraded"}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-1 text-sm">Circuit Breaker</p>
          <p className="text-lg font-bold">{circuitBreaker.state}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground mb-1 text-sm">Failure Rate</p>
          <p className="text-lg font-bold">{(circuitBreaker.failureRate * 100).toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground mb-1 text-sm">Operations Tracked</p>
          <p className="text-lg font-bold">{metrics.totalOperations}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground mb-1 text-sm">Uptime</p>
          <p className="text-lg font-bold">{Math.floor((Date.now() - metrics.trackingSince) / 1000 / 60)}m</p>
        </div>
      </div>
    </Card>
  )
}
