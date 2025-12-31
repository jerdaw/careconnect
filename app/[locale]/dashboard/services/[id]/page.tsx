"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // Changed from 'next/router'
import { supabase } from "@/lib/supabase"
import { Service } from "@/types/service"
import EditServiceForm from "@/components/EditServiceForm"
import { ServiceFormData } from "@/lib/schemas"
import { useAuth } from "@/components/AuthProvider"
import { ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
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

      const { data, error } = await supabase.from("services").select("*").eq("id", pageId).single()

      if (data) {
        // Map to Service type (similar to search.ts logic)
        const mappedData = {
          ...data,
          embedding: typeof data.embedding === "string" ? JSON.parse(data.embedding) : data.embedding,
          identity_tags: typeof data.tags === "string" ? JSON.parse(data.tags) : data.tags,
          intent_category: data.category,
          verification_level: data.verification_status,
        } as unknown as Service
        setService(mappedData)
      } else if (error) {
        console.error("Error fetching service", error)
        // Handle 404 or permission error
      }
      setLoading(false)
    }
    loadService()
  }, [params, user])

  const handleUpdate = async (formData: ServiceFormData) => {
    if (!user || !id) return

    // Prepare for DB update
    const updates = {
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
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("services").update(updates).eq("id", id)

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Service not found</h2>
        <Link href="/dashboard/services" className="mt-4 inline-block text-blue-600 hover:underline">
          &larr; Back to Services
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
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Edit Service</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{service.name}</p>
          </div>
        </div>
        <a
          href={`/services/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
        >
          <Eye className="h-4 w-4" />
          Preview
        </a>
      </div>

      <EditServiceForm service={service} onSubmit={handleUpdate} />
    </div>
  )
}
