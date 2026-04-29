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
    <Section
      container={false}
      className="relative border-y border-neutral-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.72))] py-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(255,255,255,0.55)] backdrop-blur-md dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(15,23,42,0.42))] dark:shadow-none"
    >
      <div
        aria-hidden="true"
        className="from-primary-500/0 via-primary-500/35 to-accent-500/0 absolute inset-x-0 top-0 h-px bg-gradient-to-r"
      />
      <motion.dl
        className="relative z-10 mx-auto grid max-w-5xl grid-cols-3 px-4 sm:px-6 lg:px-8"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {stats.map(({ value, label }, index) => (
          <motion.div
            key={label}
            variants={fadeInUp}
            className="relative flex min-w-0 flex-col items-center px-2 py-6 text-center md:px-8 md:py-8"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-5 bottom-5 left-0 w-px bg-gradient-to-b from-transparent via-neutral-300/80 to-transparent md:top-6 md:bottom-6 dark:via-white/15"
              />
            )}
            <dt className="order-2 mt-2 max-w-28 text-xs leading-snug font-semibold text-neutral-600 sm:text-sm md:max-w-none dark:text-neutral-300">
              {label}
            </dt>
            <dd className="font-display from-primary-600 to-accent-600 dark:from-primary-300 dark:to-accent-300 order-1 bg-gradient-to-br bg-clip-text text-3xl leading-none font-bold tracking-normal text-transparent tabular-nums md:text-4xl">
              {value}
            </dd>
          </motion.div>
        ))}
      </motion.dl>
    </Section>
  )
}
