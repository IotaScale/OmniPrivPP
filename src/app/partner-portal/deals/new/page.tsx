import React from 'react';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DealRegistrationWizard } from './deal-wizard';

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ leadAssignmentId?: string }>;
}) {
  const session = await requirePartnerSession();
  const { leadAssignmentId } = await searchParams;

  let initialData = undefined;

  if (leadAssignmentId) {
    const assignment = await prisma.leadAssignment.findUnique({
      where: { id: leadAssignmentId },
      include: { lead: true },
    });

    if (assignment && assignment.partner_organization_id === session.partnerOrgId) {
      initialData = {
        customerLegalName: assignment.lead.company,
        customerDomain: assignment.lead.customer_domain || '',
        customerCountry: assignment.lead.country,
        customerIndustry: assignment.lead.industry || undefined,
        customerContactName: `${assignment.lead.contact_first_name} ${assignment.lead.contact_last_name}`,
        customerContactEmail: assignment.lead.contact_email,
        customerContactPhone: assignment.lead.contact_phone || undefined,
        productInterest: assignment.lead.product_interest || undefined,
        expectedSeatCount: assignment.lead.estimated_seat_count || undefined,
        leadAssignmentId: assignment.id,
      };
    }
  }

  return <DealRegistrationWizard initialData={initialData} />;
}
