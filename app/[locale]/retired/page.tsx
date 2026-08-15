import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PublicServiceRetired, type PublicServiceRetiredContent } from "@/components/retirement/PublicServiceRetired"
import { BRAND_NAME } from "@/lib/brand"
import { RetirementClientCleanup } from "@/components/retirement/RetirementClientCleanup"

interface RetiredPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: RetiredPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Retirement" })

  return {
    title: `${t("metadataTitle")} | ${BRAND_NAME}`,
    description: t("metadataDescription"),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  }
}

export default async function RetiredPage({ params }: RetiredPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Retirement" })
  const keys = [
    "boundary",
    "call211",
    "call911",
    "call988",
    "clearConfirmation",
    "clearLocalData",
    "description",
    "emergencyDescription",
    "emergencyTitle",
    "eyebrow",
    "exportLocalData",
    "localDataCleared",
    "localDataDescription",
    "localDataError",
    "localDataExported",
    "localDataTitle",
    "navigationDescription",
    "navigationTitle",
    "safetyDescription",
    "safetyTitle",
    "skipToContent",
    "suicideDescription",
    "suicideTitle",
    "text988",
    "title",
    "visit211",
  ] as const satisfies readonly (keyof PublicServiceRetiredContent)[]

  const content = Object.fromEntries(keys.map((key) => [key, t(key)])) as unknown as PublicServiceRetiredContent

  return (
    <>
      <PublicServiceRetired content={content} />
      <RetirementClientCleanup />
    </>
  )
}
