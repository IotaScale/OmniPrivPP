import React from 'react';
import { prisma } from '@/lib/db';
import { Prisma, PartnerTier } from '@prisma/client';
import { Search, Globe, Award, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicFooter, PublicHeader } from '@/components/ui/public-chrome';
import { fieldBaseClass, fieldStateClass } from '@/components/ui/field-styles';

export const dynamic = 'force-dynamic';

export default async function FindAPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; track?: string; tier?: string; q?: string }>;
}) {
  const { country, track, tier, q } = await searchParams;

  const where: Prisma.PartnerLocatorProfileWhereInput = {
    opt_in: true,
    is_approved: true,
    is_published: true,
  };

  if (country) {
    where.country = { contains: country, mode: 'insensitive' };
  }
  if (tier) {
    where.tier = tier as PartnerTier;
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

  const filterField = `${fieldBaseClass} ${fieldStateClass.normal} h-11`;

  return (
    <div className="min-h-dvh bg-page text-ink-soft flex flex-col">
      <PublicHeader ctaHref="/partners/register" tag="Locator" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="op-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16">
          <div className="max-w-3xl">
            <span className="op-eyebrow">
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              Partner directory
            </span>
            <h1 className="op-h2 mt-4">Find an authorized OmniPriv partner</h1>
            <p className="op-lede mt-3">
              Connect with certified channel partners, system integrators, and managed service providers equipped to architect, deploy, and support OmniPriv Privileged Access Management.
            </p>
          </div>

          {/* Filter bar */}
          <form
            method="GET"
            action="/find-a-partner"
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 p-3 sm:p-4 rounded-2xl bg-surface border border-line shadow-[var(--op-card-shadow)]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-subtle" />
              <label htmlFor="locator-q" className="sr-only">Search partner name</label>
              <input
                id="locator-q"
                type="text"
                name="q"
                defaultValue={q || ''}
                placeholder="Search partner name..."
                className={`${filterField} pl-10 pr-3.5`}
              />
            </div>

            <div>
              <label htmlFor="locator-country" className="sr-only">Country</label>
              <input
                id="locator-country"
                type="text"
                name="country"
                defaultValue={country || ''}
                placeholder="Filter by country..."
                className={`${filterField} px-3.5`}
              />
            </div>

            <div>
              <label htmlFor="locator-track" className="sr-only">Program track</label>
              <select
                id="locator-track"
                name="track"
                defaultValue={track || ''}
                className={`${filterField} px-3.5 cursor-pointer`}
              >
                <option value="">All Program Tracks</option>
                <option value="Sell">Sell (VAR / Reseller)</option>
                <option value="Deploy">Deploy (System Integrator)</option>
                <option value="Manage">Manage (MSP / MSSP)</option>
                <option value="Build">Build (Technology Alliance)</option>
              </select>
            </div>

            <Button type="submit" variant="primary" size="md" className="h-11 sm:col-span-2 lg:col-span-1">
              <Search className="h-4 w-4" />
              Search Directory
            </Button>
          </form>
        </div>
      </section>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        {partners.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-surface border border-dashed border-line-strong p-8 space-y-3">
            <span className="op-icon mx-auto">
              <Globe className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-[1.0625rem] font-bold text-ink">
              No public partner directory listings found
            </h2>
            <p className="text-[0.875rem] text-ink-muted max-w-md mx-auto">
              No authorized partners have published public directory profiles matching these filters yet. Check back soon or reset your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-surface border border-line shadow-[var(--op-card-shadow)] hover:border-brand/40 transition-colors flex flex-col justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-heading font-bold text-[1rem] tracking-[-0.015em] text-ink break-words">{p.public_company_name}</span>
                    <Badge variant={tierVariantMap[p.tier] || 'default'} size="sm">
                      <Award className="h-3 w-3" />
                      {p.tier}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-[0.8125rem] text-ink-muted mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-ink-subtle" />
                    <span>{p.city ? `${p.city}, ` : ''}{p.country}</span>
                  </div>

                  {p.public_description && (
                    <p className="text-[0.875rem] text-ink-muted mt-3 line-clamp-3 leading-relaxed">
                      {p.public_description}
                    </p>
                  )}
                </div>

                <div className="border-t border-line pt-3 flex items-center justify-between gap-3 text-[0.8125rem]">
                  <span className="text-ink-subtle">{p.partner_type}</span>
                  {p.website && (
                    <a
                      href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-ink hover:underline underline-offset-2 inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Website</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter note="Authorized Channel Directory" />
    </div>
  );
}
