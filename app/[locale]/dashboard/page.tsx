'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();

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
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Total Services
                    </p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                        0
                    </p>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <span>Active</span>
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Total Views (30d)
                    </p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                        --
                    </p>
                    <div className="mt-4 flex items-center text-sm text-neutral-500">
                        <span>Coming soon</span>
                    </div>
                </div>

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
                    You haven&apos;t claimed any services yet. Find your organization or create a new listing.
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
