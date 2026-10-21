import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-cyan-500/30">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">OmniPriv</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 uppercase">
            Email Verification
          </span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-8 shadow-xl text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white">Email Address Verified</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your business email address has been verified for the OmniPriv Channel Partner Portal.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/partner-portal">
              <Button variant="primary" size="md" className="w-full text-xs font-semibold gap-2">
                <span>Enter Partner Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
