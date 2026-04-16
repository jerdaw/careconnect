"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { AccessibleFormField } from "@/components/forms/AccessibleFormField"
import { logger } from "@/lib/logger"
import {
  NULLABLE_SERVICE_UPDATE_FIELDS,
  TEXT_SERVICE_UPDATE_FIELDS,
  type ServiceUpdateFieldKey,
  type ServiceUpdateFieldUpdates,
  type ServiceUpdateSubmitPayload,
} from "@/types/feedback"

interface UpdateRequestModalProps {
  serviceId: string
  serviceName: string
  isOpen: boolean
  onClose: () => void
}

export function UpdateRequestModal({ serviceId, serviceName, isOpen, onClose }: UpdateRequestModalProps) {
  const t = useTranslations("Feedback")
  const { toast } = useToast()

  const [selectedField, setSelectedField] = useState<ServiceUpdateFieldKey | "">("")
  const [fieldValue, setFieldValue] = useState("")
  const [clearField, setClearField] = useState(false)
  const [justification, setJustification] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState("")
  const [valueError, setValueError] = useState("")

  const isClearableField =
    selectedField !== "" && (NULLABLE_SERVICE_UPDATE_FIELDS as readonly ServiceUpdateFieldKey[]).includes(selectedField)
  const isLongTextField =
    selectedField === "description" ||
    selectedField === "description_fr" ||
    selectedField === "hours_text" ||
    selectedField === "eligibility_notes" ||
    selectedField === "eligibility_notes_fr" ||
    selectedField === "access_script" ||
    selectedField === "access_script_fr"

  const resetForm = () => {
    setSelectedField("")
    setFieldValue("")
    setClearField(false)
    setJustification("")
    setFieldError("")
    setValueError("")
  }

  const getInputType = (field: ServiceUpdateFieldKey | "") => {
    if (field === "url") return "url"
    if (field === "phone") return "tel"
    return "text"
  }

  const getFieldValuePlaceholder = () => {
    if (!selectedField) return t("fieldValuePlaceholder")
    return t("updateRequestValuePlaceholder", {
      field: t(`updateRequestFields.${selectedField}`),
    })
  }

  const handleSubmit = async () => {
    setFieldError("")
    setValueError("")

    if (!selectedField) {
      setFieldError(t("fieldRequiredMessage"))
      return
    }

    if (!clearField && fieldValue.trim().length === 0) {
      setValueError(t("valueRequiredMessage"))
      return
    }

    setIsSubmitting(true)
    try {
      const trimmedValue = fieldValue.trim()
      const payload: ServiceUpdateSubmitPayload = {
        field_updates: {
          [selectedField]: clearField ? null : trimmedValue,
        } as ServiceUpdateFieldUpdates,
        justification: justification.trim() || undefined,
      }

      const res = await fetch(`/api/v1/services/${serviceId}/update-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as {
        data?: { success?: boolean; message?: string }
        error?: { message?: string }
      }

      if (res.ok && data.data?.success) {
        toast({
          title: t("requestSuccessTitle"),
          description: t("requestSuccessMessage"),
        })
        resetForm()
        onClose()
      } else {
        if (res.status === 401) {
          throw new Error(t("authRequiredMessage"))
        }
        throw new Error(data.error?.message || t("errorMessage"))
      }
    } catch (err: unknown) {
      logger.error("Failed to submit service update request", err, {
        component: "UpdateRequestModal",
        action: "submit_update_request",
        serviceId,
      })
      const errorMessage = err instanceof Error ? err.message : t("errorMessage")
      toast({
        title: t("errorTitle"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("requestUpdateTitle")}</DialogTitle>
          <DialogDescription>{t("requestUpdateDesc", { service: serviceName })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="update-field-trigger">
              {t("fieldSelectorLabel")}
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            </Label>
            <Select
              value={selectedField || undefined}
              onValueChange={(value) => {
                setSelectedField(value as ServiceUpdateFieldKey)
                setFieldValue("")
                setClearField(false)
                setFieldError("")
                setValueError("")
              }}
            >
              <SelectTrigger
                id="update-field-trigger"
                className="w-full"
                aria-invalid={fieldError ? "true" : "false"}
                aria-describedby={fieldError ? "update-field-error" : undefined}
              >
                <SelectValue placeholder={t("fieldSelectorPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {TEXT_SERVICE_UPDATE_FIELDS.map((field) => (
                  <SelectItem key={field} value={field}>
                    {t(`updateRequestFields.${field}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError ? (
              <p id="update-field-error" className="text-destructive text-[0.8rem] font-medium" role="alert">
                {fieldError}
              </p>
            ) : null}
          </div>

          <AccessibleFormField id="field-value" label={t("fieldValueLabel")} error={valueError} required>
            {isLongTextField ? (
              <Textarea
                placeholder={getFieldValuePlaceholder()}
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                className="resize-none"
                rows={4}
                disabled={clearField}
              />
            ) : (
              <Input
                type={getInputType(selectedField)}
                placeholder={getFieldValuePlaceholder()}
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                disabled={clearField}
              />
            )}
          </AccessibleFormField>

          {isClearableField ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="clear-field"
                  checked={clearField}
                  onCheckedChange={(checked) => {
                    const nextChecked = checked === true
                    setClearField(nextChecked)
                    if (nextChecked) {
                      setFieldValue("")
                      setValueError("")
                    }
                  }}
                />
                <Label htmlFor="clear-field">{t("clearFieldLabel")}</Label>
              </div>
              <p className="text-muted-foreground text-[0.8rem]">{t("clearFieldHint")}</p>
            </div>
          ) : null}

          <AccessibleFormField id="justification" label={t("justificationLabel")}>
            <Textarea
              id="justification"
              placeholder={t("justificationPlaceholder")}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </AccessibleFormField>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onClose()
            }}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedField || (!clearField && fieldValue.trim().length === 0)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submitRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
