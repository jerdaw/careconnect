"use client"

import { Crown, Loader2, Shield, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getRoleLabelKey, type OrganizationRole } from "@/lib/rbac"
import { useRBAC } from "@/hooks/useRBAC"
import type { Member } from "./types"

function getRoleBadgeVariant(role: OrganizationRole) {
  switch (role) {
    case "owner":
      return "default"
    case "admin":
      return "secondary"
    case "editor":
      return "outline"
    default:
      return "outline"
  }
}

interface MemberListProps {
  assignableRoles: OrganizationRole[]
  currentUserId: string | null
  loading: boolean
  members: Member[]
  onRemoveMember: (memberId: string) => Promise<void>
  onTransferOwnership: (member: Member) => void
  onUpdateRole: (memberId: string, role: OrganizationRole) => Promise<void>
  rbac: ReturnType<typeof useRBAC>
}

export function MemberList({
  assignableRoles,
  currentUserId,
  loading,
  members,
  onRemoveMember,
  onTransferOwnership,
  onUpdateRole,
  rbac,
}: MemberListProps) {
  const t = useTranslations("Dashboard.settings.members")

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="hover:bg-muted/50 border-b transition-colors">
              <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                {t("management.table.member")}
              </th>
              <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                {t("management.table.role")}
              </th>
              <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                {t("management.table.joined")}
              </th>
              {(rbac.checkPermission("canChangeRoles") || rbac.checkPermission("canRemoveMembers")) && (
                <th className="text-muted-foreground h-12 px-4 text-right align-middle font-medium">
                  {t("management.table.actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId

              return (
                <tr key={member.id} className="hover:bg-muted/50 border-b transition-colors">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-neutral-400" />
                      <span>{member.user_email || member.user_id.slice(0, 8)}</span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          {t("management.youBadge")}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      {member.role === "owner" && <Crown className="h-3 w-3 text-yellow-600" />}
                      {rbac.canModifyRole(member.role, isCurrentUser) ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => void onUpdateRole(member.id, value as OrganizationRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assignableRoles.map((assignableRole) => (
                              <SelectItem key={assignableRole} value={assignableRole}>
                                {t(getRoleLabelKey(assignableRole))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(member.role)}>{t(getRoleLabelKey(member.role))}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle text-neutral-500">
                    {new Date(member.invited_at).toLocaleDateString()}
                  </td>
                  {(rbac.checkPermission("canChangeRoles") || rbac.checkPermission("canRemoveMembers")) && (
                    <td className="p-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        {rbac.isOwner && member.role !== "owner" && !isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTransferOwnership(member)}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                        )}

                        {rbac.canRemoveMember(member.role, isCurrentUser) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("management.removeMemberDialog.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("management.removeMemberDialog.description")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => void onRemoveMember(member.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t("actions.remove")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
