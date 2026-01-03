"use client"

import { useTranslations } from "next-intl"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldCheck, CheckCircle, ExternalLink } from "lucide-react"

export default function PartnersPage() {
  const t = useTranslations("PartnersPage")

  // Placeholder data for partners - in a real app these would be logos
  const partners = [
    {
      name: "211 Ontario",
      url: "https://211ontario.ca",
      description: "Primary data source for provincial social services.",
      logo: "/partners/211-ontario.svg",
    },
    {
      name: "City of Kingston",
      url: "https://www.cityofkingston.ca",
      description: "Municipal housing and social support programs.",
      logo: "/partners/city-of-kingston.svg",
    },
    {
      name: "United Way KFL&A",
      url: "https://www.unitedwaykfla.ca",
      description: "Community funding and verified impact data.",
      logo: "/partners/united-way-kfla.svg",
    },
    {
      name: "Kingston Community Health Centres",
      url: "https://kchc.ca",
      description: "Health and wellness resource verification.",
      logo: "/partners/kchc.svg",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans dark:bg-neutral-950">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <Section className="pt-32 pb-16 text-center">
          <div className="mb-8 inline-flex items-center justify-center rounded-2xl bg-indigo-100 p-3 dark:bg-indigo-900/30">
            <ShieldCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="heading-display mb-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-white">
            {t("hero.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-neutral-600 dark:text-neutral-400">
            {t("hero.subtitle")}
          </p>
        </Section>

        {/* Partners Grid */}
        <Section className="py-12">
          <div className="grid gap-6 md:grid-cols-2">
            {partners.map((partner, idx) => (
              <a
                key={idx}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${partner.color}-100 text-${partner.color}-600 font-bold dark:bg-${partner.color}-900/30 dark:text-${partner.color}-400`}
                    >
                      {partner.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                        {partner.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Verified Source</p>
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300" />
                </div>
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">{partner.description}</p>
              </a>
            ))}
          </div>
        </Section>

        {/* Verification Process */}
        <Section className="py-24" variant="alternate">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white">{t("verification.title")}</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <CheckCircle className="mx-auto mb-4 h-8 w-8 text-green-500" />
                <h3 className="font-bold text-neutral-900 dark:text-white">{t("verification.step1")}</h3>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <CheckCircle className="mx-auto mb-4 h-8 w-8 text-green-500" />
                <h3 className="font-bold text-neutral-900 dark:text-white">{t("verification.step2")}</h3>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <CheckCircle className="mx-auto mb-4 h-8 w-8 text-green-500" />
                <h3 className="font-bold text-neutral-900 dark:text-white">{t("verification.step3")}</h3>
              </div>
            </div>
            <p className="mt-8 text-neutral-600 dark:text-neutral-400">{t("verification.description")}</p>
          </div>
        </Section>

        {/* CTA */}
        <Section className="py-24 text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-900 dark:text-white">{t("cta.title")}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            {t("cta.subtitle")}
          </p>
          <Link href="/submit-service">
            <Button size="lg">{t("cta.button")}</Button>
          </Link>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
