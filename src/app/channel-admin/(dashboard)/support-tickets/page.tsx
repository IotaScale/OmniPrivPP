import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Headphones,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building2,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface AdminSupportTicketsPageProps {
  searchParams: Promise<{ status?: string; priority?: string; q?: string }>;
}

export default async function AdminSupportTicketsPage({ searchParams }: AdminSupportTicketsPageProps) {
  await requireAdminSession();
  const params = await searchParams;

  const statusFilter = params.status as TicketStatus | undefined;
  const q = params.q?.toLowerCase().trim();

  const where: any = {};
  if (statusFilter) {
    where.status = statusFilter;
  }
  if (q) {
    where.OR = [
      { ticket_number: { contains: q, mode: 'insensitive' } },
      { subject: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [tickets, totalCount, openCount, inProgressCount, urgentCount, resolvedCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        organization: { select: { display_name: true, legal_name: true, tier: true } },
        created_by: { select: { full_name: true, email: true } },
        assigned_to: { select: { full_name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: [{ priority: 'desc' }, { updated_at: 'desc' }],
    }),
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: 'open' } }),
    prisma.supportTicket.count({ where: { status: 'in_progress' } }),
    prisma.supportTicket.count({ where: { priority: 'urgent', status: { notIn: ['resolved', 'closed'] } } }),
    prisma.supportTicket.count({ where: { status: 'resolved' } }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-950/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold uppercase mb-2">
            <Headphones className="h-3.5 w-3.5" />
            <span>Customer & Partner Technical Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Support Incident Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Technical helpdesk tickets submitted by partner organizations across AI-PAM, Vault, and Proxy Gateway modules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3001/tickets"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
          >
            <span>Open in Support Portal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-800/80 bg-slate-900/60">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Total Tickets</span>
            <Ticket className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{totalCount}</div>
        </Card>

        <Card className="p-4 border-slate-800/80 bg-slate-900/60">
          <div className="text-xs text-cyan-400 font-medium flex items-center justify-between">
            <span>Open / Triage</span>
            <AlertCircle className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{openCount}</div>
        </Card>

        <Card className="p-4 border-slate-800/80 bg-slate-900/60">
          <div className="text-xs text-rose-400 font-medium flex items-center justify-between">
            <span>Urgent Queue</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{urgentCount}</div>
        </Card>

        <Card className="p-4 border-slate-800/80 bg-slate-900/60">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{resolvedCount}</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <Link
          href="/channel-admin/support-tickets"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !statusFilter ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          All ({totalCount})
        </Link>
        <Link
          href="/channel-admin/support-tickets?status=open"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'open' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Open ({openCount})
        </Link>
        <Link
          href="/channel-admin/support-tickets?status=in_progress"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'in_progress' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          In Progress ({inProgressCount})
        </Link>
        <Link
          href="/channel-admin/support-tickets?status=resolved"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'resolved' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Resolved ({resolvedCount})
        </Link>
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <Card className="p-12 text-center space-y-3 bg-slate-900/50 border-slate-800">
          <Ticket className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No support tickets found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter
              ? `No tickets currently match status "${statusFilter}".`
              : 'When partner users submit incidents or inquiries, they will appear here in real time.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card
              key={t.id}
              className="p-5 border-slate-800 bg-slate-900/70 hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {t.ticket_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        t.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : t.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[11px] text-slate-300 px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08]">
                      {t.category}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize px-2 py-0.5 rounded bg-slate-800">
                      Status: {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {t.subject}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-200 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{t.organization?.display_name || t.organization?.legal_name || 'Individual Partner'}</span>
                    </span>
                    <span>Submitter: {t.created_by.full_name} ({t.created_by.email})</span>
                    <span>•</span>
                    <span>{new Date(t.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium">
                    {t._count.messages} {t._count.messages === 1 ? 'message' : 'messages'}
                  </span>
                  <a
                    href={`http://localhost:3001/tickets/${t.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-sm"
                  >
                    <span>Respond</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
