'use client';

import React, { useState } from 'react';
import {
  approveDealAction,
  declineDealAction,
  extendProtectionAction,
  setDealOutcomeAction,
} from '@/lib/actions/admin-deals';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  History,
  Building,
  Calendar,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

interface DealWithRelations {
  id: string;
  public_reference: string;
  customer_legal_name: string;
  customer_domain: string;
  customer_country: string;
  customer_industry?: string | null;
  customer_contact_name: string;
  customer_contact_email: string;
  customer_contact_phone?: string | null;
  product_interest: string;
  deployment_type: string;
  estimated_deal_value?: number | null;
  currency: string;
  expected_seat_count?: number | null;
  expected_close_date?: Date | string | null;
  status: string;
  conflict_detected: boolean;
  conflict_reason?: string | null;
  protection_starts_at?: Date | string | null;
  protection_expires_at?: Date | string | null;
  admin_decision_reason?: string | null;
  created_at: Date | string;
  organization: {
    id: string;
    display_name: string;
    tier: string;
  };
  submitted_by: {
    full_name: string;
    email: string;
  };
  status_history: Array<{
    id: string;
    new_status: string;
    note?: string | null;
    created_at: Date | string;
  }>;
}

export function DealReviewDrawer({
  deal,
  onClose,
  conflictingDeals,
}: {
  deal: DealWithRelations;
  onClose: () => void;
  conflictingDeals: Array<{
    id: string;
    public_reference: string;
    customer_legal_name: string;
    status: string;
    protection_expires_at?: Date | string | null;
    organization: { display_name: string };
  }>;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'approve' | 'decline' | 'extend' | 'outcome'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.append('dealId', deal.id);
    const res = await approveDealAction(fd);
    setIsSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const handleDecline = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.append('dealId', deal.id);
    const res = await declineDealAction(fd);
    setIsSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const handleExtend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.append('dealId', deal.id);
    const res = await extendProtectionAction(fd);
    setIsSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const handleOutcome = async (outcome: 'closed_won' | 'closed_lost') => {
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append('dealId', deal.id);
    fd.append('outcome', outcome);
    const res = await setDealOutcomeAction(fd);
    setIsSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-cyan-400">
                {deal.public_reference}
              </span>
              <StatusBadge status={deal.status} />
              {deal.conflict_detected && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  CONFLICT
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {deal.customer_legal_name}
            </h2>
            <p className="text-xs text-slate-400">
              Submitted by <strong className="text-slate-200">{deal.organization.display_name}</strong> ({deal.organization.tier} Tier)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center gap-2 overflow-x-auto">
          <Button
            variant={activeTab === 'details' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('details')}
          >
            Details & History
          </Button>

          {deal.status === 'awaiting_approval' && (
            <>
              <Button
                variant={activeTab === 'approve' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('approve')}
                className="gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Approve (90 Days)</span>
              </Button>
              <Button
                variant={activeTab === 'decline' ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('decline')}
                className="gap-1.5 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Decline</span>
              </Button>
            </>
          )}

          {deal.status === 'approved' && (
            <>
              <Button
                variant={activeTab === 'extend' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('extend')}
                className="gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Extend Protection</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOutcome('closed_won')}
                disabled={isSubmitting}
                className="text-emerald-400 hover:bg-emerald-500/10"
              >
                Closed Won
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOutcome('closed_lost')}
                disabled={isSubmitting}
                className="text-slate-400 hover:bg-slate-800"
              >
                Closed Lost
              </Button>
            </>
          )}
        </div>

        {error && (
          <div className="m-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Drawer Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Conflict Analysis Banner if any */}
              {deal.conflict_detected && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Domain Conflict Detected on {deal.customer_domain}</span>
                  </div>
                  {deal.conflict_reason && (
                    <p className="text-slate-300">{deal.conflict_reason}</p>
                  )}
                  {conflictingDeals.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-rose-500/20 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">
                        Conflicting Channel Registrations:
                      </span>
                      {conflictingDeals.map((cd) => (
                        <div
                          key={cd.id}
                          className="p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-mono text-cyan-400 mr-2">{cd.public_reference}</span>
                            <span className="text-slate-300">{cd.organization.display_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={cd.status} />
                            {cd.protection_expires_at && (
                              <span className="font-mono text-slate-400">
                                exp: {new Date(cd.protection_expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Commercial & Customer Spec */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Normalized Domain:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{deal.customer_domain}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Territory & Industry:</span>
                  <span className="text-slate-200">{deal.customer_country} • {deal.customer_industry || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Contact:</span>
                  <span className="text-slate-200">{deal.customer_contact_name} ({deal.customer_contact_email})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Phone:</span>
                  <span className="text-slate-200">{deal.customer_contact_phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Product Interest:</span>
                  <span className="text-slate-200 font-medium">{deal.product_interest}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Deployment Type:</span>
                  <span className="text-slate-200 font-medium">{deal.deployment_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Deal Value:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {deal.estimated_deal_value
                      ? `${deal.currency} ${deal.estimated_deal_value.toLocaleString()}`
                      : 'Not declared'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Privileged Seats:</span>
                  <span className="font-mono text-slate-200">{deal.expected_seat_count || 'Standard'}</span>
                </div>
              </div>

              {/* Protection Details */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                  Deal Protection Details
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Starts At:</span>
                    <span className="font-mono text-slate-300">
                      {deal.protection_starts_at ? new Date(deal.protection_starts_at).toLocaleDateString() : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Expires At:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {deal.protection_expires_at ? new Date(deal.protection_expires_at).toLocaleDateString() : 'Pending'}
                    </span>
                  </div>
                </div>
                {deal.admin_decision_reason && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 block">Channel Review Note:</span>
                    <p className="text-slate-300 mt-0.5">{deal.admin_decision_reason}</p>
                  </div>
                )}
              </div>

              {/* Status History */}
              <div className="space-y-3">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                  Audit & Status Timeline
                </span>
                <div className="space-y-3">
                  {deal.status_history.map((hist) => (
                    <div key={hist.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 capitalize">
                          {hist.new_status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(hist.created_at).toLocaleString()}
                        </span>
                      </div>
                      {hist.note && <p className="text-slate-400 mt-1">{hist.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* APPROVE FORM */}
          {activeTab === 'approve' && (
            <form onSubmit={handleApprove} className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Grant 90-Day Exclusive Deal Protection</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Approving grants {deal.organization.display_name} exclusive registered deal protection on domain{' '}
                  <strong className="font-mono text-emerald-300">{deal.customer_domain}</strong> for exactly 90 days from right now.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Decision Rationale / Partner Visible Note
                </label>
                <textarea
                  name="decisionReason"
                  rows={3}
                  defaultValue="Approved with 90-day exclusive deal protection. OmniPriv Channel Sales will engage for customer architecture alignment."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('details')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Confirm Approval & Grant Protection</span>
                </Button>
              </div>
            </form>
          )}

          {/* DECLINE FORM */}
          {activeTab === 'decline' && (
            <form onSubmit={handleDecline} className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Decline Deal Registration</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Provide an objective explanation. This reason will be visible to the partner on their deal dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Decline Reason (Mandatory) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  name="reason"
                  rows={4}
                  required
                  placeholder="e.g. Existing exclusive protection held by another partner / customer is a named direct account / insufficient qualification details..."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('details')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isSubmitting}
                  className="gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Confirm Decline</span>
                </Button>
              </div>
            </form>
          )}

          {/* EXTEND PROTECTION FORM */}
          {activeTab === 'extend' && (
            <form onSubmit={handleExtend} className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Extend Protection Period</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Extends exclusive protection window. An immutable audit event will record your rationale.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Days to Add</label>
                  <select
                    name="daysToAdd"
                    defaultValue="90"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                  >
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Extension Rationale (Audit Compliance) <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  name="reason"
                  rows={3}
                  required
                  placeholder="e.g. Customer procurement cycle extended due to Q3 RFP timeline; active joint PoC in progress..."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('details')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="gap-1.5"
                >
                  <Clock className="h-4 w-4" />
                  <span>Apply Protection Extension</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
