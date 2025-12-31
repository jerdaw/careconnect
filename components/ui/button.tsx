import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 border border-white/10",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-red-600/20",
        outline:
          "border border-neutral-200 bg-white/50 hover:bg-white text-neutral-900 shadow-sm hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-100 dark:hover:bg-neutral-800",
        secondary:
          "bg-white text-neutral-900 shadow-sm border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-700",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white",
        link: "text-primary-600 underline-offset-4 hover:underline dark:text-primary-400",
        pill: "rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50 hover:ring-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800",
        gradient:
          "bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 border-none",
        glass:
          "glass text-primary-900 dark:text-white hover:bg-white/60 dark:hover:bg-white/10 shadow-sm hover:shadow-md border-white/40 dark:border-white/10",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-11 w-11",
        pill: "px-4 py-1.5 text-xs font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
