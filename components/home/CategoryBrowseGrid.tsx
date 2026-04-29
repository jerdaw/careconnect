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
  surfaceClass: string
}

const CATEGORY_META = {
  [IntentCategory.Crisis]: {
    icon: AlertTriangle,
    iconClass: "text-red-700 dark:text-red-300",
    iconSurfaceClass: "bg-red-100/80 dark:bg-red-950/40",
    surfaceClass: "border-red-200/80 bg-red-50/70 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950/20",
  },
  [IntentCategory.Food]: {
    icon: Apple,
    iconClass: "text-emerald-700 dark:text-emerald-300",
    iconSurfaceClass: "bg-emerald-100/70 dark:bg-emerald-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Housing]: {
    icon: Home,
    iconClass: "text-amber-700 dark:text-amber-300",
    iconSurfaceClass: "bg-amber-100/70 dark:bg-amber-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Health]: {
    icon: Heart,
    iconClass: "text-rose-700 dark:text-rose-300",
    iconSurfaceClass: "bg-rose-100/70 dark:bg-rose-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Legal]: {
    icon: Scale,
    iconClass: "text-violet-700 dark:text-violet-300",
    iconSurfaceClass: "bg-violet-100/70 dark:bg-violet-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Community]: {
    icon: Users,
    iconClass: "text-blue-700 dark:text-blue-300",
    iconSurfaceClass: "bg-blue-100/70 dark:bg-blue-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Employment]: {
    icon: Briefcase,
    iconClass: "text-indigo-700 dark:text-indigo-300",
    iconSurfaceClass: "bg-indigo-100/70 dark:bg-indigo-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Wellness]: {
    icon: Smile,
    iconClass: "text-teal-700 dark:text-teal-300",
    iconSurfaceClass: "bg-teal-100/70 dark:bg-teal-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Education]: {
    icon: GraduationCap,
    iconClass: "text-cyan-700 dark:text-cyan-300",
    iconSurfaceClass: "bg-cyan-100/70 dark:bg-cyan-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Financial]: {
    icon: DollarSign,
    iconClass: "text-lime-700 dark:text-lime-300",
    iconSurfaceClass: "bg-lime-100/70 dark:bg-lime-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Indigenous]: {
    icon: Leaf,
    iconClass: "text-orange-700 dark:text-orange-300",
    iconSurfaceClass: "bg-orange-100/70 dark:bg-orange-950/35",
    surfaceClass: "",
  },
  [IntentCategory.Transport]: {
    icon: Bus,
    iconClass: "text-slate-700 dark:text-slate-300",
    iconSurfaceClass: "bg-slate-100/80 dark:bg-slate-800/70",
    surfaceClass: "",
  },
} satisfies Record<IntentCategory, CategoryMeta>

const FEATURED_CATEGORIES = [
  IntentCategory.Crisis,
  IntentCategory.Food,
  IntentCategory.Housing,
  IntentCategory.Health,
  IntentCategory.Legal,
  IntentCategory.Community,
] as const

const SECONDARY_CATEGORIES = [
  IntentCategory.Employment,
  IntentCategory.Wellness,
  IntentCategory.Education,
  IntentCategory.Financial,
  IntentCategory.Indigenous,
  IntentCategory.Transport,
] as const

export default function CategoryBrowseGrid({ onCategorySelect }: CategoryBrowseGridProps) {
  const t = useTranslations()
  const tGrid = useTranslations("Home.categoryGrid")

  return (
    <Section className="border-b border-neutral-200/70 bg-white/55 py-8 backdrop-blur-sm md:py-10 dark:border-white/10 dark:bg-slate-950/30">
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] lg:items-start">
        <div className="max-w-xl text-center lg:text-left">
          <p className="text-primary-700 dark:text-primary-300 text-xs font-semibold tracking-[0.16em] uppercase">
            {tGrid("eyebrow")}
          </p>
          <h2 className="heading-2 mt-2 text-neutral-950 dark:text-white">{tGrid("title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{tGrid("subtitle")}</p>
        </div>

        <div className="space-y-4">
          <div role="group" aria-label={tGrid("title")} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FEATURED_CATEGORIES.map((key) => {
              const { icon: Icon, iconClass, iconSurfaceClass, surfaceClass } = CATEGORY_META[key]
              const categoryName = t(`Search.${key.toLowerCase()}`)

              return (
                <button
                  key={key}
                  onClick={() => onCategorySelect(key)}
                  aria-label={tGrid("ariaLabel", { category: categoryName })}
                  className={cn(
                    "group flex min-h-[4.5rem] min-w-[44px] items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all duration-200",
                    "hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-neutral-900/5 focus-visible:outline-2 focus-visible:outline-offset-2",
                    "border-neutral-200/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]",
                    surfaceClass
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 dark:ring-white/10",
                      iconSurfaceClass
                    )}
                  >
                    <Icon className={cn("h-4 w-4", iconClass)} aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-tight font-semibold text-neutral-900 dark:text-white">
                    {categoryName}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="rounded-lg border border-neutral-200/70 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {tGrid("secondaryLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {SECONDARY_CATEGORIES.map((key) => {
                const { icon: Icon, iconClass } = CATEGORY_META[key]
                const categoryName = t(`Search.${key.toLowerCase()}`)

                return (
                  <button
                    key={key}
                    onClick={() => onCategorySelect(key)}
                    aria-label={tGrid("ariaLabel", { category: categoryName })}
                    className="hover:border-primary-200 hover:text-primary-700 focus-visible:outline-primary-500 dark:hover:border-primary-400/40 dark:hover:text-primary-200 inline-flex min-h-11 min-w-[44px] items-center gap-2 rounded-lg border border-neutral-200/80 bg-white/75 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200"
                  >
                    <Icon className={cn("h-4 w-4", iconClass)} aria-hidden="true" />
                    {categoryName}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
