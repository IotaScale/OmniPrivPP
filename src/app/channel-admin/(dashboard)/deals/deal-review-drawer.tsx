'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  approveDealAction,
  declineDealAction,
  declineDealAsDuplicateAction,
  extendProtectionAction,
  setDealOutcomeAction,
} from '@/lib/actions/admin-deals';
import { deleteDealRegistrationAction } from '@/lib/actions/admin-delete';
import { pluralize } from '@/lib/utils/admin-delete-guards';
import { Button } from '@/components/ui/button';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { StatusBadge } from '@/components/ui/badge';
import type { DealMatchView } from '@/lib/utils/deal-matching';
import { MatchKindBadge, MatchReasonChips, MatchSeverityBadge } from './match-badges';
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
  ExternalLink,
  Copy,
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

/** Shared delete control for a deal (table row and review drawer). */
export function DeleteDealButton({
  deal,
  onDeleted,
  iconOnly = false,
}: {
  deal: Pick<DealWithRelations, 'id' | 'public_reference' | 'customer_legal_name' | 'status_history' | 'organization'>;
  onDeleted?: () => void;
  iconOnly?: boolean;
}) {
  return (
    <ConfirmDelete
      iconOnly={iconOnly}
      title="Delete deal registration"
      entityName={`${deal.public_reference} · ${deal.customer_legal_name}`}
      description={`Submitted by ${deal.organization.display_name}. The partner will no longer see this deal.`}
      impacts={[
        pluralize(deal.status_history.length, 'status history entry', 'status history entries'),
        'Deal protection and any duplicate/conflict flags for this registration',
      ]}
      action={() => deleteDealRegistrationAction(deal.id)}
      onDeleted={onDeleted}
    />
  );
}

export function DealReviewDrawer({
  deal,
  onClose,
  matches,
}: {
  deal: DealWithRelations;
  onClose: () => void;
  matches: DealMatchView[];
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'approve' | 'decline' | 'extend' | 'outcome'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [override, setOverride] = useState(false);

  const blockingMatches = matches.filter((m) => m.blocking);
  const isPending = deal.status === 'awaiting_approval';

  const handleDeclineDuplicate = async (match: DealMatchView) => {
    const ok = window.confirm(
      `Decline ${deal.public_reference} as a duplicate of ${match.reference}? The partner is notified.`
    );
    if (!ok) return;
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append('dealId', deal.id);
    fd.append('duplicateOfId', match.dealId);
    const res = await declineDealAsDuplicateAction(fd);
    setIsSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const handleApprove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.append('dealId', deal.id);
    if (override) fd.append('override', 'true');
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
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/50">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-cyan-400">
                {deal.public_reference}
              </span>
              <StatusBadge status={deal.status} />
              {matches.length > 0 && <MatchSeverityBadge matches={matches} />}
            </div>
            <h2 className="text-lg font-bold text-white mt-1 break-words">
              {deal.customer_legal_name}
            </h2>
            <p className="text-xs text-slate-400">
              Submitted by <strong className="text-slate-200">{deal.organization.display_name}</strong> ({deal.organization.tier} Tier)
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close review"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
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

          <div className="ml-auto pl-2 shrink-0">
            <DeleteDealButton deal={deal} onDeleted={onClose} />
          </div>
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
              {/* Live duplicate / conflict matches */}
              <section
                aria-labelledby="deal-matches-heading"
                className={`rounded-xl border text-xs ${
                  blockingMatches.length > 0
                    ? 'border-rose-500/40 bg-rose-500/[0.06]'
                    : matches.length > 0
                      ? 'border-amber-500/30 bg-amber-500/[0.05]'
                      : 'border-slate-800 bg-slate-950/70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
                  <h3 id="deal-matches-heading" className="flex items-center gap-2 font-bold text-slate-100">
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        blockingMatches.length > 0
                          ? 'text-rose-400'
                          : matches.length > 0
                            ? 'text-amber-400'
                            : 'text-slate-500'
                      }`}
                    />
                    <span>Possible duplicates &amp; conflicts</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Checked live against pending, protected and recently won deals
                  </span>
                </div>

                {matches.length === 0 ? (
                  <p className="px-4 pb-4 pt-2 text-slate-400">
                    No other registration matches this customer&rsquo;s domain, company name or contact domain.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-800/80 border-t border-slate-800/80">
                    {matches.map((m) => (
                      <li key={m.dealId} className="px-4 py-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <Link
                              href={`/channel-admin/deals?id=${m.dealId}`}
                              className="inline-flex items-center gap-1 font-mono font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                            >
                              {m.reference}
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </Link>
                            <MatchKindBadge kind={m.kind} blocking={m.blocking} />
                            <StatusBadge status={m.status} />
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Submitted {new Date(m.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                          <div className="min-w-0">
                            <span className="text-slate-500">Partner: </span>
                            <span className="text-slate-200 font-medium break-words">{m.partnerName}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-slate-500">Customer: </span>
                            <span className="text-slate-200 break-words">{m.customerName}</span>{' '}
                            <span className="font-mono text-cyan-400 break-all">{m.customerDomain}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Protection: </span>
                            <span className="font-mono text-slate-300">
                              {m.status === 'approved'
                                ? m.protectionExpiresAt
                                  ? `until ${new Date(m.protectionExpiresAt).toLocaleDateString()}`
                                  : 'no expiry'
                                : '—'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <MatchReasonChips reasons={m.reasons} />
                          {isPending && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isSubmitting}
                              onClick={() => handleDeclineDuplicate(m)}
                              className="h-7 px-2 text-[11px] text-rose-400 hover:bg-rose-500/10"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Decline as duplicate</span>
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {deal.conflict_reason && (
                  <p className="border-t border-slate-800/80 px-4 py-3 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Flagged at submission: </span>
                    {deal.conflict_reason}
                  </p>
                )}
              </section>

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

              {blockingMatches.length > 0 ? (
                <div role="alert" className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Blocked by an existing protected registration</span>
                  </div>
                  <ul className="space-y-1 text-slate-300">
                    {blockingMatches.map((m) => (
                      <li key={m.dealId}>
                        <span className="font-mono text-cyan-400">{m.reference}</span> &middot; {m.partnerName} &middot;{' '}
                        {m.status === 'closed_won' ? 'closed won recently' : 'protected'}
                        {m.status === 'approved' && m.protectionExpiresAt
                          ? ` until ${new Date(m.protectionExpiresAt).toLocaleDateString()}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                  <label className="flex items-start gap-2 pt-2 border-t border-rose-500/20 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={override}
                      onChange={(e) => setOverride(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-rose-500"
                    />
                    <span>
                      Override protection and approve anyway. A decision reason is required and the override is
                      recorded in the audit log.
                    </span>
                  </label>
                </div>
              ) : matches.length > 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    {matches.length} possible {matches.length === 1 ? 'match' : 'matches'} (
                    {matches.map((m) => m.reference).join(', ')}). Approval is allowed &mdash; review the overlap on
                    the Details tab first.
                  </span>
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="approve-decision-reason" className="text-xs font-medium text-slate-300">
                  Decision Rationale / Partner Visible Note
                  {blockingMatches.length > 0 && <span className="text-rose-400"> * required for override</span>}
                </label>
                <textarea
                  id="approve-decision-reason"
                  name="decisionReason"
                  rows={3}
                  required={blockingMatches.length > 0}
                  defaultValue={
                    blockingMatches.length > 0
                      ? ''
                      : 'Approved with 90-day exclusive deal protection. OmniPriv Channel Sales will engage for customer architecture alignment.'
                  }
                  placeholder={
                    blockingMatches.length > 0
                      ? 'Why this registration should be protected despite the existing claim'
                      : undefined
                  }
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
                  disabled={blockingMatches.length > 0 && !override}
                  className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{blockingMatches.length > 0 ? 'Override & Approve' : 'Confirm Approval & Grant Protection'}</span>
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
