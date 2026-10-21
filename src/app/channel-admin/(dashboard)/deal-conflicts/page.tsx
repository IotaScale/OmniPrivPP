import React from 'react';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, Building2, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { approveDealAction, declineDealAction } from '@/lib/actions/admin-deals';

export const dynamic = 'force-dynamic';

export default async function AdminDealConflictsPage() {
  await requireAdminSession();

  const conflictingDeals = await prisma.dealRegistration.findMany({
    where: {
      conflict_detected: true,
      status: 'awaiting_approval',
    },
    include: {
      organization: { select: { id: true, legal_name: true, tier: true } },
      submitted_by: { select: { full_name: true, email: true } },
    },
    orderBy: { created_at: 'asc' },
  });

  async function handleDecline(formData: FormData) {
    'use server';
    await declineDealAction(formData);
  }

  async function handleApprove(formData: FormData) {
    'use server';
    await approveDealAction(formData);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ShieldAlert className="h-6 w-6 text-amber-400" />
          <span>Deal Domain Conflict Arbitration</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Resolve multi-partner domain overlap claims. Review first-mover timestamps, partner engagement evidence, and assign exclusive 90-day protection.
        </p>
      </div>

      {conflictingDeals.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No active domain conflict cases</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All submitted deal registrations currently have distinct customer domain claims or have been resolved by Channel Operations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conflictingDeals.map((deal) => (
            <div
              key={deal.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-amber-500/30 space-y-4 hover:border-amber-500/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-bold">{deal.public_reference}</span>
                    <Badge variant="warning" size="sm">Domain Overlap Flagged</Badge>
                  </div>
                  <h2 className="text-base font-bold text-white">{deal.customer_legal_name}</h2>
                  <div className="text-xs text-slate-400 font-mono">
                    Claimed Domain: <strong className="text-cyan-400">{deal.customer_domain}</strong>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div>Claiming Partner: <strong className="text-white">{deal.organization.legal_name}</strong></div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Submitted {new Date(deal.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {deal.conflict_reason && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/40 text-xs text-amber-300">
                  <strong>Conflict Engine Finding:</strong> {deal.conflict_reason}
                </div>
              )}

              {deal.partner_notes && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <strong className="text-slate-400 block mb-0.5">Partner Commercial Notes:</strong>
                  {deal.partner_notes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                <Link href={`/channel-admin/deals?id=${deal.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View Full Deal File &rarr;
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <form action={handleDecline}>
                    <input type="hidden" name="dealId" value={deal.id} />
                    <input type="hidden" name="reason" value="Declined in favor of existing prior protected registration on customer domain." />
                    <Button type="submit" variant="danger" size="sm" className="gap-1.5 text-xs">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Decline Claim</span>
                    </Button>
                  </form>

                  <form action={handleApprove}>
                    <input type="hidden" name="dealId" value={deal.id} />
                    <input type="hidden" name="decisionReason" value="Arbitrated and approved: verified active customer engagement and executive sponsor." />
                    <Button type="submit" variant="primary" size="sm" className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve with 90-Day Protection</span>
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
