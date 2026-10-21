import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Shield, Search, Globe, Award, ExternalLink, ArrowRight, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function FindAPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; track?: string; tier?: string; q?: string }>;
}) {
  const { country, track, tier, q } = await searchParams;

  const where: any = {
    opt_in: true,
    is_approved: true,
    is_published: true,
  };

  if (country) {
    where.country = { contains: country, mode: 'insensitive' };
  }
  if (tier) {
    where.tier = tier;
  }
  if (track) {
    where.tracks = { has: track };
  }
  if (q && q.trim()) {
    where.OR = [
      { public_company_name: { contains: q.trim(), mode: 'insensitive' } },
      { public_description: { contains: q.trim(), mode: 'insensitive' } },
    ];
  }

  const partners = await prisma.partnerLocatorProfile.findMany({
    where,
    orderBy: [{ tier: 'desc' }, { public_company_name: 'asc' }],
  });

  const tierVariantMap: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    Registered: 'default',
    Silver: 'info',
    Gold: 'warning',
    Platinum: 'success',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-white tracking-tight">OmniPriv</span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 uppercase">
              Partner Locator
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-xs text-slate-300">
                Partner Sign In
              </Button>
            </Link>
            <Link href="/partners/register">
              <Button variant="primary" size="sm" className="text-xs gap-1.5 font-medium">
                <span>Become a Partner</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Find an Authorized OmniPriv Partner
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Connect with certified channel partners, system integrators, and managed service providers equipped to architect, deploy, and support OmniPriv Privileged Access Management.
          </p>
        </div>

        {/* Filter bar */}
        <form method="GET" action="/find-a-partner" className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Search partner name..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <input
            type="text"
            name="country"
            defaultValue={country || ''}
            placeholder="Filter by country..."
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />

          <select
            name="track"
            defaultValue={track || ''}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">All Program Tracks</option>
            <option value="Sell">Sell (VAR / Reseller)</option>
            <option value="Deploy">Deploy (System Integrator)</option>
            <option value="Manage">Manage (MSP / MSSP)</option>
            <option value="Build">Build (Technology Alliance)</option>
          </select>

          <Button type="submit" variant="primary" size="sm" className="text-xs font-semibold">
            Search Directory
          </Button>
        </form>
      </div>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        {partners.length === 0 ? (
          <div className="py-16 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 p-8 space-y-3">
            <Globe className="h-8 w-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">
              No public partner directory listings found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No authorized partners have published public directory profiles matching these filters yet. Check back soon or reset your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white">{p.public_company_name}</span>
                    <Badge variant={tierVariantMap[p.tier] || 'default'} size="sm">
                      <Award className="h-3 w-3 mr-1" />
                      {p.tier}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span>{p.city ? `${p.city}, ` : ''}{p.country}</span>
                  </div>

                  {p.public_description && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                      {p.public_description}
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{p.partner_type}</span>
                  {p.website && (
                    <a
                      href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium"
                    >
                      <span>Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        OmniPriv Authorized Channel Directory &bull; Zero Trust Privileged Access Management
      </footer>
    </div>
  );
}
