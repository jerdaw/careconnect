"use client"

import { useTranslations } from "next-intl"
import { ShieldCheck, Users, Globe, Smartphone, Heart, Search, Filter, Phone } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  const t = useTranslations("About")

  const metrics = [
    {
      icon: ShieldCheck,
      title: t("metrics.verified.title"),
      description: t("metrics.verified.description"),
      color: "blue",
    },
    {
      icon: Smartphone,
      title: t("metrics.offline.title"),
      description: t("metrics.offline.description"),
      color: "purple",
    },
    {
      icon: Globe,
      title: t("metrics.multilingual.title"),
      description: t("metrics.multilingual.description"),
      color: "emerald",
    },
    {
      icon: Heart,
      title: t("metrics.community.title"),
      description: t("metrics.community.description"),
      color: "rose",
    },
  ]

  const steps = [
    {
      icon: Search,
      title: t("howItWorks.step1.title"),
      description: t("howItWorks.step1.description"),
    },
    {
      icon: Filter,
      title: t("howItWorks.step2.title"),
      description: t("howItWorks.step2.description"),
    },
    {
      icon: Phone,
      title: t("howItWorks.step3.title"),
      description: t("howItWorks.step3.description"),
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans dark:bg-neutral-950">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <Section className="pt-32 pb-16 text-center">
          <div className="mb-8 inline-flex items-center justify-center rounded-2xl bg-blue-100 p-3 dark:bg-blue-900/30">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="heading-display mb-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl dark:text-white">
            {t("hero.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-neutral-600 dark:text-neutral-400">
            {t("hero.subtitle")}
          </p>
        </Section>

        {/* Metrics Grid */}
        <Section className="py-12" variant="alternate">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, idx) => (
              <Card
                key={idx}
                className="h-full border-neutral-200/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-neutral-800"
              >
                <div
                  className={`mb-4 inline-flex rounded-xl p-3 bg-${metric.color}-50 text-${metric.color}-600 dark:bg-${metric.color}-900/20 dark:text-${metric.color}-400`}
                >
                  <metric.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">{metric.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {metric.description}
                </p>
              </Card>
            ))}
          </div>
        </Section>

        {/* How It Works */}
        <Section className="py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-neutral-900 dark:text-white">{t("howItWorks.title")}</h2>
            <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
              {t("howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-neutral-900 dark:text-white">{step.title}</h3>
                <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">{step.description}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Values / Governance */}
        <Section className="py-24" variant="alternate">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white">{t("governance.title")}</h2>
            <div className="prose prose-lg mx-auto mb-12 text-neutral-600 dark:text-neutral-400">
              <p>{t("governanceText")}</p>
            </div>
            
             {/* Land Acknowledgment */}
            <div className="mt-16 border-t border-neutral-200 pt-16 dark:border-neutral-800">
               <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">{t("landAcknowledgment.title")}</h2>
               <p className="mx-auto max-w-3xl text-neutral-600 dark:text-neutral-400">
                 {t("landAcknowledgment.text")}
               </p>
            </div>
          </div>
        </Section>

        {/* CTA */}
        <Section className="py-24 text-center">
          <h2 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white">{t("cta.title")}</h2>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/">
              <Button size="lg" className="min-w-[200px]">
                {t("cta.search")}
              </Button>
            </Link>
            <Link href="/about/partners">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                {t("cta.partners")}
              </Button>
            </Link>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
