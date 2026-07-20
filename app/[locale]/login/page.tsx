"use client"

import { useState } from "react"
import { hasSupabaseCredentials, supabase } from "@/lib/supabase"
import { getPublicAppUrl } from "@/lib/brand"
import { safeRelativeRedirect } from "@/lib/auth/redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AccessibleFormField } from "@/components/forms/AccessibleFormField"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ShieldCheck, Mail, ArrowRight, CheckCircle2, AlertCircle, FileCheck2, LockKeyhole } from "lucide-react"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"

const LOGIN_POINTS = [
  { key: "review", Icon: FileCheck2 },
  { key: "magicLink", Icon: Mail },
  { key: "privacy", Icon: LockKeyhole },
] as const

const SUPPORTED_LOCALES = new Set(["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"])

function authCallbackUrl(nextPath: string): string {
  const baseUrl =
    process.env.NODE_ENV === "development" && typeof window !== "undefined" ? window.location.origin : getPublicAppUrl()
  const nextLocale = nextPath.split("/").filter(Boolean)[0]
  const callbackLocale = nextLocale && SUPPORTED_LOCALES.has(nextLocale) ? nextLocale : "en"
  const url = new URL(`/${callbackLocale}/auth/callback`, baseUrl)
  url.searchParams.set("next", nextPath)
  return url.toString()
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const t = useTranslations("Login")
  const authConfigured = hasSupabaseCredentials()
  const searchParams = useSearchParams()
  const nextPath = safeRelativeRedirect(searchParams.get("next"), getPublicAppUrl())

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!authConfigured) {
        setMessage({
          type: "error",
          text: t("unavailableMessage"),
        })
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: authCallbackUrl(nextPath),
        },
      })

      if (error) throw error

      setMessage({
        type: "success",
        text: t("successMessage"),
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && error.message ? error.message : t("fallbackError")
      setMessage({
        type: "error",
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_14%_6%,rgba(34,211,238,0.22),transparent_24rem),radial-gradient(circle_at_82%_7%,rgba(99,102,241,0.16),transparent_26rem),radial-gradient(circle_at_50%_84%,rgba(34,211,238,0.06),transparent_30rem),linear-gradient(180deg,rgba(239,253,255,0.98)_0%,rgba(248,250,252,0.96)_18%,rgba(255,255,255,0.98)_34%,rgba(255,255,255,0.98)_72%,rgba(248,250,252,0.96)_88%,rgba(241,245,249,0.98)_100%)] font-sans dark:bg-[radial-gradient(circle_at_14%_6%,rgba(8,145,178,0.18),transparent_24rem),radial-gradient(circle_at_82%_7%,rgba(79,70,229,0.16),transparent_26rem),radial-gradient(circle_at_50%_84%,rgba(8,145,178,0.08),transparent_30rem),linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.96)_28%,rgba(15,23,42,0.94)_72%,rgba(2,6,23,0.98)_100%)]">
      <div className="bg-noise" />
      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <section className="relative px-4 pt-40 pb-12 sm:px-6 md:pt-44 md:pb-16 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-accent-700 dark:text-accent-300 text-xs font-semibold tracking-[0.16em] uppercase">
                {t("heroEyebrow")}
              </p>
              <h1 className="heading-display mt-3 max-w-3xl text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl dark:text-white">
                {t("title")}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
                {t("subtitle")}
              </p>

              <div className="mt-7 rounded-2xl border border-neutral-200/75 bg-white/82 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md md:p-6 dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10">
                <h2 className="text-base font-semibold text-neutral-950 dark:text-white">{t("trustTitle")}</h2>
                <div className="mt-5 space-y-4">
                  {LOGIN_POINTS.map(({ key, Icon }) => (
                    <div key={key} className="flex items-start gap-3">
                      <span className="bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-200 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {t(`trustItems.${key}`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/75 bg-white/88 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.07)] ring-1 ring-white/70 backdrop-blur-md md:p-8 dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10">
              <div className="mb-7 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-black/5 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-white/10">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-950 dark:text-white">{t("formTitle")}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {t("formDescription")}
                  </p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleLogin}>
                <AccessibleFormField label={t("emailLabel")} id="email" required>
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    icon={<Mail className="h-5 w-5" aria-hidden="true" />}
                    placeholder={t("emailPlaceholder")}
                  />
                </AccessibleFormField>

                {!authConfigured && !message && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <p className="text-sm font-medium">{t("unavailableMessage")}</p>
                  </div>
                )}

                {message && (
                  <div
                    className={`flex items-start gap-3 rounded-xl p-4 ${
                      message.type === "success"
                        ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={loading || !authConfigured}
                    className="shadow-primary-500/20 h-12 w-full text-base shadow-lg"
                  >
                    {loading ? t("sending") : t("submit")}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                      {t("newToCareConnect")}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="w-full border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50 hover:text-neutral-950 dark:border-neutral-300 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
                    asChild
                  >
                    <Link href="/about/partners">{t("applyPartner")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
