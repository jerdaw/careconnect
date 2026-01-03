"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"
import { CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

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
      <div className="mx-auto max-w-lg py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
        >
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </motion.div>
        
        <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">{t("successTitle")}</h2>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400">{t("successMessage")}</p>
        
        <Button onClick={() => setSuccess(false)} variant="outline" size="lg">
          {t("submitAnother")}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 lg:p-6">
      <div className="mb-8 text-center">
        <h1 className="heading-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
          {t("description")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">{t("serviceName")}</Label>
          <Input name="name" id="name" required placeholder="e.g. Kingston Youth Shelter" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("serviceDesc")}</Label>
          <Textarea 
            name="description" 
            id="description" 
            required 
            rows={4} 
            placeholder="Briefly describe the services offered..."
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input name="phone" id="phone" type="tel" placeholder="(613) ..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">{t("website")}</Label>
            <Input name="url" id="url" type="url" placeholder="https://..." />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">{t("address")}</Label>
          <Input name="address" id="address" placeholder="123 Example St, Kingston" />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
