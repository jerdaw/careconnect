"use client"

import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { SLOComplianceSummary } from "@/lib/observability/slo-tracker"
import { getSLOSummary } from "@/lib/config/slo-targets"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("Admin.observability.slo")
  const sloSummary = getSLOSummary()
  const { uptime, errorBudget, latency, overall } = compliance

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
        <Badge variant={overall.compliant ? "default" : "destructive"} className="text-sm">
          {overall.compliant ? (
            <>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {t("status.allMet")}
            </>
          ) : (
            <>
              <AlertTriangle className="mr-1 h-4 w-4" />
              {t("status.violation")}
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
              <strong>{t("activeViolationsLabel")}</strong> {overall.violations.join(", ")}.{" "}
              <a href="/docs/runbooks/slo-violation.md" className="underline hover:text-red-800">
                {t("seeRunbook")}
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Budget Warning */}
        {errorBudget.consumed >= errorBudget.warningThreshold && !errorBudget.exhausted && (
          <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>{t("warningLabel")}</strong>{" "}
              {t("warningDescription", {
                consumed: (errorBudget.consumed * 100).toFixed(1),
              })}
            </AlertDescription>
          </Alert>
        )}

        {/* 3-Column Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Uptime SLO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">{t("uptime.title")}</h3>
              <Badge variant={uptime.compliant ? "default" : "destructive"} className="text-xs">
                {uptime.compliant ? t("common.met") : t("common.violation")}
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${uptime.compliant ? "text-green-600" : "text-red-600"}`}>
              {uptime.totalChecks > 0 ? `${(uptime.actual * 100).toFixed(2)}%` : t("common.noData")}
            </div>
            <div className="text-muted-foreground text-sm">
              {t("uptime.target", { target: (uptime.target * 100).toFixed(2) })}
            </div>
            <div className="text-muted-foreground text-xs">
              {t("uptime.checksPassed", { successful: uptime.successfulChecks, total: uptime.totalChecks })}
            </div>
            <div className="text-muted-foreground text-xs">
              {t("uptime.budget", { budget: sloSummary.downtimeBudget.formatted })}
            </div>
          </div>

          {/* Error Budget SLO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">{t("errorBudget.title")}</h3>
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
                  ? t("errorBudget.badges.exhausted")
                  : errorBudget.consumed >= errorBudget.warningThreshold
                    ? t("errorBudget.badges.warning")
                    : t("errorBudget.badges.healthy")}
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
            <div className="text-muted-foreground text-sm">
              {t("errorBudget.consumed", { consumed: (errorBudget.consumed * 100).toFixed(1) })}
            </div>
            <Progress value={errorBudget.remaining * 100} className="h-2" />
            <div className="text-muted-foreground text-xs">{t("errorBudget.resetWindow")}</div>
          </div>

          {/* Latency SLO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">{t("latency.title")}</h3>
              <Badge
                variant={!latency.hasData ? "secondary" : latency.compliant ? "default" : "destructive"}
                className="text-xs"
              >
                {!latency.hasData ? t("common.noData") : latency.compliant ? t("common.met") : t("common.violation")}
              </Badge>
            </div>
            <div
              className={`text-3xl font-bold ${
                !latency.hasData ? "text-gray-400" : latency.compliant ? "text-green-600" : "text-red-600"
              }`}
            >
              {latency.hasData ? `${latency.actualP95}ms` : t("latency.noDataSymbol")}
            </div>
            <div className="text-muted-foreground text-sm">{t("latency.target", { target: latency.target })}</div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>{t("latency.percentileDescription")}</span>
            </div>
            {latency.hasData && (
              <div className="text-muted-foreground text-xs">
                {latency.actualP95! <= latency.target
                  ? t("latency.headroom", { value: latency.target - latency.actualP95! })
                  : t("latency.overTarget", { value: latency.actualP95! - latency.target })}
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-muted text-muted-foreground mt-6 rounded-lg p-4 text-sm">
          <p>
            <strong>{t("helpText.term")}</strong> {t("helpText.description")}{" "}
            <a href="/docs/runbooks/slo-violation.md" className="hover:text-foreground underline">
              {t("helpText.runbook")}
            </a>{" "}
            {t("helpText.trailing")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
