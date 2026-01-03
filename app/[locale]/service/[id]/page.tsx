import { notFound } from "next/navigation"
import { getServiceById } from "@/lib/services"
import { generateFeedbackLink } from "@/lib/feedback"
import { Metadata } from "next"
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Flag,
  Share2,
  Navigation,
  Printer,
  Mail,
  AlertTriangle,
  FileText,
  Wallet,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { VerificationLevel, IntentCategory } from "@/types/service"
import { EmergencyDisclaimer } from "@/components/ui/EmergencyDisclaimer"
import { ClaimFlow } from "@/components/partner/ClaimFlow"

interface Props {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  const service = await getServiceById(id)
  if (!service) return { title: "Service Not Found" }

  const name = locale === "fr" && service.name_fr ? service.name_fr : service.name
  const description = locale === "fr" && service.description_fr ? service.description_fr : service.description

  return {
    title: `${name} | Kingston Care Connect`,
    description: description,
  }
}

export default async function ServicePage({ params }: Props) {
  const { id, locale } = await params
  const service = await getServiceById(id)
  const t = await getTranslations("ServiceDetail")

  if (!service) {
    notFound()
  }

  const name = locale === "fr" && service.name_fr ? service.name_fr : service.name
  const description = (locale === "fr" && service.description_fr ? service.description_fr : service.description).split(
    "\n"
  )
  const address = locale === "fr" && service.address_fr ? service.address_fr : service.address

  const isVerified =
    service.verification_level === VerificationLevel.L2 || service.verification_level === VerificationLevel.L3

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 dark:bg-neutral-950">
      <Header />

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-neutral-200 bg-white pt-32 pb-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="from-primary-50/50 dark:from-primary-950/20 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {(service.intent_category === IntentCategory.Crisis) && (
            <div className="mb-8">
              <EmergencyDisclaimer variant="banner" />
            </div>
          )}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="py-1 text-sm">
                  {service.intent_category}
                </Badge>
                {isVerified && (
                  <Badge variant="primary" className="gap-1.5 py-1 text-sm">
                    <ShieldCheck className="h-4 w-4" /> Verified Service
                  </Badge>
                )}
              </div>

              {(service.status === "Permanently Closed" || service.status === "Merged") && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <h3 className="font-semibold px-2">
                        {service.status === "Merged" ? "Service Merged" : "Permanently Closed"}
                      </h3>
                      <p className="mt-1 text-sm px-2">
                        {service.status === "Merged" 
                          ? "This service has been merged with another organization. Please check the description for the new contact details." 
                          : "This service is no longer operational. Please do not visit this location."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h1 className="heading-display text-3xl leading-tight font-bold text-neutral-900 md:text-5xl dark:text-white">
                {name}
              </h1>

              {address && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <MapPin className="h-5 w-5 shrink-0" />
                    <span className="text-lg">{address}</span>
                  </div>
                  
                  {/* Map Integration */}
                  <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <iframe
                      title={`Map location for ${name}`}
                      width="100%"
                      height="200"
                      style={{ border: 0, filter: "grayscale(100%) invert(0.92) opacity(0.8)" }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                      className="dark:invert"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" className="gap-2">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Section className="py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* About */}
            <Card className="p-8">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">About this Service</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed text-neutral-600 dark:text-neutral-300">
                {description.map((paragraph, idx) => (
                  <p key={idx} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Card>

            {/* Fees & Documents Grid */}
            {(service.fees || service.documents_required) && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {service.fees && (
                  <Card className="p-8">
                    <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
                      <Wallet className="text-primary-600 h-6 w-6" />
                      Fees
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-300">{service.fees}</p>
                  </Card>
                )}
                {service.documents_required && (
                  <Card className="p-8">
                    <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
                      <FileText className="text-primary-600 h-6 w-6" />
                      Documents
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-300">{service.documents_required}</p>
                  </Card>
                )}
              </div>
            )}

            {/* Eligibility & Requirements */}
            {(service.eligibility || service.eligibility_notes) && (
              <Card className="p-8">
                <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                  <CheckCircle2 className="text-primary-600 h-6 w-6" />
                  Eligibility
                </h2>
                <div className="bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800/50 rounded-xl border p-6">
                  <p className="text-neutral-700 dark:text-neutral-300">
                    {service.eligibility_notes || service.eligibility}
                  </p>
                </div>
              </Card>
            )}

            {/* Application Process */}
            {service.application_process && (
              <Card className="p-8">
                <h2 className="mb-4 text-2xl font-bold">Application Process</h2>
                <p className="text-neutral-600 dark:text-neutral-300">{service.application_process}</p>
              </Card>
            )}

            {/* Accessibility */}
            {service.accessibility && Object.keys(service.accessibility).length > 0 && (
              <Card className="p-8">
                <h2 className="mb-4 text-2xl font-bold">Accessibility</h2>
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
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-24 p-6">
              <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
              <div className="space-y-4">
                {service.phone && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Phone</p>
                      <a href={`tel:${service.phone}`} className="text-primary-600 font-medium hover:underline">
                        {service.phone}
                      </a>
                    </div>
                  </div>
                )}

                {service.url && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Website</p>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 font-medium break-all hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}

                {service.email && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Email</p>
                      <a
                        href={`mailto:${service.email}`}
                        className="text-primary-600 font-medium break-all hover:underline"
                      >
                        {service.email}
                      </a>
                    </div>
                  </div>
                )}

                {address && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800">
                      <Navigation className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-500">Address</p>
                      <p className="text-neutral-900 dark:text-neutral-200">{address}</p>
                      <Button variant="link" className="mt-1 h-auto p-0 text-xs" asChild>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get Directions
                        </a>
                      </Button>
                      <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <iframe
                          title={`Map location for ${name}`}
                          width="100%"
                          height="180"
                          frameBorder="0"
                          scrolling="no"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                          className="grayscale-[50%] transition-all hover:grayscale-0 dark:invert dark:hue-rotate-180"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(service.hours || service.hours_text) && (
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="mb-2 text-sm font-medium text-neutral-500">Hours</p>
                      <div className="text-sm">
                        {service.hours_text && (
                          <div className="mb-3 whitespace-pre-line text-neutral-900 font-medium dark:text-neutral-200">
                            {service.hours_text}
                          </div>
                        )}
                        {service.hours && ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const dayHours = (service.hours as any)[day]
                          if (!dayHours) return null
                          return (
                            <div
                              key={day}
                              className="flex justify-between border-b border-neutral-100 py-0.5 last:border-0 dark:border-neutral-800"
                            >
                              <span className="w-24 text-neutral-500 capitalize dark:text-neutral-400">{day}</span>
                              <span className="font-medium text-neutral-900 dark:text-neutral-200">
                                {dayHours.open} - {dayHours.close}
                              </span>
                            </div>
                          )
                        })}
                        {service.hours?.notes && (
                          <p className="mt-2 rounded bg-neutral-50 p-2 text-xs text-neutral-400 italic dark:bg-neutral-800/50">
                            Note: {service.hours.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Last Verified:</span>
                  <span>{formatDate(service.last_verified) || "Unknown"}</span>
                </div>
                <div className="mt-4">
                  <a
                    href={generateFeedbackLink(service)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent py-2 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-700"
                  >
                    <Flag className="h-3 w-3" />
                    {t("reportIssue")}
                  </a>
                </div>

                {!isVerified && (
                  <div className="mt-4 border-t border-neutral-100 pt-4 text-center dark:border-neutral-800">
                    <p className="mb-2 text-xs text-neutral-500">{t("claimText")}</p>
                    <ClaimFlow serviceId={service.id} serviceName={name} />
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  )
}
