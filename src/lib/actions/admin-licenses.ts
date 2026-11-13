'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit';
import { OrgStatus } from '@prisma/client';
import {
  computeLicenseExpiry,
  generatePpLicenseKeyFormat,
  validateLicenseGenerationInput,
} from '@/lib/utils/license';

export interface ProductLicenseView {
  id: string;
  org_id: string;
  customer_name: string | null;
  license_key: string;
  status: 'active' | 'expired' | 'revoked';
  duration_value: number;
  duration_unit: string;
  starts_at: Date;
  expires_at: Date;
  max_assets: number | null;
  max_users: number | null;
  modules: string;
  last_verified_at: Date | null;
  created_at: Date;
  /** Reseller partner organization this license is visible to (optional). */
  partner_organization_id: string | null;
  partner_name: string | null;
}

export interface LicensePartnerOption {
  id: string;
  display_name: string;
  legal_name: string;
}

/** Active partner organizations that a license can be linked to. */
export async function listLicensePartnerOptionsAction(): Promise<LicensePartnerOption[]> {
  await requireAdminSession();
  return prisma.partnerOrganization.findMany({
    where: { status: OrgStatus.active },
    select: { id: true, display_name: true, legal_name: true },
    orderBy: { display_name: 'asc' },
  });
}

/**
 * Normalise an optional partner id from the admin form and make sure it
 * refers to an active partner organization. `null` means "no partner".
 */
async function resolveLicensePartnerId(
  raw: string | null | undefined
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (!id) return { ok: true, id: null };
  const org = await prisma.partnerOrganization.findFirst({
    where: { id, status: OrgStatus.active },
    select: { id: true },
  });
  if (!org) {
    return { ok: false, error: 'Selected partner was not found or is not active.' };
  }
  return { ok: true, id: org.id };
}

export async function listProductLicensesAction(): Promise<ProductLicenseView[]> {
  await requireAdminSession();
  try {
    const rows = await prisma.$queryRaw<ProductLicenseView[]>`
      SELECT
        pl.id,
        pl.org_id,
        pl.customer_name,
        pl.license_key,
        pl.status::text AS status,
        pl.duration_value,
        pl.duration_unit,
        pl.starts_at,
        pl.expires_at,
        pl.max_assets,
        pl.max_users,
        pl.modules,
        pl.last_verified_at,
        pl.created_at,
        pl.partner_organization_id,
        po.display_name AS partner_name
      FROM product_licenses pl
      LEFT JOIN partner_organizations po ON po.id = pl.partner_organization_id
      ORDER BY pl.created_at DESC
    `;
    return rows;
  } catch (err) {
    console.error('[LIST_LICENSES_ERROR]', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function generateProductLicenseAction(input: {
  orgId: string;
  customerName?: string;
  durationValue: number;
  durationUnit: 'days' | 'months' | 'years';
  maxAssets?: number | null;
  maxUsers?: number | null;
  /** Optional reseller partner org id (must be an active partner). */
  partnerOrganizationId?: string | null;
}): Promise<{
  success: boolean;
  licenseKey?: string;
  expiresAt?: string;
  supersededCount?: number;
  error?: string;
}> {
  const session = await requireAdminSession();
  const check = validateLicenseGenerationInput(input);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const partner = await resolveLicensePartnerId(input.partnerOrganizationId);
  if (!partner.ok) {
    return { success: false, error: partner.error };
  }
  const partnerOrganizationId = partner.id;

  const orgId = input.orgId.trim();
  const id = randomUUID();
  const licenseKey = generatePpLicenseKeyFormat();
  const now = new Date();
  const expiresAt = computeLicenseExpiry(now, input.durationValue, input.durationUnit);
  const customerName = input.customerName?.trim() || null;
  const maxAssets = input.maxAssets ?? null;
  const maxUsers = input.maxUsers ?? null;

  // Automatically revoke any previous active licenses for this org_id so only one is active
  const supersededCount = await prisma.$executeRaw`
    UPDATE product_licenses
    SET
      status = 'revoked'::"ProductLicenseStatus",
      revoked_at = ${now},
      revoked_by_id = ${session.userId},
      updated_at = ${now}
    WHERE org_id = ${orgId} AND status = 'active'::"ProductLicenseStatus"
  `;

  await prisma.$executeRaw`
    INSERT INTO product_licenses (
      id, org_id, customer_name, license_key, status,
      duration_value, duration_unit, starts_at, expires_at,
      max_assets, max_users, modules, issued_by_id, partner_organization_id, created_at, updated_at
    ) VALUES (
      ${id}, ${orgId}, ${customerName}, ${licenseKey}, 'active'::"ProductLicenseStatus",
      ${input.durationValue}, ${input.durationUnit}, ${now}, ${expiresAt},
      ${maxAssets}, ${maxUsers}, 'ssh,rdp,db,web', ${session.userId}, ${partnerOrganizationId}, ${now}, ${now}
    )
  `;

  await logAuditEvent({
    actorUserId: session.userId,
    partnerOrgId: partnerOrganizationId,
    entityType: 'product_license',
    entityId: id,
    eventType: 'PRODUCT_LICENSE_GENERATED',
    afterData: {
      orgId,
      customerName,
      partnerOrganizationId,
      durationValue: input.durationValue,
      durationUnit: input.durationUnit,
      maxAssets,
      maxUsers,
      expiresAt: expiresAt.toISOString(),
      supersededPrevious: Number(supersededCount),
    },
  });

  revalidatePath('/channel-admin/licenses');
  revalidatePath('/partner-portal/licenses');
  return {
    success: true,
    licenseKey,
    expiresAt: expiresAt.toISOString(),
    supersededCount: Number(supersededCount),
  };
}

export async function renewProductLicenseAction(input: {
  id: string;
  durationValue: number;
  durationUnit: 'days' | 'months' | 'years';
}): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdminSession();
  if (!input.durationValue || input.durationValue <= 0) {
    return { success: false, error: 'Duration must be a positive number.' };
  }

  const now = new Date();
  const existingRows = await prisma.$queryRaw<{ expires_at: Date }[]>`
    SELECT expires_at FROM product_licenses WHERE id = ${input.id} LIMIT 1
  `;
  const currentExpiry = existingRows[0]?.expires_at ? new Date(existingRows[0].expires_at) : now;
  const baseDate = currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  const expiresAt = computeLicenseExpiry(baseDate, input.durationValue, input.durationUnit);

  await prisma.$executeRaw`
    UPDATE product_licenses
    SET
      status = 'active'::"ProductLicenseStatus",
      duration_value = ${input.durationValue},
      duration_unit = ${input.durationUnit},
      expires_at = ${expiresAt},
      updated_at = ${now}
    WHERE id = ${input.id}
  `;

  await logAuditEvent({
    actorUserId: session.userId,
    entityType: 'product_license',
    entityId: input.id,
    eventType: 'PRODUCT_LICENSE_RENEWED',
    afterData: {
      durationValue: input.durationValue,
      durationUnit: input.durationUnit,
      expiresAt: expiresAt.toISOString(),
    },
  });

  revalidatePath('/channel-admin/licenses');
  revalidatePath('/partner-portal/licenses');
  return { success: true };
}

export async function revokeProductLicenseAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdminSession();
  const now = new Date();

  await prisma.$executeRaw`
    UPDATE product_licenses
    SET
      status = 'revoked'::"ProductLicenseStatus",
      revoked_at = ${now},
      revoked_by_id = ${session.userId},
      updated_at = ${now}
    WHERE id = ${id}
  `;

  await logAuditEvent({
    actorUserId: session.userId,
    entityType: 'product_license',
    entityId: id,
    eventType: 'PRODUCT_LICENSE_REVOKED',
    afterData: { revokedAt: now.toISOString() },
  });

  revalidatePath('/channel-admin/licenses');
  revalidatePath('/partner-portal/licenses');
  return { success: true };
}

/**
 * Link an existing license to a reseller partner (or unlink with an empty id).
 * The partner then sees it read-only under /partner-portal/licenses.
 */
export async function setLicensePartnerAction(input: {
  id: string;
  partnerOrganizationId: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdminSession();
  if (!input.id) {
    return { success: false, error: 'License id is required.' };
  }

  const partner = await resolveLicensePartnerId(input.partnerOrganizationId);
  if (!partner.ok) {
    return { success: false, error: partner.error };
  }

  const existing = await prisma.$queryRaw<{ partner_organization_id: string | null }[]>`
    SELECT partner_organization_id FROM product_licenses WHERE id = ${input.id} LIMIT 1
  `;
  if (existing.length === 0) {
    return { success: false, error: 'License not found.' };
  }
  const previous = existing[0].partner_organization_id;
  if (previous === partner.id) {
    return { success: true };
  }

  await prisma.$executeRaw`
    UPDATE product_licenses
    SET partner_organization_id = ${partner.id}, updated_at = ${new Date()}
    WHERE id = ${input.id}
  `;

  await logAuditEvent({
    actorUserId: session.userId,
    partnerOrgId: partner.id ?? previous,
    entityType: 'product_license',
    entityId: input.id,
    eventType: 'PRODUCT_LICENSE_PARTNER_UPDATED',
    beforeData: { partnerOrganizationId: previous },
    afterData: { partnerOrganizationId: partner.id },
  });

  revalidatePath('/channel-admin/licenses');
  revalidatePath('/partner-portal/licenses');
  return { success: true };
}
