import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-600">
      <div className="bg-primary-50 dark:bg-primary-900/30 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Icon className="text-primary-400 dark:text-primary-500 h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mx-auto max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
