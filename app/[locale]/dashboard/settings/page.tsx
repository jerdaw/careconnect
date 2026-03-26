"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/layout/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Shield, Bell, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { MemberManagement } from "@/components/dashboard/MemberManagement"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"

interface OrgData {
  id: string
  name: string
  domain: string | null
}

interface OrgSettings {
  website: string | null
  phone: string | null
  description: string | null
  email_on_feedback: boolean
  email_on_service_update: boolean
  weekly_analytics_report: boolean
}

export default function SettingsPage() {
  const t = useTranslations("Dashboard.settings")
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [settings, setSettings] = useState<OrgSettings>({
    website: null,
    phone: null,
    description: null,
    email_on_feedback: true,
    email_on_service_update: true,
    weekly_analytics_report: false,
  })

  useEffect(() => {
    async function fetchData() {
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

        // Fetch organization settings
        const { data: settingsData } = await supabase
          .from("organization_settings")
          .select("*")
          .eq("organization_id", orgs.id)
          .single()

        if (settingsData) {
          const data = settingsData as unknown as OrgSettings
          setSettings({
            website: data.website,
            phone: data.phone,
            description: data.description,
            email_on_feedback: data.email_on_feedback ?? true,
            email_on_service_update: data.email_on_service_update ?? true,
            weekly_analytics_report: data.weekly_analytics_report ?? false,
          })
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [user, supabase])

  const handleOrgUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org) return

    setSaving(true)
    const { error } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- organizations table not in generated Supabase types
        .from("organizations") as any
    )
      .update({ name: org.name, domain: org.domain })
      .eq("id", org.id)

    if (error) {
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.updateOrganizationFailed"),
        variant: "destructive",
      })
    } else {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.organizationUpdated"),
      })
    }
    setSaving(false)
  }

  const handleSettingsUpdate = async () => {
    if (!org) return

    setSaving(true)

    // Upsert settings (insert or update)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- organization_settings table not in generated Supabase types
    const { error } = await (supabase.from("organization_settings") as any).upsert(
      {
        organization_id: org.id,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" }
    )

    if (error) {
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.updateSettingsFailed"),
        variant: "destructive",
      })
    } else {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.settingsUpdated"),
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
    return <div className="p-8 text-center text-neutral-500">{t("noOrganization")}</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <DashboardPageHeader title={t("title")} subtitle={t("description")} />

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
                  placeholder={t("organization.placeholders.name")}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-domain">{t("organization.domain")}</Label>
                <Input
                  id="org-domain"
                  value={org.domain || ""}
                  onChange={(e) => setOrg({ ...org, domain: e.target.value })}
                  placeholder={t("organization.placeholders.domain")}
                />
                <p className="text-xs text-neutral-500">{t("organization.domainHint")}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-website">{t("organization.website")}</Label>
                <Input
                  id="org-website"
                  type="url"
                  value={settings.website || ""}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  placeholder={t("organization.placeholders.website")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-phone">{t("organization.phone")}</Label>
                <Input
                  id="org-phone"
                  type="tel"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder={t("organization.placeholders.phone")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-description">{t("organization.descriptionLabel")}</Label>
                <Textarea
                  id="org-description"
                  value={settings.description || ""}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  placeholder={t("organization.placeholders.description")}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? t("actions.saving") : t("actions.saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="text-primary-600 h-5 w-5" />
              {t("notifications.title")}
            </CardTitle>
            <CardDescription>{t("notifications.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="email-feedback">{t("notifications.emailOnFeedback.title")}</Label>
                <p className="text-sm text-neutral-500">{t("notifications.emailOnFeedback.description")}</p>
              </div>
              <Switch
                id="email-feedback"
                checked={settings.email_on_feedback}
                onCheckedChange={(checked) => setSettings({ ...settings, email_on_feedback: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="email-updates">{t("notifications.emailOnServiceUpdates.title")}</Label>
                <p className="text-sm text-neutral-500">{t("notifications.emailOnServiceUpdates.description")}</p>
              </div>
              <Switch
                id="email-updates"
                checked={settings.email_on_service_update}
                onCheckedChange={(checked) => setSettings({ ...settings, email_on_service_update: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="weekly-report">{t("notifications.weeklyAnalyticsReport.title")}</Label>
                <p className="text-sm text-neutral-500">{t("notifications.weeklyAnalyticsReport.description")}</p>
              </div>
              <Switch
                id="weekly-report"
                checked={settings.weekly_analytics_report}
                onCheckedChange={(checked) => setSettings({ ...settings, weekly_analytics_report: checked })}
              />
            </div>
            <div className="pt-4">
              <Button onClick={handleSettingsUpdate} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? t("actions.saving") : t("actions.savePreferences")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-primary-600 h-5 w-5" />
              {t("members.title")}
            </CardTitle>
            <CardDescription>{t("members.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberManagement organizationId={org.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
