"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Service } from "@/types/service"
import { Button } from "@/components/ui/button"
import { Pencil, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"

interface Props {
  partnerId: string
}

export function PartnerServiceList({ partnerId }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const locale = useLocale()
  const t = useTranslations("Dashboard.services")

  useEffect(() => {
    const fetchServices = async () => {
      // Find organization for this user first
      // For now assuming 1-1 mapping or direct query.
      // In a real multi-tenant setup, we'd query organization_members.
      // Simplified for Pilot: Query services where service.owner_id = user.id (if column exists)
      // OR find org link.

      // Let's assume we fetch services linked to the partner's org.
      // Since we haven't fully implemented the 'organizations' table link in services.json yet,
      // we will simulate by fetching ALL services for now or just mock it locally if needed.
      // BUT, wait, Phase 8 added RLS. Let's try fetching from 'services' table directly.
      // The RLS policy should filter services owned by this user/org.

      const { data, error } = await supabase.from("services").select("*")

      if (!error && data) {
        setServices(data as unknown as Service[])
      }
      setLoading(false)
    }

    fetchServices()
  }, [partnerId, supabase])

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-semibold">{t("emptyState.title")}</h3>
        <p className="mt-2 text-neutral-500">{t("emptyState.description")}</p>
        <Button className="mt-4" disabled>
          <Plus className="mr-2 h-4 w-4" />
          {t("createFirst")}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-left text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
              <th className="text-muted-foreground h-12 px-4 align-middle font-medium">{t("colName")}</th>
              <th className="text-muted-foreground h-12 px-4 align-middle font-medium">{t("colStatus")}</th>
              <th className="text-muted-foreground h-12 px-4 text-right align-middle font-medium">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {services.map((service) => (
              <tr
                key={service.id}
                className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
              >
                <td className="p-4 align-middle font-medium">{service.name}</td>
                <td className="p-4 align-middle">
                  <span className="focus:ring-ring inline-flex items-center rounded-full border border-transparent bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none dark:bg-green-900/30 dark:text-green-400">
                    {t("statusActive")}
                  </span>
                </td>
                <td className="p-4 text-right align-middle">
                  <Link href={`/${locale}/dashboard/services/${service.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("edit")}
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
