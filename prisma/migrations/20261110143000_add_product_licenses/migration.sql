-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ProductLicenseStatus" AS ENUM ('active', 'expired', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_licenses" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "license_key" TEXT NOT NULL,
    "status" "ProductLicenseStatus" NOT NULL DEFAULT 'active',
    "duration_value" INTEGER NOT NULL,
    "duration_unit" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "max_assets" INTEGER,
    "max_users" INTEGER,
    "modules" TEXT NOT NULL DEFAULT 'ssh,rdp,db,web',
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,
    "issued_by_id" TEXT,
    "last_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_licenses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_licenses_license_key_key" ON "product_licenses"("license_key");
CREATE INDEX IF NOT EXISTS "product_licenses_org_id_idx" ON "product_licenses"("org_id");
CREATE INDEX IF NOT EXISTS "product_licenses_status_idx" ON "product_licenses"("status");
CREATE INDEX IF NOT EXISTS "product_licenses_expires_at_idx" ON "product_licenses"("expires_at");

