import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { LocatorForm } from './locator-form';
import { MapPin, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function PartnerLocatorProfilePage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;

  const [locator, org] = await Promise.all([
    prisma.partnerLocatorProfile.findUnique({
      where: { partner_organization_id: orgId },
    }),
    prisma.partnerOrganization.findUnique({
      where: { id: orgId },
      select: { display_name: true, website: true, country: true, tier: true },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <MapPin className="h-6 w-6 text-cyan-400" />
            <span>Public Partner Locator Profile</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure your company presence in the global OmniPriv Partner Locator directory.
          </p>
        </div>

        <Link href="/find-a-partner" target="_blank">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5" />
            <span>View Public Directory</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <LocatorForm
        initialData={{
          optIn: locator?.opt_in ?? false,
          isApproved: locator?.is_approved ?? false,
          isPublished: locator?.is_published ?? false,
          publicCompanyName: locator?.public_company_name || org?.display_name || '',
          publicDescription: locator?.public_description || '',
          website: locator?.website || org?.website || '',
          country: locator?.country || org?.country || '',
          city: locator?.city || '',
        }}
      />
    </div>
  );
}
