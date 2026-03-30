"use client"

import { UserPlus, Loader2, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getRoleDescriptionKey, getRoleLabelKey, type OrganizationRole } from "@/lib/rbac"
import type { InvitationRole } from "./types"

interface InviteMemberDialogProps {
  assignableRoles: OrganizationRole[]
  canInviteMembers: boolean
  email: string
  inviting: boolean
  onEmailChange: (value: string) => void
  onInvite: () => Promise<void>
  onOpenChange: (open: boolean) => void
  onRoleChange: (role: InvitationRole) => void
  open: boolean
  role: InvitationRole
}

export function InviteMemberDialog({
  assignableRoles,
  canInviteMembers,
  email,
  inviting,
  onEmailChange,
  onInvite,
  onOpenChange,
  onRoleChange,
  open,
  role,
}: InviteMemberDialogProps) {
  const t = useTranslations("Dashboard.settings.members")

  if (!canInviteMembers) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          {t("invite")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("management.inviteDialog.title")}</DialogTitle>
          <DialogDescription>{t("management.inviteDialog.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("management.inviteDialog.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("management.inviteDialog.emailPlaceholder")}
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">{t("role")}</Label>
            <Select value={role} onValueChange={(value) => onRoleChange(value as InvitationRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((assignableRole) => (
                  <SelectItem key={assignableRole} value={assignableRole}>
                    {t(getRoleLabelKey(assignableRole))} - {t(getRoleDescriptionKey(assignableRole))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={() => void onInvite()} disabled={inviting}>
            {inviting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("actions.sending")}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {t("actions.sendInvitation")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
