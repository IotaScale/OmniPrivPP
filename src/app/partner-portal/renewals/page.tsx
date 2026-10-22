import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { RefreshCw, Calendar, DollarSign, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartnerRenewalsPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;

  const renewals = await prisma.renewal.findMany({
    where: { partner_organization_id: orgId },
    orderBy: { renewal_date: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <RefreshCw className="h-6 w-6 text-blue-400" />
          <span>Customer Renewals Pipeline</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Track upcoming PAM subscription renewal dates, contracted capacity, and commercial milestones.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renewals.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">
                  No commercial renewals are currently due
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When customer deals are won and active PAM subscriptions approach renewal, commercial details appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-y border-slate-800">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Customer Account</th>
                    <th className="py-3 px-6 font-semibold">Product Plan</th>
                    <th className="py-3 px-6 font-semibold">Contracted Capacity</th>
                    <th className="py-3 px-6 font-semibold">Contract Value</th>
                    <th className="py-3 px-6 font-semibold">Renewal Date</th>
                    <th className="py-3 px-6 font-semibold">Commercial Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {renewals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-200">
                        {r.customer_name}
                      </td>
                      <td className="py-3.5 px-6 text-slate-300">{r.product_plan}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {r.contracted_capacity || 'Standard'}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-medium text-cyan-400">
                        {r.contract_value ? `${r.currency} ${r.contract_value.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {new Date(r.renewal_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusBadge status={r.commercial_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
