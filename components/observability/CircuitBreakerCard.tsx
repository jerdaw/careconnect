"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircuitBreakerStats } from "@/lib/resilience/supabase-breaker"
import { CircuitState } from "@/lib/resilience/circuit-breaker"

interface CircuitBreakerCardProps {
  stats: CircuitBreakerStats
}

export function CircuitBreakerCard({ stats }: CircuitBreakerCardProps) {
  const stateColor: Record<CircuitState, string> = {
    [CircuitState.CLOSED]: "bg-green-500",
    [CircuitState.OPEN]: "bg-red-500",
    [CircuitState.HALF_OPEN]: "bg-yellow-500",
  }

  const stateLabel: Record<CircuitState, string> = {
    [CircuitState.CLOSED]: "✅ Healthy",
    [CircuitState.OPEN]: "🚨 Circuit Open",
    [CircuitState.HALF_OPEN]: "⚠️ Testing Recovery",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Circuit Breaker Status</CardTitle>
            <CardDescription>Database resilience protection</CardDescription>
          </div>
          <Badge className={stateColor[stats.state]}>{stateLabel[stats.state]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-muted-foreground text-sm font-medium">State</dt>
            <dd className="text-2xl font-bold">{stats.state}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm font-medium">Failure Rate</dt>
            <dd className="text-2xl font-bold">{(stats.failureRate * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm font-medium">Failures</dt>
            <dd className="text-2xl font-bold">{stats.failureCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm font-medium">Successes</dt>
            <dd className="text-2xl font-bold">{stats.successCount}</dd>
          </div>
        </dl>

        {stats.state !== CircuitState.CLOSED && (
          <div className="mt-4 rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Circuit is {stats.state}. Database operations are being protected.
            </p>
            {stats.nextAttemptTime && (
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                Next recovery attempt: {new Date(stats.nextAttemptTime).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
