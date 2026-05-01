"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AccessibleFormField } from "./AccessibleFormField"
import { useTranslations } from "next-intl"
import { AlertCircle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

type FieldErrors = Partial<Record<"name" | "description" | "phone" | "url" | "address" | "submitted_by_email", string>>

function buildPayload(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries())
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value] as const)
      .filter(([, value]) => value !== "")
  )
}

function extractFieldErrors(errors: unknown): FieldErrors {
  if (!errors || typeof errors !== "object" || !("fieldErrors" in errors)) {
    return {}
  }

  const fieldErrors = (errors as { fieldErrors?: Record<string, string[]> }).fieldErrors
  if (!fieldErrors) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(fieldErrors)
      .map(([field, messages]) => [field, messages[0]])
      .filter((entry): entry is [keyof FieldErrors, string] => Boolean(entry[1]))
  )
}

export default function SubmitServiceForm() {
  const t = useTranslations("SubmitService")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/v1/submissions", {
        method: "POST",
        body: JSON.stringify(buildPayload(formData)),
        headers: { "Content-Type": "application/json" },
      })

      const json = (await res.json().catch(() => null)) as {
        success?: boolean
        message?: string
        errors?: unknown
      } | null

      if (!res.ok || !json?.success) {
        setFieldErrors(extractFieldErrors(json?.errors))
        setFormError(json?.message ?? t("genericError"))
        return
      }

      setSuccess(true)
    } catch {
      setFormError(t("genericError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card
        padding="none"
        className="border-neutral-200/75 bg-white/88 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10"
      >
        <div className="px-5 py-10 text-center md:px-8 md:py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200/70 dark:bg-emerald-500/10 dark:ring-emerald-400/20"
          >
            <CheckCircle className="h-10 w-10 text-emerald-700 dark:text-emerald-200" />
          </motion.div>

          <h2 className="text-2xl font-bold text-neutral-950 dark:text-white">{t("successTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            {t("successMessage")}
          </p>

          <Button
            onClick={() => {
              setSuccess(false)
              setFormError(null)
              setFieldErrors({})
            }}
            variant="outline"
            size="lg"
            className="mt-8"
          >
            {t("submitAnother")}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      padding="none"
      className="border-neutral-200/75 bg-white/88 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10"
    >
      <form onSubmit={handleSubmit} className="p-5 md:p-7">
        <div>
          <h2 className="text-xl font-semibold text-neutral-950 dark:text-white">{t("formTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{t("formDescription")}</p>
          <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t("requiredNote")}</p>
        </div>

        {formError && (
          <Alert variant="destructive" className="mt-5">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>{t("errorTitle")}</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 space-y-5">
          <AccessibleFormField label={t("serviceName")} id="name" required error={fieldErrors.name}>
            <Input
              name="name"
              required
              minLength={3}
              placeholder={t("serviceNamePlaceholder")}
              autoComplete="organization"
            />
          </AccessibleFormField>

          <AccessibleFormField
            label={t("serviceDesc")}
            id="description"
            required
            hint={t("serviceDescHint")}
            error={fieldErrors.description}
          >
            <Textarea name="description" required minLength={10} rows={5} placeholder={t("serviceDescPlaceholder")} />
          </AccessibleFormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <AccessibleFormField label={t("phone")} id="phone" error={fieldErrors.phone}>
              <Input name="phone" type="tel" placeholder={t("phonePlaceholder")} autoComplete="tel" />
            </AccessibleFormField>

            <AccessibleFormField label={t("website")} id="url" error={fieldErrors.url}>
              <Input name="url" type="url" placeholder={t("websitePlaceholder")} autoComplete="url" />
            </AccessibleFormField>
          </div>

          <AccessibleFormField label={t("address")} id="address" error={fieldErrors.address}>
            <Input name="address" placeholder={t("addressPlaceholder")} autoComplete="street-address" />
          </AccessibleFormField>

          <AccessibleFormField
            label={t("submitterEmail")}
            id="submitted_by_email"
            hint={t("submitterEmailHint")}
            error={fieldErrors.submitted_by_email}
          >
            <Input
              name="submitted_by_email"
              type="email"
              placeholder={t("submitterEmailPlaceholder")}
              autoComplete="email"
            />
          </AccessibleFormField>
        </div>

        <div className="mt-7 rounded-2xl border border-neutral-200/75 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">{t("privacyTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{t("privacyText")}</p>
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-7 w-full" size="lg">
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Card>
  )
}
