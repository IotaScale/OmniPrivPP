import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Inbox,
  ArrowRight,
  Lock,
  Award,
} from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-500/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/40">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-white flex items-center gap-2">
              OmniPriv <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-800 text-cyan-400 uppercase tracking-wider">Channel Platform</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/become-a-partner">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Partner Program
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="primary" size="sm" className="gap-1.5 shadow-cyan-950 shadow-sm">
                <span>Become a Partner</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10 space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold tracking-wide uppercase">
          <ShieldCheck className="h-4 w-4" />
          <span>Enterprise Privileged Access Management Channel Sales</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Accelerate Your Enterprise PAM Pipeline With{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Exclusive Deal Protection
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The authorized B2B channel partner portal for OmniPriv. Register customer opportunities, obtain 90-day exclusive deal protections, receive qualified inbound leads, and access certified sales enablement.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 text-base px-8 py-3 shadow-lg shadow-cyan-950/80">
              <Building2 className="h-5 w-5" />
              <span>Register Partner Company</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-3">
              <span>Partner Sign In</span>
            </Button>
          </Link>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Instant Deal Registration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Register enterprise opportunities in a 3-step wizard with automatic domain conflict verification and rapid Channel review.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">90-Day Protection Window</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Approved deals lock in guaranteed domain exclusivity and registered partner margins for ninety days.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Inbox className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Inbound Lead Routing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive enterprise inbound demand assigned by OmniPriv based on territory, technical certifications, and SLA compliance.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500 relative z-10 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 w-full gap-4">
        <div>OmniPriv Privileged Access Management • Authorized Channel Portal</div>
        <div>
          <Link href="/channel-admin/login" className="text-slate-500 hover:text-slate-400">
            OmniPriv Channel Operations Console &rarr;
          </Link>
        </div>
      </footer>
    </div>
  );
}
