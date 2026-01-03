import React, { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Phone, ShieldCheck, Flag, ArrowRight, HeartPulse, Home, Utensils, AlertTriangle } from "lucide-react"
import { Service, VerificationLevel, IntentCategory } from "../types/service"
import { FeedbackModal } from "@/components/FeedbackModal"
import { Link } from "../i18n/routing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FreshnessBadge } from "@/components/ui/FreshnessBadge"
import { scaleOnHover } from "@/lib/motion"

import { useLocale, useTranslations } from "next-intl"
import { trackEvent } from "../lib/analytics"
import { highlightMatches } from "../lib/search/highlight"
import { useUserContext } from "@/hooks/useUserContext"
import { checkEligibility } from "@/lib/eligibility/checker"

/**
 * Props for the ServiceCard component.
 */
interface ServiceCardProps {
  service: Service
  score?: number
  matchReasons?: string[]
  highlightTokens?: string[]
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

const ServiceCard: React.FC<ServiceCardProps> = ({ service, highlightTokens = [] }) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const locale = useLocale()
  const t = useTranslations()
  const isVerified =
    service.verification_level === VerificationLevel.L2 || service.verification_level === VerificationLevel.L3

  // Localized Content
  const rawName = locale === "fr" && service.name_fr ? service.name_fr : service.name
  const rawDescription = locale === "fr" && service.description_fr ? service.description_fr : service.description
  const address = locale === "fr" && service.address_fr ? service.address_fr : service.address

  // Apply Highlighting
  const nameHtml = highlightMatches(rawName, highlightTokens)
  const descriptionHtml = highlightMatches(rawDescription, highlightTokens)

  // Cast to any to safely access distance if it's not on the main type yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceWithDistance = service as any

  const handleTrack = (type: "click_website" | "click_call") => {
    trackEvent(service.id, type)
  }

  return (
    <motion.div
      variants={scaleOnHover}
      whileHover="whileHover"
      whileTap="whileTap"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="service-card-print group hover:border-primary-100 relative h-full overflow-hidden border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Top Gradient Line on Hover */}
        <div className="from-primary-500 to-accent-500 absolute top-0 right-0 left-0 h-0.5 origin-left scale-x-0 transform bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100" />
        
        <div className="flex h-full flex-col p-1.5">
          {/* Header Row - Icon + Title + Badges */}
          <div className="flex items-start gap-2">
            <div className="from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
              <CategoryIcon
                category={service.intent_category}
                className="text-primary-600 dark:text-primary-400 h-4 w-4"
              />
            </div>

            <div className="min-w-0 flex-1">
              {/* Title Row with inline badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <h3
                  className="truncate text-sm leading-tight font-semibold text-neutral-900 dark:text-white"
                  dangerouslySetInnerHTML={{ __html: nameHtml }}
                />
                {/* Status Badge */}
                {(service.status === "Permanently Closed" || service.status === "Merged") && (
                   <Badge variant="destructive" size="sm" className="px-1.5 py-0 text-xs uppercase tracking-wider font-bold">
                     {service.status === "Merged" ? "Merged" : "Closed"}
                   </Badge>
                )}
                {service.is_provincial && (
                  <Badge variant="outline" size="sm" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 px-1.5 py-0 text-xs">
                    Provincial
                  </Badge>
                )}
                {/* Fees Badge - Only if explicitly Free */}
                {(service.fees?.toLowerCase() === "free") && (
                  <Badge variant="secondary" size="sm" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 px-1.5 py-0 text-xs">
                    Free
                  </Badge>
                )}
                {checkEligibility(service, useUserContext().context) === "eligible" && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="gap-0.5 border-green-200 bg-green-100 px-1.5 py-0 text-xs text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    {t("Eligibility.likelyQualify")}
                  </Badge>
                )}
                {isVerified && (
                  <Badge variant="primary" size="sm" className="gap-0.5 px-1.5 py-0 text-xs">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
                {service.last_verified && (
                  <FreshnessBadge lastVerified={service.last_verified} />
                )}
              </div>
              {/* Meta row: category + distance */}
              <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-500">
                <span className="font-medium">{service.intent_category}</span>
                <span className="text-neutral-300">•</span>
                <span>
                  {serviceWithDistance.distance ? `${serviceWithDistance.distance.toFixed(1)} km` : "Kingston"}
                </span>
              </div>
            </div>
          </div>

          {/* Description - single line */}
          <p
            className="mt-1.5 line-clamp-1 text-[13px] text-neutral-600 dark:text-neutral-400"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />

          {/* Contact Info - inline */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            {address && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span className="truncate max-w-[180px]">{address}</span>
              </div>
            )}
            {service.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <a
                  href={`tel:${service.phone}`}
                  className="hover:text-primary-600 transition-colors hover:underline"
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
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {service.identity_tags.slice(0, 2).map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  size="sm"
                  className="bg-neutral-50 px-1.5 py-0 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                >
                  {tag.tag}
                </Badge>
              ))}
              {service.identity_tags.length > 2 && (
                <span className="text-xs text-neutral-400">+{service.identity_tags.length - 2}</span>
              )}
              <button
                onClick={() => setFeedbackOpen(true)}
                className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <Flag className="h-3 w-3" />
                Report
              </button>
            </div>
            <FeedbackModal
              serviceId={service.id}
              serviceName={service.name}
              isOpen={feedbackOpen}
              onClose={() => setFeedbackOpen(false)}
            />

            <Button
              size="sm"
              className="h-7 gap-1 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              asChild
            >
              <Link href={`/service/${service.id}`} onClick={() => handleTrack("click_website")}>
                Details <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs opacity-100 sm:hidden" asChild>
              <Link href={`/service/${service.id}`} onClick={() => handleTrack("click_website")}>
                Details <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default ServiceCard
