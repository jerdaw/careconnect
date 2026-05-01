"use client"

import { ArrowRight, MapPinned, Search, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AboutTrustOverview from "@/components/about/AboutTrustOverview"
import { Link } from "@/i18n/routing"

export default function AboutPage() {
  const t = useTranslations("About")
  const accentCtaClassName =
    "about-gradient-border-button text-white hover:text-white dark:text-white dark:hover:text-white"

  const contextCards = [
    {
      key: "governance",
      title: t("governance.title"),
      description: t("governance.description"),
      Icon: ShieldCheck,
    },
    {
      key: "land",
      title: t("landAcknowledgment.title"),
      description: t("landAcknowledgment.text"),
      Icon: MapPinned,
    },
  ] as const

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_14%_6%,rgba(34,211,238,0.22),transparent_24rem),radial-gradient(circle_at_82%_7%,rgba(99,102,241,0.16),transparent_26rem),radial-gradient(circle_at_50%_84%,rgba(34,211,238,0.06),transparent_30rem),linear-gradient(180deg,rgba(239,253,255,0.98)_0%,rgba(248,250,252,0.96)_18%,rgba(255,255,255,0.98)_34%,rgba(255,255,255,0.98)_72%,rgba(248,250,252,0.96)_88%,rgba(241,245,249,0.98)_100%)] font-sans dark:bg-[radial-gradient(circle_at_14%_6%,rgba(8,145,178,0.18),transparent_24rem),radial-gradient(circle_at_82%_7%,rgba(79,70,229,0.16),transparent_26rem),radial-gradient(circle_at_50%_84%,rgba(8,145,178,0.08),transparent_30rem),linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.96)_28%,rgba(15,23,42,0.94)_72%,rgba(2,6,23,0.98)_100%)]">
      <div className="bg-noise" />
      <Header />

      <main id="main-content" className="flex-1">
        <Section animate={false} className="relative pt-40 pb-10 md:pt-44 md:pb-12">
          <div className="mx-auto max-w-5xl">
            <p className="text-accent-700 dark:text-accent-300 text-xs font-semibold tracking-[0.16em] uppercase">
              {t("hero.eyebrow")}
            </p>
            <h1 className="heading-display mt-3 max-w-3xl text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl dark:text-white">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
              {t("hero.subtitle")}
            </p>

            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row">
              <Button asChild variant="outline" size="lg" className={`${accentCtaClassName} min-w-[190px]`}>
                <Link href="/">
                  {t("hero.primaryCta")}
                  <Search className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[190px]">
                <Link href="/about/partners">
                  {t("hero.secondaryCta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </Section>

        <AboutTrustOverview />

        <Section animate={false} className="relative py-12 md:py-14">
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-2">
            {contextCards.map(({ key, title, description, Icon }) => (
              <Card
                key={key}
                padding="none"
                className="h-full border-neutral-200/75 bg-white/86 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10"
              >
                <div className="flex h-full flex-col gap-4 p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-200 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">{title}</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section animate={false} className="relative pt-10 pb-12 md:pt-12 md:pb-16">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-neutral-200/75 bg-white/88 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md md:flex md:items-center md:justify-between md:gap-8 md:p-6 dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950 dark:text-white">{t("cta.title")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {t("cta.description")}
              </p>
            </div>
            <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row md:mt-0">
              <Button asChild variant="outline" className={`${accentCtaClassName} min-w-[170px]`}>
                <Link href="/">{t("cta.search")}</Link>
              </Button>
              <Button asChild variant="outline" className="min-w-[170px]">
                <Link href="/about/partners">{t("cta.partners")}</Link>
              </Button>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
