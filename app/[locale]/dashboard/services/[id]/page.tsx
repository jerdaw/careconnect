"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // Changed from 'next/router'
import { Service } from "@/types/service"
import { Database } from "@/types/supabase"
import EditServiceForm from "@/components/edit-service/EditServiceForm"
import { ServiceFormData } from "@/lib/schemas/form"
import { useAuth } from "@/components/layout/AuthProvider"
import { ArrowLeft, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useServiceFeedback } from "@/hooks/useServiceFeedback"
import { ThumbsUp, AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"
import { createClient } from "@/utils/supabase/client"
import { logger } from "@/lib/logger"
import { unsafeFrom } from "@/lib/supabase"

type ServiceRow = Database["public"]["Tables"]["services"]["Row"]

function FeedbackStats({ serviceId }: { serviceId: string }) {
  const { stats, helpfulPercentage, totalVotes, loading } = useServiceFeedback(serviceId)

  if (loading || !stats) return null

  return (
    <div className="flex items-center gap-3 text-xs font-medium">
      {totalVotes > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <ThumbsUp className="h-3 w-3" />
          {helpfulPercentage}% ({totalVotes} votes)
        </span>
      )}
      {stats.open_issues_count > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          {stats.open_issues_count} open issues
        </span>
      )}
    </div>
  )
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("Dashboard.services.viewPage")
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>("")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function loadService() {
      const { id: pageId } = await params
      setId(pageId)

      if (!user) return // Auth provider handles redirect, but safe guard

      const supabase = createClient()
      const { data, error } = await supabase.from("services").select("*").eq("id", pageId).single()

      if (data) {
        const serviceRow = data as ServiceRow

        // Map to Service type (similar to search.ts logic)
        const mappedData = {
          ...serviceRow,
          embedding: typeof serviceRow.embedding === "string" ? JSON.parse(serviceRow.embedding) : serviceRow.embedding,
          identity_tags: typeof serviceRow.tags === "string" ? JSON.parse(serviceRow.tags) : serviceRow.tags,
          intent_category: serviceRow.category,
          verification_level: serviceRow.verification_status,
        } as unknown as Service
        setService(mappedData)
      } else if (error) {
        logger.error("Error fetching service", { error })
        // Handle 404 or permission error
      }
      setLoading(false)
    }
    loadService()
  }, [params, user])

  const handleUpdate = async (formData: ServiceFormData) => {
    if (!user || !id) return

    const supabase = createClient()

    // Prepare for DB update
    const updates: Database["public"]["Tables"]["services"]["Update"] = {
      name: formData.name,
      description: formData.description,
      address: formData.address,
      phone: formData.phone,
      url: formData.url,
      email: formData.email,
      hours: formData.hours,
      fees: formData.fees,
      eligibility: formData.eligibility,
      application_process: formData.application_process,
      category: formData.category,
      // tags: ... logic to save tags
      bus_routes: formData.bus_routes ? formData.bus_routes.split(",").map((s) => s.trim()) : [],
    }

    // Generated browser client types currently resolve this update payload to `never`.
    // Keep the payload strongly typed above and narrow only at the call site.
    const { error } = await unsafeFrom(supabase, "services").update(updates).eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    // Redirect back to list
    router.push("/dashboard/services")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t("serviceNotFound")}</h2>
        <Link href="/dashboard/services" className="mt-4 inline-block text-blue-600 hover:underline">
          &larr; {t("backToServices")}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/services"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-300 ring-inset hover:bg-neutral-50 dark:bg-neutral-800 dark:ring-neutral-700 dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          </Link>
          <div>
            <h1 className="heading-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t("editService")}
            </h1>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{service.name}</p>
              <FeedbackStats serviceId={id} />
            </div>
          </div>
        </div>
        <a
          href={`/services/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
        >
          <Eye className="h-4 w-4" />
          {t("preview")}
        </a>
      </div>

      <EditServiceForm service={service} onSubmit={handleUpdate} />
    </div>
  )
}
