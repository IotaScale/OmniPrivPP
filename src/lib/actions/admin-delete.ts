'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LeadStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { maskLicenseKey } from '@/lib/utils/license';
import {
  confirmationMatches,
  evaluatePartnerUserDeletion,
  pickReplacementMember,
  selectOrgUsersForDeletion,
  supportTenantIdForOrg,
} from '@/lib/utils/admin-delete-guards';

/*
 * Channel Admin delete actions.
 *
 * Every action: requireAdminSession() first, zod-validates the id, runs in one
 * transaction, records an AuditEvent and revalidates the affected pages.
 * Delete audit rows always keep `partner_organization_id` NULL (the org id is in
 * metadata) because audit_events cascades on organization delete; a later org
 * delete must not erase the record of what was deleted.
 */

export interface AdminDeleteResult {
  success: boolean;
  error?: string;
  message?: string;
}

type Tx = Prisma.TransactionClient;

const IdSchema = z
  .string()
  .trim()
  .min(1, 'Missing id.')
  .max(128, 'Invalid id.')
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid id.');

/** Thrown inside a transaction to abort it with a message safe to show the admin. */
class DeleteBlockedError extends Error {}

const TX_OPTIONS = { maxWait: 10_000, timeout: 60_000 } as const;

function parseId(raw: unknown): { ok: true; id: string } | { ok: false; error: string } {
  const parsed = IdSchema.safeParse(raw);
  return parsed.success ? { ok: true, id: parsed.data } : { ok: false, error: 'Invalid identifier.' };
}

function failure(tag: string, err: unknown, fallback: string): AdminDeleteResult {
  if (err instanceof DeleteBlockedError) return { success: false, error: err.message };
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return { success: false, error: 'Record not found. It may already have been deleted.' };
  }
  console.error(`[${tag}]`, err instanceof Error ? err.message : err);
  return { success: false, error: fallback };
}

function revalidateAll(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

// ---------------------------------------------------------------------------
// Support portal (customer_support schema in the same database)
// ---------------------------------------------------------------------------

/** `table.column` names present in the customer_support schema (empty if absent). */
async function loadSupportColumns(tx: Tx): Promise<Set<string>> {
  const rows = await tx.$queryRaw<{ col: string }[]>`
    SELECT table_name || '.' || column_name AS col
    FROM information_schema.columns
    WHERE table_schema = 'customer_support'
  `;
  return new Set(rows.map((r) => r.col));
}

/**
 * Remove support-portal users. Rows that reference them without a cascade are
 * handled first: audit actor is nulled; cases/messages are handed to another
 * user of the same tenant when one exists, otherwise deleted.
 */
async function removeSupportUsers(tx: Tx, cols: Set<string>, csUserIds: string[]): Promise<number> {
  if (csUserIds.length === 0 || !cols.has('users.id')) return 0;
  const sameTenant = cols.has('users.tenant_id');

  if (cols.has('audit_events.actor_user_id')) {
    await tx.$executeRaw`
      UPDATE customer_support.audit_events SET actor_user_id = NULL
      WHERE actor_user_id = ANY(${csUserIds}::text[])
    `;
  }

  if (cols.has('case_messages.author_user_id')) {
    if (sameTenant && cols.has('case_messages.tenant_id')) {
      await tx.$executeRaw`
        UPDATE customer_support.case_messages m
        SET author_user_id = (
          SELECT u.id FROM customer_support.users u
          WHERE u.tenant_id = m.tenant_id AND u.id <> ALL(${csUserIds}::text[])
          ORDER BY u.created_at ASC LIMIT 1
        )
        WHERE m.author_user_id = ANY(${csUserIds}::text[])
          AND EXISTS (
            SELECT 1 FROM customer_support.users u
            WHERE u.tenant_id = m.tenant_id AND u.id <> ALL(${csUserIds}::text[])
          )
      `;
    }
    await tx.$executeRaw`
      DELETE FROM customer_support.case_messages WHERE author_user_id = ANY(${csUserIds}::text[])
    `;
  }

  if (cols.has('cases.opened_by_user_id')) {
    if (sameTenant && cols.has('cases.tenant_id')) {
      await tx.$executeRaw`
        UPDATE customer_support.cases c
        SET opened_by_user_id = (
          SELECT u.id FROM customer_support.users u
          WHERE u.tenant_id = c.tenant_id AND u.id <> ALL(${csUserIds}::text[])
          ORDER BY u.created_at ASC LIMIT 1
        )
        WHERE c.opened_by_user_id = ANY(${csUserIds}::text[])
          AND EXISTS (
            SELECT 1 FROM customer_support.users u
            WHERE u.tenant_id = c.tenant_id AND u.id <> ALL(${csUserIds}::text[])
          )
      `;
    }
    if (cols.has('case_messages.case_id')) {
      await tx.$executeRaw`
        DELETE FROM customer_support.case_messages
        WHERE case_id IN (
          SELECT id FROM customer_support.cases WHERE opened_by_user_id = ANY(${csUserIds}::text[])
        )
      `;
    }
    await tx.$executeRaw`
      DELETE FROM customer_support.cases WHERE opened_by_user_id = ANY(${csUserIds}::text[])
    `;
  }

  return tx.$executeRaw`DELETE FROM customer_support.users WHERE id = ANY(${csUserIds}::text[])`;
}

interface SupportPurgeSummary {
  tenants: number;
  cases: number;
  users: number;
}

/** Remove support-portal data for deleted partner users (no-op if the schema is absent). */
async function purgeSupportForUsers(tx: Tx, partnerUserIds: string[]): Promise<number> {
  if (partnerUserIds.length === 0) return 0;
  const cols = await loadSupportColumns(tx);
  if (!cols.has('users.partner_user_id')) return 0;

  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM customer_support.users WHERE partner_user_id = ANY(${partnerUserIds}::text[])
  `;
  const removed = await removeSupportUsers(
    tx,
    cols,
    rows.map((r) => r.id)
  );
  if (cols.has('sso_handoffs.partner_user_id')) {
    await tx.$executeRaw`
      DELETE FROM customer_support.sso_handoffs WHERE partner_user_id = ANY(${partnerUserIds}::text[])
    `;
  }
  return removed;
}

/** Remove the organization's support tenant and everything in it (no-op if absent). */
async function purgeSupportForOrg(
  tx: Tx,
  orgId: string,
  deletedPartnerUserIds: string[]
): Promise<SupportPurgeSummary> {
  const summary: SupportPurgeSummary = { tenants: 0, cases: 0, users: 0 };
  const cols = await loadSupportColumns(tx);
  if (cols.size === 0) return summary;

  let tenantIds: string[] = [];
  if (cols.has('tenants.id')) {
    const tenantId = supportTenantIdForOrg(orgId);
    const rows = cols.has('tenants.partner_organization_id')
      ? await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM customer_support.tenants WHERE id = ${tenantId} OR partner_organization_id = ${orgId}
        `
      : await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM customer_support.tenants WHERE id = ${tenantId}
        `;
    tenantIds = rows.map((r) => r.id);
  }

  if (tenantIds.length > 0) {
    if (cols.has('case_messages.tenant_id')) {
      await tx.$executeRaw`
        DELETE FROM customer_support.case_messages WHERE tenant_id = ANY(${tenantIds}::text[])
      `;
    }
    if (cols.has('cases.tenant_id')) {
      summary.cases = await tx.$executeRaw`
        DELETE FROM customer_support.cases WHERE tenant_id = ANY(${tenantIds}::text[])
      `;
    }
    if (cols.has('audit_events.tenant_id')) {
      await tx.$executeRaw`
        DELETE FROM customer_support.audit_events WHERE tenant_id = ANY(${tenantIds}::text[])
      `;
    }
    if (cols.has('entitlements.tenant_id')) {
      await tx.$executeRaw`
        DELETE FROM customer_support.entitlements WHERE tenant_id = ANY(${tenantIds}::text[])
      `;
    }
  }

  if (cols.has('users.id')) {
    const byTenant = cols.has('users.tenant_id') && tenantIds.length > 0;
    const byPartner = cols.has('users.partner_user_id') && deletedPartnerUserIds.length > 0;
    let csUserIds: string[] = [];
    if (byTenant && byPartner) {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM customer_support.users
        WHERE tenant_id = ANY(${tenantIds}::text[]) OR partner_user_id = ANY(${deletedPartnerUserIds}::text[])
      `;
      csUserIds = rows.map((r) => r.id);
    } else if (byTenant) {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM customer_support.users WHERE tenant_id = ANY(${tenantIds}::text[])
      `;
      csUserIds = rows.map((r) => r.id);
    } else if (byPartner) {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM customer_support.users WHERE partner_user_id = ANY(${deletedPartnerUserIds}::text[])
      `;
      csUserIds = rows.map((r) => r.id);
    }
    summary.users = await removeSupportUsers(tx, cols, csUserIds);
  }

  if (cols.has('sso_handoffs.partner_user_id') && deletedPartnerUserIds.length > 0) {
    await tx.$executeRaw`
      DELETE FROM customer_support.sso_handoffs WHERE partner_user_id = ANY(${deletedPartnerUserIds}::text[])
    `;
  }

  if (tenantIds.length > 0) {
    summary.tenants = await tx.$executeRaw`
      DELETE FROM customer_support.tenants WHERE id = ANY(${tenantIds}::text[])
    `;
  }

  return summary;
}

// ---------------------------------------------------------------------------
// 1. Partner organization
// ---------------------------------------------------------------------------

/**
 * Delete a partner organization and everything it owns. `confirmation` must be
 * the organization's display name (typed by the admin).
 */
export async function deletePartnerOrganizationAction(
  orgId: string,
  confirmation: string
): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(orgId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.partnerOrganization.findUnique({
        where: { id },
        select: {
          id: true,
          legal_name: true,
          display_name: true,
          website: true,
          tier: true,
          memberships: {
            select: {
              user_id: true,
              user: {
                select: {
                  email: true,
                  role: true,
                  _count: { select: { memberships: true } },
                },
              },
            },
          },
          lead_assignments: { select: { lead_id: true } },
          _count: {
            select: {
              memberships: true,
              deals: true,
              lead_assignments: true,
              renewals: true,
              notifications: true,
              commercial_requests: true,
              course_enrollments: true,
              partner_certifications: true,
              event_registrations: true,
              joint_business_plans: true,
              terms_acceptances: true,
              support_tickets: true,
              audit_events: true,
              product_licenses: true,
            },
          },
        },
      });
      if (!org) throw new DeleteBlockedError('Partner organization not found. It may already have been deleted.');

      if (!confirmationMatches(confirmation, org.display_name)) {
        throw new DeleteBlockedError(`Type "${org.display_name}" exactly to confirm the deletion.`);
      }

      // Which members lose their account along with the organization?
      const candidateIds = org.memberships
        .filter((m) => m.user.role !== 'channel_admin' && m.user._count.memberships <= 1)
        .map((m) => m.user_id);

      const externalRefs = new Set<string>();
      if (candidateIds.length > 0) {
        const [extDeals, extRequests, assignedLeads] = await Promise.all([
          tx.dealRegistration.findMany({
            where: { submitted_by_user_id: { in: candidateIds }, partner_organization_id: { not: id } },
            select: { submitted_by_user_id: true },
          }),
          tx.commercialRequest.findMany({
            where: { requested_by_user_id: { in: candidateIds }, partner_organization_id: { not: id } },
            select: { requested_by_user_id: true },
          }),
          tx.leadAssignment.findMany({
            where: { assigned_by_user_id: { in: candidateIds }, partner_organization_id: { not: id } },
            select: { assigned_by_user_id: true },
          }),
        ]);
        extDeals.forEach((d) => externalRefs.add(d.submitted_by_user_id));
        extRequests.forEach((r) => externalRefs.add(r.requested_by_user_id));
        assignedLeads.forEach((a) => externalRefs.add(a.assigned_by_user_id));
      }

      const selection = selectOrgUsersForDeletion(
        org.memberships.map((m) => ({
          userId: m.user_id,
          email: m.user.email,
          userRole: m.user.role,
          otherMembershipCount: Math.max(0, m.user._count.memberships - 1),
          hasExternalRecords: externalRefs.has(m.user_id),
        }))
      );
      const deleteUserIds = selection.toDelete.map((u) => u.userId);

      // Support portal first (raw SQL, guarded so it no-ops without the schema).
      const support = await purgeSupportForOrg(tx, id, deleteUserIds);

      // Licenses are kept; only the reseller link is removed.
      const unlinked = await tx.productLicense.updateMany({
        where: { partner_organization_id: id },
        data: { partner_organization_id: null },
      });

      // Explicit removal of org-owned records (all cascade at the DB level too).
      const dealIds = (
        await tx.dealRegistration.findMany({ where: { partner_organization_id: id }, select: { id: true } })
      ).map((d) => d.id);
      const statusHistory = await tx.dealStatusHistory.deleteMany({
        where: { deal_registration_id: { in: dealIds } },
      });
      await tx.dealRegistration.deleteMany({ where: { partner_organization_id: id } });
      await tx.leadAssignment.deleteMany({ where: { partner_organization_id: id } });
      const ticketIds = (
        await tx.supportTicket.findMany({ where: { partner_organization_id: id }, select: { id: true } })
      ).map((t) => t.id);
      await tx.ticketMessage.deleteMany({ where: { ticket_id: { in: ticketIds } } });
      await tx.supportTicket.deleteMany({ where: { partner_organization_id: id } });
      await tx.renewal.deleteMany({ where: { partner_organization_id: id } });
      await tx.notification.deleteMany({ where: { partner_organization_id: id } });
      await tx.commercialRequest.deleteMany({ where: { partner_organization_id: id } });
      await tx.courseEnrollment.deleteMany({ where: { partner_organization_id: id } });
      await tx.partnerCertification.deleteMany({ where: { partner_organization_id: id } });
      await tx.eventRegistration.deleteMany({ where: { partner_organization_id: id } });
      await tx.jointBusinessPlan.deleteMany({ where: { partner_organization_id: id } });
      await tx.termsAcceptance.deleteMany({ where: { partner_organization_id: id } });
      await tx.partnerLocatorProfile.deleteMany({ where: { partner_organization_id: id } });
      await tx.auditEvent.deleteMany({ where: { partner_organization_id: id } });
      await tx.partnerMembership.deleteMany({ where: { partner_organization_id: id } });
      await tx.partnerOrganization.delete({ where: { id } });

      // Users who only belonged to this org (their remaining rows cascade or set null).
      const deletedUsers =
        deleteUserIds.length > 0
          ? await tx.user.deleteMany({
              where: { id: { in: deleteUserIds }, role: { not: 'channel_admin' } },
            })
          : { count: 0 };

      // Leads that were routed only to this org become routable again.
      const leadIds = [...new Set(org.lead_assignments.map((a) => a.lead_id))];
      if (leadIds.length > 0) {
        await tx.lead.updateMany({
          where: {
            id: { in: leadIds },
            assignments: { none: {} },
            status: { in: [LeadStatus.assigned, LeadStatus.working, LeadStatus.qualified] },
          },
          data: { status: LeadStatus.new },
        });
      }

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'partner_organization',
          entity_id: org.id,
          event_type: 'partner.organization.deleted',
          metadata: {
            partner_organization_id: org.id,
            display_name: org.display_name,
            legal_name: org.legal_name,
            website: org.website,
            tier: org.tier,
            removed: {
              ...org._count,
              deal_status_history: statusHistory.count,
              users: deletedUsers.count,
            },
            deleted_user_ids: deleteUserIds,
            deleted_user_emails: selection.toDelete.map((u) => u.email),
            retained_users: selection.retained.map((u) => ({ id: u.userId, reason: u.reason })),
            licenses_unlinked: unlinked.count,
            support_portal: { ...support },
          },
        },
      });

      return { name: org.display_name, users: deletedUsers.count };
    }, TX_OPTIONS);

    revalidateAll([
      '/channel-admin',
      '/channel-admin/partners',
      `/channel-admin/partners/${id}`,
      '/channel-admin/deals',
      '/channel-admin/deal-conflicts',
      '/channel-admin/leads',
      '/channel-admin/licenses',
      '/channel-admin/renewals',
      '/channel-admin/commercial-requests',
      '/channel-admin/audit-log',
    ]);
    return {
      success: true,
      message: `${result.name} was deleted${result.users ? ` with ${result.users} user account${result.users === 1 ? '' : 's'}` : ''}.`,
    };
  } catch (err) {
    return failure('DELETE_PARTNER_ORG_ERROR', err, 'Failed to delete partner organization.');
  }
}

// ---------------------------------------------------------------------------
// 2. Partner user
// ---------------------------------------------------------------------------

export async function deletePartnerUserAction(userId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(userId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          memberships: {
            select: {
              role: true,
              partner_organization_id: true,
              organization: { select: { display_name: true } },
            },
          },
        },
      });
      if (!target) throw new DeleteBlockedError('User not found. It may already have been deleted.');

      const orgIds = target.memberships.map((m) => m.partner_organization_id);
      const ownerCounts = orgIds.length
        ? await tx.partnerMembership.groupBy({
            by: ['partner_organization_id'],
            where: { partner_organization_id: { in: orgIds }, role: 'partner_owner' },
            _count: { _all: true },
          })
        : [];
      const ownerCountByOrg = new Map(ownerCounts.map((r) => [r.partner_organization_id, r._count._all]));

      const decision = evaluatePartnerUserDeletion({
        actorUserId: session.userId,
        target: { id: target.id, role: target.role },
        memberships: target.memberships.map((m) => ({
          orgId: m.partner_organization_id,
          orgName: m.organization.display_name,
          role: m.role,
          ownerCount: ownerCountByOrg.get(m.partner_organization_id) ?? 0,
        })),
      });
      if (!decision.allowed) throw new DeleteBlockedError(decision.reason);

      // Deals and commercial requests stay with the organization: hand them to
      // another member (owner first). RESTRICT FKs would otherwise block.
      // Org support tickets they opened (and their replies) would cascade away
      // with the user, so those move to the same teammate as well.
      const [ownedDeals, ownedRequests, ownedTickets, ownedReplies] = await Promise.all([
        tx.dealRegistration.findMany({
          where: { submitted_by_user_id: id },
          select: { partner_organization_id: true },
        }),
        tx.commercialRequest.findMany({
          where: { requested_by_user_id: id },
          select: { partner_organization_id: true },
        }),
        tx.supportTicket.findMany({
          where: { created_by_user_id: id, partner_organization_id: { not: null } },
          select: { partner_organization_id: true },
        }),
        tx.ticketMessage.findMany({
          where: { sender_user_id: id, ticket: { partner_organization_id: { not: null } } },
          select: { ticket: { select: { partner_organization_id: true } } },
        }),
      ]);
      const affectedOrgIds = [
        ...new Set(
          [
            ...ownedDeals.map((r) => r.partner_organization_id),
            ...ownedRequests.map((r) => r.partner_organization_id),
            ...ownedTickets.map((r) => r.partner_organization_id),
            ...ownedReplies.map((r) => r.ticket.partner_organization_id),
          ].filter((v): v is string => Boolean(v))
        ),
      ];
      let reassigned = 0;
      for (const orgId of affectedOrgIds) {
        const members = await tx.partnerMembership.findMany({
          where: { partner_organization_id: orgId },
          select: {
            user_id: true,
            role: true,
            joined_at: true,
            user: { select: { is_active: true } },
            organization: { select: { display_name: true } },
          },
        });
        const replacement = pickReplacementMember(
          members.map((m) => ({
            userId: m.user_id,
            role: m.role,
            joinedAt: m.joined_at,
            isActive: m.user.is_active,
          })),
          [id]
        );
        if (!replacement) {
          const name = members[0]?.organization.display_name ?? 'another organization';
          throw new DeleteBlockedError(
            `This user owns deals, requests or support tickets in ${name}, which has no other member to take them over. Delete the organization instead.`
          );
        }
        const d = await tx.dealRegistration.updateMany({
          where: { submitted_by_user_id: id, partner_organization_id: orgId },
          data: { submitted_by_user_id: replacement },
        });
        const r = await tx.commercialRequest.updateMany({
          where: { requested_by_user_id: id, partner_organization_id: orgId },
          data: { requested_by_user_id: replacement },
        });
        const t = await tx.supportTicket.updateMany({
          where: { created_by_user_id: id, partner_organization_id: orgId },
          data: { created_by_user_id: replacement },
        });
        const m = await tx.ticketMessage.updateMany({
          where: { sender_user_id: id, ticket: { partner_organization_id: orgId } },
          data: { sender_user_id: replacement },
        });
        reassigned += d.count + r.count + t.count + m.count;
      }

      // Lead assignments made by this user (unusual for partners) move to the acting admin.
      await tx.leadAssignment.updateMany({
        where: { assigned_by_user_id: id },
        data: { assigned_by_user_id: session.userId },
      });

      const supportUsers = await purgeSupportForUsers(tx, [id]);

      await tx.partnerMembership.deleteMany({ where: { user_id: id } });
      await tx.user.delete({ where: { id } });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'user',
          entity_id: target.id,
          event_type: 'partner.user.deleted',
          metadata: {
            email: target.email,
            full_name: target.full_name,
            memberships: target.memberships.map((m) => ({
              partner_organization_id: m.partner_organization_id,
              organization: m.organization.display_name,
              role: m.role,
            })),
            records_reassigned: reassigned,
            support_portal_users_removed: supportUsers,
          },
        },
      });

      return { name: target.full_name, orgIds };
    }, TX_OPTIONS);

    revalidateAll([
      '/channel-admin/partners',
      ...result.orgIds.map((o) => `/channel-admin/partners/${o}`),
      '/channel-admin/audit-log',
    ]);
    return { success: true, message: `${result.name} was deleted.` };
  } catch (err) {
    return failure('DELETE_PARTNER_USER_ERROR', err, 'Failed to delete user.');
  }
}

// ---------------------------------------------------------------------------
// 3. Deal registration
// ---------------------------------------------------------------------------

export async function deleteDealRegistrationAction(dealId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(dealId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const deal = await prisma.$transaction(async (tx) => {
      const deal = await tx.dealRegistration.findUnique({
        where: { id },
        select: {
          id: true,
          public_reference: true,
          customer_legal_name: true,
          customer_domain: true,
          status: true,
          partner_organization_id: true,
          converted_from_lead_assignment_id: true,
          organization: { select: { display_name: true } },
        },
      });
      if (!deal) throw new DeleteBlockedError('Deal registration not found. It may already have been deleted.');

      const history = await tx.dealStatusHistory.deleteMany({ where: { deal_registration_id: id } });
      await tx.dealRegistration.delete({ where: { id } });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'deal_registration',
          entity_id: deal.id,
          event_type: 'deal.registration.deleted',
          metadata: {
            public_reference: deal.public_reference,
            customer_legal_name: deal.customer_legal_name,
            customer_domain: deal.customer_domain,
            status: deal.status,
            partner_organization_id: deal.partner_organization_id,
            partner_name: deal.organization.display_name,
            converted_from_lead_assignment_id: deal.converted_from_lead_assignment_id,
            status_history_removed: history.count,
          },
        },
      });
      return deal;
    }, TX_OPTIONS);

    revalidateAll([
      '/channel-admin',
      '/channel-admin/deals',
      '/channel-admin/deal-conflicts',
      `/channel-admin/partners/${deal.partner_organization_id}`,
      '/channel-admin/audit-log',
    ]);
    return { success: true, message: `Deal ${deal.public_reference} was deleted.` };
  } catch (err) {
    return failure('DELETE_DEAL_ERROR', err, 'Failed to delete deal registration.');
  }
}

// ---------------------------------------------------------------------------
// 4. Lead
// ---------------------------------------------------------------------------

export async function deleteLeadAction(leadId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(leadId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const lead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id },
        select: {
          id: true,
          public_reference: true,
          company: true,
          customer_domain: true,
          status: true,
          assignments: { select: { id: true, partner_organization_id: true } },
        },
      });
      if (!lead) throw new DeleteBlockedError('Lead not found. It may already have been deleted.');

      const assignmentIds = lead.assignments.map((a) => a.id);
      // Converted deals stay; only their link back to the lead is cleared.
      const unlinkedDeals = assignmentIds.length
        ? await tx.dealRegistration.updateMany({
            where: { converted_from_lead_assignment_id: { in: assignmentIds } },
            data: { converted_from_lead_assignment_id: null },
          })
        : { count: 0 };
      const assignments = await tx.leadAssignment.deleteMany({ where: { lead_id: id } });
      await tx.lead.delete({ where: { id } });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'lead',
          entity_id: lead.id,
          event_type: 'lead.deleted',
          metadata: {
            public_reference: lead.public_reference,
            company: lead.company,
            customer_domain: lead.customer_domain,
            status: lead.status,
            assignments_removed: assignments.count,
            assigned_partner_ids: [...new Set(lead.assignments.map((a) => a.partner_organization_id))],
            converted_deals_unlinked: unlinkedDeals.count,
          },
        },
      });
      return lead;
    }, TX_OPTIONS);

    revalidateAll(['/channel-admin', '/channel-admin/leads', '/channel-admin/partners', '/channel-admin/audit-log']);
    return { success: true, message: `Lead ${lead.public_reference} was deleted.` };
  } catch (err) {
    return failure('DELETE_LEAD_ERROR', err, 'Failed to delete lead.');
  }
}

// ---------------------------------------------------------------------------
// 5. Product license
// ---------------------------------------------------------------------------

export async function deleteProductLicenseAction(licenseId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(licenseId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const license = await prisma.$transaction(async (tx) => {
      const license = await tx.productLicense.findUnique({
        where: { id },
        select: {
          id: true,
          org_id: true,
          customer_name: true,
          license_key: true,
          status: true,
          expires_at: true,
          partner_organization_id: true,
        },
      });
      if (!license) throw new DeleteBlockedError('License not found. It may already have been deleted.');

      await tx.productLicense.delete({ where: { id } });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'product_license',
          entity_id: license.id,
          event_type: 'product_license.deleted',
          metadata: {
            org_id: license.org_id,
            customer_name: license.customer_name,
            license_key_masked: maskLicenseKey(license.license_key),
            status: license.status,
            expires_at: license.expires_at.toISOString(),
            partner_organization_id: license.partner_organization_id,
          },
        },
      });
      return license;
    }, TX_OPTIONS);

    revalidateAll(['/channel-admin/licenses', '/partner-portal/licenses', '/channel-admin/audit-log']);
    return {
      success: true,
      message: `License ${maskLicenseKey(license.license_key)} was deleted.`,
    };
  } catch (err) {
    return failure('DELETE_LICENSE_ERROR', err, 'Failed to delete license.');
  }
}

// ---------------------------------------------------------------------------
// 6. Commercial request and admin-managed content
// ---------------------------------------------------------------------------

export async function deleteCommercialRequestAction(requestId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(requestId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const request = await prisma.$transaction(async (tx) => {
      const request = await tx.commercialRequest.findUnique({
        where: { id },
        select: {
          id: true,
          public_reference: true,
          title: true,
          request_type: true,
          status: true,
          partner_organization_id: true,
        },
      });
      if (!request) throw new DeleteBlockedError('Commercial request not found. It may already have been deleted.');

      await tx.commercialRequest.delete({ where: { id } });
      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'commercial_request',
          entity_id: request.id,
          event_type: 'commercial_request.deleted',
          metadata: {
            public_reference: request.public_reference,
            title: request.title,
            request_type: request.request_type,
            status: request.status,
            partner_organization_id: request.partner_organization_id,
          },
        },
      });
      return request;
    }, TX_OPTIONS);

    revalidateAll(['/channel-admin', '/channel-admin/commercial-requests', '/channel-admin/audit-log']);
    return { success: true, message: `Request ${request.public_reference} was deleted.` };
  } catch (err) {
    return failure('DELETE_COMMERCIAL_REQUEST_ERROR', err, 'Failed to delete commercial request.');
  }
}

export async function deleteCourseAction(courseId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(courseId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const course = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id }, select: { id: true, title: true, track: true } });
      if (!course) throw new DeleteBlockedError('Course not found. It may already have been deleted.');

      const enrollments = await tx.courseEnrollment.deleteMany({ where: { course_id: id } });
      await tx.course.delete({ where: { id } });
      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'course',
          entity_id: course.id,
          event_type: 'course.deleted',
          metadata: { title: course.title, track: course.track, enrollments_removed: enrollments.count },
        },
      });
      return course;
    }, TX_OPTIONS);

    revalidateAll(['/channel-admin/learning', '/partner-portal/learning', '/channel-admin/audit-log']);
    return { success: true, message: `Course "${course.title}" was deleted.` };
  } catch (err) {
    return failure('DELETE_COURSE_ERROR', err, 'Failed to delete course.');
  }
}

export async function deleteEventAction(eventId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(eventId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const event = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id },
        select: { id: true, title: true, event_type: true, starts_at: true },
      });
      if (!event) throw new DeleteBlockedError('Event not found. It may already have been deleted.');

      const registrations = await tx.eventRegistration.deleteMany({ where: { event_id: id } });
      await tx.event.delete({ where: { id } });
      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'event',
          entity_id: event.id,
          event_type: 'event.deleted',
          metadata: {
            title: event.title,
            event_type: event.event_type,
            starts_at: event.starts_at.toISOString(),
            registrations_removed: registrations.count,
          },
        },
      });
      return event;
    }, TX_OPTIONS);

    revalidateAll(['/channel-admin/events', '/partner-portal/events', '/channel-admin/audit-log']);
    return { success: true, message: `Event "${event.title}" was deleted.` };
  } catch (err) {
    return failure('DELETE_EVENT_ERROR', err, 'Failed to delete event.');
  }
}

export async function deleteCampaignAction(campaignId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(campaignId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const campaign = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id },
        select: { id: true, title: true, status: true },
      });
      if (!campaign) throw new DeleteBlockedError('Campaign not found. It may already have been deleted.');

      await tx.campaign.delete({ where: { id } });
      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'campaign',
          entity_id: campaign.id,
          event_type: 'campaign.deleted',
          metadata: { title: campaign.title, status: campaign.status },
        },
      });
      return campaign;
    }, TX_OPTIONS);

    revalidateAll(['/channel-admin/campaigns', '/partner-portal/campaigns', '/channel-admin/audit-log']);
    return { success: true, message: `Campaign "${campaign.title}" was deleted.` };
  } catch (err) {
    return failure('DELETE_CAMPAIGN_ERROR', err, 'Failed to delete campaign.');
  }
}

export async function deleteResourceAction(resourceId: string): Promise<AdminDeleteResult> {
  const session = await requireAdminSession();
  const parsed = parseId(resourceId);
  if (!parsed.ok) return { success: false, error: parsed.error };
  const id = parsed.id;

  try {
    const resource = await prisma.$transaction(async (tx) => {
      const resource = await tx.resourceItem.findUnique({
        where: { id },
        select: { id: true, title: true, category: true, url: true },
      });
      if (!resource) throw new DeleteBlockedError('Resource not found. It may already have been deleted.');

      await tx.resourceItem.delete({ where: { id } });
      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: null,
          entity_type: 'resource',
          entity_id: resource.id,
          event_type: 'resource.deleted',
          metadata: { title: resource.title, category: resource.category, url: resource.url },
        },
      });
      return resource;
    }, TX_OPTIONS);

    revalidateAll(['/channel-admin/resources', '/partner-portal/resources', '/channel-admin/audit-log']);
    return { success: true, message: `Resource "${resource.title}" was deleted.` };
  } catch (err) {
    return failure('DELETE_RESOURCE_ERROR', err, 'Failed to delete resource.');
  }
}
