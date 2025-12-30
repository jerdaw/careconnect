'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Search, MapPin, Users } from 'lucide-react';

const MOCK_VIEWS_DATA = [
    { day: 'Mon', views: 45 },
    { day: 'Tue', views: 52 },
    { day: 'Wed', views: 38 },
    { day: 'Thu', views: 65 },
    { day: 'Fri', views: 48 },
    { day: 'Sat', views: 25 },
    { day: 'Sun', views: 30 },
];

const TOP_SEARCH_TERMS = [
    { term: 'food bank', count: 124, growth: '+12%' },
    { term: 'emergency shelter', count: 89, growth: '+5%' },
    { term: 'mental health', count: 65, growth: '-2%' },
    { term: 'legal aid', count: 42, growth: '+8%' },
    { term: 'youth housing', count: 38, growth: '+15%' },
];

export default function AnalyticsPage() {
    const maxViews = Math.max(...MOCK_VIEWS_DATA.map(d => d.views));

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Analytics Overview
                </h1>
                <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
                    Insights into how people are finding and interacting with your services.
                </p>
            </header>

            {/* Main Chart */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Profile Views (Last 7 Days)</h3>
                    <div className="text-green-600 flex items-center text-sm font-medium bg-green-50 px-2 py-1 rounded-full dark:bg-green-900/20 dark:text-green-400">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        +12.5%
                    </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-2">
                    {MOCK_VIEWS_DATA.map((item, index) => (
                        <div key={item.day} className="flex flex-col items-center gap-2 w-full">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(item.views / maxViews) * 100}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="w-full max-w-[40px] bg-blue-600 rounded-t-md opacity-80 hover:opacity-100"
                            >
                                <div className="sr-only">{item.views} views</div>
                            </motion.div>
                            <span className="text-xs text-neutral-500 font-medium">{item.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Search Terms */}
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-6">
                        <Search className="h-5 w-5 text-neutral-400" />
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Top Search Terms</h3>
                    </div>
                    <div className="space-y-4">
                        {TOP_SEARCH_TERMS.map((item) => (
                            <div key={item.term} className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0 dark:border-neutral-800">
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">"{item.term}"</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-neutral-500">{item.count}</span>
                                    <span className={`text-xs font-medium ${item.growth.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                                        {item.growth}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Demographics / Devices */}
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="h-5 w-5 text-neutral-400" />
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Visitor Demographics</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-neutral-600 dark:text-neutral-400">Mobile Users</span>
                                <span className="font-medium text-neutral-900 dark:text-white">68%</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                                <div className="h-full bg-blue-500 w-[68%]" />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-neutral-600 dark:text-neutral-400">Local (Kingston)</span>
                                <span className="font-medium text-neutral-900 dark:text-white">82%</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                                <div className="h-full bg-purple-500 w-[82%]" />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-neutral-600 dark:text-neutral-400">Recurring Visitors</span>
                                <span className="font-medium text-neutral-900 dark:text-white">45%</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                                <div className="h-full bg-orange-500 w-[45%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
