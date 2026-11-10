import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

interface ProductLicenseRow {
  id: string;
  org_id: string;
  customer_name: string | null;
  license_key: string;
  status: 'active' | 'expired' | 'revoked' | string;
  duration_value: number;
  duration_unit: string;
  starts_at: Date;
  expires_at: Date;
  max_assets: number | null;
  max_users: number | null;
  modules: string;
}

/**
 * POST /api/licenses/verify
 *
 * Called by OmniPrive backend (on license key assignment and during the daily 00:00 cron)
 * to validate an organization's license key against Supabase records.
 */
export async function POST(request: NextRequest) {
  try {
    const configuredApiKey = (process.env.PP_API_KEY || '').trim();
    if (configuredApiKey) {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token !== configuredApiKey) {
        return NextResponse.json(
          { valid: false, status: 'invalid', error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body = (await request.json()) as {
      org_id?: string;
      license_key?: string;
    };

    const orgId = (body.org_id || '').trim();
    const licenseKey = (body.license_key || '').trim();
    const now = new Date();

    if (!orgId || !licenseKey) {
      return NextResponse.json(
        {
          valid: false,
          org_id: orgId,
          status: 'invalid',
          expires_at: null,
          remaining_days: 0,
          remaining_seconds: 0,
          verified_at: now.toISOString(),
        },
        { status: 400 }
      );
    }

    const rows = await prisma.$queryRaw<ProductLicenseRow[]>`
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
        modules
      FROM product_licenses
      WHERE license_key = ${licenseKey}
      LIMIT 1
    `;

    const license = rows[0];

    if (!license || license.org_id !== orgId) {
      return NextResponse.json({
        valid: false,
        org_id: orgId,
        status: 'invalid',
        expires_at: null,
        remaining_days: 0,
        remaining_seconds: 0,
        verified_at: now.toISOString(),
      });
    }

    const expiresAt = new Date(license.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let effectiveStatus: 'active' | 'expired' | 'revoked' =
      license.status === 'revoked'
        ? 'revoked'
        : diffMs <= 0
          ? 'expired'
          : 'active';

    // Update last_verified_at and persist expired status if it just crossed expiration
    await prisma.$executeRaw`
      UPDATE product_licenses
      SET
        status = ${effectiveStatus}::"ProductLicenseStatus",
        last_verified_at = ${now},
        updated_at = ${now}
      WHERE id = ${license.id}
    `;

    return NextResponse.json({
      valid: effectiveStatus === 'active',
      org_id: license.org_id,
      status: effectiveStatus,
      expires_at: expiresAt.toISOString(),
      remaining_days: effectiveStatus === 'active' ? remainingDays : 0,
      remaining_seconds: effectiveStatus === 'active' ? remainingSeconds : 0,
      verified_at: now.toISOString(),
      max_assets: license.max_assets,
      max_users: license.max_users,
      modules: license.modules,
    });
  } catch (error) {
    console.error('[PP_LICENSE_VERIFY_ERROR]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal verification error' },
      { status: 500 }
    );
  }
}

