"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { LayoutDashboard, List, Settings, LogOut, ExternalLink, Bell, BarChart3, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const router = useRouter()

  const isActive = (path: string) => pathname.includes(path)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 transform border-r border-neutral-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:inset-auto lg:flex lg:translate-x-0 lg:flex-col dark:border-neutral-800 dark:bg-neutral-900">
      {/* Logo Area */}
      <div className="flex h-20 items-center border-b border-neutral-100 px-6 dark:border-neutral-800">
        <Link href="/" className="group flex items-center gap-2">
          <div className="from-primary-500 to-primary-600 group-hover:shadow-primary-500/30 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-lg font-bold text-white shadow-md transition-shadow">
            K
          </div>
          <span className="heading-display text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Care Connect
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <Link
          href="/dashboard"
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive("/dashboard") && !isActive("/dashboard/services") && !isActive("/dashboard/settings")
              ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          <LayoutDashboard
            className={cn(
              "h-5 w-5 transition-colors",
              isActive("/dashboard") ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600"
            )}
          />
          Overview
        </Link>

        <Link
          href="/dashboard/services"
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive("/dashboard/services")
              ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          <List
            className={cn(
              "h-5 w-5 transition-colors",
              isActive("/dashboard/services") ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600"
            )}
          />
          My Services
        </Link>

        <Link
          href="/dashboard/notifications"
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive("/dashboard/notifications")
              ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          <div className="relative">
            <Bell
              className={cn(
                "h-5 w-5 transition-colors",
                isActive("/dashboard/notifications")
                  ? "text-primary-600"
                  : "text-neutral-400 group-hover:text-neutral-600"
              )}
            />
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-neutral-900">
              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
            </span>
          </div>
          Notifications
        </Link>

        <Link
          href="/dashboard/feedback"
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive("/dashboard/feedback")
              ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          <MessageSquare
            className={cn(
              "h-5 w-5 transition-colors",
              isActive("/dashboard/feedback") ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600"
            )}
          />
          Feedback
        </Link>

        <Link
          href="/dashboard/analytics"
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive("/dashboard/analytics")
              ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          <BarChart3
            className={cn(
              "h-5 w-5 transition-colors",
              isActive("/dashboard/analytics") ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600"
            )}
          />
          Analytics
        </Link>

        <Link
          href="/dashboard/settings"
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive("/dashboard/settings")
              ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          <Settings
            className={cn(
              "h-5 w-5 transition-colors",
              isActive("/dashboard/settings") ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600"
            )}
          />
          Settings
        </Link>
      </nav>

      {/* User Profile / Footer */}
      <div className="border-t border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex items-center gap-3 px-2 pb-4">
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm dark:border-neutral-800">
            <AvatarFallback className="from-primary-100 to-primary-200 text-primary-700 bg-gradient-to-br text-xs font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
              {user?.email || "Partner"}
            </p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">Organization Admin</p>
          </div>
        </div>

        <div className="space-y-1">
          <Link
            href="/"
            target="_blank"
            className="group hover:text-primary-600 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-white hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <ExternalLink className="h-4 w-4" />
            View Public Site
          </Link>

          <Button
            variant="ghost"
            className="h-9 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  )
}
