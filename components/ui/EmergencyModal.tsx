"use client"

import { AlertTriangle, Phone, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef } from "react"

interface EmergencyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  const t = useTranslations("EmergencyModal")
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Save previously focused element
      previousFocus.current = document.activeElement as HTMLElement

      // Small delay to ensure modal is rendered and focusable
      const focusTimer = setTimeout(() => {
        const closeButton = modalRef.current?.querySelector("button[aria-label]") as HTMLElement
        closeButton?.focus()
      }, 50)

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return

        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }

      window.addEventListener("keydown", handleTabKey)

      return () => {
        window.removeEventListener("keydown", handleTabKey)
        clearTimeout(focusTimer)
        // Restore focus
        if (previousFocus.current) {
          previousFocus.current.focus()
        }
      }
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed top-[10%] left-1/2 z-[101] w-full max-w-lg -translate-x-1/2 px-4"
          >
            <div className="relative overflow-hidden rounded-2xl bg-red-600 p-6 text-white shadow-2xl ring-1 ring-white/20">
              {/* Decorative blurs */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-black/10 blur-3xl" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-xl leading-tight font-bold">{t("title")}</h2>
                    <p className="mt-2 font-medium text-red-50 opacity-90">{t("message")}</p>
                  </div>
                </div>

                {/* Crisis Lines */}
                <div className="mt-6 space-y-2">
                  <a
                    href="tel:911"
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-red-700 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 fill-current" />
                      <span className="font-bold">{t("emergency")}</span>
                    </div>
                    <span className="text-xl font-bold">911</span>
                  </a>

                  <div className="overflow-hidden rounded-xl bg-white/20 text-white">
                    <a
                      href="tel:988"
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5" />
                        <span className="font-medium">{t("crisisLine")}</span>
                      </div>
                      <span className="text-xl font-bold">988</span>
                    </a>

                    <a
                      href="tel:+18334564566"
                      className="block px-4 pb-3 text-right text-xs text-white/90 transition-colors hover:text-white hover:underline hover:decoration-white/50 hover:underline-offset-4"
                    >
                      {t("crisisFallback", { number: "1-833-456-4566" })}
                    </a>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="mt-4 text-center text-sm text-red-100/80">{t("disclaimer")}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
