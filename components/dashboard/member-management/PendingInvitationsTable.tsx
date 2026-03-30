"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getRoleLabelKey, isValidRole, type OrganizationRole } from "@/lib/rbac"
import type { Invitation } from "./types"

interface PendingInvitationsTableProps {
  invitations: Invitation[]
  onCancelInvitation: (invitationId: string) => Promise<void>
}

export function PendingInvitationsTable({ invitations, onCancelInvitation }: PendingInvitationsTableProps) {
  const t = useTranslations("Dashboard.settings.members")

  if (invitations.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        {t("management.pendingInvitationsHeading", { count: invitations.length })}
      </h3>
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="hover:bg-muted/50 border-b transition-colors">
                <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                  {t("management.pendingTable.email")}
                </th>
                <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                  {t("management.pendingTable.role")}
                </th>
                <th className="text-muted-foreground h-12 px-4 text-left align-middle font-medium">
                  {t("management.pendingTable.expires")}
                </th>
                <th className="text-muted-foreground h-12 px-4 text-right align-middle font-medium">
                  {t("management.pendingTable.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-muted/50 border-b transition-colors">
                  <td className="p-4 align-middle">{invitation.email}</td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline">
                      {t(
                        getRoleLabelKey(isValidRole(invitation.role) ? (invitation.role as OrganizationRole) : "viewer")
                      )}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle text-neutral-500">
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right align-middle">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => void onCancelInvitation(invitation.id)}
                    >
                      {t("actions.cancel")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
