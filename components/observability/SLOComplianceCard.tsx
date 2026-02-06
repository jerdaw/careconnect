"use client"

import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { SLOComplianceSummary } from "@/lib/observability/slo-tracker"
import { getSLOSummary } from "@/lib/config/slo-targets"

interface SLOComplianceCardProps {
  compliance: SLOComplianceSummary
}

/**
 * SLO Compliance Dashboard Card
 *
 * Displays uptime, error budget, and latency SLO compliance
 * in a 3-column grid layout with visual indicators.
 */
export function SLOComplianceCard({ compliance }: SLOComplianceCardProps) {
  const sloSummary = getSLOSummary()
  const { uptime, errorBudget, latency, overall } = compliance

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold">SLO Compliance</CardTitle>
        <Badge variant={overall.compliant ? "default" : "destructive"} className="text-sm">
          {overall.compliant ? (
            <>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              All SLOs Met
            </>
          ) : (
            <>
              <AlertTriangle className="mr-1 h-4 w-4" />
              SLO Violation
            </>
          )}
        </Badge>
      </CardHeader>

      <CardContent>
        {/* Violation Alert Banner */}
        {!overall.compliant && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Active SLO Violations:</strong> {overall.violations.join(", ")}.{" "}
              <a href="/docs/runbooks/slo-violation.md" className="underline hover:text-red-800">
                See runbook
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Budget Warning */}
        {errorBudget.consumed >= errorBudget.warningThreshold && !errorBudget.exhausted && (
          <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Warning:</strong> Error budget {(errorBudget.consumed * 100).toFixed(1)}% consumed. Reduce
              incident rate to avoid exhaustion.
            </AlertDescription>
          </Alert>
        )}

        {/* 3-Column Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Uptime SLO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">Uptime</h3>
              <Badge variant={uptime.compliant ? "default" : "destructive"} className="text-xs">
                {uptime.compliant ? "Met" : "Violation"}
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${uptime.compliant ? "text-green-600" : "text-red-600"}`}>
              {uptime.totalChecks > 0 ? `${(uptime.actual * 100).toFixed(2)}%` : "No Data"}
            </div>
            <div className="text-muted-foreground text-sm">Target: {(uptime.target * 100).toFixed(2)}%</div>
            <div className="text-muted-foreground text-xs">
              {uptime.successfulChecks} / {uptime.totalChecks} checks passed
            </div>
            <div className="text-muted-foreground text-xs">
              Budget: {sloSummary.downtimeBudget.formatted} downtime/month
            </div>
          </div>

          {/* Error Budget SLO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">Error Budget</h3>
              <Badge
                variant={
                  errorBudget.exhausted
                    ? "destructive"
                    : errorBudget.consumed >= errorBudget.warningThreshold
                      ? "outline"
                      : "default"
                }
                className="text-xs"
              >
                {errorBudget.exhausted
                  ? "Exhausted"
                  : errorBudget.consumed >= errorBudget.warningThreshold
                    ? "Warning"
                    : "Healthy"}
              </Badge>
            </div>
            <div
              className={`text-3xl font-bold ${
                errorBudget.exhausted
                  ? "text-red-600"
                  : errorBudget.consumed >= errorBudget.warningThreshold
                    ? "text-amber-600"
                    : "text-green-600"
              }`}
            >
              {(errorBudget.remaining * 100).toFixed(1)}%
            </div>
            <div className="text-muted-foreground text-sm">Consumed: {(errorBudget.consumed * 100).toFixed(1)}%</div>
            <Progress value={errorBudget.remaining * 100} className="h-2" />
            <div className="text-muted-foreground text-xs">Budget resets over 30-day window</div>
          </div>

          {/* Latency SLO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">Latency (p95)</h3>
              <Badge
                variant={!latency.hasData ? "secondary" : latency.compliant ? "default" : "destructive"}
                className="text-xs"
              >
                {!latency.hasData ? "No Data" : latency.compliant ? "Met" : "Violation"}
              </Badge>
            </div>
            <div
              className={`text-3xl font-bold ${
                !latency.hasData ? "text-gray-400" : latency.compliant ? "text-green-600" : "text-red-600"
              }`}
            >
              {latency.hasData ? `${latency.actualP95}ms` : "—"}
            </div>
            <div className="text-muted-foreground text-sm">Target: &lt; {latency.target}ms</div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>95th percentile response time</span>
            </div>
            {latency.hasData && (
              <div className="text-muted-foreground text-xs">
                {latency.actualP95! <= latency.target
                  ? `${latency.target - latency.actualP95!}ms headroom`
                  : `${latency.actualP95! - latency.target}ms over target`}
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-muted text-muted-foreground mt-6 rounded-lg p-4 text-sm">
          <p>
            <strong>SLO (Service Level Objective)</strong> defines the target reliability for the service. Violations
            trigger alerts and may require incident response. See{" "}
            <a href="/docs/runbooks/slo-violation.md" className="hover:text-foreground underline">
              SLO Violation Runbook
            </a>{" "}
            for response procedures.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
