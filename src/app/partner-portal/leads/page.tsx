import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Inbox, Clock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { evaluateLeadSla } from '@/lib/utils/sla';

export const dynamic = 'force-dynamic';

export default async function PartnerLeadsPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;

  const assignments = await prisma.leadAssignment.findMany({
    where: { partner_organization_id: orgId },
    include: {
      lead: true,
      converted_deal: {
        select: { id: true, public_reference: true, status: true },
      },
    },
    orderBy: { assigned_at: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-cyan-400" />
            <span>Assigned Inbound Leads</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise customer prospects routed by OmniPriv Channel Operations. Respond within the 7-day SLA window.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {assignments.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                <Inbox className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">
                  No leads have been assigned to your company yet
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  OmniPriv Channel Operations assigns inbound customer demand based on partner tier, technical certifications, and regional focus.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-y border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Lead Reference</th>
                    <th className="py-3 px-4 font-semibold">Customer / Company</th>
                    <th className="py-3 px-4 font-semibold">Contact</th>
                    <th className="py-3 px-4 font-semibold">Product Interest</th>
                    <th className="py-3 px-4 font-semibold">Lead Source</th>
                    <th className="py-3 px-4 font-semibold">Assigned Date</th>
                    <th className="py-3 px-4 font-semibold">Acceptance Deadline</th>
                    <th className="py-3 px-4 font-semibold">Partner Acceptance</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {assignments.map((assignment) => {
                    const sla = evaluateLeadSla(
                      assignment.acceptance_deadline_at,
                      assignment.accepted_at || assignment.declined_at
                    );

                    // SLA Visual Urgency label
                    let urgencyBadge = { label: 'Normal', color: 'text-slate-300 bg-slate-900 border-slate-800' };
                    if (sla.isBreached) {
                      urgencyBadge = { label: 'Overdue', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
                    } else if (sla.isUrgent) {
                      urgencyBadge = { label: 'Action needed soon', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
                    }

                    return (
                      <tr
                        key={assignment.id}
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-medium text-cyan-400">
                          {assignment.lead.public_reference}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                            {assignment.lead.company}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {assignment.lead.country} {assignment.lead.region ? `• ${assignment.lead.region}` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200">
                            {assignment.lead.contact_first_name} {assignment.lead.contact_last_name}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {assignment.lead.contact_email}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                          {assignment.lead.product_interest || 'OmniPriv PAM'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">
                          {assignment.lead.lead_source || 'OmniPriv Web Inbound'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                          {new Date(assignment.assigned_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {assignment.partner_acceptance_status === 'pending' ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs text-slate-200">
                                {new Date(assignment.acceptance_deadline_at).toLocaleDateString()}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border w-fit ${urgencyBadge.color}`}>
                                {sla.isBreached && <AlertTriangle className="h-3 w-3 shrink-0" />}
                                <span>{urgencyBadge.label}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">
                              Settled {assignment.accepted_at ? new Date(assignment.accepted_at).toLocaleDateString() : ''}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={assignment.partner_acceptance_status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={assignment.current_status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/partner-portal/leads/${assignment.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              <span>Work Lead</span>
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
