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
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provenance = (service.provenance as any) || {}
  
  const getLevelVariant = (level: VerificationLevel) => {
    switch (level) {
      case VerificationLevel.L3: return "success"
      case VerificationLevel.L2: return "primary"
      case VerificationLevel.L1: return "default"
      default: return "outline"
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-primary-100 bg-primary-50/10 dark:border-primary-900/10 dark:bg-primary-900/5 mt-6" variant="default" padding="none">
        <CardHeader className="pb-3 bg-white/50 dark:bg-black/20 flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            {t("title")}
          </CardTitle>
          <Badge variant={getLevelVariant(service.verification_level)} size="sm">
            {vt(service.verification_level)}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-sm p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">{t("lastVerified")}</span>
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-medium">{formatDate(service.last_verified, locale) || t("unknown")}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">{t("verifiedBy")}</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">{provenance.verified_by || "Care Connect Admin"}</span>
              </div>
            </div>
          </div>

          {provenance.method && (
            <div className="space-y-1 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">{t("method")}</span>
              <div className="flex items-center gap-2">
                {provenance.method === 'phone' && <Phone className="w-3.5 h-3.5 text-neutral-400" />}
                {provenance.method === 'email' && <Mail className="w-3.5 h-3.5 text-neutral-400" />}
                {provenance.method === 'site' && <Globe className="w-3.5 h-3.5 text-neutral-400" />}
                <span className="font-medium">{t(`methods.${provenance.method}`)}</span>
              </div>
            </div>
          )}

          {provenance.evidence_url && (
            <div className="space-y-1 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">{t("evidence")}</span>
              <a 
                href={provenance.evidence_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors font-medium decoration-primary-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="underline underline-offset-4">{t("viewEvidence")}</span>
              </a>
            </div>
          )}
          
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button 
              onClick={() => setIsIssueModalOpen(true)}
              className="text-[10px] text-neutral-500 hover:text-primary-600 flex items-center gap-1.5 transition-colors font-medium uppercase tracking-tight"
            >
              <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
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
