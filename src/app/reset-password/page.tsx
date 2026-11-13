import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { AuthShell, authCardClass } from '@/components/ui/auth-shell';
import { describePasswordTokenFailure } from '@/lib/auth/password-token';
import { resolvePasswordToken } from '@/lib/auth/password-flows';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Set your password',
  referrer: 'no-referrer',
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';
  const inviteParam = params.invite === '1';

  const verified = token ? await resolvePasswordToken(token) : null;

  if (!verified || !verified.ok) {
    const reason = verified && !verified.ok ? describePasswordTokenFailure(verified.reason) : 'This link is invalid.';
    return (
      <AuthShell>
        <div className={authCardClass}>
          <div className="mb-6">
            <h1 className="font-heading text-[1.5rem] font-bold tracking-[-0.03em] text-ink">
              {inviteParam ? 'Invitation link unavailable' : 'Reset link unavailable'}
            </h1>
          </div>
          <div
            role="alert"
            className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[0.8125rem] flex items-start gap-3"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
            <div>
              <strong className="block font-semibold text-ink">{reason}</strong>
              <span className="text-ink-muted">
                {inviteParam
                  ? 'Ask your partner owner to resend the invitation, or request a password reset link below.'
                  : 'Password links expire after 1 hour and can only be used once. Request a new one below.'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <Link href="/forgot-password" className={buttonVariants({ variant: 'primary', className: 'w-full' })}>
              Request a new link
            </Link>
            <div className="text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-muted hover:text-brand-ink transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </AuthShell>
    );
  }

  const isInvite = verified.claims.purpose === 'invite';
  const heading = isInvite
    ? `Welcome to ${verified.orgName ?? 'the OmniPriv Partner Portal'} — set your password`
    : 'Create a new password';
  const description = isInvite
    ? `Choose a password for ${verified.user.email} to activate your OmniPriv Partner Portal account.`
    : `Set a new secure password for ${verified.user.email}.`;

  return (
    <AuthShell>
      <div className={authCardClass}>
        <div className="mb-6">
          <h1 className="font-heading text-[1.5rem] font-bold tracking-[-0.03em] text-ink">{heading}</h1>
          <p className="text-[0.875rem] text-ink-muted mt-2 leading-relaxed break-words">{description}</p>
        </div>
        <ResetPasswordForm token={token} isInvite={isInvite} email={verified.user.email} />
      </div>
    </AuthShell>
  );
}
