-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('partner_user', 'channel_admin');

-- CreateEnum
CREATE TYPE "PartnerTier" AS ENUM ('Registered', 'Silver', 'Gold', 'Platinum');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('partner_owner', 'partner_member');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('draft', 'awaiting_approval', 'approved', 'declined', 'closed_won', 'closed_lost', 'expired');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'assigned', 'working', 'qualified', 'disqualified', 'converted');

-- CreateEnum
CREATE TYPE "LeadAcceptanceStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('sales_playbook', 'product_collateral', 'technical_enablement', 'certification', 'marketing_asset');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'partner_user',
    "email_verified_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_organizations" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "partner_type" TEXT NOT NULL,
    "market_vertical" TEXT,
    "company_summary" TEXT,
    "tier" "PartnerTier" NOT NULL DEFAULT 'Registered',
    "partner_manager_user_id" TEXT,
    "status" "OrgStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "partner_organization_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'partner_member',
    "invited_by_user_id" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_registrations" (
    "id" TEXT NOT NULL,
    "public_reference" TEXT NOT NULL,
    "partner_organization_id" TEXT NOT NULL,
    "submitted_by_user_id" TEXT NOT NULL,
    "customer_legal_name" TEXT NOT NULL,
    "customer_domain" TEXT NOT NULL,
    "customer_country" TEXT NOT NULL,
    "customer_industry" TEXT,
    "customer_contact_name" TEXT NOT NULL,
    "customer_contact_email" TEXT NOT NULL,
    "customer_contact_phone" TEXT,
    "product_interest" TEXT NOT NULL,
    "deployment_type" TEXT NOT NULL,
    "estimated_arr" DOUBLE PRECISION,
    "estimated_deal_value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expected_seat_count" INTEGER,
    "expected_close_date" TIMESTAMP(3),
    "deployment_timeline" TEXT,
    "opportunity_source" TEXT,
    "partner_notes" TEXT,
    "status" "DealStatus" NOT NULL DEFAULT 'draft',
    "conflict_detected" BOOLEAN NOT NULL DEFAULT false,
    "conflict_reason" TEXT,
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "admin_decision_reason" TEXT,
    "protection_starts_at" TIMESTAMP(3),
    "protection_expires_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "converted_from_lead_assignment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_status_history" (
    "id" TEXT NOT NULL,
    "deal_registration_id" TEXT NOT NULL,
    "previous_status" "DealStatus",
    "new_status" "DealStatus" NOT NULL,
    "changed_by_user_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "public_reference" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_domain" TEXT,
    "contact_first_name" TEXT NOT NULL,
    "contact_last_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "company" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "industry" TEXT,
    "lead_source" TEXT NOT NULL,
    "product_interest" TEXT,
    "estimated_seat_count" INTEGER,
    "customer_comment" TEXT,
    "internal_notes" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_assignments" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "partner_organization_id" TEXT NOT NULL,
    "assigned_by_user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptance_deadline_at" TIMESTAMP(3) NOT NULL,
    "partner_acceptance_status" "LeadAcceptanceStatus" NOT NULL DEFAULT 'pending',
    "accepted_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "decline_reason" TEXT,
    "current_status" TEXT NOT NULL DEFAULT 'assigned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewals" (
    "id" TEXT NOT NULL,
    "partner_organization_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "product_plan" TEXT NOT NULL,
    "contracted_capacity" TEXT,
    "renewal_date" TIMESTAMP(3) NOT NULL,
    "contract_value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "commercial_status" TEXT NOT NULL DEFAULT 'upcoming',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "url" TEXT NOT NULL,
    "visible_to_tiers" TEXT[] DEFAULT ARRAY['Registered', 'Silver', 'Gold', 'Platinum']::TEXT[],
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "partner_organization_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "partner_organization_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'info',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "partner_organizations_tier_idx" ON "partner_organizations"("tier");

-- CreateIndex
CREATE INDEX "partner_organizations_status_idx" ON "partner_organizations"("status");

-- CreateIndex
CREATE INDEX "partner_organizations_country_idx" ON "partner_organizations"("country");

-- CreateIndex
CREATE INDEX "partner_memberships_partner_organization_id_idx" ON "partner_memberships"("partner_organization_id");

-- CreateIndex
CREATE INDEX "partner_memberships_user_id_idx" ON "partner_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_memberships_user_id_partner_organization_id_key" ON "partner_memberships"("user_id", "partner_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "deal_registrations_public_reference_key" ON "deal_registrations"("public_reference");

-- CreateIndex
CREATE UNIQUE INDEX "deal_registrations_converted_from_lead_assignment_id_key" ON "deal_registrations"("converted_from_lead_assignment_id");

-- CreateIndex
CREATE INDEX "deal_registrations_partner_organization_id_idx" ON "deal_registrations"("partner_organization_id");

-- CreateIndex
CREATE INDEX "deal_registrations_status_idx" ON "deal_registrations"("status");

-- CreateIndex
CREATE INDEX "deal_registrations_customer_domain_idx" ON "deal_registrations"("customer_domain");

-- CreateIndex
CREATE INDEX "deal_registrations_protection_expires_at_idx" ON "deal_registrations"("protection_expires_at");

-- CreateIndex
CREATE INDEX "deal_registrations_created_at_idx" ON "deal_registrations"("created_at");

-- CreateIndex
CREATE INDEX "deal_status_history_deal_registration_id_idx" ON "deal_status_history"("deal_registration_id");

-- CreateIndex
CREATE INDEX "deal_status_history_created_at_idx" ON "deal_status_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "leads_public_reference_key" ON "leads"("public_reference");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_customer_domain_idx" ON "leads"("customer_domain");

-- CreateIndex
CREATE INDEX "leads_country_idx" ON "leads"("country");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "lead_assignments_partner_organization_id_idx" ON "lead_assignments"("partner_organization_id");

-- CreateIndex
CREATE INDEX "lead_assignments_lead_id_idx" ON "lead_assignments"("lead_id");

-- CreateIndex
CREATE INDEX "lead_assignments_partner_acceptance_status_idx" ON "lead_assignments"("partner_acceptance_status");

-- CreateIndex
CREATE INDEX "lead_assignments_acceptance_deadline_at_idx" ON "lead_assignments"("acceptance_deadline_at");

-- CreateIndex
CREATE INDEX "renewals_partner_organization_id_idx" ON "renewals"("partner_organization_id");

-- CreateIndex
CREATE INDEX "renewals_renewal_date_idx" ON "renewals"("renewal_date");

-- CreateIndex
CREATE INDEX "resource_items_category_idx" ON "resource_items"("category");

-- CreateIndex
CREATE INDEX "resource_items_is_published_idx" ON "resource_items"("is_published");

-- CreateIndex
CREATE INDEX "audit_events_partner_organization_id_idx" ON "audit_events"("partner_organization_id");

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_idx" ON "audit_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_events_event_type_idx" ON "audit_events"("event_type");

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_partner_organization_id_idx" ON "notifications"("partner_organization_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "partner_memberships" ADD CONSTRAINT "partner_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_memberships" ADD CONSTRAINT "partner_memberships_partner_organization_id_fkey" FOREIGN KEY ("partner_organization_id") REFERENCES "partner_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_registrations" ADD CONSTRAINT "deal_registrations_partner_organization_id_fkey" FOREIGN KEY ("partner_organization_id") REFERENCES "partner_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_registrations" ADD CONSTRAINT "deal_registrations_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_registrations" ADD CONSTRAINT "deal_registrations_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_registrations" ADD CONSTRAINT "deal_registrations_converted_from_lead_assignment_id_fkey" FOREIGN KEY ("converted_from_lead_assignment_id") REFERENCES "lead_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_status_history" ADD CONSTRAINT "deal_status_history_deal_registration_id_fkey" FOREIGN KEY ("deal_registration_id") REFERENCES "deal_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_status_history" ADD CONSTRAINT "deal_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_partner_organization_id_fkey" FOREIGN KEY ("partner_organization_id") REFERENCES "partner_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewals" ADD CONSTRAINT "renewals_partner_organization_id_fkey" FOREIGN KEY ("partner_organization_id") REFERENCES "partner_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_partner_organization_id_fkey" FOREIGN KEY ("partner_organization_id") REFERENCES "partner_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_partner_organization_id_fkey" FOREIGN KEY ("partner_organization_id") REFERENCES "partner_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
