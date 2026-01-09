"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ShieldCheck, Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { Link } from "@/i18n/routing"
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const t = useTranslations("Login")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage({
        type: "success",
        text: "Magic link sent! Check your email to sign in.",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setMessage({
        type: "error",
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans dark:bg-neutral-950">
      <Header />

      <main className="relative flex flex-1 flex-col justify-center overflow-hidden py-12 sm:px-6 lg:px-8">
        {/* Background Decor */}
        <div className="from-primary-200/20 to-accent-200/20 dark:from-primary-900/10 dark:to-accent-900/10 absolute top-1/2 left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr blur-[100px]" />

        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="from-primary-500 to-primary-600 mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="heading-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t("title")}
            </h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t("subtitle")}</p>
          </div>

          <div className="mt-8">
            <div className="border border-white/50 bg-white/80 px-4 py-8 shadow-xl backdrop-blur-xl sm:rounded-2xl sm:px-10 dark:border-white/5 dark:bg-neutral-900/80">
              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t("emailLabel")}
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-xl border-neutral-300 py-3 pl-10 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                      placeholder={t("emailPlaceholder")}
                    />
                  </div>
                </div>

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
                    disabled={loading}
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
                    <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-900">{t("newToKCC")}</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/contact">{t("applyPartner")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
