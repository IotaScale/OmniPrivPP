import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { BookOpen, ExternalLink, ShieldCheck, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminResourcesPage() {
  await requireAdminSession();

  const resources = await prisma.resourceItem.findMany({
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <BookOpen className="h-6 w-6 text-cyan-400" />
          <span>Enablement Resources & Content</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage official sales playbooks, architecture whitepapers, competitive battlecards, and certification exam blueprints.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-5 font-semibold">Title</th>
              <th className="py-3 px-5 font-semibold">Category</th>
              <th className="py-3 px-5 font-semibold">Visible Tiers</th>
              <th className="py-3 px-5 font-semibold">Status</th>
              <th className="py-3 px-5 font-semibold text-right">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {resources.map((res) => (
              <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-5">
                  <div className="font-semibold text-white">{res.title}</div>
                  <div className="text-[11px] text-slate-400 max-w-md truncate">{res.description}</div>
                </td>
                <td className="py-3.5 px-5 text-slate-300 font-mono">{res.category}</td>
                <td className="py-3.5 px-5 text-slate-400">{res.visible_to_tiers.join(', ')}</td>
                <td className="py-3.5 px-5">
                  <Badge variant={res.is_published ? 'success' : 'default'} size="sm">
                    {res.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                    <span>View Asset</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
