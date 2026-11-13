import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LogOut, Mail, ShieldAlert, UserX } from 'lucide-react';
import { requirePartnerSessionAnyStatus } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { signOutAction } from '@/lib/actions/auth';
import { AuthShell, authCardClass } from '@/components/ui/auth-shell';
import { Button, buttonVariants } from '@/components/ui/button';
import { OrgStatusBadge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Account status',
};

const CHANNEL_CONTACT_EMAIL = 'channel@omnipriv.com';

type StatusKey = 'suspended' | 'no_access';

const STATUS_COPY: Record<
  StatusKey,
  { title: string; body: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  suspended: {
    title: 'Your partner account is suspended',
    body: 'Access to the partner workspace has been paused for your organization. Contact the OmniPriv channel team to resolve the suspension.',
    icon: ShieldAlert,
    tone: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  },
  no_access: {
    title: 'Workspace access unavailable',
    body: 'Your account is no longer linked to an active partner organization. Ask your company’s partner owner to re-invite you, or contact the OmniPriv channel team.',
    icon: UserX,
    tone: 'bg-surface-hover border-line-strong text-ink-muted',
  },
};

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function AccountStatusPage() {
  const { session, decision } = await requirePartnerSessionAnyStatus();

  // Active organizations go straight to the workspace.
  if (decision.allowed) {
    redirect('/partner-portal');
  }

  const org =
    decision.reason === 'suspended'
      ? await prisma.partnerOrganization.findUnique({
          where: { id: session.partnerOrgId },
          select: { legal_name: true, status: true, created_at: true },
        })
      : null;

  const statusKey: StatusKey = org ? 'suspended' : 'no_access';
  const copy = STATUS_COPY[statusKey];
  const Icon = copy.icon;

  return (
    <AuthShell width="lg">
      <div className={authCardClass}>
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${copy.tone}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
              Partner account
            </p>
            <h1 className="mt-1 font-heading text-xl sm:text-2xl font-bold tracking-[-0.03em] text-ink">
              {copy.title}
            </h1>
          </div>
        </div>

        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">{copy.body}</p>

        {org && (
          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
            <div className="bg-surface px-4 py-3 sm:col-span-2">
              <dt className="text-[0.75rem] text-ink-subtle">Organization</dt>
              <dd className="mt-0.5 text-[0.9375rem] font-semibold text-ink break-words">{org.legal_name}</dd>
            </div>
            <div className="bg-surface px-4 py-3">
              <dt className="text-[0.75rem] text-ink-subtle">Status</dt>
              <dd className="mt-1">
                <OrgStatusBadge status={org.status} />
              </dd>
            </div>
            <div className="bg-surface px-4 py-3">
              <dt className="text-[0.75rem] text-ink-subtle">Registered</dt>
              <dd className="mt-0.5 text-[0.9375rem] text-ink">
                <time dateTime={org.created_at.toISOString()}>{formatDate(org.created_at)}</time>
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-6 pt-5 border-t border-line flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[0.8125rem] text-ink-subtle">
            Signed in as <span className="font-medium text-ink-soft break-all">{session.email}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={`mailto:${CHANNEL_CONTACT_EMAIL}?subject=${encodeURIComponent('Partner account status')}`}
              className={buttonVariants({ variant: 'outline', size: 'md', className: 'w-full sm:w-auto' })}
            >
              <Mail className="h-4 w-4" />
              <span>Contact channel team</span>
            </a>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" size="md" className="w-full sm:w-auto">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
