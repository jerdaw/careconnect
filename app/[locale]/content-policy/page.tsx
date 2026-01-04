"use client"

import { useTranslations } from "next-intl"
import PageSection from "@/components/PageSection"

export default function ContentPolicyPage() {
  const t = useTranslations("ContentPolicy")

  const rich = {
    p: (chunks) => <p className="mb-4">{chunks}</p>,
    ul: (chunks) => <ul className="list-disc pl-6 space-y-2 mb-4">{chunks}</ul>,
    li: (chunks) => <li>{chunks}</li>,
    strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
  }

  const policySections = [
    {
      id: "prohibited",
      title: t("sections.prohibited.title"),
      content: t.rich("sections.prohibited.content", rich),
    },
    {
      id: "submissions",
      title: t("sections.submissions.title"),
      content: t.rich("sections.submissions.content", rich),
    },
    {
      id: "reporting",
      title: t("sections.reporting.title"),
      content: t.rich("sections.reporting.content", rich),
    },
    {
      id: "appeals",
      title: t("sections.appeals.title"),
      content: t.rich("sections.appeals.content", rich),
    },
  ]

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          {t("title")}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          {t("description")}
        </p>
      </div>

      <div className="space-y-12">
        {policySections.map((section) => (
          <PageSection 
            key={section.id} 
            title={section.title} 
            id={section.id}
          >
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {section.content}
            </div>
          </PageSection>
        ))}
      </div>

      <div className="mt-16 rounded-2xl bg-neutral-50 p-8 text-center dark:bg-neutral-900">
        <p className="text-sm text-neutral-500">
          {t("lastUpdated")}: January 2026
        </p>
      </div>
    </main>
  )
}
