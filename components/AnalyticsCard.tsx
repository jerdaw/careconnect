import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AnalyticsCardProps {
    title: string;
    value: number | string;
    change?: number; // Percentage change (optional)
    loading?: boolean;
    period?: string;
}

export default function AnalyticsCard({ title, value, change, loading, period = 'last 30 days' }: AnalyticsCardProps) {
    const t = useTranslations('Analytics');

    if (loading) {
        return (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                <div className="mt-2 h-8 w-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                {value}
            </p>
            <div className="mt-4 flex items-center text-sm">
                {change !== undefined ? (
                    <>
                        {change > 0 ? (
                            <span className="flex items-center text-green-600">
                                <ArrowUp className="mr-1 h-4 w-4" />
                                {change}%
                            </span>
                        ) : change < 0 ? (
                            <span className="flex items-center text-red-600">
                                <ArrowDown className="mr-1 h-4 w-4" />
                                {Math.abs(change)}%
                            </span>
                        ) : (
                            <span className="flex items-center text-neutral-500">
                                <Minus className="mr-1 h-4 w-4" />
                                0%
                            </span>
                        )}
                        <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                            {t('vsPeriod', { period })}
                        </span>
                    </>
                ) : (
                    <span className="text-neutral-500 dark:text-neutral-400">
                        {t('totalAllTime')}
                    </span>
                )}
            </div>
        </div>
    );
}
