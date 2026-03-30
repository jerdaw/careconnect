"use client"

import { Service } from "@/types/service"
import EditServiceForm from "@/components/edit-service/EditServiceForm"
import { updateServiceAction } from "@/lib/actions/services"
import { ServiceFormData } from "@/lib/schemas/form"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"

interface Props {
  service: Service
  id: string
  locale: string
}

export default function EditServiceClientWrapper({ service, id, locale }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations("Dashboard.services.viewPage.toast")

  const handleSubmit = async (data: ServiceFormData) => {
    const result = await updateServiceAction(id, data, locale)

    if (result.success) {
      toast({
        title: t("successTitle"),
        description: t("updateSuccess"),
      })
      router.push(`/dashboard/services/${id}`, { locale })
    } else {
      throw new Error(result.error || t("updateFailed"))
    }
  }

  return <EditServiceForm service={service} onSubmit={handleSubmit} />
}
