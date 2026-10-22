import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Award, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminProgramsPage() {
  await requireAdminSession();

  const [registeredCount, silverCount, goldCount, platinumCount] = await Promise.all([
    prisma.partnerOrganization.count({ where: { tier: 'Registered' } }),
    prisma.partnerOrganization.count({ where: { tier: 'Silver' } }),
    prisma.partnerOrganization.count({ where: { tier: 'Gold' } }),
    prisma.partnerOrganization.count({ where: { tier: 'Platinum' } }),
  ]);

  const tiers = [
    {
      name: 'Registered',
      margin: '10% Base Deal Margin',
      protection: '90-Day Guaranteed Price Protection',
      requirements: 'Complete Company Profile & Partner Agreement acceptance',
      partnerCount: registeredCount,
      color: 'border-slate-800',
    },
    {
      name: 'Silver',
      margin: '15% Deal Margin + Standard MDF',
      protection: '90-Day Protection with 30-day extension eligibility',
      requirements: '1 certified sales rep (OCSP), $50K annual revenue',
      partnerCount: silverCount,
      color: 'border-blue-500/30',
    },
    {
      name: 'Gold',
      margin: '25% Deal Margin + Dedicated Channel Manager',
      protection: 'Priority deal review (< 24h), co-sell resource allocation',
      requirements: '2 OCSP reps, 1 certified implementation engineer (OCIE), $250K annual revenue',
      partnerCount: goldCount,
      color: 'border-amber-500/30',
    },
    {
      name: 'Platinum',
      margin: '35% Deal Margin + Executive Sponsorship',
      protection: 'Direct C-suite deal escalation, joint demand-gen funding',
      requirements: '4 OCSP reps, 2 OCIE engineers, 1 OCSE expert, $1M annual revenue',
      partnerCount: platinumCount,
      color: 'border-emerald-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Award className="h-6 w-6 text-cyan-400" />
          <span>Partner Program Tracks & Tier Governance</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review tier qualification criteria, commercial margin bands, and partner distribution across tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`p-5 rounded-xl bg-slate-900/60 border ${t.color} flex flex-col justify-between space-y-4`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-white">{t.name} Tier</span>
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {t.partnerCount} Partners
                </span>
              </div>
              <div className="text-xs font-semibold text-emerald-400">{t.margin}</div>
              <div className="text-xs text-slate-300 mt-2">{t.protection}</div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
              <strong className="text-slate-300 block mb-0.5">Requirements:</strong>
              {t.requirements}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
