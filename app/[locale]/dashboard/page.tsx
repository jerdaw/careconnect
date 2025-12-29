'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getAnalyticsForServices } from '@/lib/analytics';
import AnalyticsCard from '@/components/AnalyticsCard';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<{ total: number; recent: number }>({ total: 0, recent: 0 });
    const [serviceCount, setServiceCount] = useState(0);
    const [loading, setLoading] = useState(true);

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
                    Dashboard
                </h1>
                <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
                    Welcome back, {user?.email}
                </p>
            </header>

            {/* Quick Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnalyticsCard
                    title="Total Services"
                    value={serviceCount}
                    loading={loading}
                />

                <AnalyticsCard
                    title="Total Views (30d)"
                    value={stats.recent}
                    loading={loading}
                    change={0} // TODO: Calculate change from previous period
                />

                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Verification Status
                    </p>
                    <p className="mt-2 text-xl font-bold text-yellow-600 dark:text-yellow-500">
                        Pending
                    </p>
                    <div className="mt-4">
                        <Link href="/dashboard/settings" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Complete Profile &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Actions */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Get Started
                </h3>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    {serviceCount === 0
                        ? "You haven't claimed any services yet. Find your organization or create a new listing."
                        : "Manage your existing services and keep your data up to date."}
                </p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/services"
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Manage Services
                    </Link>
                </div>
            </div>
        </div>
    );
}
