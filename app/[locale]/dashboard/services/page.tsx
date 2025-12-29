'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Service } from '@/types/service';
import Link from 'next/link';
import { Plus, ExternalLink, AlertCircle } from 'lucide-react';
// import { useTranslations } from 'next-intl';

export default function ServicesPage() {
    const { user } = useAuth();
    // const t = useTranslations('Common');
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchServices() {
            if (!user) return;

            // TODO: In a real app, we would query by 'organization_id' linked to the user.
            // For now, we'll fetch ALL services and filter client-side (mocking ownership).
            // Or better: Just fetch a few specific ones if we can't filter by user yet.

            // Temporary Mock: Fetch "homelessness" services as a demo set
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .limit(5);

            if (data) {
                // Map to Service type (similar to search.ts logic)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedData: Service[] = data.map((row: any) => ({
                    ...row,
                    embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
                    identity_tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
                    intent_category: row.category,
                    verification_level: row.verification_status,
                }));
                setServices(mappedData);
            } else if (error) {
                console.error("Error fetching services", error);
            }

            setLoading(false);
        }

        fetchServices();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        My Services
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Manage your organization&apos;s listings.
                    </p>
                </div>
                <button
                    disabled
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="h-4 w-4" />
                    Add Service
                </button>
            </div>

            {services.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
                    <AlertCircle className="mx-auto h-12 w-12 text-neutral-400" />
                    <h3 className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">No services found</h3>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Get started by claiming or creating a new service.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <ul role="list" className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {services.map((service) => (
                            <li key={service.id} className="group flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {service.name}
                                        </h3>
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${service.verification_level === 'L2' || service.verification_level === 'L3' ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-500'}`}>
                                            {service.verification_level === 'L2' || service.verification_level === 'L3' ? 'Verified' : 'Unverified'}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
                                        {service.address || 'No address provided'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <a
                                        href={`/service/${service.id}`} // Assuming we have a public route like this, or just stubbing it
                                        target="_blank"
                                        className="text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                                        title="View Public Page"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                    </a>
                                    <Link
                                        href={`/dashboard/services/${service.id}`}
                                        className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-white dark:ring-neutral-700 dark:hover:bg-neutral-700"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
