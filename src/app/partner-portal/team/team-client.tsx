'use client';

import React, { useState } from 'react';
import {
  inviteTeamMemberAction,
  updateMemberRoleAction,
  removeTeamMemberAction,
} from '@/lib/actions/partner-management';
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
} from 'lucide-react';

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
}: {
  members: MemberRow[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await inviteTeamMemberAction(fd);
    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setShowInviteModal(false);
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

      {/* Team Members List */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 dark:bg-[#050B16] text-slate-400 uppercase tracking-wider text-[11px] border-y border-white/[0.08]">
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
          <div className="max-w-md w-full rounded-xl bg-slate-900 dark:bg-[#0d1424] border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
