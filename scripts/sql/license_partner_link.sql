-- Partner-visible product licenses: optional reseller partner on product licenses.
-- Additive and idempotent: safe to re-run; existing rows are not modified.

ALTER TABLE "product_licenses" ADD COLUMN IF NOT EXISTS "partner_organization_id" TEXT;

CREATE INDEX IF NOT EXISTS "product_licenses_partner_organization_id_idx"
    ON "product_licenses"("partner_organization_id");

DO $$ BEGIN
    ALTER TABLE "product_licenses"
        ADD CONSTRAINT "product_licenses_partner_organization_id_fkey"
        FOREIGN KEY ("partner_organization_id") REFERENCES "partner_organizations"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
