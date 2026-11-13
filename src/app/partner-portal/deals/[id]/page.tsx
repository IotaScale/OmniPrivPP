import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { findDealMatches } from '@/lib/utils/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Building,
  User,
  DollarSign,
  AlertTriangle,
  History,
  CheckCircle2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartnerDealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await requirePartnerSession();
  const { id } = await params;
  const { submitted } = await searchParams;

  const deal = await prisma.dealRegistration.findUnique({
    where: { id },
    include: {
      status_history: {
        orderBy: { created_at: 'desc' },
      },
      submitted_by: {
        select: { full_name: true, email: true },
      },
    },
  });

  // Strict multi-tenant isolation guard:
  // If deal does not exist or belongs to another partner organization, return 404
  if (!deal || deal.partner_organization_id !== session.partnerOrgId) {
    notFound();
  }

  // Overlap note for pending deals. Only this partner's own matching deals are
  // ever named; other partners' registrations stay anonymous.
  const isPending = deal.status === 'awaiting_approval';
  const liveMatches = isPending ? await findDealMatches(deal, { excludeDealId: deal.id }) : [];
  const ownDuplicates = liveMatches.filter(
    (m) => m.kind === 'duplicate' && m.candidate.partner_organization_id === session.partnerOrgId
  );
  const showOverlapNote = isPending && (deal.conflict_detected || liveMatches.length > 0);

  const nextStepMap: Record<string, { message: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    awaiting_approval: {
      message: 'OmniPriv Channel Operations is currently reviewing this registration against existing channel protections.',
      color: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: Clock,
    },
    approved: {
      message: `Opportunity approved! Exclusive deal protection is active until ${
        deal.protection_expires_at ? new Date(deal.protection_expires_at).toLocaleDateString() : 'the specified date'
      }. Contact your OmniPriv Channel Account Manager for joint technical validation.`,
      color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: ShieldCheck,
    },
    declined: {
      message: 'This registration was declined by OmniPriv Channel Operations. Please review the Channel decision note below.',
      color: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      icon: ShieldAlert,
    },
    expired: {
      message: 'The 90-day deal protection period for this opportunity has expired. Contact OmniPriv Channel Team if you need to request an extension.',
      color: 'bg-slate-800 border-slate-700 text-slate-400',
      icon: AlertTriangle,
    },
    closed_won: {
      message: 'Deal successfully closed won! Subscription provisioning and license keys are managed by OmniPriv Operations.',
      color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: CheckCircle2,
    },
    closed_lost: {
      message: 'This opportunity has been marked closed lost.',
      color: 'bg-slate-800 border-slate-700 text-slate-400',
      icon: History,
    },
  };

  const nextStep = nextStepMap[deal.status] || {
    message: 'Opportunity in progress.',
    color: 'bg-slate-800 border-slate-700 text-slate-400',
    icon: History,
  };
  const StepIcon = nextStep.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/partner-portal/deals">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Deals</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <span className="font-mono text-xs text-slate-400">{deal.public_reference}</span>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={deal.status} />
        </div>
      </div>

      {/* Submission Flash Alert */}
      {submitted && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 text-sm flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-cyan-300">
              Deal Registration Successfully Submitted!
            </strong>
            <p className="text-xs text-slate-300 mt-0.5">
              Reference: <strong className="font-mono text-cyan-400">{deal.public_reference}</strong>. Your deal registration is awaiting OmniPriv review. Deal protection starts only after approval.
            </p>
          </div>
        </div>
      )}

      {/* Operational Next Step Guidance Box */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${nextStep.color}`}>
        <StepIcon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-semibold block mb-0.5">Status Guidance:</strong>
          <span>{nextStep.message}</span>
        </div>
      </div>

      {/* Overlap note (partner-safe: never names other partners or their references) */}
      {showOverlapNote && (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 min-w-0">
            <strong className="font-semibold block">Under review &mdash; possible overlap with an existing registration</strong>
            <span className="block text-slate-300">
              This customer may already be registered. OmniPriv Channel Operations will check the overlap before
              deciding on protection; no action is needed from you unless we contact you.
            </span>
            {ownDuplicates.length > 0 && (
              <span className="block text-slate-300">
                Your company&rsquo;s matching registration{ownDuplicates.length === 1 ? '' : 's'}:{' '}
                {ownDuplicates.map((m, i) => (
                  <React.Fragment key={m.candidate.id}>
                    {i > 0 && ', '}
                    <Link
                      href={`/partner-portal/deals/${m.candidate.id}`}
                      className="font-mono font-semibold text-cyan-400 hover:underline"
                    >
                      {m.candidate.public_reference}
                    </Link>
                  </React.Fragment>
                ))}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Admin Decision Reason if present */}
      {deal.admin_decision_reason && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
          <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
            Channel Operations Decision Note:
          </span>
          <p className="text-slate-200 font-medium">{deal.admin_decision_reason}</p>
          {deal.reviewed_at && (
            <span className="text-[10px] text-slate-500 block">
              Reviewed on {new Date(deal.reviewed_at).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Customer & Commercial Data */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4 text-cyan-400" />
                <span>Customer & Commercial Scope</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Customer Legal Name:</span>
                  <span className="text-sm font-semibold text-white">{deal.customer_legal_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Customer Domain:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{deal.customer_domain}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Country & Industry:</span>
                  <span className="text-slate-300">{deal.customer_country} • {deal.customer_industry || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Customer Contact:</span>
                  <span className="text-slate-300">{deal.customer_contact_name} ({deal.customer_contact_email})</span>
                  {deal.customer_contact_phone && (
                    <span className="text-slate-500 block">{deal.customer_contact_phone}</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Product Interest:</span>
                  <span className="text-slate-200 font-medium">{deal.product_interest}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Deployment Architecture:</span>
                  <span className="text-slate-200 font-medium">{deal.deployment_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Deal Value:</span>
                  <span className="font-mono text-slate-100 font-semibold text-sm">
                    {deal.estimated_deal_value
                      ? `${deal.currency} ${deal.estimated_deal_value.toLocaleString()}`
                      : 'To be determined'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Privileged Seats:</span>
                  <span className="font-mono text-slate-300">{deal.expected_seat_count || 'Standard capacity'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Close Date:</span>
                  <span className="text-slate-300">
                    {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Deployment Timeline:</span>
                  <span className="text-slate-300">{deal.deployment_timeline || 'Standard cycle'}</span>
                </div>
              </div>

              {deal.partner_notes && (
                <div className="pt-4 border-t border-slate-800">
                  <span className="text-slate-500 text-xs block mb-1">Partner Strategic Notes:</span>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                    {deal.partner_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Protection Window & Timeline */}
        <div className="space-y-6">
          {/* Protection Box */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Deal Protection Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Protection Period:</span>
                <span className="font-semibold text-slate-200">
                  {deal.status === 'approved' ? '90 Days Active' : 'Not Granted'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Starts At:</span>
                <span className="font-mono text-slate-300">
                  {deal.protection_starts_at ? new Date(deal.protection_starts_at).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Expires At:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {deal.protection_expires_at ? new Date(deal.protection_expires_at).toLocaleDateString() : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-cyan-400" />
                <span>Status History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deal.status_history.map((hist, idx) => (
                  <div key={hist.id} className="relative pl-5 text-xs">
                    {/* timeline line */}
                    {idx < deal.status_history.length - 1 && (
                      <div className="absolute left-1.5 top-2.5 bottom-0 w-px bg-slate-800 -mb-4" />
                    )}
                    {/* timeline dot */}
                    <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-cyan-400" />
                    <div>
                      <span className="font-semibold text-slate-200 capitalize">
                        {hist.new_status.replace('_', ' ')}
                      </span>
                      {hist.note && <p className="text-slate-400 text-[11px] mt-0.5">{hist.note}</p>}
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(hist.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
