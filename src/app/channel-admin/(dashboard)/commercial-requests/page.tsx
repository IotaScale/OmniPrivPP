import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { updateCommercialRequestStatusAction } from '@/lib/actions/admin-ops';
import { deleteCommercialRequestAction } from '@/lib/actions/admin-delete';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { FileQuestion, CheckCircle2, XCircle, Clock, ShieldCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminCommercialRequestsPage() {
  await requireAdminSession();

  const requests = await prisma.commercialRequest.findMany({
    include: {
      organization: { select: { id: true, legal_name: true, tier: true } },
      requested_by: { select: { full_name: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  const typeLabelMap: Record<string, string> = {
    poc: 'Proof of Concept (POC)',
    customer_trial: 'Customer Trial',
    nfr_license: 'NFR Lab License',
    quote_request: 'Custom Quote',
    order_assistance: 'Order Processing',
    license_expansion: 'Seat Expansion',
  };

  const statusVariantMap: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
    draft: 'default',
    submitted: 'warning',
    in_review: 'info',
    approved: 'success',
    fulfilled: 'success',
    rejected: 'danger',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileQuestion className="h-6 w-6 text-cyan-400" />
          <span>Partner Commercial Requests</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review and fulfill partner requests for POC licenses, customer trials, internal lab NFRs, and specialized deal pricing.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <FileQuestion className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No commercial requests in queue</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Partner-submitted requests for lab licenses, cloud trial tenants, and pricing reviews will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-400 font-bold">{r.public_reference}</span>
                    <Badge variant={statusVariantMap[r.status] || 'default'} size="sm">
                      {r.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">
                      {typeLabelMap[r.request_type] || r.request_type}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white">{r.title}</h2>
                  <div className="text-xs text-slate-400">
                    Partner: <strong className="text-slate-200">{r.organization.legal_name}</strong> &bull; Requestor:{' '}
                    <span className="text-slate-300">{r.requested_by.full_name} ({r.requested_by.email})</span>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div>Target Client: <strong className="text-white">{r.customer_name || 'Internal Lab'}</strong></div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {r.seats_nodes ? `${r.seats_nodes} Seats / Nodes` : 'Scope TBD'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-slate-400 block mb-1">Details & Justification:</strong>
                {r.details}
              </div>

              {/* Admin Actions */}
              <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-mono">
                  Submitted {new Date(r.created_at).toLocaleString()}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['submitted', 'in_review', 'approved'].includes(r.status) && (
                    <form action={updateCommercialRequestStatusAction} className="inline-flex items-center gap-2">
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="status" value="fulfilled" />
                      <input
                        type="text"
                        name="adminNotes"
                        placeholder="License / entitlement notes..."
                        className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <Button type="submit" variant="primary" size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Fulfill Request</span>
                      </Button>
                    </form>
                  )}

                  {(r.status === 'submitted' || r.status === 'in_review') && (
                    <form action={updateCommercialRequestStatusAction}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <Button type="submit" variant="ghost" size="sm" className="text-xs text-rose-400 hover:bg-rose-500/10">
                        <span>Reject</span>
                      </Button>
                    </form>
                  )}

                  <ConfirmDelete
                    title="Delete commercial request"
                    entityName={`${r.public_reference} · ${r.title}`}
                    description={`Requested by ${r.organization.legal_name}. The partner will no longer see this request.`}
                    action={deleteCommercialRequestAction.bind(null, r.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
