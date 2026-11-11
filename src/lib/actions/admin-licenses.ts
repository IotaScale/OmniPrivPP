'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit';
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
}

export async function listProductLicensesAction(): Promise<ProductLicenseView[]> {
  await requireAdminSession();
  try {
    const rows = await prisma.$queryRaw<ProductLicenseView[]>`
      SELECT
        id,
        org_id,
        customer_name,
        license_key,
        status::text AS status,
        duration_value,
        duration_unit,
        starts_at,
        expires_at,
        max_assets,
        max_users,
        modules,
        last_verified_at,
        created_at
      FROM product_licenses
      ORDER BY created_at DESC
    `;
    return rows;
  } catch {
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
      max_assets, max_users, modules, issued_by_id, created_at, updated_at
    ) VALUES (
      ${id}, ${orgId}, ${customerName}, ${licenseKey}, 'active'::"ProductLicenseStatus",
      ${input.durationValue}, ${input.durationUnit}, ${now}, ${expiresAt},
      ${maxAssets}, ${maxUsers}, 'ssh,rdp,db,web', ${session.userId}, ${now}, ${now}
    )
  `;

  await logAuditEvent({
    actorUserId: session.userId,
    entityType: 'product_license',
    entityId: id,
    eventType: 'PRODUCT_LICENSE_GENERATED',
    afterData: {
      orgId,
      customerName,
      durationValue: input.durationValue,
      durationUnit: input.durationUnit,
      maxAssets,
      maxUsers,
      expiresAt: expiresAt.toISOString(),
      supersededPrevious: Number(supersededCount),
    },
  });

  revalidatePath('/channel-admin/licenses');
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
  return { success: true };
}
