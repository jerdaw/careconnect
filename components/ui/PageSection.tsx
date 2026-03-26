import React from "react"
import { Section } from "@/components/ui/section"

interface PageSectionProps {
  title: string
  id?: string
  children: React.ReactNode
}

const PageSection = ({ title, id, children }: PageSectionProps) => {
  return (
    <Section id={id} className="py-12">
      <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
      {children}
    </Section>
  )
}

export default PageSection
