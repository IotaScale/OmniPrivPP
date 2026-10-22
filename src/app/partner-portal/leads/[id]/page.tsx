import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { PartnerLeadActions } from './lead-actions';
import { evaluateLeadSla } from '@/lib/utils/sla';
import {
  ArrowLeft,
  Inbox,
  Clock,
  Building,
  User,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  Tag,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartnerLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePartnerSession();
  const { id } = await params;

  const assignment = await prisma.leadAssignment.findUnique({
    where: { id },
    include: {
      lead: true,
      converted_deal: {
        select: { id: true, public_reference: true, status: true },
      },
    },
  });

  // Strict tenant isolation guard
  if (!assignment || assignment.partner_organization_id !== session.partnerOrgId) {
    notFound();
  }

  const sla = evaluateLeadSla(
    assignment.acceptance_deadline_at,
    assignment.accepted_at || assignment.declined_at
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/partner-portal/leads">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Leads</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <span className="font-mono text-xs text-slate-400">
            {assignment.lead.public_reference}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={assignment.partner_acceptance_status} />
        </div>
      </div>

      {/* SLA Alert Banner */}
      {assignment.partner_acceptance_status === 'pending' && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
            sla.isBreached
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : sla.isUrgent
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-cyan-950/40 border-cyan-800/40 text-cyan-200'
          }`}
        >
          {sla.isBreached ? (
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Clock className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="font-semibold block mb-0.5">
              {sla.isBreached ? 'Acceptance Deadline Overdue' : '7-Day Acceptance SLA Active'}
            </strong>
            <span>
              Assigned on {new Date(assignment.assigned_at).toLocaleDateString()}. Acceptance deadline:{' '}
              <strong className="font-mono">
                {new Date(assignment.acceptance_deadline_at).toLocaleDateString()}
              </strong>{' '}
              ({sla.formattedRemaining}). Please accept or decline to maintain partner tier SLA compliance.
            </span>
          </div>
        </div>
      )}

      {/* Decline Note Banner if declined */}
      {assignment.decline_reason && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
          <span className="text-slate-400 font-semibold uppercase text-[10px] block">
            Decline Rationale:
          </span>
          <p className="text-slate-300">{assignment.decline_reason}</p>
        </div>
      )}

      {/* Action Controller */}
      <PartnerLeadActions
        assignmentId={assignment.id}
        acceptanceStatus={assignment.partner_acceptance_status}
        currentStatus={assignment.current_status}
        convertedDealId={assignment.converted_deal?.id}
        convertedReference={assignment.converted_deal?.public_reference}
      />

      {/* Main Prospect Specifications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-4 w-4 text-cyan-400" />
            <span>Prospect Information & Inbound Scope</span>
          </CardTitle>
          <CardDescription>
            Qualified customer requirements captured by OmniPriv Inbound Marketing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Company Name:</span>
              <span className="text-sm font-semibold text-white">{assignment.lead.company}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Primary Domain:</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {assignment.lead.customer_domain || 'Not declared'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Location:</span>
              <span className="text-slate-200">
                {assignment.lead.country} {assignment.lead.region ? `• ${assignment.lead.region}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Industry Sector:</span>
              <span className="text-slate-200">{assignment.lead.industry || 'Enterprise'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Contact Name:</span>
              <span className="text-slate-200 font-medium">
                {assignment.lead.contact_first_name} {assignment.lead.contact_last_name}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Business Email:</span>
              <span className="text-slate-200 font-mono">{assignment.lead.contact_email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Direct Phone:</span>
              <span className="text-slate-200 font-mono">
                {assignment.lead.contact_phone || '—'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Product Interest:</span>
              <span className="text-slate-200 font-medium">
                {assignment.lead.product_interest || 'OmniPriv PAM'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Estimated Seats:</span>
              <span className="text-slate-200 font-mono">
                {assignment.lead.estimated_seat_count || 'Standard Scope'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Inbound Source:</span>
              <span className="text-slate-200">{assignment.lead.lead_source}</span>
            </div>
          </div>

          {assignment.lead.customer_comment && (
            <div className="pt-4 border-t border-slate-800">
              <span className="text-slate-500 text-xs block mb-1">Prospect Inbound Comments:</span>
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                {assignment.lead.customer_comment}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
