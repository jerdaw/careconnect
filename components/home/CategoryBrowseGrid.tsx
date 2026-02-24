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

interface CategoryBrowseGridProps {
  onCategorySelect: (category: string) => void
}

const CATEGORIES = [
  {
    key: "Crisis",
    icon: AlertTriangle,
    count: 42,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100/80 dark:bg-red-900/30",
    border: "border-red-200 bg-red-50/60 dark:border-red-800/50 dark:bg-red-900/10",
  },
  {
    key: "Health",
    icon: Heart,
    count: 41,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100/80 dark:bg-rose-900/30",
    border: "",
  },
  {
    key: "Community",
    icon: Users,
    count: 34,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100/80 dark:bg-blue-900/30",
    border: "",
  },
  {
    key: "Legal",
    icon: Scale,
    count: 26,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100/80 dark:bg-purple-900/30",
    border: "",
  },
  {
    key: "Food",
    icon: Apple,
    count: 15,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100/80 dark:bg-green-900/30",
    border: "",
  },
  {
    key: "Housing",
    icon: Home,
    count: 9,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100/80 dark:bg-amber-900/30",
    border: "",
  },
  {
    key: "Employment",
    icon: Briefcase,
    count: 8,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100/80 dark:bg-indigo-900/30",
    border: "",
  },
  {
    key: "Wellness",
    icon: Smile,
    count: 7,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100/80 dark:bg-teal-900/30",
    border: "",
  },
  {
    key: "Education",
    icon: GraduationCap,
    count: 5,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100/80 dark:bg-cyan-900/30",
    border: "",
  },
  {
    key: "Financial",
    icon: DollarSign,
    count: 4,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100/80 dark:bg-emerald-900/30",
    border: "",
  },
  {
    key: "Indigenous",
    icon: Leaf,
    count: 3,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100/80 dark:bg-orange-900/30",
    border: "",
  },
  {
    key: "Transport",
    icon: Bus,
    count: 2,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100/80 dark:bg-slate-900/30",
    border: "",
  },
] as const

export default function CategoryBrowseGrid({ onCategorySelect }: CategoryBrowseGridProps) {
  const t = useTranslations()
  const tGrid = useTranslations("Home.categoryGrid")

  return (
    <Section variant="alternate" className="py-12 md:py-16">
      <div className="mb-8 text-center">
        <h2 className="heading-2 text-neutral-900 dark:text-white">{tGrid("title")}</h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{tGrid("subtitle")}</p>
      </div>
      <div
        role="group"
        aria-label={tGrid("title")}
        className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      >
        {CATEGORIES.map(({ key, icon: Icon, count, color, bg, border }) => {
          const categoryName = t(`Search.${key.toLowerCase()}`)
          return (
            <button
              key={key}
              onClick={() => onCategorySelect(key)}
              aria-label={tGrid("ariaLabel", { category: categoryName, count })}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2",
                "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/60",
                border
              )}
            >
              <div className={cn("rounded-full p-1.5 sm:p-2", bg)}>
                <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", color)} aria-hidden="true" />
              </div>
              <span className="text-xs leading-tight font-medium text-neutral-700 dark:text-neutral-200">
                {categoryName}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {tGrid("servicesCount", { count })}
              </span>
            </button>
          )
        })}
      </div>
    </Section>
  )
}
