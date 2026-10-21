import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Award, ShieldCheck, Clock, AlertTriangle, CheckCircle2, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartnerCertificationsPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;

  const [availableCerts, orgCertifications, org] = await Promise.all([
    prisma.certification.findMany({ orderBy: { code: 'asc' } }),
    prisma.partnerCertification.findMany({
      where: { partner_organization_id: orgId },
      include: { certification: true, user: { select: { full_name: true, email: true } } },
      orderBy: { expires_at: 'desc' },
    }),
    prisma.partnerOrganization.findUnique({
      where: { id: orgId },
      select: { tier: true, legal_name: true },
    }),
  ]);

  const activeCerts = orgCertifications.filter((c) => c.status === 'active');
  const expiringSoonCerts = orgCertifications.filter((c) => c.status === 'expiring_soon');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Award className="h-6 w-6 text-cyan-400" />
            <span>Partner Certifications & Compliance</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track certified personnel, accreditation requirements for {org?.tier} tier, and renewal schedules.
          </p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Active Credentials</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{activeCerts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified organization personnel</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Expiring within 60 Days</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{expiringSoonCerts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Renewal action recommended</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Partner Tier Status</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{org?.tier || 'Registered'}</span>
            <Badge variant="info" size="sm">Compliant</Badge>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Minimum track requirements met</div>
        </div>
      </div>

      {/* Active Organization Certifications */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">Organization Certified Team Members</h2>

        {orgCertifications.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
            <Award className="h-8 w-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No active certifications recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Complete course modules in the Learning catalog to earn official accreditation badges and unlock Gold and Platinum partner tier discounts.
            </p>
            <div className="pt-2">
              <Link href="/partner-portal/learning">
                <Button variant="primary" size="sm" className="text-xs gap-1.5 font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Start Learning Path</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-5 font-semibold">Credential Code</th>
                  <th className="py-3 px-5 font-semibold">Certification Name</th>
                  <th className="py-3 px-5 font-semibold">Certified Individual</th>
                  <th className="py-3 px-5 font-semibold">Certificate #</th>
                  <th className="py-3 px-5 font-semibold">Expires</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orgCertifications.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-cyan-400 font-bold">{c.certification.code}</td>
                    <td className="py-3.5 px-5 font-semibold text-white">{c.certification.name}</td>
                    <td className="py-3.5 px-5 text-slate-200">{c.user.full_name}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-400">{c.certificate_number}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-300 text-xs">
                      {new Date(c.expires_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={c.status === 'active' ? 'success' : 'warning'} size="sm">
                        {c.status === 'active' ? 'Active' : 'Expiring Soon'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Certification Programs */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Available Certification Programs</h2>
          <p className="text-xs text-slate-400 mt-0.5">Official accreditations by partner track.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableCerts.map((ac) => (
            <div
              key={ac.id}
              className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {ac.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{ac.level}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{ac.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ac.description}</p>
              </div>

              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">{ac.validity_months} Months Validity</span>
                <Link href="/partner-portal/learning">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-400">
                    <span>Study & Take Exam &rarr;</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
