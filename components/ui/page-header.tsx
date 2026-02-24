import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  subtitle?: string
  badgeText?: string
  align?: "center" | "left"
  className?: string
}

export function PageHeader({ icon: Icon, title, subtitle, badgeText, align = "center", className }: PageHeaderProps) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      {Icon && (
        <div
          className={cn(
            "mb-6 inline-flex items-center justify-center rounded-2xl bg-blue-100 p-3 dark:bg-blue-900/30",
            align === "center" && "mx-auto"
          )}
        >
          <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
      )}
      {badgeText && (
        <span className="mb-4 inline-block rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-semibold tracking-wider text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300">
          {badgeText}
        </span>
      )}
      <h1 className="heading-display mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p
          className={cn(
            "text-lg leading-relaxed text-neutral-600 dark:text-neutral-400",
            align === "center" && "mx-auto max-w-2xl"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
