import { useTranslations } from "next-intl"

export default function BetaBanner() {
  const t = useTranslations("BetaBanner")

  return (
    <aside
      role="complementary"
      aria-label="Beta Information"
      className="bg-blue-600 px-4 py-2 text-white dark:bg-blue-800"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold">PILOT</span>
          <span className="opacity-90">{t("title")}</span>
        </div>
        <div className="hidden sm:block">
          <a
            href="mailto:feedback@kingstoncare.ca?subject=Kingston%20Care%20Connect%20Pilot%20Feedback"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-blue-100"
          >
            Report it here
          </a>
        </div>
      </div>
    </aside>
  )
}
