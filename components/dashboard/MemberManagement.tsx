"use client"

import { useTranslations } from "next-intl"
import { InviteMemberDialog } from "@/components/dashboard/member-management/InviteMemberDialog"
import { MemberList } from "@/components/dashboard/member-management/MemberList"
import { PendingInvitationsTable } from "@/components/dashboard/member-management/PendingInvitationsTable"
import { TransferOwnershipDialog } from "@/components/dashboard/member-management/TransferOwnershipDialog"
import { useMemberManagement } from "@/components/dashboard/member-management/useMemberManagement"

interface MemberManagementProps {
  organizationId: string
}

export function MemberManagement({ organizationId }: MemberManagementProps) {
  const t = useTranslations("Dashboard.settings.members")
  const {
    assignableRoles,
    currentUserId,
    inviteDialog,
    invitations,
    loading,
    members,
    onCancelInvitation,
    onRemoveMember,
    onUpdateRole,
    rbac,
    transferDialog,
  } = useMemberManagement(organizationId)

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("management.teamMembersHeading", { count: members.length })}</h3>
          <InviteMemberDialog
            assignableRoles={assignableRoles}
            canInviteMembers={rbac.checkPermission("canInviteMembers")}
            email={inviteDialog.email}
            inviting={inviteDialog.inviting}
            onEmailChange={inviteDialog.onEmailChange}
            onInvite={inviteDialog.onInvite}
            onOpenChange={inviteDialog.onOpenChange}
            onRoleChange={inviteDialog.onRoleChange}
            open={inviteDialog.open}
            role={inviteDialog.role}
          />
        </div>

        <MemberList
          assignableRoles={assignableRoles}
          currentUserId={currentUserId}
          loading={loading}
          members={members}
          onRemoveMember={onRemoveMember}
          onTransferOwnership={(member) => {
            transferDialog.onMemberChange(member)
            transferDialog.onOpenChange(true)
          }}
          onUpdateRole={onUpdateRole}
          rbac={rbac}
        />
      </div>

      <TransferOwnershipDialog
        member={transferDialog.member}
        onConfirm={transferDialog.onConfirm}
        onOpenChange={transferDialog.onOpenChange}
        open={transferDialog.open}
        transferring={transferDialog.transferring}
      />

      {rbac.checkPermission("canInviteMembers") && (
        <PendingInvitationsTable invitations={invitations} onCancelInvitation={onCancelInvitation} />
      )}
    </div>
  )
}
