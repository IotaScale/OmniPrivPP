import React from 'react';
import type { Metadata } from 'next';
import { KeyRound, Lock } from 'lucide-react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateLicenseTimeRemaining, maskLicenseKey } from '@/lib/utils/license';
import { CopyLicenseKeyButton } from './copy-license-key';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customer Licenses',
};

const EXPIRING_SOON_DAYS = 30;

type DisplayStatus = 'active' | 'expired' | 'revoked';

const STATUS_BADGE: Record<DisplayStatus, { label: string; variant: 'success' | 'danger' | 'outline' }> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'danger' },
  revoked: { label: 'Revoked', variant: 'outline' },
};

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatLimit(value: number | null) {
  return value === null ? 'Unlimited' : value.toLocaleString();
}

export default async function PartnerLicensesPage() {
  const session = await requirePartnerSession();
  const isOwner = session.membershipRole === 'partner_owner';

  // Only licenses OmniPriv linked to this partner organization.
  const rows = await prisma.productLicense.findMany({
    where: { partner_organization_id: session.partnerOrgId },
    select: {
      id: true,
      org_id: true,
      customer_name: true,
      license_key: true,
      status: true,
      expires_at: true,
      max_assets: true,
      max_users: true,
      modules: true,
    },
    orderBy: [{ expires_at: 'asc' }],
  });

  const now = new Date();
  // The full key stays on the server; the page only receives the masked form.
  const licenses = rows.map((lic) => {
    const remaining = calculateLicenseTimeRemaining(lic.expires_at, now);
    const status: DisplayStatus =
      lic.status === 'revoked' ? 'revoked' : lic.status === 'expired' || remaining.expired ? 'expired' : 'active';
    return {
      id: lic.id,
      orgId: lic.org_id,
      customerName: lic.customer_name,
      maskedKey: maskLicenseKey(lic.license_key),
      keyTail: lic.license_key.slice(-6),
      status,
      expiresAt: lic.expires_at,
      remainingDays: status === 'active' ? remaining.remainingDays : 0,
      maxAssets: lic.max_assets,
      maxUsers: lic.max_users,
      modules: lic.modules
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
    };
  });

  const remainingLabel = (lic: (typeof licenses)[number]) => {
    if (lic.status === 'revoked') return 'Revoked';
    if (lic.status === 'expired') return 'Expired';
    return `${lic.remainingDays} ${lic.remainingDays === 1 ? 'day' : 'days'} left`;
  };

  const remainingTone = (lic: (typeof licenses)[number]) =>
    lic.status !== 'active'
      ? 'text-ink-subtle'
      : lic.remainingDays <= EXPIRING_SOON_DAYS
        ? 'text-amber-400 font-semibold'
        : 'text-ink-muted';

  const keyCell = (lic: (typeof licenses)[number]) => (
    <div className="flex flex-wrap items-center gap-2">
      <code className="font-mono text-[0.75rem] text-ink-soft tracking-wide">{lic.maskedKey}</code>
      {isOwner && <CopyLicenseKeyButton licenseId={lic.id} keyTail={lic.keyTail} />}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <KeyRound className="h-6 w-6 text-cyan-400" />
          <span>Customer Licenses</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          OmniPriv licenses issued for customers your organization sold to. Read-only; contact your Partner
          Manager to renew or change a license.
        </p>
      </div>

      {!isOwner && licenses.length > 0 && (
        <p className="flex items-start gap-2 text-[0.8125rem] text-ink-muted">
          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
          <span>License keys are masked. Your company&rsquo;s Partner Owner can copy full keys.</span>
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          {licenses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-slate-200">No customer licenses yet</h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When OmniPriv issues a license for a customer you sold to, it appears here with its status,
                  expiry, and limits.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Phones: stacked cards */}
              <ul className="md:hidden -mx-6 -mt-6 divide-y divide-line">
                {licenses.map((lic) => (
                  <li key={lic.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.9375rem] font-semibold text-ink break-words">
                          {lic.customerName || 'Unnamed customer'}
                        </p>
                        <p className="mt-0.5 font-mono text-[0.75rem] text-ink-subtle break-all">{lic.orgId}</p>
                      </div>
                      <Badge variant={STATUS_BADGE[lic.status].variant} size="sm">
                        {STATUS_BADGE[lic.status].label}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.8125rem]">
                      <div>
                        <dt className="text-ink-subtle text-[0.75rem]">Expires</dt>
                        <dd className="text-ink-soft">{formatDate(lic.expiresAt)}</dd>
                        <dd className={`text-[0.75rem] ${remainingTone(lic)}`}>{remainingLabel(lic)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-subtle text-[0.75rem]">Limits</dt>
                        <dd className="text-ink-soft">{formatLimit(lic.maxAssets)} assets</dd>
                        <dd className="text-ink-soft">{formatLimit(lic.maxUsers)} users</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-ink-subtle text-[0.75rem] mb-1">Modules</dt>
                        <dd className="flex flex-wrap gap-1">
                          {lic.modules.map((m) => (
                            <Badge key={m} variant="neutral" size="sm" className="uppercase">
                              {m}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-ink-subtle text-[0.75rem] mb-1">License key</dt>
                        <dd>{keyCell(lic)}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>

              {/* Tablet and up: table */}
              <div className="hidden md:block overflow-x-auto -mx-6 -mt-6">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th scope="col" className="py-3 px-6 font-semibold">Customer</th>
                      <th scope="col" className="py-3 px-4 font-semibold">Status</th>
                      <th scope="col" className="py-3 px-4 font-semibold">Expires</th>
                      <th scope="col" className="py-3 px-4 font-semibold">Modules</th>
                      <th scope="col" className="py-3 px-4 font-semibold">Limits</th>
                      <th scope="col" className="py-3 px-6 font-semibold">License key</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {licenses.map((lic) => (
                      <tr key={lic.id} className="align-top hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-slate-200">{lic.customerName || 'Unnamed customer'}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-slate-500 break-all">{lic.orgId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={STATUS_BADGE[lic.status].variant} size="sm">
                            {STATUS_BADGE[lic.status].label}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-300">{formatDate(lic.expiresAt)}</div>
                          <div className={`text-[11px] ${remainingTone(lic)}`}>{remainingLabel(lic)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[10rem]">
                            {lic.modules.map((m) => (
                              <Badge key={m} variant="neutral" size="sm" className="uppercase">
                                {m}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                          <div>{formatLimit(lic.maxAssets)} assets</div>
                          <div>{formatLimit(lic.maxUsers)} users</div>
                        </td>
                        <td className="py-3.5 px-6">{keyCell(lic)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
