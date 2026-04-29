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
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Section } from "@/components/ui/section"
import { cn } from "@/lib/utils"
import { IntentCategory } from "@/types/service"

interface CategoryBrowseGridProps {
  onCategorySelect: (category: string) => void
}

type CategoryMeta = {
  icon: LucideIcon
  iconClass: string
  iconSurfaceClass: string
}

const CATEGORY_META = {
  [IntentCategory.Crisis]: {
    icon: AlertTriangle,
    iconClass: "text-red-700 dark:text-red-300",
    iconSurfaceClass: "bg-red-100/80 dark:bg-red-950/40",
  },
  [IntentCategory.Food]: {
    icon: Apple,
    iconClass: "text-emerald-700 dark:text-emerald-300",
    iconSurfaceClass: "bg-emerald-100/70 dark:bg-emerald-950/35",
  },
  [IntentCategory.Housing]: {
    icon: Home,
    iconClass: "text-amber-700 dark:text-amber-300",
    iconSurfaceClass: "bg-amber-100/70 dark:bg-amber-950/35",
  },
  [IntentCategory.Health]: {
    icon: Heart,
    iconClass: "text-rose-700 dark:text-rose-300",
    iconSurfaceClass: "bg-rose-100/70 dark:bg-rose-950/35",
  },
  [IntentCategory.Legal]: {
    icon: Scale,
    iconClass: "text-violet-700 dark:text-violet-300",
    iconSurfaceClass: "bg-violet-100/70 dark:bg-violet-950/35",
  },
  [IntentCategory.Community]: {
    icon: Users,
    iconClass: "text-blue-700 dark:text-blue-300",
    iconSurfaceClass: "bg-blue-100/70 dark:bg-blue-950/35",
  },
  [IntentCategory.Employment]: {
    icon: Briefcase,
    iconClass: "text-indigo-700 dark:text-indigo-300",
    iconSurfaceClass: "bg-indigo-100/70 dark:bg-indigo-950/35",
  },
  [IntentCategory.Wellness]: {
    icon: Smile,
    iconClass: "text-teal-700 dark:text-teal-300",
    iconSurfaceClass: "bg-teal-100/70 dark:bg-teal-950/35",
  },
  [IntentCategory.Education]: {
    icon: GraduationCap,
    iconClass: "text-cyan-700 dark:text-cyan-300",
    iconSurfaceClass: "bg-cyan-100/70 dark:bg-cyan-950/35",
  },
  [IntentCategory.Financial]: {
    icon: DollarSign,
    iconClass: "text-lime-700 dark:text-lime-300",
    iconSurfaceClass: "bg-lime-100/70 dark:bg-lime-950/35",
  },
  [IntentCategory.Indigenous]: {
    icon: Leaf,
    iconClass: "text-orange-700 dark:text-orange-300",
    iconSurfaceClass: "bg-orange-100/70 dark:bg-orange-950/35",
  },
  [IntentCategory.Transport]: {
    icon: Bus,
    iconClass: "text-slate-700 dark:text-slate-300",
    iconSurfaceClass: "bg-slate-100/80 dark:bg-slate-800/70",
  },
} satisfies Record<IntentCategory, CategoryMeta>

const CATEGORY_SHORTCUTS = [
  IntentCategory.Health,
  IntentCategory.Community,
  IntentCategory.Employment,
  IntentCategory.Education,
  IntentCategory.Financial,
  IntentCategory.Indigenous,
  IntentCategory.Transport,
] as const

export default function CategoryBrowseGrid({ onCategorySelect }: CategoryBrowseGridProps) {
  const t = useTranslations()
  const tGrid = useTranslations("Home.categoryGrid")

  return (
    <Section className="pt-8 pb-5 md:pt-9 md:pb-6">
      <div
        role="group"
        aria-label={tGrid("groupLabel")}
        className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2"
      >
        {CATEGORY_SHORTCUTS.map((key) => {
          const { icon: Icon, iconClass, iconSurfaceClass } = CATEGORY_META[key]
          const categoryName = t(`Search.${key.toLowerCase()}`)

          return (
            <button
              key={key}
              onClick={() => onCategorySelect(key)}
              aria-label={tGrid("ariaLabel", { category: categoryName })}
              className="hover:border-primary-200 hover:text-primary-700 focus-visible:outline-primary-500 dark:hover:border-primary-400/40 dark:hover:text-primary-200 inline-flex min-h-11 min-w-[44px] items-center gap-2 rounded-full border border-neutral-200/80 bg-white/50 py-2 pr-4 pl-2.5 text-sm font-semibold text-neutral-800 shadow-sm shadow-neutral-900/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-100 dark:shadow-none"
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", iconSurfaceClass)}>
                <Icon className={cn("h-3.5 w-3.5", iconClass)} aria-hidden="true" />
              </span>
              {categoryName}
            </button>
          )
        })}
      </div>
    </Section>
  )
}
