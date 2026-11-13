'use client';

import React, { useState } from 'react';
import {
  inviteTeamMemberAction,
  resendTeamInviteAction,
  updateMemberRoleAction,
  removeTeamMemberAction,
  type InviteActionResult,
} from '@/lib/actions/partner-management';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Crown,
  X,
  Copy,
  Check,
  Mail,
  Send,
  Clock,
} from 'lucide-react';

interface InviteNotice {
  email: string;
  inviteUrl?: string;
}

interface MemberRow {
  id: string; // membership id
  role: string;
  joined_at: Date | string;
  user: {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
  };
}

export function TeamManagementClient({
  members,
  currentUserId,
  isOwner,
  pendingInviteUserIds = [],
}: {
  members: MemberRow[];
  currentUserId: string;
  isOwner: boolean;
  pendingInviteUserIds?: string[];
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<InviteNotice | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const pendingIds = new Set(pendingInviteUserIds);

  /** Toast on emailed invites; otherwise keep a copyable link on screen. */
  const reportInvite = (res: Extract<InviteActionResult, { success: true }>, resend = false) => {
    if (res.emailSent) {
      setNotice(null);
      toast.success(resend ? `Invitation re-sent to ${res.email}` : `Invitation emailed to ${res.email}`);
      return;
    }
    setCopied(false);
    setNotice({ email: res.email, inviteUrl: res.inviteUrl });
  };

  const copyInviteLink = async () => {
    if (!notice?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(notice.inviteUrl);
      setCopied(true);
    } catch {
      toast.error('Could not copy the link. Select it and copy it manually.');
    }
  };

  const handleResend = async (membershipId: string) => {
    setResendingId(membershipId);
    setError(null);
    const res = await resendTeamInviteAction(membershipId);
    setResendingId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.success) reportInvite(res, true);
  };

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await inviteTeamMemberAction(fd);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      setShowInviteModal(false);
      reportInvite(res);
    }
  };

  const handleRoleChange = async (membershipId: string, currentRole: string) => {
    const newRole = currentRole === 'partner_owner' ? 'partner_member' : 'partner_owner';
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append('membershipId', membershipId);
    fd.append('role', newRole);
    const res = await updateMemberRoleAction(fd);
    setIsSubmitting(false);
    if (res?.error) setError(res.error);
  };

  const handleRemove = async (membershipId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from your partner organization?`)) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append('membershipId', membershipId);
    const res = await removeTeamMemberAction(fd);
    setIsSubmitting(false);
    if (res?.error) setError(res.error);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#00B8DB]" />
            <span>Team & Access Governance</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage partner team authorization, roles, and opportunity registration privileges.
          </p>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowInviteModal(true)}
            className="gap-2 shadow-lg shadow-[#00B8DB]/20"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Team Member</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="relative rounded-2xl border border-line bg-surface p-4 pl-5 text-ink shadow-[var(--op-pop-shadow)] overflow-hidden"
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
            <div className="flex-1 min-w-0 space-y-3">
              {notice.inviteUrl ? (
                <p className="text-[0.875rem] font-semibold text-ink">
                  Email isn&apos;t configured — copy the invite link and send it to{' '}
                  <span className="break-all">{notice.email}</span>
                </p>
              ) : (
                <p className="text-[0.875rem] font-semibold text-ink">
                  <span className="break-all">{notice.email}</span> was added, but the notification email
                  couldn&apos;t be sent. Let them know they can sign in with their existing password.
                </p>
              )}
              {notice.inviteUrl && (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      readOnly
                      value={notice.inviteUrl}
                      aria-label="Invite link"
                      onFocus={(e) => e.currentTarget.select()}
                      className="min-w-0 flex-1 rounded-lg border border-line bg-surface-muted px-3 py-2 font-mono text-[0.75rem] text-ink-soft"
                    />
                    <Button type="button" variant="primary" size="sm" onClick={copyInviteLink} className="gap-1.5 shrink-0">
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy link'}</span>
                    </Button>
                  </div>
                  <p className="text-[0.75rem] text-ink-muted">
                    The link is single-use and expires in 7 days. Only share it with {notice.email}.
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
              className="shrink-0 -m-1 p-1.5 rounded-lg text-ink-subtle hover:text-ink hover:bg-surface-hover transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 dark:bg-[#15171a] text-slate-400 uppercase tracking-wider text-[11px] border-y border-white/[0.08]">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Team Member</th>
                  <th className="py-3.5 px-6 font-semibold">Business Email</th>
                  <th className="py-3.5 px-6 font-semibold">Organization Role</th>
                  <th className="py-3.5 px-6 font-semibold">Joined Date</th>
                  {isOwner && <th className="py-3.5 px-6 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {members.map((m) => {
                  const isCurrent = m.user.id === currentUserId;
                  const isPending = isOwner && pendingIds.has(m.user.id);
                  const isSoleOwner =
                    m.role === 'partner_owner' &&
                    members.filter((x) => x.role === 'partner_owner').length === 1;

                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span>{m.user.full_name}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00B8DB]/15 border border-[#00B8DB]/30 text-[#00B8DB] font-medium">
                              You
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-medium">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              Invite pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">{m.user.email}</td>
                      <td className="py-4 px-6">
                        <Badge
                          variant={m.role === 'partner_owner' ? 'default' : 'neutral'}
                          size="sm"
                          className="gap-1 font-semibold"
                        >
                          {m.role === 'partner_owner' && <Crown className="h-3 w-3 text-amber-400" />}
                          <span>{m.role === 'partner_owner' ? 'Partner Owner' : 'Partner Member'}</span>
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </td>

                      {isOwner && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isSubmitting || resendingId !== null}
                                isLoading={resendingId === m.id}
                                onClick={() => handleResend(m.id)}
                                className="gap-1.5 text-xs text-[#00B8DB] hover:text-[#00B8DB]"
                                title="Send a new set-your-password link"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span>Resend invite</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isSubmitting || isSoleOwner}
                              onClick={() => handleRoleChange(m.id, m.role)}
                              className="text-xs text-slate-300 hover:text-white"
                              title={
                                isSoleOwner
                                  ? 'Cannot demote the last remaining owner'
                                  : 'Switch role'
                              }
                            >
                              {m.role === 'partner_owner' ? 'Demote to Member' : 'Promote to Owner'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isSubmitting || isSoleOwner || isCurrent}
                              onClick={() => handleRemove(m.id, m.user.full_name)}
                              className="text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-7 px-2"
                              title={
                                isSoleOwner
                                  ? 'Cannot remove the last remaining owner'
                                  : 'Remove member'
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-xl bg-slate-900 dark:bg-[#15171a] border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#00B8DB]/10 text-[#00B8DB] flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <span>Invite Team Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              New team members can register customer deals, manage renewals, and complete technical certifications under your partner account.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <Input label="Full Name" name="fullName" placeholder="e.g. Sarah Jenkins" required />
              <Input
                label="Business Email Address"
                name="email"
                type="email"
                placeholder="sjenkins@partnercompany.com"
                required
              />

              <Select
                label="Access Role"
                name="role"
                defaultValue="partner_member"
              >
                <option value="partner_member">Partner Member (Register deals & work leads)</option>
                <option value="partner_owner">Partner Owner (Full team & profile management)</option>
              </Select>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                  className="border-white/[0.1] text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="shadow-md shadow-[#00B8DB]/20"
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
