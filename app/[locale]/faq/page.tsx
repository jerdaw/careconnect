import { promises as fs } from "fs"
import path from "path"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import ReactMarkdown from "react-markdown"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { logger } from "@/lib/logger"
import { HelpCircle } from "lucide-react"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "FAQ" })

  return {
    title: t("title") || "FAQ - Kingston Care Connect",
    description:
      t("description") || "Frequently asked questions about Kingston Care Connect, data verification, and privacy.",
  }
}

export default async function FAQPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "FAQ" })

  // Read the appropriate markdown file based on locale
  const filename = locale === "fr" ? "faq.fr.md" : "faq.md"
  const filePath = path.join(process.cwd(), "docs", filename)

  let content = ""
  try {
    content = await fs.readFile(filePath, "utf8")
  } catch (error) {
    logger.error(`Error reading ${filename}`, error, {
      component: "faq-page",
      action: "readMarkdown",
    })
    content = "# FAQ\n\nContent not available."
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-neutral-950">
      <Header />
      <main id="main-content" className="flex-1">
        <Section className="py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-blue-100 p-3 dark:bg-blue-900/30">
              <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="heading-display mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
              {t("title")}
            </h1>
          </div>
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm sm:p-12 dark:bg-neutral-900">
            <article className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  )
}
