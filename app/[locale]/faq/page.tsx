import { promises as fs } from "fs"
import path from "path"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import ReactMarkdown from "react-markdown"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { logger } from "@/lib/logger"

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
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <article className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </main>
      <Footer />
    </>
  )
}
