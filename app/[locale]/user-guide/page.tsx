import { promises as fs } from "fs"
import path from "path"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import ReactMarkdown from "react-markdown"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "UserGuide" })

  return {
    title: t("title") || "User Guide - Kingston Care Connect",
    description: t("description") || "Learn how to use Kingston Care Connect to find local services and support.",
  }
}

export default async function UserGuidePage({ params }: Props) {
  const { locale } = await params

  // Read the appropriate markdown file based on locale
  const filename = locale === "fr" ? "user-guide.fr.md" : "user-guide.md"
  const filePath = path.join(process.cwd(), "docs", filename)

  let content = ""
  try {
    content = await fs.readFile(filePath, "utf8")
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    content = "# User Guide\n\nContent not available."
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
