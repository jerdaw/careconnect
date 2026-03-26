"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { createServiceAction } from "@/lib/actions/services"
import type { ServiceCreateInput } from "@/lib/schemas/service-create"
import { logger } from "@/lib/logger"
import Link from "next/link"

const INTENT_CATEGORIES = [
  { value: "Food", key: "food" },
  { value: "Crisis", key: "crisis" },
  { value: "Housing", key: "housing" },
  { value: "Health", key: "health" },
  { value: "Legal", key: "legal" },
  { value: "Financial", key: "financial" },
  { value: "Employment", key: "employment" },
  { value: "Education", key: "education" },
  { value: "Transport", key: "transport" },
  { value: "Community", key: "community" },
  { value: "Indigenous", key: "indigenous" },
  { value: "Wellness", key: "wellness" },
] as const

export default function CreateServicePage() {
  const t = useTranslations("Dashboard.services.create")
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState<Partial<ServiceCreateInput>>({
    intent_category: "Community",
    scope: "kingston",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const result = await createServiceAction(formData as ServiceCreateInput, locale)

      if (result.success) {
        toast({
          title: t("toast.successTitle"),
          description: t("toast.successDescription"),
        })
        router.push(`/${locale}/dashboard/services`)
      } else {
        toast({
          title: t("toast.errorTitle"),
          description: result.error || t("toast.createFailed"),
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error("Service creation error", { error })
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/services`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="heading-display text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t("subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.basic.title")}</CardTitle>
              <CardDescription>{t("sections.basic.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  {t("fields.name.label")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("fields.name.placeholder")}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name_fr">{t("fields.nameFr.label")}</Label>
                <Input
                  id="name_fr"
                  value={formData.name_fr || ""}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                  placeholder={t("fields.nameFr.placeholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">
                  {t("fields.description.label")} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("fields.description.placeholder")}
                  rows={4}
                  required
                  minLength={10}
                />
                <p className="text-xs text-neutral-500">{t("fields.description.minLengthHint")}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description_fr">{t("fields.descriptionFr.label")}</Label>
                <Textarea
                  id="description_fr"
                  value={formData.description_fr || ""}
                  onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                  placeholder={t("fields.descriptionFr.placeholder")}
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">
                  {t("fields.category.label")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.intent_category}
                  onValueChange={(val) =>
                    setFormData({ ...formData, intent_category: val as (typeof INTENT_CATEGORIES)[number]["value"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {t(`categories.${cat.key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.contact.title")}</CardTitle>
              <CardDescription>{t("sections.contact.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">
                  {t("fields.phone.label")}
                  {formData.intent_category === "Crisis" && <span className="text-red-500"> *</span>}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t("fields.phone.placeholder")}
                  required={formData.intent_category === "Crisis"}
                />
                {formData.intent_category === "Crisis" && (
                  <p className="text-xs text-amber-600">{t("fields.phone.crisisRequiredHint")}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t("fields.email.label")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t("fields.email.placeholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="url">{t("fields.website.label")}</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url || ""}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder={t("fields.website.placeholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">{t("fields.address.label")}</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t("fields.address.placeholder")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.additional.title")}</CardTitle>
              <CardDescription>{t("sections.additional.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="hours_text">{t("fields.hours.label")}</Label>
                <Input
                  id="hours_text"
                  value={formData.hours_text || ""}
                  onChange={(e) => setFormData({ ...formData, hours_text: e.target.value })}
                  placeholder={t("fields.hours.placeholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fees">{t("fields.fees.label")}</Label>
                <Input
                  id="fees"
                  value={formData.fees || ""}
                  onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                  placeholder={t("fields.fees.placeholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="eligibility">{t("fields.eligibility.label")}</Label>
                <Textarea
                  id="eligibility"
                  value={formData.eligibility || ""}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder={t("fields.eligibility.placeholder")}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="application_process">{t("fields.applicationProcess.label")}</Label>
                <Textarea
                  id="application_process"
                  value={formData.application_process || ""}
                  onChange={(e) => setFormData({ ...formData, application_process: e.target.value })}
                  placeholder={t("fields.applicationProcess.placeholder")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("actions.creating")}
                </>
              ) : (
                t("actions.createService")
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
