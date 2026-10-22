import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { updatePartnerTierAction } from '@/lib/actions/admin-ops';
import { Building2, ArrowLeft, Award, Users, ShieldCheck, Mail, Globe, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  await requireAdminSession();
  const { partnerId } = await params;

  const partner = await prisma.partnerOrganization.findUnique({
    where: { id: partnerId },
    include: {
      memberships: {
        include: { user: true },
      },
      deals: {
        orderBy: { created_at: 'desc' },
        take: 5,
      },
      locator_profile: true,
      audit_events: {
        orderBy: { created_at: 'desc' },
        take: 5,
      },
    },
  });

  if (!partner) notFound();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Link href="/channel-admin/partners">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Partners</span>
          </Button>
        </Link>
      </div>

      {/* Partner Overview Header */}
      <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{partner.legal_name}</h1>
            <Badge variant="info" size="md">{partner.tier} Tier</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
            <span>Trading Name: <strong className="text-slate-200">{partner.display_name}</strong></span>
            <span>&bull;</span>
            <span>Type: <strong className="text-slate-200">{partner.partner_type}</strong></span>
            <span>&bull;</span>
            <span>Location: <strong className="text-slate-200">{partner.country} ({partner.region})</strong></span>
          </div>
        </div>

        {partner.website && (
          <a
            href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
          >
            {partner.website} &rarr;
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier & Partner Manager Management */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-cyan-400" />
                <span>Program Tier & Partner Manager</span>
              </CardTitle>
              <CardDescription>
                Assign the partner tier and designated OmniPriv Channel Manager.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updatePartnerTierAction} className="space-y-4">
                <input type="hidden" name="partnerId" value={partner.id} />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Partner Program Tier</label>
                  <select
                    name="tier"
                    defaultValue={partner.tier}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Registered">Registered (Base Margin)</option>
                    <option value="Silver">Silver (15% Deal Margin + MDF)</option>
                    <option value="Gold">Gold (25% Deal Margin + Dedicated Rep)</option>
                    <option value="Platinum">Platinum (35% Deal Margin + Strategic Co-Sell)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Channel Manager Name</label>
                  <input
                    type="text"
                    name="partnerManagerName"
                    defaultValue={partner.partner_manager_name || ''}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">Channel Manager Email</label>
                  <input
                    type="email"
                    name="partnerManagerEmail"
                    defaultValue={partner.partner_manager_email || ''}
                    placeholder="e.g. sarah.jenkins@omnipriv.internal"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <Button type="submit" variant="primary" size="sm" className="w-full text-xs font-semibold">
                  Update Partner Settings
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span>Authorized Team ({partner.memberships.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-800">
                {partner.memberships.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{m.user.full_name}</div>
                      <div className="text-slate-400 text-[11px]">{m.user.email}</div>
                    </div>
                    <Badge variant={m.role === 'partner_owner' ? 'warning' : 'default'} size="sm">
                      {m.role.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deals & Activity */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Recent Deal Registrations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partner.deals.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No deal registrations submitted yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {partner.deals.map((deal) => (
                    <div key={deal.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{deal.customer_legal_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {deal.public_reference} &bull; {deal.customer_domain}
                        </div>
                      </div>
                      <Badge variant="info" size="sm">{deal.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Audit Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {partner.audit_events.map((ae) => (
                  <div key={ae.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono text-cyan-400 font-semibold">{ae.event_type}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{ae.entity_type}: {ae.entity_id}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(ae.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
