"use client"

import { useState, useEffect } from "react"
import { Service } from "@/types/service"
import { Scroll, Phone, MapPin, Clock, ArrowRight } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface PlainLanguageSummary {
  summary_en: string
  how_to_use_en: string
  summary_fr?: string
  how_to_use_fr?: string
  reviewed_at: string
}

interface SimplifiedServiceViewProps {
  service: Service
  locale: string
  translations: {
    standardView: string
    whatIsIt: string
    howToGetHelp: string
    callUs: string
    visitUs: string
    openHours: string
    summaryComingSoon: string
  }
}

function resolveLocalizedField<T>(
  locale: string,
  frenchValue: T | undefined,
  englishValue: T | undefined,
  fallback: T | undefined
): T | undefined {
  if (locale === "fr") {
    return frenchValue ?? englishValue ?? fallback
  }
  return englishValue ?? fallback
}

export function SimplifiedServiceView({ service, locale, translations }: SimplifiedServiceViewProps) {
  const [summary, setSummary] = useState<PlainLanguageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/v1/services/${service.id}/summary`)
        const json = (await res.json()) as { success: boolean; data: PlainLanguageSummary }

        if (json.success && json.data) {
          setSummary(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch summary", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [service.id])

  const handleToggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("view")
    router.push(`${pathname}?${params.toString()}`)
  }

  const fallbackDescription = summary ? null : service.description
  const description = resolveLocalizedField(locale, summary?.summary_fr, summary?.summary_en, fallbackDescription)

  const fallbackHowToUse = summary ? null : service.application_process
  const howToUse = resolveLocalizedField(locale, summary?.how_to_use_fr, summary?.how_to_use_en, fallbackHowToUse)

  const isMissing = !loading && !summary

  return (
    <div className="min-h-screen bg-[#FFFFF0] p-6 font-sans text-black md:p-12">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{service.name}</h1>
          <button
            onClick={handleToggle}
            className="flex shrink-0 items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 font-bold transition-colors hover:bg-neutral-100"
          >
            {translations.standardView}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="space-y-4">
              <div className="h-10 w-48 rounded bg-neutral-200"></div>
              <div className="h-32 rounded bg-neutral-200"></div>
            </div>
            <div className="space-y-4">
              <div className="h-10 w-48 rounded bg-neutral-200"></div>
              <div className="h-32 rounded bg-neutral-200"></div>
            </div>
          </div>
        ) : isMissing ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white/50 py-20 text-center">
            <p className="text-2xl font-medium text-neutral-600 italic">{translations.summaryComingSoon}</p>
            <button onClick={handleToggle} className="mt-6 text-xl font-bold text-blue-700 underline">
              {translations.standardView}
            </button>
          </div>
        ) : (
          <>
            {/* What is it? */}
            <section className="space-y-4">
              <div className="flex inline-block items-center gap-3 border-b-4 border-blue-600 pb-2 text-2xl font-bold">
                <Scroll className="h-8 w-8 text-blue-600" />
                <h2>{translations.whatIsIt}</h2>
              </div>
              <p className="text-xl leading-relaxed font-bold md:text-3xl">{description}</p>
            </section>

            {/* How do I get help? */}
            <section className="space-y-4">
              <div className="flex inline-block items-center gap-3 border-b-4 border-green-600 pb-2 text-2xl font-bold">
                <ArrowRight className="h-8 w-8 text-green-600" />
                <h2>{translations.howToGetHelp}</h2>
              </div>
              <div className="rounded-2xl border-4 border-green-200 bg-white p-8 text-xl leading-relaxed font-bold whitespace-pre-wrap shadow-sm md:text-2xl">
                {howToUse}
              </div>
            </section>

            {/* Contact Info (Simplified) */}
            <section className="grid gap-8 pt-8 md:grid-cols-2">
              {service.phone && (
                <div className="space-y-4 rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="flex items-center gap-2 text-xl font-bold">
                    <Phone className="h-6 w-6" />
                    {translations.callUs}
                  </h3>
                  <a href={`tel:${service.phone}`} className="block text-3xl font-black text-blue-700 underline">
                    {service.phone}
                  </a>
                </div>
              )}

              {service.address && (
                <div className="space-y-4 rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="flex items-center gap-2 text-xl font-bold">
                    <MapPin className="h-6 w-6" />
                    {translations.visitUs}
                  </h3>
                  <p className="text-2xl font-bold">{service.address}</p>
                </div>
              )}

              {service.hours_text && (
                <div className="space-y-4 rounded-2xl border-2 border-black bg-white p-6 md:col-span-2">
                  <h3 className="flex items-center gap-2 text-xl font-bold">
                    <Clock className="h-6 w-6" />
                    {translations.openHours}
                  </h3>
                  <p className="text-xl font-medium whitespace-pre-line">{service.hours_text}</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
