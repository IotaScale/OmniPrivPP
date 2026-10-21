import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { normalizeDomain, detectDomainConflict } from '@/lib/utils/domain';
import { calculateProtectionDates, calculateLeadDeadline, evaluateLeadSla } from '@/lib/utils/sla';
import { generateDealReference, generateLeadReference } from '@/lib/utils/reference';
import { canViewDeal, canAccessChannelAdmin, canManageTeam } from '@/lib/utils/deal-state';
import { DealStatus, LeadAcceptanceStatus, LeadStatus, MembershipRole, OrgStatus, PartnerTier, UserRole } from '@prisma/client';

describe('OmniPriv Channel Partner Integration Flows', () => {
  let partnerOrgAId: string;
  let partnerOrgBId: string;
  let partnerUserAId: string;
  let partnerUserBId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Clean test records if any existed
    await prisma.notification.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.dealStatusHistory.deleteMany();
    await prisma.dealRegistration.deleteMany();
    await prisma.leadAssignment.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.partnerMembership.deleteMany();
    await prisma.partnerOrganization.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: 'test-flow-' } } });

    // Seed test Channel Admin
    const adminHash = await hashPassword('AdminPass123!');
    const admin = await prisma.user.create({
      data: {
        email: 'test-flow-admin@omnipriv.internal',
        full_name: 'OmniPriv Operations Admin',
        password_hash: adminHash,
        role: UserRole.channel_admin,
      },
    });
    adminUserId = admin.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Flow 1: Partner company signs up and receives immediate operational workspace', async () => {
    const passwordHash = await hashPassword('PartnerSecret123!');

    // Atomic signup transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.partnerOrganization.create({
        data: {
          legal_name: 'Apex Cyber Solutions Ltd',
          display_name: 'Apex Cyber',
          website: 'apexcyber.co.uk',
          country: 'United Kingdom',
          region: 'EMEA',
          partner_type: 'Value Added Reseller (VAR)',
          tier: PartnerTier.Registered,
          status: OrgStatus.active,
        },
      });

      const user = await tx.user.create({
        data: {
          email: 'test-flow-owner@apexcyber.co.uk',
          full_name: 'Eleanor Vance',
          password_hash: passwordHash,
          role: UserRole.partner_user,
          is_active: true,
        },
      });

      const membership = await tx.partnerMembership.create({
        data: {
          user_id: user.id,
          partner_organization_id: org.id,
          role: MembershipRole.partner_owner,
        },
      });

      const audit = await tx.auditEvent.create({
        data: {
          actor_user_id: user.id,
          partner_organization_id: org.id,
          entity_type: 'partner_organization',
          entity_id: org.id,
          event_type: 'partner.organization.created',
          metadata: { tier: org.tier },
        },
      });

      return { org, user, membership, audit };
    });

    partnerOrgAId = result.org.id;
    partnerUserAId = result.user.id;

    expect(result.org.tier).toBe('Registered');
    expect(result.membership.role).toBe('partner_owner');
    expect(result.audit.event_type).toBe('partner.organization.created');

    // Verify password verification with Argon2id
    const isPasswordValid = await verifyPassword('PartnerSecret123!', result.user.password_hash);
    expect(isPasswordValid).toBe(true);
  });

  it('Flow 2: Partner creates a deal registration; domain conflict detection', async () => {
    const ref = await generateDealReference();
    expect(ref).toMatch(/^OPR-\d{4}-\d{6}$/);

    const rawDomain = '  https://WWW.StandardCharteredBank.com/about?src=deal  ';
    const normalized = normalizeDomain(rawDomain);
    expect(normalized).toBe('standardcharteredbank.com');

    // No existing deal on this domain yet -> conflict should be false
    const initialConflict = await detectDomainConflict(normalized, partnerOrgAId);
    expect(initialConflict.hasConflict).toBe(false);

    // Create deal in awaiting_approval
    const deal = await prisma.dealRegistration.create({
      data: {
        public_reference: ref,
        partner_organization_id: partnerOrgAId,
        submitted_by_user_id: partnerUserAId,
        customer_legal_name: 'Standard Chartered Bank',
        customer_domain: normalized,
        customer_country: 'United Kingdom',
        customer_contact_name: 'David Wright',
        customer_contact_email: 'david.wright@scb.com',
        product_interest: 'OmniPriv Enterprise PAM Platform',
        deployment_type: 'Cloud SaaS',
        estimated_deal_value: 120000,
        currency: 'USD',
        status: DealStatus.awaiting_approval,
        conflict_detected: false,
      },
    });

    expect(deal.status).toBe(DealStatus.awaiting_approval);

    // Create another partner organization (Partner B)
    const orgB = await prisma.partnerOrganization.create({
      data: {
        legal_name: 'Nexus Security Group',
        display_name: 'Nexus Security',
        website: 'nexussec.com',
        country: 'Germany',
        region: 'EMEA',
        partner_type: 'System Integrator (SI)',
      },
    });
    partnerOrgBId = orgB.id;

    const userB = await prisma.user.create({
      data: {
        email: 'test-flow-owner@nexussec.com',
        full_name: 'Klaus Schmidt',
        password_hash: await hashPassword('NexusSecret123!'),
        role: UserRole.partner_user,
      },
    });
    partnerUserBId = userB.id;

    await prisma.partnerMembership.create({
      data: {
        user_id: userB.id,
        partner_organization_id: orgB.id,
        role: MembershipRole.partner_owner,
      },
    });

    // When Partner B checks the same customer domain, conflict MUST be detected!
    const conflictForPartnerB = await detectDomainConflict(normalized, partnerOrgBId);
    expect(conflictForPartnerB.hasConflict).toBe(true);
    expect(conflictForPartnerB.conflictingReference).toBe(ref);
    expect(conflictForPartnerB.isSamePartner).toBe(false);
  });

  it('Flow 3: Channel Admin approves deal registration and grants 90-day protection', async () => {
    const deal = await prisma.dealRegistration.findFirst({
      where: { partner_organization_id: partnerOrgAId },
    });
    expect(deal).toBeDefined();

    const now = new Date();
    const { protectionStartsAt, protectionExpiresAt } = calculateProtectionDates(now);

    const approvedDeal = await prisma.dealRegistration.update({
      where: { id: deal!.id },
      data: {
        status: DealStatus.approved,
        reviewed_by_user_id: adminUserId,
        reviewed_at: now,
        admin_decision_reason: 'Approved with 90-day exclusivity.',
        protection_starts_at: protectionStartsAt,
        protection_expires_at: protectionExpiresAt,
      },
    });

    expect(approvedDeal.status).toBe(DealStatus.approved);
    expect(approvedDeal.protection_starts_at).toBeDefined();
    expect(approvedDeal.protection_expires_at).toBeDefined();

    const diffDays = Math.round(
      (new Date(approvedDeal.protection_expires_at!).getTime() -
        new Date(approvedDeal.protection_starts_at!).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(90);
  });

  it('Flow 4: Strict Multi-Tenant Isolation & Role Boundaries', () => {
    const partnerUserAContext = {
      role: UserRole.partner_user,
      partnerOrgId: partnerOrgAId,
      membershipRole: MembershipRole.partner_owner,
    };
    const partnerUserBContext = {
      role: UserRole.partner_user,
      partnerOrgId: partnerOrgBId,
      membershipRole: MembershipRole.partner_owner,
    };
    const adminContext = {
      role: UserRole.channel_admin,
    };

    // Partner A can view Deal A
    expect(canViewDeal(partnerUserAContext, partnerOrgAId)).toBe(true);
    // Partner B CANNOT view Deal A (strict isolation)
    expect(canViewDeal(partnerUserBContext, partnerOrgAId)).toBe(false);
    // Admin can view all
    expect(canViewDeal(adminContext, partnerOrgAId)).toBe(true);

    // Partner users cannot access Channel Admin console
    expect(canAccessChannelAdmin(partnerUserAContext)).toBe(false);
    expect(canAccessChannelAdmin(partnerUserBContext)).toBe(false);
    expect(canAccessChannelAdmin(adminContext)).toBe(true);

    // Team management boundaries
    expect(canManageTeam(partnerUserAContext, partnerOrgAId)).toBe(true);
    expect(canManageTeam(partnerUserBContext, partnerOrgAId)).toBe(false);
    expect(partnerUserBId).toBeDefined();
  });

  it('Flow 5: Lead assignment -> 7-day SLA -> Partner accept -> Deal conversion', async () => {
    const leadRef = await generateLeadReference();
    const deadline = calculateLeadDeadline(new Date(), 7);

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        public_reference: leadRef,
        customer_name: 'Fatima Zahra',
        company: 'Emirates Global Aluminum',
        customer_domain: 'ega.ae',
        contact_first_name: 'Fatima',
        contact_last_name: 'Zahra',
        contact_email: 'f.zahra@ega.ae',
        country: 'United Arab Emirates',
        lead_source: 'OmniPriv Cybersecurity Summit 2026',
        product_interest: 'OmniPriv Zero-Trust Privilege Broker',
        status: LeadStatus.assigned,
      },
    });

    // Assign to Partner A with 7-day acceptance deadline
    const assignment = await prisma.leadAssignment.create({
      data: {
        lead_id: lead.id,
        partner_organization_id: partnerOrgAId,
        assigned_by_user_id: adminUserId,
        acceptance_deadline_at: deadline,
        partner_acceptance_status: LeadAcceptanceStatus.pending,
        current_status: 'assigned',
      },
    });

    // Verify SLA calculation
    const sla = evaluateLeadSla(assignment.acceptance_deadline_at, null);
    expect(sla.isBreached).toBe(false);
    expect(sla.formattedRemaining).toContain('d');

    // Partner A accepts the lead
    const acceptedAssignment = await prisma.leadAssignment.update({
      where: { id: assignment.id },
      data: {
        partner_acceptance_status: LeadAcceptanceStatus.accepted,
        accepted_at: new Date(),
        current_status: 'working',
      },
    });
    expect(acceptedAssignment.partner_acceptance_status).toBe('accepted');

    // Partner A converts accepted lead into a deal registration
    const dealRef = await generateDealReference();
    const convertedDeal = await prisma.dealRegistration.create({
      data: {
        public_reference: dealRef,
        partner_organization_id: partnerOrgAId,
        submitted_by_user_id: partnerUserAId,
        customer_legal_name: lead.company,
        customer_domain: lead.customer_domain!,
        customer_country: lead.country,
        customer_contact_name: lead.customer_name,
        customer_contact_email: lead.contact_email,
        product_interest: lead.product_interest || 'OmniPriv PAM',
        deployment_type: 'Hybrid Multi-Cloud Deployment',
        status: DealStatus.awaiting_approval,
        converted_from_lead_assignment_id: assignment.id,
      },
    });

    await prisma.leadAssignment.update({
      where: { id: assignment.id },
      data: {
        current_status: 'converted',
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: LeadStatus.converted },
    });

    const finalLead = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(finalLead!.status).toBe(LeadStatus.converted);
    expect(convertedDeal.converted_from_lead_assignment_id).toBe(assignment.id);
  });
});
