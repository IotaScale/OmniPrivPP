'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordFormAction } from '@/lib/actions/password-reset';

export function ResetPasswordForm({ token, isInvite, email }: { token: string; isInvite: boolean; email: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordFormAction, undefined);

  return (
    <>
      {state?.error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-500/[0.08] border border-rose-500/30 text-rose-400 text-[0.8125rem]"
        >
          {state.error}
          {state.expired && (
            <>
              {' '}
              <Link href="/forgot-password" className="font-semibold underline underline-offset-2">
                Request a new link
              </Link>
            </>
          )}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="token" value={token} />
        {/* Lets password managers associate the new password with the account. */}
        <input type="hidden" name="username" autoComplete="username" value={email} readOnly />

        <Input
          label={isInvite ? 'Password' : 'New Password'}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Minimum 8 characters"
        />

        <Input
          label={isInvite ? 'Confirm Password' : 'Confirm New Password'}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Re-enter password"
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isPending} className="w-full">
          <Lock className="h-4 w-4" />
          <span>{isInvite ? 'Set Password' : 'Update Password'}</span>
        </Button>
      </form>
    </>
  );
}
