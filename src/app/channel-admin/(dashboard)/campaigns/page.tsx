import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Megaphone, Calendar, Target, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { deleteCampaignAction } from '@/lib/actions/admin-delete';
import { CreateCampaignForm } from './create-campaign-form';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignsPage() {
  await requireAdminSession();

  const [campaigns, partnerUserCount] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { start_date: 'desc' } }),
    prisma.user.count({
      where: {
        role: 'partner_user',
        is_active: true,
        memberships: { some: { organization: { status: 'active' } } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Megaphone className="h-6 w-6 text-cyan-400" />
            <span>Channel Marketing Campaigns</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Publish and oversee joint marketing kits, digital sequences, and campaign assets distributed to partner organizations.
          </p>
        </div>
      </div>

      <CreateCampaignForm partnerUserCount={partnerUserCount} />

      {campaigns.length === 0 && (
        <div className="py-14 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-2">
          <Megaphone className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No campaigns yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Publish a campaign kit and every partner is notified in the portal and by email.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">{camp.title}</span>
                <Badge variant={camp.status === 'active' ? 'success' : 'default'} size="sm">
                  {camp.status}
                </Badge>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(camp.start_date).toLocaleDateString()} &mdash; {camp.end_date ? new Date(camp.end_date).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{camp.summary}</p>

            <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-slate-500" />
                <span>Target: {camp.target_audience}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-medium">{camp.related_product}</span>
                <ConfirmDelete
                  title="Delete campaign"
                  entityName={camp.title}
                  description="Partners will no longer see this campaign or its assets."
                  action={deleteCampaignAction.bind(null, camp.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
