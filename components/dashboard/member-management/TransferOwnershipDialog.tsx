"use client"

import { Crown, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Member } from "./types"

interface TransferOwnershipDialogProps {
  member: Member | null
  onConfirm: () => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
  transferring: boolean
}

export function TransferOwnershipDialog({
  member,
  onConfirm,
  onOpenChange,
  open,
  transferring,
}: TransferOwnershipDialogProps) {
  const t = useTranslations("Dashboard.settings.members")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("management.transferDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("management.transferDialog.description", { email: member?.user_email || "" })}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            <strong>{t("management.transferDialog.warningTitle")}</strong> {t("management.transferDialog.warningBody")}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={transferring}>
            {t("actions.cancel")}
          </Button>
          <Button
            onClick={() => void onConfirm()}
            disabled={transferring}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {transferring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("actions.transferring")}
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                {t("management.transferDialog.confirm")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
