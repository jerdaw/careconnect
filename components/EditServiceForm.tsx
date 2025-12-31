"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { serviceSchema, ServiceFormData } from "@/lib/schemas"
import { Service } from "@/types/service"
import { useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"

import BasicInfoSection from "./edit-service/BasicInfoSection"
import ContactSection from "./edit-service/ContactSection"
import DetailsSection from "./edit-service/DetailsSection"

interface EditServiceFormProps {
  service?: Service // Optional for creation mode
  onSubmit: (data: ServiceFormData) => Promise<void>
}

export default function EditServiceForm({ service, onSubmit }: EditServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      address: service?.address || "",
      phone: service?.phone || "",
      url: service?.url || "",
      email: service?.email || "",
      hours: typeof service?.hours === "object" ? JSON.stringify(service.hours, null, 2) : service?.hours || "",
      fees: service?.fees || "",
      eligibility: service?.eligibility || "",
      application_process: service?.application_process || "",
      category: service?.intent_category || "General",
      tags: service?.identity_tags?.map((t) => t.tag) || [],
      bus_routes: service?.bus_routes?.join(", ") || "",
    },
  })

  const onFormSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(data)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to save changes."
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      <BasicInfoSection register={register} errors={errors} />
      <ContactSection register={register} errors={errors} />
      <DetailsSection register={register} errors={errors} />

      {submitError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {submitError}
        </div>
      )}

      <div className="flex justify-end pt-5">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
