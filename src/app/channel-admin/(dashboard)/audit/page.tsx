import React from 'react';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollText, Search, Filter, ShieldAlert, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChannelAdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; eventType?: string; orgId?: string; q?: string }>;
}) {
  await requireAdminSession();
  const { entityType, eventType, orgId, q: query } = await searchParams;

  const where: Prisma.AuditEventWhereInput = {};

  if (entityType) where.entity_type = entityType;
  if (eventType) where.event_type = eventType;
  if (orgId) where.partner_organization_id = orgId;

  if (query && query.trim()) {
    const s = query.trim();
    where.OR = [
      { event_type: { contains: s, mode: 'insensitive' } },
      { entity_type: { contains: s, mode: 'insensitive' } },
      { entity_id: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [audits, partners] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      include: {
        actor: { select: { full_name: true, email: true, role: true } },
        organization: { select: { id: true, display_name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    }),
    prisma.partnerOrganization.findMany({
      select: { id: true, display_name: true },
      orderBy: { display_name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ScrollText className="h-6 w-6 text-indigo-400" />
            <span>Immutable Forensic Audit Log</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete append-only audit trail capturing all state transitions, deal approvals, protections, and lead assignments.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <form method="GET" action="/channel-admin/audit" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              name="entityType"
              defaultValue={entityType || ''}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Entity Types</option>
              <option value="deal_registration">Deal Registration</option>
              <option value="lead_assignment">Lead Assignment</option>
              <option value="partner_organization">Partner Organization</option>
              <option value="partner_membership">Partner Membership</option>
              <option value="renewal">Renewal</option>
              <option value="user">User Identity</option>
            </select>

            <select
              name="orgId"
              defaultValue={orgId || ''}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Partner Organizations</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="q"
              defaultValue={query || ''}
              placeholder="Search event type, ID..."
              className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[#ffffff] font-medium text-xs transition-colors"
            >
              Filter Audit Log
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      {audits.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/50">
          No audit records found matching your filters.
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6 font-semibold">Timestamp (UTC)</th>
                  <th className="py-3 px-6 font-semibold">Event Type</th>
                  <th className="py-3 px-6 font-semibold">Actor</th>
                  <th className="py-3 px-6 font-semibold">Partner Organization</th>
                  <th className="py-3 px-6 font-semibold">Entity Type & ID</th>
                  <th className="py-3 px-6 font-semibold">Metadata Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(a.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-mono font-semibold text-indigo-300">
                        {a.event_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="text-slate-200">
                        {a.actor?.full_name || 'System / Automated'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {a.actor?.email || ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-300">
                      {a.organization?.display_name || '—'}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px]">
                      <span className="text-slate-400">{a.entity_type}</span>
                      <span className="text-slate-600 block text-[10px] truncate max-w-[120px]">
                        {a.entity_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {a.metadata ? JSON.stringify(a.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
