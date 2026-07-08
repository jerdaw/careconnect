"use client"

import { Share2, Printer, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useShare } from "@/hooks/useShare"
import { useToast } from "@/components/ui/use-toast"
import { BRAND_NAME } from "@/lib/brand"

interface ServiceActionBarProps {
  serviceId: string
  serviceName: string
  plainLanguageLabel: string
  shareLabel: string
  printLabel: string
}

export function ServiceActionBar({
  serviceId,
  serviceName,
  plainLanguageLabel,
  shareLabel,
  printLabel,
}: ServiceActionBarProps) {
  const { share } = useShare()
  const { toast } = useToast()

  const handleShare = async () => {
    const result = await share({
      title: serviceName,
      text: `Check out ${serviceName} on ${BRAND_NAME}`,
      url: window.location.href,
    })

    if (result.type === "copy" && result.success) {
      toast({
        title: "Link Copied",
        description: "The service link has been copied to your clipboard.",
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="?view=simple"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-950 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-950 dark:border-neutral-300 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
      >
        <BookOpen className="h-4 w-4" />
        {plainLanguageLabel}
      </Link>

      <Button
        variant="outline"
        className="gap-2 !border-neutral-300 !bg-white !text-neutral-950 hover:!bg-neutral-50 hover:!text-neutral-950 dark:!border-neutral-300 dark:!bg-white dark:!text-neutral-950 dark:hover:!bg-neutral-100"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" /> {shareLabel}
      </Button>

      <Button
        variant="outline"
        className="gap-2 !border-neutral-300 !bg-white !text-neutral-950 hover:!bg-neutral-50 hover:!text-neutral-950 dark:!border-neutral-300 dark:!bg-white dark:!text-neutral-950 dark:hover:!bg-neutral-100"
        asChild
      >
        <a href={`/api/v1/services/${serviceId}/printable`} target="_blank" rel="noopener noreferrer">
          <Printer className="h-4 w-4" /> {printLabel}
        </a>
      </Button>
    </div>
  )
}
