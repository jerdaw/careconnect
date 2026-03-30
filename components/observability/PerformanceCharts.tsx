"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricsSummary } from "@/lib/performance/metrics"
import { useTranslations } from "next-intl"

interface PerformanceChartsProps {
  metrics: MetricsSummary
}

export function PerformanceCharts({ metrics }: PerformanceChartsProps) {
  const t = useTranslations("Admin.observability.performance")
  // Extract top 5 operations by request count
  const topOperations = Object.entries(metrics.operations)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("trackingSince", { datetime: new Date(metrics.trackingSince).toLocaleString() })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm font-medium">{t("fields.totalOperations")}</p>
              <p className="text-3xl font-bold">{metrics.totalOperations}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm font-medium">{t("fields.trackedOperations")}</p>
              <p className="text-3xl font-bold">{Object.keys(metrics.operations).length}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm font-medium">{t("fields.uptime")}</p>
              <p className="text-3xl font-bold">{Math.floor((Date.now() - metrics.trackingSince) / 1000 / 60)}m</p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">{t("topOperations")}</h3>
            <div className="space-y-3">
              {topOperations.map(([name, stats]) => (
                <div key={name} className="border-primary border-l-4 pl-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-muted-foreground text-xs">{t("calls", { count: stats.count })}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">{t("metrics.p50")}</span>{" "}
                      <span className="font-medium">{stats.p50.toFixed(0)}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("metrics.p95")}</span>{" "}
                      <span className="font-medium">{stats.p95.toFixed(0)}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("metrics.p99")}</span>{" "}
                      <span className="font-medium">{stats.p99.toFixed(0)}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("metrics.avg")}</span>{" "}
                      <span className="font-medium">{stats.mean.toFixed(0)}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {Object.keys(metrics.operations).length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              <p>{t("empty.title")}</p>
              <p className="mt-2 text-sm">
                {t("empty.description")}{" "}
                <code className="bg-muted rounded px-1 py-0.5">NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING=true</code>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
