import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { FileQuestion, PlusCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartnerCommercialRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;
  const { submitted } = await searchParams;

  const requests = await prisma.commercialRequest.findMany({
    where: { partner_organization_id: orgId },
    orderBy: { created_at: 'desc' },
  });

  const statusVariantMap: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
    draft: 'default',
    submitted: 'warning',
    in_review: 'info',
    approved: 'success',
    fulfilled: 'success',
    rejected: 'danger',
  };

  const typeLabelMap: Record<string, string> = {
    poc: 'Proof of Concept (POC)',
    customer_trial: 'Customer Trial Tenant',
    nfr_license: 'NFR / Internal Lab License',
    quote_request: 'Custom Quote / Deal Pricing',
    order_assistance: 'Subscription / Order Assistance',
    license_expansion: 'License Seat Expansion',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileQuestion className="h-6 w-6 text-cyan-400" />
            <span>Commercial Requests</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Request customer POCs, cloud trials, NFR lab licenses, pricing quotes, or order support from OmniPriv Operations.
          </p>
        </div>

        <Link href="/partner-portal/commercial-requests/new">
          <Button variant="primary" size="md" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Commercial Request</span>
          </Button>
        </Link>
      </div>

      {submitted && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
          <span>Your commercial request has been submitted and routed to OmniPriv Operations for fulfillment.</span>
        </div>
      )}

      {/* Requests Table */}
      {requests.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <FileQuestion className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            No commercial requests submitted yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Need a lab license, an enterprise customer trial, or specialized pricing support? Submit a commercial request to engage OmniPriv Operations.
          </p>
          <div className="pt-2">
            <Link href="/partner-portal/commercial-requests/new">
              <Button variant="primary" size="sm" className="gap-1.5 text-xs font-semibold">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create Commercial Request</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-5 font-semibold">Reference</th>
                <th className="py-3 px-5 font-semibold">Request Type</th>
                <th className="py-3 px-5 font-semibold">Title / Subject</th>
                <th className="py-3 px-5 font-semibold">Customer / Target</th>
                <th className="py-3 px-5 font-semibold">Capacity</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-cyan-400 font-medium">
                    {r.public_reference}
                  </td>
                  <td className="py-3.5 px-5 font-medium text-slate-200">
                    {typeLabelMap[r.request_type] || r.request_type}
                  </td>
                  <td className="py-3.5 px-5 max-w-sm truncate text-white">
                    {r.title}
                  </td>
                  <td className="py-3.5 px-5 text-slate-300">
                    {r.customer_name || 'Internal / Partner'}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-300">
                    {r.seats_nodes ? `${r.seats_nodes} seats` : '—'}
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge variant={statusVariantMap[r.status] || 'default'} size="sm">
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 font-mono text-xs">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
