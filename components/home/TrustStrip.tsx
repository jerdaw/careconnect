"use client"

import { ShieldCheck, WifiOff, Globe } from "lucide-react"
import { useTranslations } from "next-intl"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function TrustStrip() {
  const t = useTranslations("Home.trustStrip")

  const features = [
    {
      icon: ShieldCheck,
      title: t("privacy.title"),
      description: t("privacy.description"),
      iconBg: "bg-emerald-100/80 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: WifiOff,
      title: t("offline.title"),
      description: t("offline.description"),
      iconBg: "bg-blue-100/80 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Globe,
      title: t("bilingual.title"),
      description: t("bilingual.description"),
      iconBg: "bg-indigo-100/80 dark:bg-indigo-900/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
  ]

  return (
    <Section className="py-16 md:py-20">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description, iconBg, iconColor }) => (
          <Card key={title} variant="glass" padding="default">
            <div className="flex items-start gap-4">
              <div className={cn("shrink-0 rounded-full p-2.5", iconBg)}>
                <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}
