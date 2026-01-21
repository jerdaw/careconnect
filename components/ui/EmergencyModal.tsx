import { AlertTriangle, Phone } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { X } from "lucide-react"

interface EmergencyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  const t = useTranslations("EmergencyModal")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border-none bg-transparent p-0 shadow-none sm:rounded-2xl [&>button]:hidden">
        <div className="relative overflow-hidden rounded-2xl bg-red-700 p-6 text-white shadow-2xl ring-1 ring-white/20">
          {/* Decorative blurs */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-black/10 blur-3xl" />

          {/* Close button - Styled for red background */}
          <DialogClose className="absolute top-4 right-4 z-20 rounded-full p-2 text-white transition-colors hover:bg-white/20 hover:text-white focus:ring-2 focus:ring-white focus:outline-none">
            <X className="h-5 w-5" />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>

          <div className="relative z-10">
            <DialogHeader className="flex flex-row items-start gap-4 space-y-0 text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>

              <div className="flex-1">
                <DialogTitle className="text-xl leading-tight font-bold text-white">{t("title")}</DialogTitle>
                <DialogDescription className="mt-2 font-medium text-white">{t("message")}</DialogDescription>
              </div>
            </DialogHeader>

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

              <div className="overflow-hidden rounded-xl bg-black/20 text-white">
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
                  className="block px-4 pb-3 text-right text-xs text-white transition-colors hover:text-white hover:underline hover:decoration-white/50 hover:underline-offset-4"
                >
                  {t("crisisFallback", { number: "1-833-456-4566" })}
                </a>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-4 text-center text-sm font-medium text-white">{t("disclaimer")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
