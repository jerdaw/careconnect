'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { LayoutDashboard, List, Settings, LogOut, ExternalLink, Bell, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardSidebar() {
    const pathname = usePathname();
    const { signOut, user } = useAuth();
    const router = useRouter();

    const isActive = (path: string) => pathname.includes(path);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col">
            {/* Logo Area */}
            <div className="flex h-16 items-center border-b border-neutral-200 px-6 dark:border-neutral-800">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600">
                    <span>Care Connect</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                <Link
                    href="/dashboard"
                    className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/dashboard') && !isActive('/dashboard/services') && !isActive('/dashboard/settings')
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        }`}
                >
                    <LayoutDashboard className="h-5 w-5" />
                    Overview
                </Link>

                <Link
                    href="/dashboard/services"
                    className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/dashboard/services')
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        }`}
                >
                    <List className="h-5 w-5" />
                    My Services
                </Link>

                <Link
                    href="/dashboard/notifications"
                    className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/dashboard/notifications')
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        }`}
                >
                    <div className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">2</span>
                    </div>
                    Notifications
                </Link>

                <Link
                    href="/dashboard/analytics"
                    className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/dashboard/analytics')
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        }`}
                >
                    <BarChart3 className="h-5 w-5" />
                    Analytics
                </Link>

                <Link
                    href="/dashboard/settings"
                    className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/dashboard/settings')
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        }`}
                >
                    <Settings className="h-5 w-5" />
                    Settings
                </Link>
            </nav>

            {/* User Profile / Footer */}
            <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex items-center gap-3 px-2 pb-4">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                            {user?.email || 'Partner'}
                        </p>
                        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                            Organization Admin
                        </p>
                    </div>
                </div>

                <div className="space-y-1">
                    <Link
                        href="/"
                        target="_blank"
                        className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        <ExternalLink className="h-4 w-4" />
                        View Public Site
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
}
