"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useTranslations } from "next-intl"
import { getHeroPlaces } from "@/lib/places/registry"

export default function RotatingRegionHero() {
  const t = useTranslations("Home.hero")
  const reduceMotion = useReducedMotion()
  const places = getHeroPlaces()
  const staticPlace = places[0]?.heroLabel ?? "Kingston"

  return (
    <h1 className="heading-1 heading-display relative text-neutral-900 dark:text-white">
      <span className="sr-only">{t("accessibleTitle")}</span>
      <span aria-hidden="true" className="relative z-10 inline-grid min-w-[11ch] justify-items-center">
        {reduceMotion
          ? staticPlace
          : places.map((place, index) => (
              <motion.span
                key={place.id}
                className="col-start-1 row-start-1"
                initial={{ opacity: index === 0 ? 1 : 0, y: index === 0 ? 0 : 12 }}
                animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -12] }}
                transition={{
                  duration: 4,
                  delay: index * 2.2,
                  repeat: Infinity,
                  repeatDelay: Math.max(0, places.length * 2.2 - 4),
                }}
              >
                {place.heroLabel}
              </motion.span>
            ))}
      </span>
      <span
        aria-hidden="true"
        className="from-primary-600 via-primary-500 to-accent-500 relative z-10 bg-gradient-to-r bg-clip-text text-transparent"
      >
        {" "}
        {t("brand")}
      </span>
      <div className="absolute -inset-x-8 -inset-y-4 -z-10 rounded-[50%] bg-white/30 blur-3xl dark:bg-white/5" />
    </h1>
  )
}
