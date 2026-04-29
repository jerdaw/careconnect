"use client"

import {
  AlertTriangle,
  Heart,
  Users,
  Scale,
  Apple,
  Home,
  Briefcase,
  Smile,
  GraduationCap,
  DollarSign,
  Leaf,
  Bus,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Section } from "@/components/ui/section"
import { cn } from "@/lib/utils"
import { IntentCategory } from "@/types/service"

interface CategoryBrowseGridProps {
  onCategorySelect: (category: string) => void
}

const CATEGORIES = [
  {
    key: IntentCategory.Crisis,
    icon: AlertTriangle,
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100/80 dark:bg-red-950/40",
    border: "border-red-200/80 bg-red-50/70 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950/20",
  },
  {
    key: IntentCategory.Health,
    icon: Heart,
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-100/70 dark:bg-rose-950/35",
    border: "",
  },
  {
    key: IntentCategory.Community,
    icon: Users,
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100/70 dark:bg-blue-950/35",
    border: "",
  },
  {
    key: IntentCategory.Legal,
    icon: Scale,
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-100/70 dark:bg-violet-950/35",
    border: "",
  },
  {
    key: IntentCategory.Food,
    icon: Apple,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100/70 dark:bg-emerald-950/35",
    border: "",
  },
  {
    key: IntentCategory.Housing,
    icon: Home,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100/70 dark:bg-amber-950/35",
    border: "",
  },
  {
    key: IntentCategory.Employment,
    icon: Briefcase,
    color: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-100/70 dark:bg-indigo-950/35",
    border: "",
  },
  {
    key: IntentCategory.Wellness,
    icon: Smile,
    color: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-100/70 dark:bg-teal-950/35",
    border: "",
  },
  {
    key: IntentCategory.Education,
    icon: GraduationCap,
    color: "text-cyan-700 dark:text-cyan-300",
    bg: "bg-cyan-100/70 dark:bg-cyan-950/35",
    border: "",
  },
  {
    key: IntentCategory.Financial,
    icon: DollarSign,
    color: "text-lime-700 dark:text-lime-300",
    bg: "bg-lime-100/70 dark:bg-lime-950/35",
    border: "",
  },
  {
    key: IntentCategory.Indigenous,
    icon: Leaf,
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-100/70 dark:bg-orange-950/35",
    border: "",
  },
  {
    key: IntentCategory.Transport,
    icon: Bus,
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-100/80 dark:bg-slate-800/70",
    border: "",
  },
] as const

export default function CategoryBrowseGrid({ onCategorySelect }: CategoryBrowseGridProps) {
  const t = useTranslations()
  const tGrid = useTranslations("Home.categoryGrid")

  return (
    <Section className="border-b border-neutral-200/70 bg-white/55 pt-10 pb-12 backdrop-blur-sm md:pt-12 md:pb-14 dark:border-white/10 dark:bg-slate-950/30">
      <div className="mb-7 flex flex-col gap-3 text-center md:mb-8 md:flex-row md:items-end md:justify-between md:text-left">
        <div>
          <p className="text-primary-700 dark:text-primary-300 text-xs font-semibold tracking-[0.16em] uppercase">
            {tGrid("eyebrow")}
          </p>
          <h2 className="heading-2 mt-2 text-neutral-950 dark:text-white">{tGrid("title")}</h2>
        </div>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-neutral-600 md:mx-0 md:text-right dark:text-neutral-300">
          {tGrid("subtitle")}
        </p>
      </div>
      <div
        role="group"
        aria-label={tGrid("title")}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      >
        {CATEGORIES.map(({ key, icon: Icon, color, bg, border }) => {
          const categoryName = t(`Search.${key.toLowerCase()}`)
          return (
            <button
              key={key}
              onClick={() => onCategorySelect(key)}
              aria-label={tGrid("ariaLabel", { category: categoryName })}
              className={cn(
                "group flex min-h-28 min-w-[44px] flex-col items-start justify-between rounded-xl border p-4 text-left transition-all duration-200",
                "hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-neutral-900/5 focus-visible:outline-2 focus-visible:outline-offset-2",
                "border-neutral-200/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]",
                border
              )}
            >
              <div className={cn("rounded-lg p-2 ring-1 ring-black/5 dark:ring-white/10", bg)}>
                <Icon className={cn("h-4 w-4", color)} aria-hidden="true" />
              </div>
              <span className="mt-4 text-sm leading-tight font-semibold text-neutral-900 dark:text-white">
                {categoryName}
              </span>
              <span className="mt-1 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                {tGrid(`items.${key}.description`)}
              </span>
            </button>
          )
        })}
      </div>
    </Section>
  )
}
