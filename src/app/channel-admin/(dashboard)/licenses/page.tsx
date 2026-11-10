import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { listProductLicensesAction } from '@/lib/actions/admin-licenses';
import { LicensesClient } from './licenses-client';

export const dynamic = 'force-dynamic';

export default async function ChannelAdminLicensesPage() {
  await requireAdminSession();
  const licenses = await listProductLicensesAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          OmniPrive Organization Licenses
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate, renew, and revoke OmniPrive organization license keys stored in Supabase and verified nightly by OmniPrive.
        </p>
      </div>

      <LicensesClient initialLicenses={licenses} />
    </div>
  );
}

