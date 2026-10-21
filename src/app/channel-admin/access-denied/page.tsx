import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden bg-omnipriv-page-gradient">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex justify-center mb-2">
          <OmniPrivLogo variant="full" href="/" />
        </div>
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 text-xs font-mono uppercase tracking-wider">
            <Lock className="h-3 w-3" />
            403 Security Boundary Enforced
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Channel Admin Access Denied
          </h1>
          <p className="text-sm text-slate-400">
            The Channel Admin console is restricted exclusively to authorized OmniPriv internal operations personnel. Partner user accounts are isolated to the Partner Portal workspace.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
          <Link href="/partner-portal" className="w-full">
            <Button variant="primary" size="lg" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Partner Portal</span>
            </Button>
          </Link>
          <Link href="/sign-in" className="text-xs text-slate-500 hover:text-slate-400">
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}
