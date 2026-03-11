"use client"

import { useState } from "react"
import { ShieldCheck, History, ExternalLink, HelpCircle, Phone, Mail, Globe, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Service, VerificationLevel } from "@/types/service"
import { formatDate } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { ReportIssueModal } from "../feedback/ReportIssueModal"

interface TrustPanelProps {
  service: Service
  locale: string
}

export function TrustPanel({ service, locale }: TrustPanelProps) {
  const t = useTranslations("Trust")
  const vt = useTranslations("VerificationLevels")
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)

  const provenance = service.provenance

  const getLevelVariant = (level: VerificationLevel) => {
    switch (level) {
      case VerificationLevel.L3:
        return "success"
      case VerificationLevel.L2:
        return "primary"
      case VerificationLevel.L1:
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <>
      <Card
        className="border-primary-100 bg-primary-50/10 dark:border-primary-900/10 dark:bg-primary-900/5 mt-6 overflow-hidden"
        variant="default"
        padding="none"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-white/50 p-4 pb-3 dark:bg-black/20">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="text-primary-600 h-4 w-4" />
            {t("title")}
          </CardTitle>
          <Badge variant={getLevelVariant(service.verification_level)} size="sm">
            {vt(service.verification_level)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t("lastVerified")}
              </span>
              <div className="flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-medium">{formatDate(service.last_verified, locale) || t("unknown")}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t("verifiedBy")}
              </span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-medium">{provenance.verified_by || "HelpBridge Admin"}</span>
              </div>
            </div>
          </div>

          {provenance.method && (
            <div className="space-y-1 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <span className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t("method")}
              </span>
              <div className="flex items-center gap-2">
                {provenance.method === "phone" && <Phone className="h-3.5 w-3.5 text-neutral-400" />}
                {provenance.method === "email" && <Mail className="h-3.5 w-3.5 text-neutral-400" />}
                {provenance.method === "site" && <Globe className="h-3.5 w-3.5 text-neutral-400" />}
                <span className="font-medium">{t(`methods.${provenance.method}`)}</span>
              </div>
            </div>
          )}

          {provenance.evidence_url && (
            <div className="space-y-1 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <span className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t("evidence")}
              </span>
              <a
                href={provenance.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 decoration-primary-200 flex items-center gap-2 font-medium transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="underline underline-offset-4">{t("viewEvidence")}</span>
              </a>
            </div>
          )}

          <div className="border-t border-neutral-100 pt-2 dark:border-neutral-800">
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="hover:text-primary-600 flex items-center gap-1.5 text-[10px] font-medium tracking-tight text-neutral-500 uppercase transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
              {t("updateHint")}
            </button>
          </div>
        </CardContent>
      </Card>

      <ReportIssueModal
        serviceId={service.id}
        serviceName={service.name}
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />
    </>
  )
}
