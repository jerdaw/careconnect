import type { ReactNode } from "react"

interface DashboardPageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function DashboardPageHeader({ title, subtitle, actions }: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="heading-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}
