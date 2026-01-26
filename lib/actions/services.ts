"use server"

import { revalidatePath } from "next/cache"
import { updateService } from "@/lib/services"
import { ServiceFormData } from "@/lib/schemas"
import { Service, IntentCategory, ServiceHours } from "@/types/service"
import { ServiceCreateSchema, type ServiceCreateInput } from "@/lib/schemas/service-create"
import { createClient } from "@/utils/supabase/server"
import { assertPermission } from "@/lib/auth/authorization"
import { getUserOrganizationMembership } from "@/lib/actions/members"
import { logger } from "@/lib/logger"

export async function updateServiceAction(id: string, data: ServiceFormData, locale: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Get user's organization membership
  const membership = await getUserOrganizationMembership(user.id)

  if (!membership) {
    return { success: false, error: "You are not a member of an organization" }
  }

  try {
    // Check permission using centralized authorization
    await assertPermission(supabase, user.id, membership.organization_id, "canEditAllServices")
  } catch {
    // If user can't edit all services, check if they can edit their own
    try {
      await assertPermission(supabase, user.id, membership.organization_id, "canEditOwnServices")

      // Verify this is their own service
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("created_by, org_id")
        .eq("id", id)
        .single()

      if (serviceError || !service) {
        logger.error("Service not found for update", serviceError, {
          component: "ServiceActions",
          action: "update",
          serviceId: id,
          userId: user.id,
        })
        return { success: false, error: "Service not found" }
      }

      const serviceData = service as { created_by: string; org_id: string }

      // Verify org ownership
      if (serviceData.org_id !== membership.organization_id) {
        return { success: false, error: "Cannot edit services from other organizations" }
      }

      // Verify personal ownership
      if (serviceData.created_by !== user.id) {
        return { success: false, error: "You can only edit services you created" }
      }
    } catch (editOwnError) {
      logger.error("Insufficient permissions to edit service", editOwnError, {
        component: "ServiceActions",
        action: "update",
        serviceId: id,
        userId: user.id,
        role: membership.role,
      })
      return { success: false, error: "Insufficient permissions to edit services" }
    }
  }

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
    logger.info("Service updated successfully", {
      component: "ServiceActions",
      action: "update",
      serviceId: id,
      userId: user.id,
    })
    revalidatePath(`/${locale}/dashboard/services`)
    revalidatePath(`/${locale}/dashboard/services/${id}`)
    revalidatePath(`/${locale}/service/${id}`)
  } else {
    logger.error("Service update failed", result.error, {
      component: "ServiceActions",
      action: "update",
      serviceId: id,
      userId: user.id,
    })
  }

  return result
}

export async function createServiceAction(data: ServiceCreateInput, locale: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Validate input
  const validation = ServiceCreateSchema.safeParse(data)
  if (!validation.success) {
    logger.warn("Service creation validation failed", {
      component: "ServiceActions",
      action: "create",
      userId: user.id,
      errors: validation.error.flatten(),
    })
    return {
      success: false,
      error: "Validation failed",
      details: validation.error.flatten(),
    }
  }

  // Get user's organization membership
  const membership = await getUserOrganizationMembership(user.id)

  if (!membership) {
    return { success: false, error: "You are not a member of an organization" }
  }

  // Check permission using centralized authorization
  try {
    await assertPermission(supabase, user.id, membership.organization_id, "canCreateServices")
  } catch (error) {
    logger.error("Insufficient permissions to create service", error, {
      component: "ServiceActions",
      action: "create",
      userId: user.id,
      role: membership.role,
    })
    return { success: false, error: "Insufficient permissions to create services" }
  }

  // Prepare service data
  const serviceData = {
    ...validation.data,
    org_id: membership.organization_id,
    created_by: user.id,
    verification_level: "L1" as const,
    published: false, // Services start unpublished for review
    // Convert coordinates if provided
    latitude: validation.data.coordinates?.lat,
    longitude: validation.data.coordinates?.lng,
  }

  // Remove coordinates object (we've split it into lat/lng)
  const { coordinates: _coordinates, ...finalServiceData } = serviceData

  // Insert service
  const { data: newService, error: insertError } = await (supabase.from("services") as any)
    .insert([finalServiceData])
    .select()
    .single()

  if (insertError) {
    logger.error("Service creation failed", insertError, {
      component: "ServiceActions",
      action: "create",
      userId: user.id,
      orgId: membership.organization_id,
    })
    return { success: false, error: insertError.message }
  }

  logger.info("Service created successfully", {
    component: "ServiceActions",
    action: "create",
    serviceId: newService?.id,
    userId: user.id,
    orgId: membership.organization_id,
  })

  // Revalidate paths
  revalidatePath(`/${locale}/dashboard/services`)

  return { success: true, data: newService }
}

export async function deleteServiceAction(serviceId: string, locale: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Get user's organization membership
  const membership = await getUserOrganizationMembership(user.id)

  if (!membership) {
    return { success: false, error: "You are not a member of an organization" }
  }

  // Check permission using centralized authorization
  try {
    await assertPermission(supabase, user.id, membership.organization_id, "canDeleteServices")
  } catch (error) {
    logger.error("Insufficient permissions to delete service", error, {
      component: "ServiceActions",
      action: "delete",
      serviceId,
      userId: user.id,
      role: membership.role,
    })
    return { success: false, error: "Insufficient permissions to delete services" }
  }

  // Use the soft_delete_service function from the database
  // This function also checks ownership at the database level
  const { data, error } = await (supabase.rpc as any)("soft_delete_service", {
    service_uuid: serviceId,
  })

  if (error) {
    logger.error("Service deletion failed", error, {
      component: "ServiceActions",
      action: "delete",
      serviceId,
      userId: user.id,
      orgId: membership.organization_id,
    })
    return { success: false, error: error.message }
  }

  const result = data as { success: boolean; error?: string; message?: string }

  if (!result.success) {
    logger.warn("Service deletion returned failure", {
      component: "ServiceActions",
      action: "delete",
      serviceId,
      userId: user.id,
      resultError: result.error,
    })
    return { success: false, error: result.error || "Failed to delete service" }
  }

  logger.info("Service deleted successfully", {
    component: "ServiceActions",
    action: "delete",
    serviceId,
    userId: user.id,
    orgId: membership.organization_id,
  })

  // Revalidate paths
  revalidatePath(`/${locale}/dashboard/services`)
  revalidatePath(`/${locale}/dashboard/services/${serviceId}`)

  return { success: true, message: result.message }
}
