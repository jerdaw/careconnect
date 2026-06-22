import { notFound } from "next/navigation"
import { getServiceById } from "@/lib/services"
import { Metadata } from "next"
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wallet,
  Mail,
  Navigation,
  MessageSquareText,
} from "lucide-react"
import { SimplifiedServiceView } from "@/components/services/SimplifiedServiceView"
import { getTranslations } from "next-intl/server"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { VerificationLevel, IntentCategory } from "@/types/service"
import { EmergencyDisclaimer } from "@/components/ui/EmergencyDisclaimer"
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget"
import { TrustPanel } from "@/components/services/TrustPanel"
import { ServiceActionBar } from "@/components/services/ServiceActionBar"
import { PartnerActionsPanel } from "@/components/services/PartnerActionsPanel"
import { ExternalMapPanel } from "@/components/services/ExternalMapPanel"
import { ServiceDetailTracker } from "@/components/services/ServiceDetailTracker"
import ServiceMatchReasons from "@/components/services/ServiceMatchReasons"
import { TrackedServiceLink } from "@/components/services/TrackedServiceLink"
import { normalizeMatchReasons } from "@/lib/search/match-reasons"
import { isBeyondGovernanceFreshnessWindow } from "@/lib/freshness"

interface Props {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<{ view?: string; matchReason?: string | string[] }>
}

const PAGE_BACKGROUND_CLASS =
  "relative flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_14%_6%,rgba(34,211,238,0.22),transparent_24rem),radial-gradient(circle_at_82%_7%,rgba(99,102,241,0.16),transparent_26rem),radial-gradient(circle_at_50%_84%,rgba(34,211,238,0.06),transparent_30rem),linear-gradient(180deg,rgba(239,253,255,0.98)_0%,rgba(248,250,252,0.96)_18%,rgba(255,255,255,0.98)_34%,rgba(255,255,255,0.98)_72%,rgba(248,250,252,0.96)_88%,rgba(241,245,249,0.98)_100%)] font-sans dark:bg-[radial-gradient(circle_at_14%_6%,rgba(8,145,178,0.18),transparent_24rem),radial-gradient(circle_at_82%_7%,rgba(79,70,229,0.16),transparent_26rem),radial-gradient(circle_at_50%_84%,rgba(8,145,178,0.08),transparent_30rem),linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.96)_28%,rgba(15,23,42,0.94)_72%,rgba(2,6,23,0.98)_100%)]"

const DETAIL_SURFACE_CLASS =
  "border-neutral-200/75 bg-white/86 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10"

const DETAIL_PANEL_CLASS =
  "rounded-xl border border-neutral-200/70 bg-white/65 p-5 text-neutral-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300"

const CONTACT_ICON_CLASS =
  "shrink-0 rounded-xl bg-accent-50 p-2.5 text-accent-700 ring-1 ring-black/5 dark:bg-accent-500/10 dark:text-accent-200 dark:ring-white/10"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  const service = await getServiceById(id)
  if (!service) return { title: "Service Not Found" }

  const name = locale === "fr" && service.name_fr ? service.name_fr : service.name
  const description = locale === "fr" && service.description_fr ? service.description_fr : service.description

  return {
    title: `${name} | CareConnect`,
    description: description,
  }
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { id, locale } = await params
  const { view, matchReason } = await searchParams
  const service = await getServiceById(id)
  const t = await getTranslations("ServiceDetail")
  const tBadge = await getTranslations("VerificationLevels")
  const searchMatchReasons = normalizeMatchReasons(
    Array.isArray(matchReason) ? matchReason : matchReason ? [matchReason] : []
  )

  if (!service) {
    notFound()
  }

  if (view === "simple") {
    return (
      <SimplifiedServiceView
        service={service}
        locale={locale}
        translations={{
          standardView: t("standardView"),
          whatIsIt: t("whatIsIt"),
          howToGetHelp: t("howToGetHelp"),
          callUs: t("callUs"),
          visitUs: t("visitUs"),
          openHours: t("openHours"),
          summaryComingSoon: t("summaryComingSoon"),
        }}
      />
    )
  }

  const name = locale === "fr" && service.name_fr ? service.name_fr : service.name
  const description = (locale === "fr" && service.description_fr ? service.description_fr : service.description).split(
    "\n"
  )
  const address = locale === "fr" && service.address_fr ? service.address_fr : service.address
  const accessScript = locale === "fr" && service.access_script_fr ? service.access_script_fr : service.access_script
  const accessScriptIsEnglishFallback = locale === "fr" && !!service.access_script && !service.access_script_fr

  const isVerified =
    service.verification_level === VerificationLevel.L2 || service.verification_level === VerificationLevel.L3
  const isBeyondFreshnessWindow = isBeyondGovernanceFreshnessWindow(service)

  return (
    <div className={PAGE_BACKGROUND_CLASS}>
      <div className="bg-noise" />
      <ServiceDetailTracker serviceId={service.id} />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Section animate={false} className="relative pt-40 pb-8 md:pt-44 md:pb-10">
          <div className="space-y-6">
            {service.intent_category === IntentCategory.Crisis && (
              <div>
                <EmergencyDisclaimer variant="banner" />
              </div>
            )}

            <Card padding="none" className={DETAIL_SURFACE_CLASS}>
              <div className="p-6 md:p-8 lg:p-10">
                <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="border-neutral-200/80 bg-white/70 py-1 text-sm">
                        {service.intent_category}
                      </Badge>
                      {service.verification_level === VerificationLevel.L3 ? (
                        <Badge
                          variant="primary"
                          className="gap-1.5 border-blue-200 bg-blue-50 py-1 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {tBadge("L3")}
                        </Badge>
                      ) : isVerified ? (
                        <Badge variant="primary" className="gap-1.5 py-1 text-sm">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {tBadge("L2")}
                        </Badge>
                      ) : null}
                    </div>

                    {(service.status === "Permanently Closed" || service.status === "Merged") && (
                      <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                          <div>
                            <h2 className="font-semibold">
                              {service.status === "Merged" ? t("serviceMerged") : t("permanentlyClosed")}
                            </h2>
                            <p className="mt-1 text-sm">
                              {service.status === "Merged" ? t("mergedDescription") : t("closedDescription")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <h1 className="heading-display max-w-4xl text-3xl leading-tight font-bold text-neutral-950 md:text-5xl dark:text-white">
                      {name}
                    </h1>

                    {address && (
                      <div className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                        <MapPin
                          className="text-accent-700 dark:text-accent-300 mt-1 h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-lg leading-relaxed">{address}</span>
                      </div>
                    )}
                  </div>

                  <ServiceActionBar
                    serviceId={service.id}
                    serviceName={name}
                    plainLanguageLabel={t("plainLanguage")}
                    shareLabel={t("share")}
                    printLabel={t("print")}
                  />
                </div>
              </div>
            </Card>
          </div>
        </Section>

        <Section animate={false} className="pt-2 pb-14 md:pb-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {isBeyondFreshnessWindow && (
                <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <div>
                      <h2 className="font-semibold">{t("staleRecordTitle")}</h2>
                      <p className="mt-1 text-sm">{t("staleRecordDescription")}</p>
                    </div>
                  </div>
                </div>
              )}

              {searchMatchReasons.length > 0 && (
                <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                  <div className="p-6 md:p-8">
                    <ServiceMatchReasons reasons={searchMatchReasons} />
                  </div>
                </Card>
              )}

              <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                <div className="p-6 md:p-8">
                  <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-neutral-950 dark:text-white">
                    {t("aboutService")}
                  </h2>
                  <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {description.map((paragraph, idx) => (
                      <p key={idx} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </Card>

              {(service.fees || service.documents_required) && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {service.fees && (
                    <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                      <div className="p-6 md:p-7">
                        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-neutral-950 dark:text-white">
                          <Wallet className="text-accent-700 dark:text-accent-300 h-6 w-6" aria-hidden="true" />
                          {t("fees")}
                        </h2>
                        <p className="text-neutral-700 dark:text-neutral-300">{service.fees}</p>
                      </div>
                    </Card>
                  )}
                  {service.documents_required && (
                    <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                      <div className="p-6 md:p-7">
                        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-neutral-950 dark:text-white">
                          <FileText className="text-accent-700 dark:text-accent-300 h-6 w-6" aria-hidden="true" />
                          {t("documents")}
                        </h2>
                        <p className="text-neutral-700 dark:text-neutral-300">{service.documents_required}</p>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {(service.eligibility || service.eligibility_notes) && (
                <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                  <div className="p-6 md:p-8">
                    <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold text-neutral-950 dark:text-white">
                      <CheckCircle2 className="text-accent-700 dark:text-accent-300 h-6 w-6" aria-hidden="true" />
                      {t("eligibility")}
                    </h2>
                    <div className={DETAIL_PANEL_CLASS}>
                      <p>{service.eligibility_notes || service.eligibility}</p>
                    </div>
                  </div>
                </Card>
              )}

              {service.application_process && (
                <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                  <div className="p-6 md:p-8">
                    <h2 className="mb-4 text-2xl font-bold text-neutral-950 dark:text-white">{t("accessProcess")}</h2>
                    <p className="text-neutral-700 dark:text-neutral-300">{service.application_process}</p>
                  </div>
                </Card>
              )}

              {accessScript && (
                <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                  <div className="p-6 md:p-8">
                    <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold text-neutral-950 dark:text-white">
                      <MessageSquareText className="text-accent-700 dark:text-accent-300 h-6 w-6" aria-hidden="true" />
                      {t("whatToSayWhenYouCall")}
                    </h2>
                    <div className={DETAIL_PANEL_CLASS}>
                      <p className="text-neutral-800 dark:text-neutral-200">{t("whatToSayWhenYouCallDescription")}</p>
                      {accessScriptIsEnglishFallback && (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                          {t("accessScriptEnglishFallbackNotice")}
                        </p>
                      )}
                      <p className="mt-4 whitespace-pre-line">{accessScript}</p>
                    </div>
                  </div>
                </Card>
              )}

              {service.accessibility && Object.keys(service.accessibility).length > 0 && (
                <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                  <div className="p-6 md:p-8">
                    <h2 className="mb-4 text-2xl font-bold text-neutral-950 dark:text-white">{t("accessibility")}</h2>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(service.accessibility).map(
                        ([key, value]) =>
                          value && (
                            <Badge key={key} variant="secondary" className="capitalize">
                              {key.replace("_", " ")}
                            </Badge>
                          )
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              <Card padding="none" className={DETAIL_SURFACE_CLASS}>
                <div className="p-5 md:p-6">
                  <h2 className="mb-5 text-lg font-semibold text-neutral-950 dark:text-white">{t("contactInfo")}</h2>
                  <div className="space-y-5">
                    {service.phone && (
                      <div className="flex items-start gap-3">
                        <div className={CONTACT_ICON_CLASS}>
                          <Phone className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t("phone")}</p>
                          <TrackedServiceLink
                            href={`tel:${service.phone}`}
                            serviceId={service.id}
                            eventType="click_call"
                            className="text-primary-600 dark:text-primary-300 font-medium hover:underline"
                          >
                            {service.phone}
                          </TrackedServiceLink>
                        </div>
                      </div>
                    )}

                    {service.url && (
                      <div className="flex items-start gap-3">
                        <div className={CONTACT_ICON_CLASS}>
                          <Globe className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t("website")}</p>
                          <TrackedServiceLink
                            href={service.url}
                            serviceId={service.id}
                            eventType="click_website"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-300 font-medium break-all hover:underline"
                          >
                            {t("visitWebsite")}
                          </TrackedServiceLink>
                        </div>
                      </div>
                    )}

                    {service.email && (
                      <div className="flex items-start gap-3">
                        <div className={CONTACT_ICON_CLASS}>
                          <Mail className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t("email")}</p>
                          <a
                            href={`mailto:${service.email}`}
                            className="text-primary-600 dark:text-primary-300 font-medium break-all hover:underline"
                          >
                            {service.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {address && (
                      <div className="flex items-start gap-3">
                        <div className={CONTACT_ICON_CLASS}>
                          <Navigation className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t("location")}</p>
                          <p className="text-neutral-900 dark:text-neutral-200">{address}</p>
                          <Button variant="link" className="mt-1 h-auto p-0 text-xs" asChild>
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t("getDirections")}
                            </a>
                          </Button>
                          <ExternalMapPanel
                            className="mt-3"
                            mapTitle={t("mapTitle", { name })}
                            embedUrl={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            loadMapLabel={t("loadMapPreview")}
                            privacyDescription={t("mapPrivacyDescription")}
                            externalNotice={t("mapExternalNotice")}
                          />
                        </div>
                      </div>
                    )}

                    {(service.hours || service.hours_text) && (
                      <div className="flex items-start gap-3">
                        <div className={CONTACT_ICON_CLASS}>
                          <Clock className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            {t("hours")}
                          </p>
                          <div className="text-sm">
                            {service.hours_text && (
                              <div className="mb-3 font-medium whitespace-pre-line text-neutral-900 dark:text-neutral-200">
                                {service.hours_text}
                              </div>
                            )}
                            {service.hours &&
                              ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                                (day) => {
                                  const dayHours = (service.hours as any)[day]
                                  if (!dayHours) return null
                                  return (
                                    <div
                                      key={day}
                                      className="flex justify-between border-b border-neutral-100 py-0.5 last:border-0 dark:border-white/10"
                                    >
                                      <span className="w-24 text-neutral-500 capitalize dark:text-neutral-400">
                                        {day}
                                      </span>
                                      <span className="font-medium text-neutral-900 dark:text-neutral-200">
                                        {dayHours.open} - {dayHours.close}
                                      </span>
                                    </div>
                                  )
                                }
                              )}
                            {service.hours?.notes && (
                              <p className="mt-2 rounded-lg bg-neutral-50/80 p-2 text-xs text-neutral-500 italic dark:bg-white/[0.04] dark:text-neutral-400">
                                {t("note")} {service.hours.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <PartnerActionsPanel serviceId={service.id} serviceName={name} showClaimAction={!isVerified} />
                </div>
              </Card>

              <TrustPanel service={service} locale={locale} />
            </div>
          </div>
        </Section>

        <Section animate={false} className="pt-0 pb-16">
          <FeedbackWidget serviceId={service.id} serviceName={name} />
        </Section>
      </main>
      <Footer />
    </div>
  )
}
