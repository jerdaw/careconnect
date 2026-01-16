"use client"

import { Share2, Printer, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useShare } from "@/hooks/useShare"
import { useToast } from "@/components/ui/use-toast"

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
      text: `Check out ${serviceName} on Kingston Care Connect`,
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
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      >
        <BookOpen className="h-4 w-4" />
        {plainLanguageLabel}
      </Link>

      <Button variant="outline" className="gap-2" onClick={handleShare}>
        <Share2 className="h-4 w-4" /> {shareLabel}
      </Button>

      <Button variant="outline" className="gap-2" asChild>
        <a href={`/api/v1/services/${serviceId}/printable`} target="_blank" rel="noopener noreferrer">
          <Printer className="h-4 w-4" /> {printLabel}
        </a>
      </Button>
    </div>
  )
}
