"use client"

import { useEffect, useState } from "react"
import { Check, Info, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/components/ui/use-toast"

interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  created_at: string
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setNotifications(data as Notification[])
      }
      setLoading(false)
    }

    fetchNotifications()
  }, [user, supabase])

  const markAsRead = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("notifications") as any).update({ read: true }).eq("id", id)

    if (!error) {
      setNotifications((prev: Notification[]) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } else {
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("notifications") as any)
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    if (!error) {
      setNotifications((prev: Notification[]) => prev.map((n) => ({ ...n, read: true })))
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive",
      })
    }
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
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
        {notifications.some((n: Notification) => !n.read) && (
          <Button variant="link" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-neutral-500">No notifications yet.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {notifications.map((notification: Notification) => (
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
                  <p className="mt-2 text-xs text-neutral-500">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
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
      )}
    </div>
  )
}
