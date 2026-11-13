import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { PublicFooter, PublicHeader } from '@/components/ui/public-chrome';
import { ShieldCheck, Building2, FileSpreadsheet, Inbox, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (session.role === 'channel_admin') {
      redirect('/channel-admin');
    } else {
      redirect('/partner-portal');
    }
  }

  const pillars = [
    {
      title: 'Instant Deal Registration',
      text: 'Register enterprise opportunities in a 3-step wizard with automatic domain conflict verification and rapid Channel review.',
      icon: FileSpreadsheet,
    },
    {
      title: '90-Day Protection Window',
      text: 'Approved deals lock in guaranteed domain exclusivity and registered partner margins for ninety days.',
      icon: ShieldCheck,
    },
    {
      title: 'Inbound Lead Routing',
      text: 'Receive enterprise inbound demand assigned by OmniPriv based on territory, technical certifications, and SLA compliance.',
      icon: Inbox,
    },
  ];

  return (
    <div className="min-h-dvh bg-page text-ink-soft flex flex-col">
      <PublicHeader />

      {/* Hero Content */}
      <main className="relative flex-1 overflow-hidden">
        <div className="op-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="op-glow pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <span className="op-eyebrow">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>AI-Powered PAM Channel Sales</span>
          </span>

          <h1 className="op-h1 mt-6">
            Accelerate your AI-PAM pipeline with{' '}
            <span className="text-brand-ink">exclusive deal protection.</span>
          </h1>

          <p className="op-lede mt-6 max-w-2xl mx-auto">
            The authorized B2B channel partner portal for OmniPriv. Register customer opportunities for the full 9-module AI-PAM platform, govern AI agents across 53 MCP tools, lock in 90-day deal protection, and access certified partner enablement.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up" className={buttonVariants({ size: 'lg', className: 'group w-full sm:w-auto' })}>
              <Building2 className="h-5 w-5" />
              <span>Register Partner Company</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/sign-in" className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'w-full sm:w-auto' })}>
              Partner Sign In
            </Link>
          </div>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-14 text-left">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="p-6 rounded-2xl bg-surface border border-line shadow-[var(--op-card-shadow)] space-y-3">
                  <span className="op-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="font-heading text-[1.0625rem] font-bold tracking-[-0.015em] text-ink">{p.title}</h2>
                  <p className="text-[0.875rem] text-ink-muted leading-relaxed">{p.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <PublicFooter note="Authorized Channel Portal" />
    </div>
  );
}
