import SubmitServiceForm from "@/components/forms/SubmitServiceForm"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { getTranslations } from "next-intl/server"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"
import { ClipboardCheck, LockKeyhole, SearchCheck } from "lucide-react"

const NEXT_STEPS = [
  {
    key: "review",
    Icon: ClipboardCheck,
    className: "bg-accent-50 text-accent-700 ring-accent-200/70 dark:bg-accent-500/10 dark:text-accent-200",
  },
  {
    key: "publish",
    Icon: SearchCheck,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  {
    key: "privacy",
    Icon: LockKeyhole,
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-200",
  },
] as const

export default async function SubmitServicePage() {
  const t = await getTranslations("SubmitService")

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_14%_6%,rgba(34,211,238,0.22),transparent_24rem),radial-gradient(circle_at_82%_7%,rgba(99,102,241,0.16),transparent_26rem),radial-gradient(circle_at_50%_84%,rgba(34,211,238,0.06),transparent_30rem),linear-gradient(180deg,rgba(239,253,255,0.98)_0%,rgba(248,250,252,0.96)_18%,rgba(255,255,255,0.98)_34%,rgba(255,255,255,0.98)_72%,rgba(248,250,252,0.96)_88%,rgba(241,245,249,0.98)_100%)] font-sans dark:bg-[radial-gradient(circle_at_14%_6%,rgba(8,145,178,0.18),transparent_24rem),radial-gradient(circle_at_82%_7%,rgba(79,70,229,0.16),transparent_26rem),radial-gradient(circle_at_50%_84%,rgba(8,145,178,0.08),transparent_30rem),linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.96)_28%,rgba(15,23,42,0.94)_72%,rgba(2,6,23,0.98)_100%)]">
      <div className="bg-noise" />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Section animate={false} className="relative pt-40 pb-12 md:pt-44 md:pb-16">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div>
              <p className="text-accent-700 dark:text-accent-300 text-xs font-semibold tracking-[0.16em] uppercase">
                {t("heroEyebrow")}
              </p>
              <h1 className="heading-display mt-3 max-w-3xl text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl dark:text-white">
                {t("title")}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
                {t("description")}
              </p>

              <Card
                padding="none"
                className="mt-7 border-neutral-200/75 bg-white/82 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10"
              >
                <div className="p-5 md:p-6">
                  <h2 className="text-base font-semibold text-neutral-950 dark:text-white">{t("nextTitle")}</h2>
                  <div className="mt-5 space-y-4">
                    {NEXT_STEPS.map(({ key, Icon, className }) => (
                      <div key={key} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${className}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                          {t(`nextItems.${key}`)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <SubmitServiceForm />
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  )
}
