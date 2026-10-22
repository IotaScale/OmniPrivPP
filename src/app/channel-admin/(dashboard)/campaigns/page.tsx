import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Megaphone, Calendar, Target, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignsPage() {
  await requireAdminSession();

  const campaigns = await prisma.campaign.findMany({
    orderBy: { start_date: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Megaphone className="h-6 w-6 text-cyan-400" />
          <span>Channel Marketing Campaigns</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Publish and oversee joint marketing kits, digital sequences, and campaign assets distributed to partner organizations.
        </p>
      </div>

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

            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-slate-500" />
                <span>Target: {camp.target_audience}</span>
              </div>
              <span className="text-slate-300 font-medium">{camp.related_product}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
