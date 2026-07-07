import React, { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Phone, ShieldCheck, Flag, ArrowRight, HeartPulse, Home, Utensils, AlertTriangle } from "lucide-react"
import { Service, VerificationLevel, IntentCategory } from "@/types/service"
import { ReportIssueModal } from "@/components/feedback/ReportIssueModal"
import { Link } from "@/i18n/routing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FreshnessBadge } from "@/components/ui/FreshnessBadge"
import ServiceMatchReasons from "@/components/services/ServiceMatchReasons"
import { scaleOnHover } from "@/lib/motion"

import { useLocale, useTranslations } from "next-intl"
import { trackEvent } from "@/lib/analytics"
import { highlightMatches } from "@/lib/search/highlight"
import { buildMatchReasonSearchParams } from "@/lib/search/match-reasons"
import { useUserContext } from "@/hooks/useUserContext"
import { checkEligibility } from "@/lib/eligibility/checker"
import { getCoverageBadges, getPrimaryPlaceLabel } from "@/lib/places/coverage"
import { cn } from "@/lib/utils"

/**
 * Props for the ServiceCard component.
 */
interface ServiceCardProps {
  service: Service
  score?: number
  matchReasons?: string[]
  highlightTokens?: string[]
  onScopeFilter?: (scope: "provincial") => void
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  switch (category) {
    case IntentCategory.Health:
      return <HeartPulse className={className} />
    case IntentCategory.Housing:
      return <Home className={className} />
    case IntentCategory.Food:
      return <Utensils className={className} />
    case IntentCategory.Crisis:
      return <AlertTriangle className={className} />
    default:
      return <HeartPulse className={className} />
  }
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  matchReasons = [],
  highlightTokens = [],
  onScopeFilter,
}) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const locale = useLocale()
  const t = useTranslations()
  const { context: userContext } = useUserContext()
  const isVerified =
    service.verification_level === VerificationLevel.L2 || service.verification_level === VerificationLevel.L3

  // Localized Content
  const rawName = locale === "fr" && service.name_fr ? service.name_fr : service.name
  const rawDescription = locale === "fr" && service.description_fr ? service.description_fr : service.description
  const address = locale === "fr" && service.address_fr ? service.address_fr : service.address

  // Apply Highlighting
  const nameHtml = highlightMatches(rawName, highlightTokens)
  const descriptionHtml = highlightMatches(rawDescription, highlightTokens)

  // Distance is optionally added during search with geolocation
  const distance = service.distance
  const coverageBadges = getCoverageBadges(service)
  const primaryPlaceLabel = getPrimaryPlaceLabel(service)
  const coverageMetaLabel =
    coverageBadges.find((badge) => badge.kind === "provincial" || badge.kind === "national")?.label ??
    primaryPlaceLabel ??
    t("ServiceDetail.kingston")

  const handleTrack = (type: "click_call") => {
    trackEvent(service.id, type)
  }

  const detailSearchParams = buildMatchReasonSearchParams(matchReasons)
  const detailHref =
    detailSearchParams.size > 0 ? `/service/${service.id}?${detailSearchParams.toString()}` : `/service/${service.id}`

  return (
    <motion.div
      variants={scaleOnHover}
      whileHover="whileHover"
      whileTap="whileTap"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="service-card-print group hover:border-primary-100 relative h-full overflow-hidden border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-neutral-300 dark:bg-white">
        {/* Top Gradient Line on Hover */}
        <div className="from-primary-500 to-accent-500 absolute top-0 right-0 left-0 h-0.5 origin-left scale-x-0 transform bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100" />

        <div className="flex h-full flex-col p-1.5">
          {/* Header Row - Icon + Title + Badges */}
          <div className="flex items-start gap-2">
            <div className="from-primary-50 to-primary-100 dark:from-primary-50 dark:to-primary-100 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
              <CategoryIcon
                category={service.intent_category}
                className="text-primary-600 dark:text-primary-700 h-4 w-4"
              />
            </div>

            <div className="min-w-0 flex-1">
              {/* Title Row with inline badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <h2
                  className="truncate text-sm leading-tight font-semibold text-neutral-900 dark:text-neutral-950"
                  dangerouslySetInnerHTML={{ __html: nameHtml }}
                />
                {/* Status Badge */}
                {(service.status === "Permanently Closed" || service.status === "Merged") && (
                  <Badge
                    variant="destructive"
                    size="sm"
                    className="px-1.5 py-0 text-xs font-bold tracking-wider uppercase"
                  >
                    {service.status === "Merged" ? t("ServiceDetail.merged") : t("ServiceDetail.closed")}
                  </Badge>
                )}
                {coverageBadges.map((badge) => {
                  const isBroadCoverage = badge.kind === "provincial" || badge.kind === "national"
                  return (
                    <Badge
                      key={badge.key}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-blue-300 bg-blue-50 px-1.5 py-0 text-xs text-blue-900 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100",
                        isBroadCoverage && "cursor-pointer transition-colors hover:bg-blue-100 dark:hover:bg-blue-100",
                        "dark:border-blue-300 dark:bg-blue-50 dark:text-blue-900"
                      )}
                      onClick={(e) => {
                        if (!isBroadCoverage) return
                        e.stopPropagation()
                        onScopeFilter?.("provincial")
                      }}
                    >
                      {badge.label}
                    </Badge>
                  )
                })}
                {service.scope === "canada" && coverageBadges.length === 0 && (
                  <Badge
                    variant="outline"
                    size="sm"
                    className="cursor-pointer border-purple-300 bg-purple-50 px-1.5 py-0 text-xs text-purple-900 transition-colors hover:bg-purple-100 dark:border-purple-300 dark:bg-purple-50 dark:text-purple-900 dark:hover:bg-purple-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onScopeFilter?.("provincial")
                    }}
                  >
                    {t("Badges.canadaWide")}
                  </Badge>
                )}
                {/* Fees Badge - Only if explicitly Free */}
                {service.fees?.toLowerCase() === "free" && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="border-green-300 bg-green-50 px-1.5 py-0 text-xs text-green-900 dark:border-green-300 dark:bg-green-50 dark:text-green-900"
                  >
                    {t("ServiceDetail.free")}
                  </Badge>
                )}
                {checkEligibility(service, userContext) === "eligible" && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="gap-0.5 border-green-300 bg-green-100 px-1.5 py-0 text-xs text-green-900 dark:border-green-300 dark:bg-green-100 dark:text-green-900"
                  >
                    {t("Eligibility.likelyQualify")}
                  </Badge>
                )}
                {isVerified && (
                  <Badge variant="primary" size="sm" className="gap-0.5 px-1.5 py-0 text-xs">
                    <ShieldCheck className="h-3 w-3" /> {t("ServiceDetail.verified")}
                  </Badge>
                )}
                {service.last_verified && <FreshnessBadge lastVerified={service.last_verified} />}
              </div>
              {/* Meta row: category + distance/scope */}
              <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-700 dark:text-neutral-700">
                <span className="font-medium">{service.intent_category}</span>
                <span className="text-neutral-500 dark:text-neutral-500">•</span>
                <span>
                  {service.scope === "ontario"
                    ? t("Distance.ontarioWide")
                    : service.scope === "canada"
                      ? t("Distance.canadaWide")
                      : distance
                        ? `${distance.toFixed(1)} km`
                        : coverageMetaLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Description - single line */}
          <p
            className="mt-1.5 line-clamp-1 text-[13px] text-neutral-700 dark:text-neutral-700"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />

          <ServiceMatchReasons reasons={matchReasons} />

          {/* Contact Info - inline */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-neutral-700 dark:text-neutral-700">
            {address && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-600 dark:text-neutral-600" />
                <span className="max-w-[180px] truncate">{address}</span>
              </div>
            )}
            {service.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-600 dark:text-neutral-600" />
                <a
                  href={`tel:${service.phone}`}
                  className="hover:text-primary-700 dark:hover:text-primary-700 text-neutral-800 transition-colors hover:underline dark:text-neutral-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTrack("click_call")
                  }}
                >
                  {service.phone}
                </a>
              </div>
            )}
          </div>

          {/* Footer: Tags + Actions - minimal spacing */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              {service.identity_tags.slice(0, 2).map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  size="sm"
                  className="bg-neutral-50 px-1.5 py-0 text-xs text-neutral-800 dark:bg-neutral-100 dark:text-neutral-800"
                >
                  {tag.tag}
                </Badge>
              ))}
              {service.identity_tags.length > 2 && (
                <span className="text-xs text-neutral-600 dark:text-neutral-600">
                  +{service.identity_tags.length - 2}
                </span>
              )}
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-neutral-800 transition-colors hover:text-neutral-950 dark:text-neutral-800 dark:hover:text-neutral-950"
              >
                <Flag className="h-3 w-3" />
                {t("ServiceDetail.report")}
              </button>
            </div>
            <ReportIssueModal
              serviceId={service.id}
              serviceName={service.name}
              isOpen={feedbackOpen}
              onClose={() => setFeedbackOpen(false)}
            />

            <Button size="sm" className="h-7 gap-1 px-2 text-xs" asChild>
              <Link href={detailHref}>
                {t("ServiceDetail.details")} <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default ServiceCard
