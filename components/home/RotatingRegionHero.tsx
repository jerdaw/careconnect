"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTranslations } from "next-intl"
import { getHeroPlaces } from "@/lib/places/registry"

export default function RotatingRegionHero() {
  const t = useTranslations("Home.hero")
  const reduceMotion = useReducedMotion()
  const places = getHeroPlaces()
  const staticPlace = places[0]?.heroLabel ?? "Kingston"
  const [activeIndex, setActiveIndex] = useState(0)
  const activePlace = places[activeIndex]?.heroLabel ?? staticPlace

  useEffect(() => {
    if (reduceMotion || places.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % places.length)
    }, 2200)

    return () => window.clearInterval(interval)
  }, [places.length, reduceMotion])

  return (
    <h1 className="heading-1 heading-display relative text-neutral-900 dark:text-white">
      <span className="sr-only">{t("accessibleTitle")}</span>
      <span aria-hidden="true" className="relative z-10 inline-grid min-w-[11ch] justify-items-center">
        {reduceMotion ? (
          staticPlace
        ) : (
          <motion.span
            key={activePlace}
            className="col-start-1 row-start-1"
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activePlace}
          </motion.span>
        )}
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
