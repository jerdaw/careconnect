"use client"

import { useUserContext } from "@/hooks/useUserContext"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { User, ShieldCheck, Bell, BellOff, Loader2 } from "lucide-react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { NotificationCategory } from "@/types/notifications"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const AGE_GROUPS = ["youth", "adult", "senior"] as const
const IDENTITY_OPTIONS = ["indigenous", "newcomer", "2slgbtqi+", "veteran", "disability"] as const
const NOTIFICATION_CATEGORIES: NotificationCategory[] = ["crisis", "food", "housing", "health", "general"]

export function ProfileSettings() {
  const t = useTranslations("Settings")
  const { context, updateAgeGroup, toggleIdentity, optIn, optOut } = useUserContext()
  const { isSupported, isSubscribed, subscribedCategories, isLoading, subscribe, unsubscribe } = usePushNotifications()
  const [open, setOpen] = useState(false)

  const toggleSubscription = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe(NOTIFICATION_CATEGORIES) // Subscribe to all by default initially
    }
  }

  const toggleCategory = async (category: NotificationCategory) => {
    if (!isSubscribed) return

    const newCategories = subscribedCategories.includes(category)
      ? subscribedCategories.filter((c) => c !== category)
      : [...subscribedCategories, category]

    // If removing last category, could unsubscribe, but let's keep it simple for now
    // and just update the subscription with the new list
    if (newCategories.length === 0) {
      await unsubscribe()
    } else {
      await subscribe(newCategories)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
              context.hasOptedIn
                ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
            )}
          >
            {context.hasOptedIn ? <User className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>
          <span className="hidden font-medium sm:inline-block">
            {context.hasOptedIn ? t("personalizePrompt") : t("enablePersonalization")}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 overflow-hidden p-0" align="end">
        {!context.hasOptedIn ? (
          <div className="bg-slate-50 p-6 dark:bg-slate-900/50">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-white p-3 shadow-sm dark:bg-slate-800">
                <ShieldCheck className="text-primary-600 h-8 w-8" />
              </div>
              <div>
                <h3 className="text-primary-900 mb-1 text-lg font-semibold dark:text-white">
                  {t("personalizePrompt")}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {t("personalizeDescription")}
                </p>
                <Button onClick={optIn} className="shadow-primary-500/20 w-full shadow-lg">
                  {t("enablePersonalization")}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
              <h4 className="text-sm font-semibold">{t("personalizePrompt")}</h4>
              <span className="text-xs text-neutral-400">{context.identities.length} tags active</span>
            </div>

            <section>
              <h4 className="mb-3 text-xs font-semibold tracking-wider text-neutral-500 uppercase">{t("ageGroup")}</h4>
              <div className="grid grid-cols-3 gap-2">
                {AGE_GROUPS.map((group) => (
                  <Button
                    key={group}
                    variant={context.ageGroup === group ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateAgeGroup(group)}
                    className={cn(
                      "h-8 text-xs",
                      context.ageGroup === group
                        ? "bg-primary-600 hover:bg-primary-700"
                        : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    )}
                  >
                    {t(`ageGroups.${group}`).split(" ")[0]}
                  </Button>
                ))}
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                {t("identities")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {IDENTITY_OPTIONS.map((id) => (
                  <Button
                    key={id}
                    variant={context.identities.includes(id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleIdentity(id)}
                    className={cn(
                      "h-7 px-2.5 text-xs",
                      context.identities.includes(id)
                        ? "border-transparent bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    )}
                  >
                    {t(`identityTags.${id}`)}
                  </Button>
                ))}
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                {t("Notifications.title")}
              </h4>

              {/* Master Toggle */}
              <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                <div className="flex items-center gap-2">
                  {isSubscribed ? (
                    <Bell className="text-primary-600 h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4 text-neutral-500" />
                  )}
                  <span className="text-sm font-medium">{t("Notifications.enable")}</span>
                </div>
                <Button
                  size="sm"
                  variant={isSubscribed ? "default" : "secondary"}
                  className="h-7 text-xs"
                  onClick={toggleSubscription}
                  disabled={!isSupported || isLoading}
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : isSubscribed ? "On" : "Off"}
                </Button>
              </div>

              {!isSupported && (
                <p className="mb-2 text-xs text-amber-600">Push notifications not supported on this browser.</p>
              )}

              {/* Categories */}
              {isSubscribed && (
                <div className="space-y-1 pl-1">
                  {NOTIFICATION_CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`notif-${cat}`}
                        checked={subscribedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="text-primary-600 focus:ring-primary-500 h-3 w-3 rounded border-neutral-300"
                      />
                      <label htmlFor={`notif-${cat}`} className="cursor-pointer text-sm select-none">
                        {t(`Notifications.categories.${cat}`)}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-full text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                onClick={() => {
                  optOut()
                  setOpen(false)
                }}
              >
                {t("clearProfile")}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
