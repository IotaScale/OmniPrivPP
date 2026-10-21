'use client';

import React, { useState } from 'react';
import {
  inviteTeamMemberAction,
  updateMemberRoleAction,
  removeTeamMemberAction,
} from '@/lib/actions/partner-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Crown,
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
            <Users className="h-6 w-6 text-cyan-400" />
            <span>Team & Access Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage partner team access, roles, and opportunity registration privileges.
          </p>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowInviteModal(true)}
            className="gap-2 shadow-cyan-950/80 shadow-md"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Team Member</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Team Members List */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-y border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold">Team Member</th>
                  <th className="py-3 px-6 font-semibold">Business Email</th>
                  <th className="py-3 px-6 font-semibold">Organization Role</th>
                  <th className="py-3 px-6 font-semibold">Joined Date</th>
                  {isOwner && <th className="py-3 px-6 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {members.map((m) => {
                  const isCurrent = m.user.id === currentUserId;
                  const isSoleOwner =
                    m.role === 'partner_owner' &&
                    members.filter((x) => x.role === 'partner_owner').length === 1;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span>{m.user.full_name}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">{m.user.email}</td>
                      <td className="py-3.5 px-6">
                        <Badge
                          variant={m.role === 'partner_owner' ? 'default' : 'neutral'}
                          size="sm"
                          className="gap-1"
                        >
                          {m.role === 'partner_owner' && <Crown className="h-3 w-3" />}
                          <span>{m.role === 'partner_owner' ? 'Partner Owner' : 'Partner Member'}</span>
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-slate-400">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </td>

                      {isOwner && (
                        <td className="py-3.5 px-6 text-right">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-cyan-400" />
              <span>Invite Team Member</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              New team members can register deals and work assigned leads under your partner organization.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <Input label="Full Name" name="fullName" placeholder="Sarah Jenkins" required />
              <Input
                label="Work Email Address"
                name="email"
                type="email"
                placeholder="sjenkins@partnercompany.com"
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Access Role</label>
                <select
                  name="role"
                  defaultValue="partner_member"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                >
                  <option value="partner_member">Partner Member (Submit deals & work leads)</option>
                  <option value="partner_owner">Partner Owner (Full team & profile admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
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
