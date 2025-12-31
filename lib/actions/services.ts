"use server"

import { revalidatePath } from "next/cache"
import { updateService } from "@/lib/services"
import { ServiceFormData } from "@/lib/schemas"
import { Service, IntentCategory, ServiceHours } from "@/types/service"

export async function updateServiceAction(id: string, data: ServiceFormData, locale: string) {
  // Map ServiceFormData to Partial<Service>
  const updates: Partial<Service> = {
    name: data.name,
    description: data.description,
    address: data.address,
    phone: data.phone,
    url: data.url,
    email: data.email,
    hours: data.hours as unknown as ServiceHours,
    fees: data.fees,
    eligibility_notes: data.eligibility,
    application_process: data.application_process,
    intent_category: data.category as IntentCategory,
    identity_tags: (data.tags || []).map((t) => ({ tag: t, evidence_url: "" })),
    bus_routes: data.bus_routes ? data.bus_routes.split(",").map((s) => s.trim()) : [],
  }

  const result = await updateService(id, updates)

  if (result.success) {
    revalidatePath(`/${locale}/dashboard/services`)
    revalidatePath(`/${locale}/dashboard/services/${id}`)
    revalidatePath(`/${locale}/service/${id}`)
  }

  return result
}
