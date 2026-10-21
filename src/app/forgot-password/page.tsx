'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsPending(true);
    // Simulate secure delivery delay and neutral response
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsPending(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-cyan-500/30">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">OmniPriv</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 uppercase">
            Portal Access
          </span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-white">Reset Your Password</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your authorized business email address to receive password reset instructions.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Password Reset Sent</strong>
                  <span>
                    If an authorized partner account exists for <strong className="text-white">{email}</strong>, a secure reset link has been dispatched.
                  </span>
                </div>
              </div>
              <Link href="/sign-in" className="block text-center">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Authorized Business Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isPending}
                className="w-full text-xs font-semibold gap-2"
              >
                {isPending ? (
                  <span>Sending instructions...</span>
                ) : (
                  <>
                    <Mail className="h-3.5 w-3.5" />
                    <span>Send Reset Instructions</span>
                  </>
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
