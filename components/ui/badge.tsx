import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-100 dark:text-neutral-700 dark:hover:bg-neutral-200",
        primary:
          "bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-50 dark:text-primary-700 dark:border-primary-200",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-50 dark:text-emerald-700 dark:border-emerald-200",
        warning:
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-50 dark:text-amber-700 dark:border-amber-200",
        danger: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-50 dark:text-red-700 dark:border-red-200",
        gradient: "bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm border-none",
        outline: "border border-neutral-200 text-neutral-600 dark:border-neutral-300 dark:text-neutral-700",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        default: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-4 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
