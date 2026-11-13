'use server';

import { prisma } from '@/lib/db';
import { requirePartnerSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit';

/**
 * Reveal the full key of a license linked to the caller's organization so a
 * Partner Owner can copy it. Members get masked keys only; the full key never
 * ships in the page payload and every reveal is audited.
 */
export async function revealPartnerLicenseKeyAction(
  licenseId: string
): Promise<{ licenseKey?: string; error?: string }> {
  const session = await requirePartnerSession();

  if (session.membershipRole !== 'partner_owner') {
    return { error: 'Only Partner Owners can copy license keys.' };
  }
  if (typeof licenseId !== 'string' || !licenseId) {
    return { error: 'License not found.' };
  }

  const license = await prisma.productLicense.findFirst({
    where: { id: licenseId, partner_organization_id: session.partnerOrgId },
    select: { id: true, license_key: true, org_id: true },
  });

  if (!license) {
    return { error: 'License not found.' };
  }

  await logAuditEvent({
    actorUserId: session.userId,
    partnerOrgId: session.partnerOrgId,
    entityType: 'product_license',
    entityId: license.id,
    eventType: 'partner.license_key_copied',
    metadata: { org_id: license.org_id },
  });

  return { licenseKey: license.license_key };
}
