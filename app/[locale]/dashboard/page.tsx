'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getAnalyticsForServices } from '@/lib/analytics';
import AnalyticsCard from '@/components/AnalyticsCard';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<{ total: number; recent: number }>({ total: 0, recent: 0 });
    const [serviceCount, setServiceCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const t = useTranslations('Dashboard');
    const tAnalytics = useTranslations('Analytics');

    useEffect(() => {
        async function loadStats() {
            if (!user) return;

            // 1. Fetch user's services (IDs only)
            // Mock: Fetching first 5 services as we did in services/page.tsx
            const { data: services } = await supabase
                .from('services')
                .select('id')
                .limit(5);

            if (services && services.length > 0) {
                setServiceCount(services.length);
                const ids = services.map(s => s.id);

                // 2. Fetch analytics for these services
                const analyticsData = await getAnalyticsForServices(ids);

                // 3. Aggregate
                let total = 0;
                let recent = 0;
                Object.values(analyticsData).forEach(stat => {
                    total += stat.totalViews;
                    recent += stat.recentViews;
                });

                setStats({ total, recent });
            }
            setLoading(false);
        }

        loadStats();
    }, [user]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {t('title')}
                </h1>
                <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
                    {t('welcome', { email: user?.email || 'Partner' })}
                </p>
            </header>

            {/* Quick Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnalyticsCard
                    title={tAnalytics('totalServices')}
                    value={serviceCount}
                    loading={loading}
                />

                <AnalyticsCard
                    title={tAnalytics('totalViews')}
                    value={stats.recent}
                    loading={loading}
                    change={0} // TODO: Calculate change from previous period
                />

                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        {t('verificationStatus')}
                    </p>
                    <p className="mt-2 text-xl font-bold text-yellow-600 dark:text-yellow-500">
                        {t('pending')}
                    </p>
                    <div className="mt-4">
                        <Link href="/dashboard/settings" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            {t('completeProfile')} &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tasks / Action Items */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Action Items
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/20">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">Complete your organization profile</p>
                            <p className="text-xs text-neutral-500">Add a logo and website to increase trust.</p>
                        </div>
                        <Link href="/dashboard/settings" className="text-xs font-semibold text-blue-600 hover:underline">Complete</Link>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">Review new analytics suggestions</p>
                            <p className="text-xs text-neutral-500">Based on recent search trends in your area.</p>
                        </div>
                        <Link href="/dashboard/analytics" className="text-xs font-semibold text-blue-600 hover:underline">View</Link>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Actions */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {t('getStarted')}
                </h3>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    {serviceCount === 0
                        ? t('noServices')
                        : t('hasServices')}
                </p>
                <div className="mt-6 flex gap-4">
                    <Link
                        href="/dashboard/services"
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        {t('manageServices')}
                    </Link>
                    <Link
                        href="/dashboard/services/import"
                        className="inline-flex items-center justify-center rounded-md bg-white border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
                    >
                        Bulk Import
                    </Link>
                </div>
            </div>
        </div>
    );
}
