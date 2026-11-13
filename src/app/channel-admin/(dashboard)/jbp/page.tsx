import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { updateJbpStatusAction } from '@/lib/actions/admin-ops';
import { TrendingUp, CheckCircle2, MessageSquare, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminJbpPage() {
  await requireAdminSession();

  const plans = await prisma.jointBusinessPlan.findMany({
    include: {
      organization: { select: { id: true, legal_name: true, tier: true, partner_manager_name: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  const statusVariantMap: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
    draft: 'default',
    submitted: 'warning',
    under_review: 'info',
    changes_requested: 'danger',
    approved: 'success',
    archived: 'default',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <TrendingUp className="h-6 w-6 text-cyan-400" />
          <span>Joint Business Plans (JBP) Queue</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review, provide executive feedback, and approve annual partner commitments, revenue targets, and co-selling plans.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <TrendingUp className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No Joint Business Plans submitted yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Annual strategic business plans submitted by partner organizations will appear here for review and approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((jbp) => (
            <div
              key={jbp.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">
                      {jbp.organization.legal_name} &bull; {jbp.year} Annual Plan
                    </span>
                    <Badge variant={statusVariantMap[jbp.status] || 'default'} size="sm">
                      {jbp.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400">
                    Partner Tier: <strong className="text-slate-200">{jbp.organization.tier}</strong> &bull; Manager:{' '}
                    <span className="text-slate-300">{jbp.organization.partner_manager_name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Target ARR</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    ${Number(jbp.revenue_target).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-slate-400 block">Growth Goals & Strategy:</strong>
                  <p className="text-slate-200 leading-relaxed">{jbp.growth_goals}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-slate-400 block">Focus Products & Verticals:</strong>
                  <p className="text-slate-200 leading-relaxed">{jbp.focus_products} &bull; {jbp.target_industries}</p>
                </div>
              </div>

              {jbp.admin_feedback && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/40 text-xs text-amber-300">
                  <strong className="block mb-0.5">Current Admin Feedback:</strong>
                  {jbp.admin_feedback}
                </div>
              )}

              {/* Status Action Form */}
              <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-mono">
                  Submitted {jbp.submitted_at ? new Date(jbp.submitted_at).toLocaleDateString() : 'Draft'}
                </span>

                {jbp.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approved{jbp.approved_at ? ` ${new Date(jbp.approved_at).toLocaleDateString()}` : ''} &bull; reopens for review if the partner resubmits
                  </span>
                ) : jbp.status === 'changes_requested' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Waiting for the partner to update and resubmit
                  </span>
                ) : jbp.status !== 'submitted' && jbp.status !== 'under_review' ? (
                  <span className="text-xs text-slate-500">No action needed</span>
                ) : (
                <form action={updateJbpStatusAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="jbpId" value={jbp.id} />
                  <input
                    type="text"
                    name="adminFeedback"
                    placeholder="Feedback (required to request changes)"
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    name="status"
                    value="changes_requested"
                    className="px-2.5 py-1 rounded text-xs text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 font-medium"
                  >
                    Request Changes
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="approved"
                    className="px-3 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-[#ffffff] font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Approve JBP</span>
                  </button>
                </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
