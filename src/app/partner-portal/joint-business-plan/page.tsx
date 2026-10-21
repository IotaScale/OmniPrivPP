import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { JbpForm } from './jbp-form';
import { TrendingUp, Award, Clock, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartnerJbpPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;
  const currentYear = new Date().getFullYear();

  const [jbp, org] = await Promise.all([
    prisma.jointBusinessPlan.findFirst({
      where: { partner_organization_id: orgId, year: currentYear },
    }),
    prisma.partnerOrganization.findUnique({
      where: { id: orgId },
      select: { partner_manager_name: true, partner_manager_email: true, tier: true },
    }),
  ]);

  const statusVariantMap: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
    draft: 'default',
    submitted: 'warning',
    under_review: 'info',
    changes_requested: 'danger',
    approved: 'success',
    archived: 'default',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-cyan-400" />
            <span>Joint Business Plan ({currentYear})</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Collaborative annual commercial, pipeline, and enablement strategy with your OmniPriv Partner Manager.
          </p>
        </div>

        {jbp && (
          <Badge variant={statusVariantMap[jbp.status] || 'default'} size="md">
            Status: {jbp.status.replace('_', ' ')}
          </Badge>
        )}
      </div>

      {/* Partner Manager Info Box */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400">Assigned Channel Manager:</span>{' '}
          <strong className="text-white">{org?.partner_manager_name || 'Sarah Jenkins (Channel Director)'}</strong>
        </div>
        <a
          href={`mailto:${org?.partner_manager_email || 'channel@omnipriv.com'}`}
          className="text-cyan-400 hover:text-cyan-300 font-medium"
        >
          Contact Partner Manager &rarr;
        </a>
      </div>

      {/* Admin Feedback Box if changes requested or feedback provided */}
      {jbp?.admin_feedback && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4" />
            <span>OmniPriv Channel Feedback:</span>
          </div>
          <p className="text-slate-200">{jbp.admin_feedback}</p>
        </div>
      )}

      {/* JBP Form */}
      <JbpForm initialData={jbp ? {
        year: jbp.year,
        growthGoals: jbp.growth_goals,
        revenueTarget: jbp.revenue_target,
        focusProducts: jbp.focus_products,
        targetIndustries: jbp.target_industries,
        keyAccounts: jbp.key_accounts || '',
        technicalPlan: jbp.technical_plan || '',
        marketingActivities: jbp.marketing_activities || '',
        milestones: jbp.milestones || '',
      } : undefined} />
    </div>
  );
}
