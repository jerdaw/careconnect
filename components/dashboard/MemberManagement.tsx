"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/AuthProvider"
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
import { useToast } from "@/components/ui/use-toast"
import { UserPlus, Trash2, Loader2, Mail, Shield, Crown } from "lucide-react"
import { useRBAC } from "@/hooks/useRBAC"
import { OrganizationRole, getRoleLabelKey, getRoleDescriptionKey, getAssignableRoles, isValidRole } from "@/lib/rbac"
import {
  changeMemberRole,
  removeMember,
  transferOwnership,
  getOrganizationMembersWithEmails,
} from "@/lib/actions/members"
import { useLocale, useTranslations } from "next-intl"
import { logger } from "@/lib/logger"

interface Member {
  id: string
  user_id: string
  organization_id: string
  role: OrganizationRole
  invited_at: string
  user_email: string
}

interface Invitation {
  id: string
  email: string
  role: string
  invited_at: string
  expires_at: string
}

interface MemberManagementProps {
  organizationId: string
}

export function MemberManagement({ organizationId }: MemberManagementProps) {
  const t = useTranslations("Dashboard.settings.members")
  const locale = useLocale()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor")
  const [inviting, setInviting] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [selectedMemberForTransfer, setSelectedMemberForTransfer] = useState<Member | null>(null)
  const [transferring, setTransferring] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  const currentMember = members.find((m) => m.user_id === user?.id)
  const rbac = useRBAC(currentMember?.role)

  useEffect(() => {
    fetchMembers()
    fetchInvitations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  async function fetchMembers() {
    setLoading(true)
    try {
      // Use server action to fetch members with emails
      const membersWithEmails = await getOrganizationMembersWithEmails(organizationId)
      setMembers(membersWithEmails)
    } catch (error) {
      logger.error("Failed to fetch members", error, {
        component: "MemberManagement",
        action: "fetchMembers",
        orgId: organizationId,
      })
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.loadMembersFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchInvitations() {
    const { data, error } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", organizationId)
      .is("accepted_at", null)
      .order("invited_at", { ascending: false })

    if (!error && data) {
      setInvitations(data as Invitation[])
    }
  }

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
      // Generate token
      const { data: tokenData } = await supabase.rpc("generate_invitation_token")
      const token = tokenData as string | null

      if (!token) {
        throw new Error("Failed to generate invitation token")
      }

      // Create invitation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("organization_invitations") as any).insert({
        organization_id: organizationId,
        email: inviteEmail,
        role: inviteRole,
        token,
        invited_by: user?.id,
      })

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast({
            title: t("toast.errorTitle"),
            description: t("toast.alreadyInvited"),
            variant: "destructive",
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: t("toast.successTitle"),
          description: t("toast.invitationSent", { email: inviteEmail }),
        })

        // TODO: In production, send invitation email here
        // For now, just show the invitation link
        const inviteUrl = `${window.location.origin}/invite/${token}`
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
        fetchInvitations()
      }
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
    const { error } = await supabase.from("organization_invitations").delete().eq("id", invitationId)

    if (error) {
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.cancelInvitationFailed"),
        variant: "destructive",
      })
    } else {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.invitationCancelled"),
      })
      fetchInvitations()
    }
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    const result = await changeMemberRole(memberId, newRole, locale)

    if (!result.success) {
      toast({
        title: t("toast.errorTitle"),
        description: result.error || t("toast.updateRoleFailed"),
        variant: "destructive",
      })
    } else {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.roleUpdated"),
      })
      fetchMembers()
    }
  }

  async function handleRemoveMemberClick(memberId: string) {
    const result = await removeMember(memberId, locale)

    if (!result.success) {
      toast({
        title: t("toast.errorTitle"),
        description: result.error || t("toast.removeMemberFailed"),
        variant: "destructive",
      })
    } else {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.memberRemoved"),
      })
      fetchMembers()
    }
  }

  async function handleTransferOwnership() {
    if (!selectedMemberForTransfer) return

    setTransferring(true)
    const result = await transferOwnership(selectedMemberForTransfer.user_id, locale)

    if (!result.success) {
      toast({
        title: t("toast.errorTitle"),
        description: result.error || t("toast.transferOwnershipFailed"),
        variant: "destructive",
      })
    } else {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.ownershipTransferred", { email: selectedMemberForTransfer.user_email }),
      })
      setTransferOpen(false)
      setSelectedMemberForTransfer(null)
      fetchMembers()
    }

    setTransferring(false)
  }

  const getRoleBadgeVariant = (role: string) => {
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

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  const assignableRoles = getAssignableRoles(currentMember?.role || "viewer")

  return (
    <div className="space-y-6">
      {/* Members List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("management.teamMembersHeading", { count: members.length })}</h3>
          {rbac.checkPermission("canInviteMembers") && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
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
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{t("role")}</Label>
                    <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as typeof inviteRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(getRoleLabelKey(role))} - {t(getRoleDescriptionKey(role))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    {t("actions.cancel")}
                  </Button>
                  <Button onClick={handleInvite} disabled={inviting}>
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
          )}
        </div>

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
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/50 border-b transition-colors">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-neutral-400" />
                        <span>{member.user_email || member.user_id.slice(0, 8)}</span>
                        {member.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">
                            {t("management.youBadge")}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        {member.role === "owner" && <Crown className="h-3 w-3 text-yellow-600" />}
                        {rbac.canModifyRole(member.role, member.user_id === user?.id) ? (
                          <Select value={member.role} onValueChange={(val) => handleUpdateRole(member.id, val)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {assignableRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {t(getRoleLabelKey(role))}
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
                          {/* Transfer Ownership Button (Owner only) */}
                          {rbac.isOwner && member.role !== "owner" && member.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMemberForTransfer(member)
                                setTransferOpen(true)
                              }}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Crown className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Remove Member Button */}
                          {rbac.canRemoveMember(member.role, member.user_id === user?.id) && (
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
                                    onClick={() => handleRemoveMemberClick(member.id)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("management.transferDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("management.transferDialog.description", { email: selectedMemberForTransfer?.user_email || "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-900 dark:text-yellow-200">
              <strong>{t("management.transferDialog.warningTitle")}</strong>{" "}
              {t("management.transferDialog.warningBody")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)} disabled={transferring}>
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={handleTransferOwnership}
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

      {/* Pending Invitations */}
      {rbac.checkPermission("canInviteMembers") && invitations.length > 0 && (
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
                            getRoleLabelKey(
                              isValidRole(invitation.role) ? (invitation.role as OrganizationRole) : "viewer"
                            )
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
                          onClick={() => handleCancelInvitation(invitation.id)}
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
      )}
    </div>
  )
}
