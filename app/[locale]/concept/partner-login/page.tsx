import { ShieldCheck } from 'lucide-react';
import { Link } from '../../../../i18n/routing';

export default function PartnerLoginConcept() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Partner Portal
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        Sign in to manage your service listing
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                placeholder="you@organization.ca"
                            />
                        </div>
                    </div>

                    <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                    Concept Prototype
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                    <p>
                                        This is a design mockup. Authentication is not yet active.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        disabled
                    >
                        Send Magic Link
                    </button>

                    <div className="text-center">
                        <Link href="/concept/partner-dashboard" className="text-xs text-neutral-400 hover:text-blue-500 hover:underline">
                            (Dev: Skip to Dashboard)
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
