'use client';

import React, { useState } from 'react';
import { updatePartnerTierAction, togglePartnerStatusAction } from '@/lib/actions/admin-partners';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import {
  Building2,
  Award,
  Users,
  FileSpreadsheet,
  Inbox,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface PartnerRow {
  id: string;
  legal_name: string;
  display_name: string;
  website: string;
  country: string;
  region: string;
  partner_type: string;
  tier: string;
  status: string;
  created_at: Date | string;
  memberships: Array<{
    role: string;
    user: { full_name: string; email: string };
  }>;
  _count: {
    memberships: number;
    deals: number;
    lead_assignments: number;
  };
  deals: Array<{
    estimated_deal_value?: number | null;
    status: string;
  }>;
}

export function ChannelAdminPartnersClient({
  partners,
}: {
  partners: PartnerRow[];
}) {
  const [selectedPartner, setSelectedPartner] = useState<PartnerRow | null>(null);
  const [showTierModal, setShowTierModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTierSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.append('partnerOrgId', selectedPartner.id);
    const res = await updatePartnerTierAction(fd);
    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setShowTierModal(false);
    }
  };

  const handleToggleStatus = async (partner: PartnerRow) => {
    const nextStatus = partner.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to mark ${partner.display_name} as ${nextStatus}?`)) {
      return;
    }
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('partnerOrgId', partner.id);
    fd.append('status', nextStatus);
    await togglePartnerStatusAction(fd);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-cyan-400" />
            <span>Channel Partner Directory</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered organizations, tier advancements, team size, and commercial pipeline.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {partners.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/50">
          No partner companies registered yet.
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold">Partner Organization</th>
                  <th className="py-3 px-6 font-semibold">Tier</th>
                  <th className="py-3 px-6 font-semibold">Owner & Team</th>
                  <th className="py-3 px-6 font-semibold">Classification</th>
                  <th className="py-3 px-6 font-semibold">Deals / Leads</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {partners.map((p) => {
                  const owner = p.memberships.find((m) => m.role === 'partner_owner');

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-100">
                        <div>{p.display_name}</div>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {p.legal_name} • {p.website}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge
                          variant={
                            p.tier === 'Platinum'
                              ? 'success'
                              : p.tier === 'Gold'
                              ? 'warning'
                              : p.tier === 'Silver'
                              ? 'info'
                              : 'default'
                          }
                          size="sm"
                        >
                          {p.tier}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="text-slate-200">
                          {owner?.user.full_name || 'No Owner'}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {owner?.user.email} • {p._count.memberships} members
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="text-slate-200">{p.partner_type}</div>
                        <span className="text-[11px] text-slate-400">
                          {p.region} ({p.country})
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono">
                        <span className="text-slate-200 font-semibold">{p._count.deals}</span> deals /{' '}
                        <span className="text-cyan-400 font-semibold">
                          {p._count.lead_assignments}
                        </span>{' '}
                        leads
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedPartner(p);
                              setShowTierModal(true);
                            }}
                          >
                            Update Tier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 text-xs ${
                              p.status === 'active'
                                ? 'text-rose-400 hover:bg-rose-500/10'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            onClick={() => handleToggleStatus(p)}
                            disabled={isSubmitting}
                          >
                            {p.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Tier Modal */}
      {showTierModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-cyan-400" />
              <span>Update Tier: {selectedPartner.display_name}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Advancing a partner tier grants access to higher enablement resources, deal margins, and priority inbound lead routing.
            </p>

            <form onSubmit={handleTierSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Partner Tier</label>
                <select
                  name="tier"
                  defaultValue={selectedPartner.tier}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                >
                  <option value="Registered">Registered (Entry level)</option>
                  <option value="Silver">Silver (Certified technical engineers)</option>
                  <option value="Gold">Gold (High annual revenue commitment)</option>
                  <option value="Platinum">Platinum (Elite national distributor/SI)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Justification / Audit Note <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  name="reason"
                  rows={3}
                  required
                  placeholder="e.g. Achieved 2 certified PAM implementation engineers and surpassed annual quota..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTierModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                 
                >
                  Apply Tier Change
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
