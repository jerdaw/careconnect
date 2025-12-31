"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "next-intl"
import { Save, Loader2 } from "lucide-react"
import { Service } from "@/types/service"

// Extended schema for bilingual support in this form
const ServiceEditSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  name_fr: z.string().min(3, "French name must be at least 3 characters").optional(), // Optional for now as not all DB records might have it yet
  description: z.string().min(20, "Description must be at least 20 characters"),
  description_fr: z.string().min(20, "French description must be at least 20 characters").optional(),
  phone: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  operating_hours: z.string().optional(),
  eligibility_notes: z.string().optional(),
  eligibility_notes_fr: z.string().optional(),
  access_script: z.string().optional(),
  access_script_fr: z.string().optional(),
})

type ServiceEditFormData = z.infer<typeof ServiceEditSchema>

interface Props {
  service: Partial<Service>
  onSave: (data: ServiceEditFormData) => Promise<void>
}

export function ServiceEditForm({ service, onSave }: Props) {
  const t = useTranslations("Dashboard.services")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ServiceEditFormData>({
    resolver: zodResolver(ServiceEditSchema),
    defaultValues: {
      name: service.name || "",
      name_fr: service.name_fr || "",
      description: service.description || "",
      description_fr: service.description_fr || "",
      phone: service.phone || "",
      url: service.url || "",
      address: service.address || "",
      operating_hours:
        typeof service.hours === "string" ? service.hours : service.hours ? JSON.stringify(service.hours) : "",
      eligibility_notes: service.eligibility_notes || "",
      eligibility_notes_fr: service.eligibility_notes_fr || "",
      access_script: service.access_script || "",
      access_script_fr: service.access_script_fr || "",
    },
  })

  const onSubmit = async (data: ServiceEditFormData) => {
    setIsSubmitting(true)
    try {
      await onSave(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* English Name */}
        <div>
          <label className="text-sm font-medium">
            {t("name")} ({t("englishLabel")})
          </label>
          <Input {...register("name")} />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
        </div>

        {/* French Name */}
        <div>
          <label className="text-sm font-medium">
            {t("name")} ({t("frenchLabel")})
          </label>
          <Input {...register("name_fr")} />
          {errors.name_fr && <p className="mt-1 text-sm text-red-500">{errors.name_fr.message}</p>}
        </div>

        {/* English Description */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium">
            {t("description")} ({t("englishLabel")})
          </label>
          <Textarea {...register("description")} rows={4} />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
        </div>

        {/* French Description */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium">
            {t("description")} ({t("frenchLabel")})
          </label>
          <Textarea {...register("description_fr")} rows={4} />
          {errors.description_fr && <p className="mt-1 text-sm text-red-500">{errors.description_fr.message}</p>}
        </div>

        {/* Contact Info */}
        <div>
          <label className="text-sm font-medium">{t("phone")}</label>
          <Input {...register("phone")} type="tel" />
        </div>

        <div>
          <label className="text-sm font-medium">{t("website")}</label>
          <Input {...register("url")} type="url" placeholder="https://" />
          {errors.url && <p className="mt-1 text-sm text-red-500">{errors.url.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">{t("address")}</label>
          <Input {...register("address")} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">{t("hours")}</label>
          <Input {...register("operating_hours")} placeholder="Mon-Fri 9am-5pm" />
        </div>

        {/* Eligibility Notes */}
        <div>
          <label className="text-sm font-medium">
            {t("eligibility")} ({t("englishLabel")})
          </label>
          <Textarea {...register("eligibility_notes")} rows={3} />
        </div>

        <div>
          <label className="text-sm font-medium">
            {t("eligibility")} ({t("frenchLabel")})
          </label>
          <Textarea {...register("eligibility_notes_fr")} rows={3} />
        </div>

        {/* Access Scripts */}
        <div>
          <label className="text-sm font-medium">Access Script (EN)</label>
          <Textarea {...register("access_script")} rows={3} />
        </div>

        <div>
          <label className="text-sm font-medium">Access Script (FR)</label>
          <Textarea {...register("access_script_fr")} rows={3} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t("saveChanges")}
        </Button>
      </div>
    </form>
  )
}
