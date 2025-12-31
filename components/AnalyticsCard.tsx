import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AnalyticsCardProps {
    title: string
    value: string | number
    description?: string
    change?: number
    loading?: boolean
}

export function AnalyticsCard({ title, value, description, change, loading }: AnalyticsCardProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(change !== undefined || description) && (
                    <p className="text-xs text-muted-foreground">
                        {change !== undefined && (
                            <span className={cn("mr-1 font-medium", change > 0 ? "text-green-600" : "text-red-600")}>
                                {Math.abs(change)}%
                            </span>
                        )}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
