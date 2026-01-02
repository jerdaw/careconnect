"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export default function SubmitServiceForm() {
  const t = useTranslations("SubmitService")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const res = await fetch("/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" },
    })

    setIsSubmitting(false)
    if (res.ok) setSuccess(true)
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <div className="mb-4 text-4xl">🎉</div>
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">{t("successTitle")}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">{t("successMessage")}</p>
        <Button className="mt-6" variant="outline" onClick={() => setSuccess(false)}>
          {t("submitAnother")}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{t("title")}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t("description")}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            {t("serviceName")}
          </label>
          <input
            name="name"
            id="name"
            required
            className="w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            {t("serviceDesc")}
          </label>
          <textarea
            name="description"
            id="description"
            required
            rows={4}
            className="w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              {t("phone")}
            </label>
            <input
              name="phone"
              id="phone"
              className="w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
          <div>
            <label htmlFor="url" className="mb-1 block text-sm font-medium">
              {t("website")}
            </label>
            <input
              name="url"
              id="url"
              type="url"
              className="w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium">
            {t("address")}
          </label>
          <input
            name="address"
            id="address"
            className="w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
