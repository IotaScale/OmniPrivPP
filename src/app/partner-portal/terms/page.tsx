import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { FileText, ShieldCheck, CheckCircle2, Award, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartnerTermsPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;

  const [org, termsHistory] = await Promise.all([
    prisma.partnerOrganization.findUnique({
      where: { id: orgId },
      select: {
        legal_name: true,
        tier: true,
        partner_type: true,
        created_at: true,
      },
    }),
    prisma.termsAcceptance.findMany({
      where: { partner_organization_id: orgId },
      orderBy: { accepted_at: 'desc' },
    }),
  ]);

  const standardAgreements = [
    {
      title: 'OmniPriv Global Channel Partner Program Agreement',
      version: 'v2026.1',
      type: 'Primary Program Terms',
      acceptedOn: org?.created_at,
      status: 'Active & Binding',
      summary: 'Governs deal registration protections, margin discounts, non-circumvention, partner tier obligations, and channel code of conduct.',
    },
    {
      title: 'Privileged Deal Registration & Margin Reservation Policy',
      version: 'v2026.1',
      type: 'Deal Protection Policy',
      acceptedOn: org?.created_at,
      status: 'Active & Binding',
      summary: 'Specifies 90-day exclusive opportunity protection, domain conflict arbitration procedures, and deal extension rules.',
    },
    {
      title: 'Zero Trust Security & Non-Disclosure Addendum',
      version: 'v2026.1',
      type: 'Confidentiality & Data Security',
      acceptedOn: org?.created_at,
      status: 'Active & Binding',
      summary: 'Enforces strict separation of commercial channel metadata from customer PAM tenant access, encryption keys, and secrets.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileText className="h-6 w-6 text-cyan-400" />
          <span>Legal Agreements & Program Terms</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical record of signed partner agreements, program rules, and deal protection policy versions for {org?.legal_name}.
        </p>
      </div>

      {/* Agreements List */}
      <div className="space-y-4">
        {standardAgreements.map((agreement) => (
          <div
            key={agreement.title}
            className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{agreement.title}</span>
                  <Badge variant="success" size="sm">{agreement.status}</Badge>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Version: <span className="font-mono text-cyan-400 font-semibold">{agreement.version}</span> &bull; {agreement.type}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Accepted {agreement.acceptedOn ? new Date(agreement.acceptedOn).toLocaleDateString() : 'Active'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
              {agreement.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
