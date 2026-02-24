"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { fadeInUp } from "@/lib/motion"

type SectionProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart" | "onAnimationEnd"
> & {
  container?: boolean
  animate?: boolean
  variant?: "default" | "alternate"
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, children, container = true, animate = true, variant = "default", ...props }, ref) => {
    const sectionClassName = cn(
      "relative overflow-hidden py-2 md:py-2",
      variant === "alternate" && "bg-neutral-50 dark:bg-neutral-900/50",
      className
    )

    const content = container ? (
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    ) : (
      children
    )

    if (animate) {
      return (
        <motion.section
          ref={ref}
          className={sectionClassName}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          {...props}
        >
          {content}
        </motion.section>
      )
    }

    return (
      <section ref={ref} className={sectionClassName} {...props}>
        {content}
      </section>
    )
  }
)
Section.displayName = "Section"

export { Section }
