"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, Save, RefreshCw } from "lucide-react"
import { Service, IntentCategory, VerificationLevel } from "../../../types/service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AccessibleFormField } from "@/components/forms/AccessibleFormField"
import { ReindexProgress } from "@/components/admin/ReindexProgress"
import { useTranslations } from "next-intl"

export default function AdminPage() {
  const t = useTranslations("Admin")
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [reindexProgressId, setReindexProgressId] = useState<string | null>(null)
  const [showReindexProgress, setShowReindexProgress] = useState(false)

  // 1. Fetch Data on Load
  useEffect(() => {
    // In a real app, we'd fetch from an API.
    // Here, we just import the JSON for initial view,
    // BUT to get "write" capability we likely need to fetch from an endpoint
    // that reads the file fresh.
    fetch("/api/admin/data")
      .then((res) => res.json() as Promise<{ services: Service[] }>)
      .then((data) => {
        setServices(data.services)
        setIsLoading(false)
      })
      .catch(() => {
        setStatus(t("status.loadError"))
        setIsLoading(false)
      })
  }, [t])

  const handleSave = async (service: Service) => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      })
      if (!res.ok) throw new Error("Failed to save")

      // Update local state
      setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)))
      setStatus(t("status.saved"))
      setTimeout(() => setStatus(""), 3000)
    } catch {
      setStatus(t("status.saveError"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReindex = async () => {
    setStatus(t("status.reindexStarting"))
    setShowReindexProgress(true)
    try {
      const res = await fetch("/api/admin/reindex", { method: "POST" })
      if (!res.ok) throw new Error("Reindex failed")
      const data = (await res.json()) as { progressId: string }
      setReindexProgressId(data.progressId)
      setStatus(t("status.reindexInProgress"))
    } catch {
      setStatus(t("status.reindexFailed"))
      setShowReindexProgress(false)
    }
  }

  const handleReindexComplete = () => {
    setStatus(t("status.reindexComplete"))
    setTimeout(() => {
      setShowReindexProgress(false)
      setReindexProgressId(null)
      setStatus("")
    }, 3000)
  }

  if (isLoading) return <div className="p-8">{t("loading")}</div>

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-neutral-100 p-8 focus:outline-none dark:bg-neutral-900"
    >
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("title")}</h1>
        <div className="flex gap-4">
          <span className="font-mono text-sm text-red-500">{status}</span>
          <Button variant="secondary" onClick={handleReindex} disabled={showReindexProgress}>
            <RefreshCw className={showReindexProgress ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> {t("actions.reindexAi")}
          </Button>
        </div>
      </header>

      {/* Reindex Progress */}
      {showReindexProgress && reindexProgressId && (
        <div className="mb-8">
          <ReindexProgress progressId={reindexProgressId} onComplete={handleReindexComplete} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* List Column */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-500">{t("servicesList.title", { count: services.length })}</h2>
            <Button
              variant="default"
              size="icon"
              className="rounded-full"
              onClick={() =>
                setSelectedService({
                  id: "new-" + Date.now(),
                  name: t("newService.name"),
                  description: "",
                  url: "",
                  phone: "",
                  address: "",
                  intent_category: IntentCategory.Food,
                  verification_level: VerificationLevel.L0,
                  synthetic_queries: [],
                  identity_tags: [],
                  provenance: {
                    verified_by: "admin",
                    verified_at: new Date().toISOString(),
                    evidence_url: "",
                    method: "manual-entry",
                  },
                })
              }
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="h-[80vh] space-y-2 overflow-y-auto pr-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedService(s)}
                className={`w-full cursor-pointer rounded-lg border p-3 text-left text-sm transition-colors ${
                  selectedService?.id === s.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                }`}
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-neutral-400">{s.intent_category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Column */}
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2 dark:bg-neutral-950">
          {selectedService ? (
            <ServiceEditor service={selectedService} onSave={handleSave} isSaving={isSaving} />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">{t("servicesList.empty")}</div>
          )}
        </div>
      </div>
    </main>
  )
}

// Simple Sub-component for form
function ServiceEditor({
  service,
  onSave,
  isSaving,
}: {
  service: Service
  onSave: (s: Service) => void
  isSaving: boolean
}) {
  const t = useTranslations("Admin")
  const [formData, setFormData] = useState(service)

  // Reset form when selection changes
  useEffect(() => {
    setFormData(service)
  }, [service])

  const handleChange = (field: keyof Service, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-neutral-400">{t("editor.labels.id", { id: formData.id })}</span>
        <Button onClick={() => onSave(formData)} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t("actions.saveChanges")}
        </Button>
      </div>

      <div className="grid gap-6">
        <AccessibleFormField label={t("editor.fields.serviceName")} id="name">
          <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
        </AccessibleFormField>

        <AccessibleFormField label={t("editor.fields.description")} id="description">
          <Textarea
            rows={4}
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </AccessibleFormField>

        {/* Category and Verification */}
        <div className="grid grid-cols-2 gap-6">
          <AccessibleFormField label={t("editor.fields.category")} id="category">
            <Select value={formData.intent_category} onValueChange={(val) => handleChange("intent_category", val)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(IntentCategory).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccessibleFormField>

          <AccessibleFormField label={t("editor.fields.verificationLevel")} id="verification_level">
            <Select
              value={formData.verification_level}
              onValueChange={(val) => handleChange("verification_level", val)}
            >
              <SelectTrigger id="verification_level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(VerificationLevel).map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccessibleFormField>
        </div>

        {/* Contact Information */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t("editor.sections.contact")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <AccessibleFormField label={t("editor.fields.phone")} id="phone">
              <Input type="tel" value={formData.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} />
            </AccessibleFormField>

            <AccessibleFormField label={t("editor.fields.email")} id="email">
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </AccessibleFormField>

            <AccessibleFormField label={t("editor.fields.website")} id="url">
              <Input type="url" value={formData.url} onChange={(e) => handleChange("url", e.target.value)} />
            </AccessibleFormField>

            <AccessibleFormField label={t("editor.fields.address")} id="address">
              <Input value={formData.address || ""} onChange={(e) => handleChange("address", e.target.value)} />
            </AccessibleFormField>
          </div>
        </div>

        {/* Service Details */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t("editor.sections.details")}
          </h3>
          <div className="space-y-4">
            <AccessibleFormField label={t("editor.fields.hours")} id="hours">
              <Textarea
                rows={3}
                placeholder={t("editor.placeholders.hours")}
                value={formData.hours_text || ""}
                onChange={(e) => handleChange("hours_text", e.target.value)}
              />
            </AccessibleFormField>

            <AccessibleFormField label={t("editor.fields.fees")} id="fees">
              <Input
                placeholder={t("editor.placeholders.fees")}
                value={formData.fees || ""}
                onChange={(e) => handleChange("fees", e.target.value)}
              />
            </AccessibleFormField>

            <AccessibleFormField label={t("editor.fields.eligibility")} id="eligibility">
              <Textarea
                rows={3}
                placeholder={t("editor.placeholders.eligibility")}
                value={formData.eligibility_notes || ""}
                onChange={(e) => handleChange("eligibility_notes", e.target.value)}
              />
            </AccessibleFormField>

            <AccessibleFormField label={t("editor.fields.applicationProcess")} id="application_process">
              <Textarea
                rows={3}
                placeholder={t("editor.placeholders.applicationProcess")}
                value={formData.application_process || ""}
                onChange={(e) => handleChange("application_process", e.target.value)}
              />
            </AccessibleFormField>
          </div>
        </div>

        {/* Search Optimization */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t("editor.sections.search")}
          </h3>
          <AccessibleFormField label={t("editor.fields.keywords")} id="keywords">
            <Input
              placeholder={t("editor.placeholders.keywords")}
              value={formData.synthetic_queries.join(", ")}
              onChange={(e) =>
                setFormData((p) => ({ ...p, synthetic_queries: e.target.value.split(",").map((s) => s.trim()) }))
              }
            />
          </AccessibleFormField>
        </div>

        {/* Admin Notes (Phase 3) */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <h3 className="mb-4 text-sm font-semibold text-yellow-900 dark:text-yellow-200">
            {t("editor.sections.adminNotes")}
          </h3>
          <AccessibleFormField label={t("editor.fields.internalNotes")} id="admin_notes">
            <Textarea
              rows={3}
              placeholder={t("editor.placeholders.internalNotes")}
              value={formData.admin_notes || ""}
              onChange={(e) => handleChange("admin_notes", e.target.value)}
            />
          </AccessibleFormField>
        </div>
      </div>
    </div>
  )
}
