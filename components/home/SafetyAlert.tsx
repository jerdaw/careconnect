import { AlertTriangle, Phone
 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"

interface SafetyAlertProps {
  query: string
  category?: string
}

const CRISIS_KEYWORDS = [
  "suicide",
  "kill",
  "die",
  "hurt",
  "crisis",
  "emergency",
  "help",
  "911",
  "dead",
  "depression",
  "anxiety",
]

export default function SafetyAlert({ query, category }: SafetyAlertProps) {
  const t = useTranslations("CrisisAlert")
  const isCrisisSearch =
    category === "Crisis" || CRISIS_KEYWORDS.some((keyword) => query.toLowerCase().includes(keyword))

  return (
    <AnimatePresence>
      {isCrisisSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="relative mb-6 overflow-hidden rounded-2xl bg-red-600 p-6 text-white shadow-xl ring-1 shadow-red-600/20 ring-white/20">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-black/10 blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="text-xl leading-tight font-bold">{t("title")}</h3>
                <p className="mt-1 font-medium text-red-50 opacity-90">
                  {t("message")}
                </p>
                <p className="mt-2 text-sm text-red-100/80">
                  {t("disclaimer")}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <a
                  href="tel:911"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Phone className="h-5 w-5 fill-current" />
                  {t("callButton")}
                </a>
                <a
                  href="tel:988"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/30"
                >
                  <Phone className="h-5 w-5" />
                  {t("crisisLine")}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
