"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Service } from "@/types/service"
import { Button } from "@/components/ui/button"
import { Pencil, Loader2, Plus, Trash2 } from "lucide-react"
import { Link } from "@/i18n/routing"
import { useLocale, useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

interface Props {
  partnerId: string
  locale: string
}

export function PartnerServiceList({ partnerId, locale: localeProp }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const localeFromHook = useLocale()
  const locale = localeProp || localeFromHook
  const t = useTranslations("Dashboard.services")
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const fetchServices = async () => {
      // ==========================================================================
      // RLS-FIRST APPROACH: Services automatically filtered by organization
      // ==========================================================================
      // The "Partners can view their organization's services" RLS policy
      // automatically filters this query to only return services owned by
      // the authenticated user's organization. No explicit org_id filter needed.
      // ==========================================================================
      const { data, error } = await supabase.from("services").select("*")

      if (!error && data) {
        setServices(data as unknown as Service[])
      }
      setLoading(false)
    }

    fetchServices()
  }, [partnerId, supabase])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const { error } = await supabase.from("services").delete().eq("id", id)

    if (error) {
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.deleteFailed"),
        variant: "destructive",
      })
    } else {
      setServices((prev) => prev.filter((s) => s.id !== id))
      toast({
        title: t("toast.successTitle"),
        description: t("toast.deleteSuccess"),
      })
    }
    setDeleting(null)
  }

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
        <Button className="mt-4" asChild>
          <Link href="/dashboard/services/create" locale={locale}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createFirstService")}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/services/create" locale={locale}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createService")}
          </Link>
        </Button>
      </div>
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-left text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                <th className="text-muted-foreground h-12 px-4 align-middle font-medium">{t("colName")}</th>
                <th className="text-muted-foreground h-12 px-4 align-middle font-medium">{t("colStatus")}</th>
                <th className="text-muted-foreground h-12 px-4 text-right align-middle font-medium">
                  {t("colActions")}
                </th>
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
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/services/${service.id}/edit`} locale={locale}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("edit")}
                        </Link>
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                            {deleting === service.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="ml-2">{t("delete")}</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t("deleteConfirm.title")}</DialogTitle>
                            <DialogDescription>{t("deleteConfirm.description")}</DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">{t("deleteConfirm.cancel")}</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(service.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t("deleteConfirm.confirm")}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
