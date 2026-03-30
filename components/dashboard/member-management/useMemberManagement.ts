"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useAuth } from "@/components/layout/AuthProvider"
import { useToast } from "@/components/ui/use-toast"
import { useRBAC } from "@/hooks/useRBAC"
import { logger } from "@/lib/logger"
import { getAssignableRoles, type OrganizationRole } from "@/lib/rbac"
import {
  changeMemberRole,
  getOrganizationMembersWithEmails,
  removeMember,
  transferOwnership,
} from "@/lib/actions/members"
import {
  cancelOrganizationInvitation,
  createOrganizationInvitation,
  listOrganizationInvitations,
} from "@/lib/actions/organization-invitations"
import type { Invitation, InvitationRole, Member } from "./types"

function normalizeInvitations(invitations: Awaited<ReturnType<typeof listOrganizationInvitations>>): Invitation[] {
  return invitations.map((invitation) => ({
    ...invitation,
    role: invitation.role,
  }))
}

export function useMemberManagement(organizationId: string) {
  const t = useTranslations("Dashboard.settings.members")
  const locale = useLocale()
  const { user } = useAuth()
  const { toast } = useToast()

  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<InvitationRole>("editor")
  const [inviting, setInviting] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [selectedMemberForTransfer, setSelectedMemberForTransfer] = useState<Member | null>(null)
  const [transferring, setTransferring] = useState(false)

  const currentMember = members.find((member) => member.user_id === user?.id)
  const rbac = useRBAC(currentMember?.role)
  const assignableRoles = getAssignableRoles(currentMember?.role || "viewer")

  async function refreshMembers(showError = true) {
    try {
      const membersWithEmails = await getOrganizationMembersWithEmails(organizationId)
      setMembers(membersWithEmails)
      return membersWithEmails
    } catch (error) {
      logger.error("Failed to fetch members", error, {
        component: "MemberManagement",
        action: "fetchMembers",
        orgId: organizationId,
      })

      if (showError) {
        toast({
          title: t("toast.errorTitle"),
          description: t("toast.loadMembersFailed"),
          variant: "destructive",
        })
      }

      return []
    }
  }

  async function refreshInvitations(showError = true) {
    try {
      const pendingInvitations = await listOrganizationInvitations(organizationId)
      const normalizedInvitations = normalizeInvitations(pendingInvitations)
      setInvitations(normalizedInvitations)
      return normalizedInvitations
    } catch (error) {
      logger.error("Failed to fetch invitations", error, {
        component: "MemberManagement",
        action: "fetchInvitations",
        orgId: organizationId,
      })

      if (showError) {
        toast({
          title: t("toast.errorTitle"),
          description: t("toast.loadMembersFailed"),
          variant: "destructive",
        })
      }

      return []
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      setLoading(true)

      try {
        const [membersWithEmails, pendingInvitations] = await Promise.all([
          getOrganizationMembersWithEmails(organizationId),
          listOrganizationInvitations(organizationId),
        ])

        if (cancelled) {
          return
        }

        setMembers(membersWithEmails)
        setInvitations(normalizeInvitations(pendingInvitations))
      } catch (error) {
        if (cancelled) {
          return
        }

        logger.error("Failed to load member management data", error, {
          component: "MemberManagement",
          action: "loadInitialData",
          orgId: organizationId,
        })
        toast({
          title: t("toast.errorTitle"),
          description: t("toast.loadMembersFailed"),
          variant: "destructive",
        })
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      cancelled = true
    }
  }, [organizationId, t, toast])

  async function handleInvite() {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.fillAllFields"),
        variant: "destructive",
      })
      return
    }

    setInviting(true)

    try {
      const result = await createOrganizationInvitation({
        organizationId,
        locale,
        email: inviteEmail,
        role: inviteRole,
      })

      if (!result.success) {
        if (result.error === "ALREADY_INVITED") {
          toast({
            title: t("toast.errorTitle"),
            description: t("toast.alreadyInvited"),
            variant: "destructive",
          })
          return
        }

        throw new Error(result.error || "Failed to create invitation")
      }

      toast({
        title: t("toast.successTitle"),
        description: t("toast.invitationSent", { email: inviteEmail }),
      })

      const inviteUrl = result.token ? `${window.location.origin}/invite/${result.token}` : null
      logger.info("Invitation created", {
        component: "MemberManagement",
        action: "invite",
        email: inviteEmail,
        role: inviteRole,
        inviteUrl,
      })

      setInviteOpen(false)
      setInviteEmail("")
      setInviteRole("editor")
      await refreshInvitations(false)
    } catch (error) {
      logger.error("Invitation failed", error, {
        component: "MemberManagement",
        action: "invite",
        email: inviteEmail,
        role: inviteRole,
      })
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.invitationFailed"),
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    const result = await cancelOrganizationInvitation({ invitationId, locale })

    if (!result.success) {
      toast({
        title: t("toast.errorTitle"),
        description: result.error || t("toast.cancelInvitationFailed"),
        variant: "destructive",
      })
      return
    }

    toast({
      title: t("toast.successTitle"),
      description: t("toast.invitationCancelled"),
    })
    await refreshInvitations(false)
  }

  async function handleUpdateRole(memberId: string, newRole: OrganizationRole) {
    const result = await changeMemberRole(memberId, newRole, locale)

    if (!result.success) {
      toast({
        title: t("toast.errorTitle"),
        description: result.error || t("toast.updateRoleFailed"),
        variant: "destructive",
      })
      return
    }

    toast({
      title: t("toast.successTitle"),
      description: t("toast.roleUpdated"),
    })
    setLoading(true)
    await refreshMembers(false)
    setLoading(false)
  }

  async function handleRemoveMember(memberId: string) {
    const result = await removeMember(memberId, locale)

    if (!result.success) {
      toast({
        title: t("toast.errorTitle"),
        description: result.error || t("toast.removeMemberFailed"),
        variant: "destructive",
      })
      return
    }

    toast({
      title: t("toast.successTitle"),
      description: t("toast.memberRemoved"),
    })
    setLoading(true)
    await refreshMembers(false)
    setLoading(false)
  }

  async function handleTransferOwnership() {
    if (!selectedMemberForTransfer) {
      return
    }

    setTransferring(true)
    const result = await transferOwnership(selectedMemberForTransfer.user_id, locale)

    if (!result.success) {
      toast({
        title: t("toast.errorTitle"),
        description: result.error || t("toast.transferOwnershipFailed"),
        variant: "destructive",
      })
      setTransferring(false)
      return
    }

    toast({
      title: t("toast.successTitle"),
      description: t("toast.ownershipTransferred", { email: selectedMemberForTransfer.user_email }),
    })
    setTransferOpen(false)
    setSelectedMemberForTransfer(null)
    setLoading(true)
    await refreshMembers(false)
    setLoading(false)
    setTransferring(false)
  }

  return {
    assignableRoles,
    currentUserId: user?.id ?? null,
    inviteDialog: {
      email: inviteEmail,
      inviting,
      onEmailChange: setInviteEmail,
      onInvite: handleInvite,
      onOpenChange: setInviteOpen,
      onRoleChange: setInviteRole,
      open: inviteOpen,
      role: inviteRole,
    },
    invitations,
    loading,
    members,
    rbac,
    transferDialog: {
      member: selectedMemberForTransfer,
      onConfirm: handleTransferOwnership,
      onMemberChange: setSelectedMemberForTransfer,
      onOpenChange: setTransferOpen,
      open: transferOpen,
      transferring,
    },
    onCancelInvitation: handleCancelInvitation,
    onRemoveMember: handleRemoveMember,
    onUpdateRole: handleUpdateRole,
  }
}
