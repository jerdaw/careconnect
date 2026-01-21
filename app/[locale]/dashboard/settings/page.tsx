"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, UserPlus, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface OrgData {
  id: string
  name: string
  domain: string | null
}

export default function SettingsPage() {
  const t = useTranslations("Dashboard.settings")
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [org, setOrg] = useState<OrgData | null>(null)

  useEffect(() => {
    async function fetchOrg() {
      if (!user) return

      // Fetch organization linked to user
      const { data } = await supabase
        .from("organization_members")
        .select("organization_id, organizations(*)")
        .eq("user_id", user.id)
        .single()

      const orgs = (data as unknown as { organizations: OrgData }).organizations
      if (orgs) {
        setOrg(orgs)
      }
      setLoading(false)
    }

    fetchOrg()
  }, [user, supabase])

  const handleOrgUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org) return

    setSaving(true)
    const { error } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("organizations") as any
    )
      .update({ name: org.name, domain: org.domain })
      .eq("id", org.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Organization updated successfully",
      })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!org) {
    return <div className="p-8 text-center text-neutral-500">No organization found for your account.</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{t("title")}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t("description")}</p>
      </div>

      <div className="grid gap-8">
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="text-primary-600 h-5 w-5" />
              {t("organization.title")}
            </CardTitle>
            <CardDescription>{t("organization.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOrgUpdate} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">{t("organization.name")}</Label>
                <Input
                  id="org-name"
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  placeholder="Organization Name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-domain">{t("organization.domain")}</Label>
                <Input
                  id="org-domain"
                  value={org.domain || ""}
                  onChange={(e) => setOrg({ ...org, domain: e.target.value })}
                  placeholder="example.com"
                />
                <p className="text-xs text-neutral-500">{t("organization.domainHint")}</p>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Team Members Placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("members.title")}</CardTitle>
              <CardDescription>Manage your team and their access roles.</CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("members.invite")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border p-4 text-center text-sm text-neutral-500">
              Team management features coming soon.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
