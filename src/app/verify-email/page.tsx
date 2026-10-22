import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { OmniPrivLogo } from '@/components/ui/omnipriv-logo';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-cyan-500/30 bg-omnipriv-page-gradient">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex justify-center mb-2">
          <OmniPrivLogo variant="partner" href="/" />
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
