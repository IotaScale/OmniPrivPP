'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, CheckCircle2 } from 'lucide-react';
import { AuthShell, authCardClass } from '@/components/ui/auth-shell';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSuccess(true);
  };

  return (
    <AuthShell>
      <div className={authCardClass}>
        <div className="mb-6">
          <h1 className="font-heading text-[1.5rem] font-bold tracking-[-0.03em] text-ink">Create a new password</h1>
          <p className="text-[0.875rem] text-ink-muted mt-2 leading-relaxed">
            Set a new secure password for your OmniPriv partner account.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-5 p-3.5 rounded-xl bg-rose-500/[0.08] border border-rose-500/30 text-rose-400 text-[0.8125rem]">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div role="status" className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[0.8125rem] flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Password successfully updated</strong>
                <span className="text-ink-muted">Your password has been changed. You can now sign in with your new credentials.</span>
              </div>
            </div>
            <Link href="/sign-in" className={buttonVariants({ variant: 'primary', className: 'w-full' })}>
              Sign In Now &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="New Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />

            <Button type="submit" variant="primary" size="lg" className="w-full">
              <Lock className="h-4 w-4" />
              <span>Update Password</span>
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
