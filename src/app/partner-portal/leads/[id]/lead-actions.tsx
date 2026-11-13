'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { acceptLeadAction, declineLeadAction, updateLeadStatusAction } from '@/lib/actions/leads';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  FilePlus2,
  Clock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export function PartnerLeadActions({
  assignmentId,
  acceptanceStatus,
  currentStatus,
  convertedDealId,
  convertedReference,
}: {
  assignmentId: string;
  acceptanceStatus: string;
  currentStatus: string;
  convertedDealId?: string | null;
  convertedReference?: string | null;
}) {
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append('assignmentId', assignmentId);
    const res = await acceptLeadAction(fd);
    setIsSubmitting(false);
    if (res?.error) setError(res.error);
  };

  const handleDecline = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.append('assignmentId', assignmentId);
    const res = await declineLeadAction(fd);
    setIsSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setShowDeclineModal(false);
    }
  };

  const handleUpdateStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('assignmentId', assignmentId);
    fd.append('status', newStatus);
    await updateLeadStatusAction(fd);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {acceptanceStatus === 'pending' && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleAccept}
            isLoading={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Accept Lead Opportunity</span>
          </Button>

          <Button
            variant="danger"
            size="md"
            onClick={() => setShowDeclineModal(true)}
            disabled={isSubmitting}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            <span>Decline with Reason</span>
          </Button>
        </div>
      )}

      {acceptanceStatus === 'accepted' && (
        <div className="flex flex-wrap items-center gap-4">
          {!convertedDealId ? (
            <Link href={`/partner-portal/deals/new?leadAssignmentId=${assignmentId}`}>
              <Button variant="primary" size="md" className="gap-2">
                <FilePlus2 className="h-4 w-4" />
                <span>Convert to Deal Registration</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-300">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>Converted to Deal:</span>
              <Link
                href={`/partner-portal/deals/${convertedDealId}`}
                className="font-mono font-bold underline underline-offset-2 hover:text-white"
              >
                {convertedReference}
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Work Stage:</span>
            <select
              value={currentStatus}
              onChange={handleUpdateStatus}
              disabled={isSubmitting || Boolean(convertedDealId)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="working">In Progress (Working)</option>
              <option value="qualified">Qualified Prospect</option>
              <option value="disqualified">Disqualified</option>
              {convertedDealId && <option value="converted">Converted to Deal</option>}
            </select>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Decline Lead Assignment</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please declare why your organization is declining this inbound opportunity. The lead will be returned to OmniPriv Channel Operations for reassignment.
            </p>

            <form onSubmit={handleDecline} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Reason for Declining <span className="text-rose-400">*</span>
                </label>
                <textarea
                  name="reason"
                  rows={3}
                  required
                  placeholder="e.g. Resource bandwidth / out of territory / commercial conflict..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeclineModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Confirm Decline
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
