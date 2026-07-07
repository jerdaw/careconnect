"use client"

import { useState } from "react"
import { FilePenLine } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ClaimFlow } from "@/components/partner/ClaimFlow"
import { UpdateRequestModal } from "./UpdateRequestModal"

interface PartnerActionsPanelProps {
  serviceId: string
  serviceName: string
  showClaimAction: boolean
}

export function PartnerActionsPanel({ serviceId, serviceName, showClaimAction }: PartnerActionsPanelProps) {
  const serviceDetail = useTranslations("ServiceDetail")
  const feedback = useTranslations("Feedback")
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  return (
    <div className="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
      {showClaimAction ? (
        <div className="text-center">
          <p className="mb-2 text-xs text-neutral-500">{serviceDetail("claimText")}</p>
          <ClaimFlow serviceName={serviceName} />
        </div>
      ) : null}

      <div className={showClaimAction ? "mt-4" : ""}>
        <Button
          variant="outline"
          className="w-full gap-2 !border-neutral-300 !bg-white !text-neutral-950 hover:!bg-neutral-50 hover:!text-neutral-950 dark:!border-neutral-300 dark:!bg-white dark:!text-neutral-950 dark:hover:!bg-neutral-100"
          onClick={() => setIsUpdateModalOpen(true)}
        >
          <FilePenLine className="h-4 w-4" />
          {feedback("requestUpdateTitle")}
        </Button>
      </div>

      <UpdateRequestModal
        serviceId={serviceId}
        serviceName={serviceName}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  )
}
