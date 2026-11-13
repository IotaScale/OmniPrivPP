'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell, authCardClass } from '@/components/ui/auth-shell';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { requestPasswordResetAction } from '@/lib/actions/password-reset';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsPending(true);
    try {
      // Always resolves with the same neutral message (no account enumeration).
      await requestPasswordResetAction(email);
    } finally {
      setIsPending(false);
      setSubmitted(true);
    }
  };

  return (
    <AuthShell>
      <div className={authCardClass}>
        <div className="mb-6">
          <h1 className="font-heading text-[1.5rem] font-bold tracking-[-0.03em] text-ink">Reset your password</h1>
          <p className="text-[0.875rem] text-ink-muted mt-2 leading-relaxed">
            Enter your authorized business email address to receive password reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div role="status" className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[0.8125rem] flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Check your inbox</strong>
                <span className="text-ink-muted">
                  If an active account exists for <strong className="text-ink break-all">{email}</strong>, a secure reset link is on its way. It expires in 1 hour.
                </span>
              </div>
            </div>
            <Link href="/sign-in" className={buttonVariants({ variant: 'secondary', className: 'w-full' })}>
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Authorized Business Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />

            <Button type="submit" variant="primary" size="lg" disabled={isPending} className="w-full">
              {isPending ? (
                <span>Sending instructions...</span>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>Send Reset Instructions</span>
                </>
              )}
            </Button>

            <div className="pt-1 text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-muted hover:text-brand-ink transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
