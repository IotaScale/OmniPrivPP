'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-cyan-500/30">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">OmniPriv</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 uppercase">
            Security
          </span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-white">Create New Password</h1>
            <p className="text-xs text-slate-400 mt-1">
              Set a new secure password for your OmniPriv partner account.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Password Successfully Updated</strong>
                  <span>Your password has been changed. You can now sign in with your new credentials.</span>
                </div>
              </div>
              <Link href="/sign-in" className="block text-center">
                <Button variant="primary" size="sm" className="w-full text-xs font-semibold">
                  Sign In Now &rarr;
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button type="submit" variant="primary" size="md" className="w-full text-xs font-semibold gap-2">
                <Lock className="h-3.5 w-3.5" />
                <span>Update Password</span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
