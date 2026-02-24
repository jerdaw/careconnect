"use client"

import { useTranslations } from "next-intl"
import { Section } from "@/components/ui/section"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer } from "@/lib/motion"

export default function HomeStats() {
  const t = useTranslations("Home.stats")

  const stats = [
    { value: t("servicesValue"), label: t("services") },
    { value: t("categoriesValue"), label: t("categories") },
    { value: t("languagesValue"), label: t("languages") },
  ]

  return (
    <Section variant="alternate" className="py-10 md:py-12">
      <motion.div
        className="grid grid-cols-3 gap-4 divide-x-0 divide-neutral-200 md:gap-0 md:divide-x dark:divide-neutral-700"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {stats.map(({ value, label }) => (
          <motion.div key={label} variants={fadeInUp} className="flex flex-col items-center text-center">
            <span className="font-display text-primary-600 dark:text-primary-400 text-2xl font-bold md:text-4xl">
              {value}
            </span>
            <span className="mt-1 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">{label}</span>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}
