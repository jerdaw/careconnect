import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva("rounded-2xl transition-all duration-300 overflow-hidden", {
  variants: {
    variant: {
      default: "bg-white border border-neutral-100 shadow-sm hover:shadow-md dark:bg-white/5 dark:border-white/5",
      elevated: "bg-white shadow-xl shadow-neutral-200/50 dark:bg-neutral-900 dark:shadow-black/20 border-none",
      glass: "glass-card hover:bg-white/80 dark:hover:bg-neutral-900/60 transition-colors",
      gradient:
        "bg-gradient-to-br from-white to-primary-50/30 border border-white/50 shadow-lg dark:from-neutral-900 dark:to-primary-950/30 dark:border-white/5",
      interactive:
        "group bg-white border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1 hover:border-primary-500/20 cursor-pointer dark:bg-white/5 dark:border-white/5 dark:hover:border-primary-500/30 dark:hover:bg-white/10",
      flat: "bg-neutral-50 border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800",
    },
    padding: {
      none: "",
      sm: "p-4",
      default: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "default",
  },
})

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, padding, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant, padding, className }))} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl leading-none font-semibold tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
