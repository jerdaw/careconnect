"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AccessibleFormField } from "@/components/forms/AccessibleFormField"
import { useToast } from "@/components/ui/use-toast"
import { BellRing, Send } from "lucide-react"

export default function AdminNotificationsPage() {
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState("service_update")

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [isSubmitting, setIsSubmitting] = useState(false)
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const handleSend = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          type,
          url: "/", // Default to home
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification broadcast sent successfully.",
          duration: 5000,
        })
        setTitle("")
        setMessage("")
      } else {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || "Failed to send")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send notification.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="container max-w-2xl py-10 focus:outline-none">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Notification Console</h1>
        <p className="text-muted-foreground">Send push notifications to all subscribed users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Compose Message
          </CardTitle>
          <CardDescription>This will be sent to all users who have opted in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccessibleFormField label="Notification Type" id="notif-type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="notif-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_update">Service Update</SelectItem>
                <SelectItem value="emergency">Critical Alert</SelectItem>
                <SelectItem value="general">General Announcement</SelectItem>
              </SelectContent>
            </Select>
          </AccessibleFormField>

          <AccessibleFormField label="Title" id="notif-title" required>
            <Input placeholder="e.g. Shelter Capacity Alert" value={title} onChange={(e) => setTitle(e.target.value)} />
          </AccessibleFormField>

          <AccessibleFormField label="Message Body" id="notif-body" required>
            <Textarea
              placeholder="Details about the update..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </AccessibleFormField>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSend} disabled={!title || !message}>
              <Send className="mr-2 h-4 w-4" />
              Send Broadcast
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 rounded bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>Note:</strong> To make this functional, you need to implement a Next.js API route (`/api/admin/push`)
        that uses the **OneSignal REST API Key** to trigger the actual send.
      </div>
    </main>
  )
}
