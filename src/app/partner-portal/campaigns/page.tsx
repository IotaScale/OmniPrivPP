import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Megaphone, Download, Copy, Calendar, Target, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartnerCampaignsPage() {
  const session = await requirePartnerSession();

  const campaigns = await prisma.campaign.findMany({
    orderBy: { start_date: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Megaphone className="h-6 w-6 text-cyan-400" />
            <span>Marketing Campaigns & Demand Kits</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Turnkey co-marketing kits, email sequences, social posts, and digital assets ready for immediate partner deployment.
          </p>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <Megaphone className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No active campaigns available</h3>
          <p className="text-xs text-slate-500">New demand-gen campaigns will be published by OmniPriv Channel Marketing.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={camp.status === 'active' ? 'success' : 'default'} size="sm">
                      {camp.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">{camp.related_product}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{camp.title}</h2>
                </div>

                {camp.assets_url && (
                  <a href={camp.assets_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" size="sm" className="gap-2 text-xs font-semibold">
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Campaign Kit</span>
                    </Button>
                  </a>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{camp.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {camp.email_copy && (
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px] uppercase tracking-wider font-mono">
                      <span>Ready Email Copy</span>
                      <span className="text-cyan-400">Copy Template</span>
                    </div>
                    <p className="text-slate-300 italic text-xs leading-relaxed">{camp.email_copy}</p>
                  </div>
                )}

                {camp.social_copy && (
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px] uppercase tracking-wider font-mono">
                      <span>Social Media Post Copy</span>
                      <span className="text-cyan-400">LinkedIn / X</span>
                    </div>
                    <p className="text-slate-300 italic text-xs leading-relaxed">{camp.social_copy}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-slate-500" />
                  <span>Target: <strong className="text-slate-300 font-normal">{camp.target_audience}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Valid through {camp.end_date ? new Date(camp.end_date).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
