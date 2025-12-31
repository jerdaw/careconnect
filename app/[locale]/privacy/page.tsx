"use client"

import { useTranslations } from "next-intl"
import { ShieldCheck, Cookie, Ghost, Lock, EyeOff, Database } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"

export default function PrivacyPage() {
  const t = useTranslations("Privacy")

  const features = [
    {
      icon: Ghost,
      title: "Zero Tracking",
      description: t("points.noTracking"),
      color: "blue",
    },
    {
      icon: Cookie,
      title: "No Ads, No Data Mining",
      description: t("points.noCookies"),
      color: "emerald",
    },
    {
      icon: ShieldCheck,
      title: "Private Search",
      description: t("points.noLogging"),
      color: "purple",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans dark:bg-neutral-950">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <Section className="pt-32 pb-12 text-center">
          <div className="mb-8 inline-flex items-center justify-center rounded-2xl bg-neutral-100 p-3 dark:bg-neutral-800">
            <Lock className="h-8 w-8 text-neutral-600 dark:text-neutral-400" />
          </div>
          <h1 className="heading-display mb-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-white">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-neutral-600 dark:text-neutral-400">
            {t("intro")}
          </p>
        </Section>

        {/* Features Grid */}
        <Section className="py-12" variant="alternate">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="h-full border-neutral-200/60 p-8 transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800"
              >
                <div
                  className={`mb-6 inline-flex rounded-xl p-3 bg-${feature.color}-50 text-${feature.color}-600 dark:bg-${feature.color}-900/20 dark:text-${feature.color}-400`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-neutral-900 dark:text-white">{feature.title}</h3>
                <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* Detailed Content */}
        <Section className="py-24">
          <div className="prose prose-neutral dark:prose-invert prose-lg mx-auto max-w-3xl">
            <h2>Our Commitment to Privacy</h2>
            <p>
              Kingston Care Connect is built with a &quot;privacy-first&quot; architecture. We believe that searching
              for social services is a sensitive activity, and your data should remain yours.
            </p>

            <div className="not-prose my-12 grid gap-6 sm:grid-cols-2">
              <div className="flex gap-4">
                <EyeOff className="h-6 w-6 shrink-0 text-neutral-400" />
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">No IP Logging</h4>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    We don&apos;t store IP addresses associated with search queries.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Database className="h-6 w-6 shrink-0 text-neutral-400" />
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">Local Storage</h4>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Saved searches live only on your device, not our servers.
                  </p>
                </div>
              </div>
            </div>

            <h3>Contact Us</h3>
            <p>
              If you have questions about our privacy practices, please contact us at: <br />
              <a
                href="mailto:privacy@kingstoncareconnect.com"
                className="text-primary-600 no-underline hover:underline"
              >
                privacy@kingstoncareconnect.com
              </a>
            </p>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
