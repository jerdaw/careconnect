"use client"

import { useState } from "react"
import { Check, Info, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  type: "info" | "success" | "warning"
  title: string
  message: string
  date: string
  read: boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Verification Approved",
    message: 'Your service "Martha\'s Table" has been verified and is now public.',
    date: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Profile Incomplete",
    message: "Please add your organization logo and website URL to improve trust.",
    date: "1 day ago",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "New Feature Available",
    message: "You can now bulk import services using CSV files. Check the services tab.",
    date: "3 days ago",
    read: true,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Notifications</h1>
          <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
            Stay updated on your services and account status.
          </p>
        </div>
        <Button variant="link" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </header>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`flex items-start gap-4 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
              }`}
            >
              <div className="mt-1 flex-shrink-0">{getIcon(notification.type)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{notification.title}</p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{notification.message}</p>
                <p className="mt-2 text-xs text-neutral-500">{notification.date}</p>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => markAsRead(notification.id)}
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
