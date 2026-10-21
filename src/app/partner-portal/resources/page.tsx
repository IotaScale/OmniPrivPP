import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { ResourceCategory } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  FileText,
  Award,
  Sparkles,
  Shield,
} from 'lucide-react';

export default async function PartnerResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const session = await requirePartnerSession();
  const { category: filterCategory, q: query } = await searchParams;

  const partnerTier = session.partnerTier || 'Registered';

  // Fetch PostgreSQL-backed resource items
  const allResources = await prisma.resourceItem.findMany({
    where: {
      is_published: true,
      visible_to_tiers: {
        has: partnerTier,
      },
      category: filterCategory && Object.values(ResourceCategory).includes(filterCategory as ResourceCategory)
        ? (filterCategory as ResourceCategory)
        : undefined,
    },
    orderBy: { created_at: 'desc' },
  });

  const filteredResources = query
    ? allResources.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.description.toLowerCase().includes(query.toLowerCase())
      )
    : allResources;

  const categories = [
    { label: 'All Resources', value: undefined },
    { label: 'Sales Playbooks', value: ResourceCategory.sales_playbook },
    { label: 'Product Collateral', value: ResourceCategory.product_collateral },
    { label: 'Technical Enablement', value: ResourceCategory.technical_enablement },
    { label: 'Certifications', value: ResourceCategory.certification },
    { label: 'Brand & Marketing', value: ResourceCategory.marketing_asset },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <BookOpen className="h-6 w-6 text-cyan-400" />
          <span>Enablement & Partner Resources</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Official OmniPriv enterprise battlecards, technical whitepapers, exam blueprints, and co-marketing brand assets.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {categories.map((c) => {
            const isActive = filterCategory === c.value;
            return (
              <Link
                key={c.label}
                href={
                  c.value
                    ? `/partner-portal/resources?category=${c.value}${query ? `&q=${query}` : ''}`
                : `/partner-portal/resources${query ? `?q=${query}` : ''}`
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/partner-portal/resources" className="relative min-w-[260px]">
          {filterCategory && <input type="hidden" name="category" value={filterCategory} />}
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={query || ''}
            placeholder="Search collateral, playbooks..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </form>
      </div>

      {/* Resource Grid */}
      {filteredResources.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40">
          No resources found matching your query or tier filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between hover:border-slate-700 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                    {item.category.replace('_', ' ')}
                  </Badge>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-white line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="line-clamp-3 text-xs text-slate-400 mt-2">
                  {item.description}
                </CardDescription>
              </CardHeader>

              <CardFooter className="pt-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {item.visible_to_tiers.join(', ')}
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Access Asset</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
