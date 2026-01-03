"use client"

import { useTranslations } from "next-intl"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"

export default function TermsPage() {
  const t = useTranslations("Terms")
  
  const sections = [
    "acceptance",
    "serviceDescription",
    "disclaimer",
    "liability",
    "emergency",
    "advice",
    "responsibilities",
    "indemnification",
    "thirdParty",
    "ai",
    "modifications",
    "governing",
    "severability",
    "contact",
  ]

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans dark:bg-neutral-950">
      <Header />
      
      <main className="flex-1">
        <Section className="py-20">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm sm:p-12 dark:bg-neutral-900">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
              {t("title")}
            </h1>
            <p className="mb-12 text-neutral-500 dark:text-neutral-400">
              {t("lastUpdated", { date: new Date().toLocaleDateString() })}
            </p>

            <div className="space-y-12">
              {sections.map((sectionId) => (
                <section key={sectionId} id={sectionId} className="scroll-mt-24">
                  <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">
                    {t(`sections.${sectionId}.title`)}
                  </h2>
                  <div className="prose prose-neutral max-w-none text-neutral-600 dark:prose-invert dark:text-neutral-300">
                    <p className="whitespace-pre-line leading-relaxed">
                      {t(`sections.${sectionId}.content`)}
                    </p>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
