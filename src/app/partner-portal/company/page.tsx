import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { CompanyProfileForm } from './company-form';

export default async function PartnerCompanyPage() {
  const session = await requirePartnerSession();

  const org = await prisma.partnerOrganization.findUnique({
    where: { id: session.partnerOrgId },
  });

  if (!org) notFound();

  return (
    <div className="space-y-6">
      <CompanyProfileForm
        org={{
          legalName: org.legal_name,
          displayName: org.display_name,
          website: org.website,
          country: org.country,
          region: org.region,
          partnerType: org.partner_type,
          tier: org.tier,
          status: org.status,
          companySummary: org.company_summary,
        }}
        isOwner={session.membershipRole === 'partner_owner'}
      />
    </div>
  );
}
