import { BarChart3, Edit, Settings, Users } from 'lucide-react';

export default function PartnerDashboardConcept() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Nav */}
            <nav className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                        <span className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white">Partner</span>
                        Kingston Youth Shelter
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span>jane@youthshelter.ca</span>
                        <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-8">
                {/* Stats */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-neutral-500">Total Views (30d)</h3>
                            <BarChart3 className="h-4 w-4 text-neutral-400" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">1,245</p>
                        <span className="text-xs text-emerald-600">+12% from last month</span>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-neutral-500">Click-throughs</h3>
                            <Users className="h-4 w-4 text-neutral-400" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">86</p>
                        <span className="text-xs text-neutral-500">Website & Phone</span>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-neutral-500">Profile Health</h3>
                            <Settings className="h-4 w-4 text-neutral-400" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-emerald-600">92%</p>
                        <span className="text-xs text-neutral-500">Good standing</span>
                    </div>
                </div>

                {/* Service List */}
                <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Managed Services</h2>
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                        <div>
                            <h3 className="font-medium text-neutral-900 dark:text-white">Emergency Youth Shelter</h3>
                            <p className="text-sm text-neutral-500">234 Brock St • Last updated 2 days ago</p>
                        </div>
                        <button className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            <Edit className="h-3 w-3" />
                            Edit
                        </button>
                    </div>
                    <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800 opacity-60">
                        <div>
                            <h3 className="font-medium text-neutral-900 dark:text-white">Transitional Housing Program</h3>
                            <p className="text-sm text-neutral-500">Last updated 6 months ago</p>
                        </div>
                        <button className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            <Edit className="h-3 w-3" />
                            Edit
                        </button>
                    </div>
                </div>

                <div className="mt-8 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Note:</strong> This is a static concept page. Data is mocked.
                    </p>
                </div>
            </main>
        </div>
    );
}
