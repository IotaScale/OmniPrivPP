'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { calculateProtectionDates, extendProtection } from '@/lib/utils/sla';
import { logAuditEvent } from '@/lib/audit';
import { findDealMatches } from '@/lib/utils/domain';
import { describeMatch, formatMatchReasons } from '@/lib/utils/deal-matching';
import { DealStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const ApproveSchema = z.object({
  dealId: z.string().min(1),
  decisionReason: z.string().trim().optional(),
  override: z.boolean().default(false),
});

export type ApproveDealResult =
  | { success: true; error?: undefined; blockingReferences?: undefined }
  | { success?: false; error: string; blockingReferences?: string[] };

/**
 * Approve a deal and start 90-day protection. Duplicate / conflict matching is
 * re-run server-side: if another deal holds active protection (or was won in
 * the last 90 days) on the same or a related domain, approval is refused
 * unless the form carries `override=true` and a non-empty decision reason.
 * Overrides are recorded in the audit trail with the blocking references.
 */
export async function approveDealAction(formData: FormData): Promise<ApproveDealResult> {
  const session = await requireAdminSession();
  const raw = {
    dealId: formData.get('dealId'),
    decisionReason: formData.get('decisionReason') || undefined,
    override: formData.get('override') === 'true',
  };

  const validated = ApproveSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Invalid parameters for deal approval.' };
  }

  const { dealId, decisionReason, override } = validated.data;
  const now = new Date();
  const { protectionStartsAt, protectionExpiresAt } = calculateProtectionDates(now);

  const subject = await prisma.dealRegistration.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      customer_legal_name: true,
      customer_domain: true,
      customer_contact_email: true,
      partner_organization_id: true,
    },
  });
  if (!subject) {
    return { error: 'Deal registration not found.' };
  }

  const matches = await findDealMatches(subject, { excludeDealId: subject.id, now });
  const blocking = matches.filter((m) => m.blocking);
  const blockingReferences = blocking.map((m) => m.candidate.public_reference);
  const overrideUsed = blocking.length > 0;

  if (blocking.length > 0 && (!override || !decisionReason)) {
    return {
      error: `Approval blocked: ${blocking
        .map(describeMatch)
        .join('; ')}. To approve anyway, tick the override and record a decision reason.`,
      blockingReferences,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const deal = await tx.dealRegistration.findUnique({
        where: { id: dealId },
      });

      if (!deal) throw new Error('Deal not found');

      const previousStatus = deal.status;

      const result = await tx.dealRegistration.update({
        where: { id: dealId },
        data: {
          status: DealStatus.approved,
          reviewed_by_user_id: session.userId,
          reviewed_at: now,
          admin_decision_reason: decisionReason || 'Approved with 90-day exclusive deal protection.',
          protection_starts_at: protectionStartsAt,
          protection_expires_at: protectionExpiresAt,
        },
        include: { organization: true },
      });

      // Status history
      await tx.dealStatusHistory.create({
        data: {
          deal_registration_id: deal.id,
          previous_status: previousStatus,
          new_status: DealStatus.approved,
          changed_by_user_id: session.userId,
          note: decisionReason || 'Approved with 90-day deal protection by Channel Admin.',
        },
      });

      // Immutable audit event
      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: deal.partner_organization_id,
          entity_type: 'deal_registration',
          entity_id: deal.id,
          event_type: 'deal.approved',
          before_data: { status: previousStatus },
          after_data: {
            status: DealStatus.approved,
            protection_starts_at: protectionStartsAt,
            protection_expires_at: protectionExpiresAt,
          },
          metadata: {
            decision_reason: decisionReason,
            public_reference: deal.public_reference,
            matched_references: matches.map((m) => m.candidate.public_reference),
            ...(overrideUsed ? { protection_override: true, blocking_references: blockingReferences } : {}),
          },
        },
      });

      if (overrideUsed) {
        await tx.auditEvent.create({
          data: {
            actor_user_id: session.userId,
            partner_organization_id: deal.partner_organization_id,
            entity_type: 'deal_registration',
            entity_id: deal.id,
            event_type: 'deal.approval_override',
            metadata: {
              public_reference: deal.public_reference,
              decision_reason: decisionReason,
              blocking_references: blockingReferences,
              blocking_matches: blocking.map((m) => ({
                deal_id: m.candidate.id,
                reference: m.candidate.public_reference,
                partner_organization_id: m.candidate.partner_organization_id,
                kind: m.kind,
                reasons: m.reasons,
              })),
            },
          },
        });
      }

      // Partner In-App Notification
      await tx.notification.create({
        data: {
          partner_organization_id: deal.partner_organization_id,
          title: `Deal Approved: ${deal.public_reference}`,
          message: `Your registration for ${deal.customer_legal_name} was approved! 90-day protection is active until ${protectionExpiresAt.toLocaleDateString()}.`,
          link: `/partner-portal/deals/${deal.id}`,
          type: 'success',
        },
      });

      return result;
    });

    revalidatePath('/channel-admin/deals');
    revalidatePath(`/channel-admin/deals/${dealId}`);
    revalidatePath('/channel-admin');
    revalidatePath('/partner-portal/deals');
    revalidatePath(`/partner-portal/deals/${dealId}`);
    revalidatePath('/partner-portal');
    revalidatePath('/channel-admin/deal-conflicts');
    return { success: true };
  } catch (err: unknown) {
    console.error('[ADMIN_APPROVE_ERROR]', err);
    return { error: 'Failed to approve deal registration.' };
  }
}

const DeclineSchema = z.object({
  dealId: z.string().min(1),
  reason: z.string().min(3, 'A clear reason for declining the deal is required'),
});

export async function declineDealAction(formData: FormData) {
  const session = await requireAdminSession();
  const raw = {
    dealId: formData.get('dealId'),
    reason: formData.get('reason'),
  };

  const validated = DeclineSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || 'Invalid parameters.' };
  }

  return declineDeal(session.userId, validated.data.dealId, validated.data.reason.trim());
}

/**
 * Shared decline flow: status change, history, immutable audit event and the
 * partner notification. `auditMetadata` adds admin-only context (e.g. the
 * deal this one duplicates) that is never shown to the partner.
 */
async function declineDeal(
  actorUserId: string,
  dealId: string,
  reason: string,
  auditMetadata: Record<string, unknown> = {}
): Promise<{ success: true; error?: undefined } | { success?: false; error: string }> {
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const deal = await tx.dealRegistration.findUnique({
        where: { id: dealId },
      });

      if (!deal) throw new Error('Deal not found');
      const previousStatus = deal.status;

      await tx.dealRegistration.update({
        where: { id: dealId },
        data: {
          status: DealStatus.declined,
          reviewed_by_user_id: actorUserId,
          reviewed_at: now,
          admin_decision_reason: reason,
        },
      });

      await tx.dealStatusHistory.create({
        data: {
          deal_registration_id: deal.id,
          previous_status: previousStatus,
          new_status: DealStatus.declined,
          changed_by_user_id: actorUserId,
          note: `Declined: ${reason}`,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: actorUserId,
          partner_organization_id: deal.partner_organization_id,
          entity_type: 'deal_registration',
          entity_id: deal.id,
          event_type: 'deal.declined',
          before_data: { status: previousStatus },
          after_data: { status: DealStatus.declined, reason },
          metadata: {
            public_reference: deal.public_reference,
            ...auditMetadata,
          },
        },
      });

      await tx.notification.create({
        data: {
          partner_organization_id: deal.partner_organization_id,
          title: `Deal Declined: ${deal.public_reference}`,
          message: `Your registration for ${deal.customer_legal_name} was not approved. Reason: ${reason}`,
          link: `/partner-portal/deals/${deal.id}`,
          type: 'danger',
        },
      });
    });

    revalidatePath('/channel-admin/deals');
    revalidatePath(`/channel-admin/deals/${dealId}`);
    revalidatePath('/channel-admin/deal-conflicts');
    revalidatePath('/channel-admin');
    revalidatePath('/partner-portal/deals');
    revalidatePath(`/partner-portal/deals/${dealId}`);
    revalidatePath('/partner-portal');
    return { success: true };
  } catch (err: unknown) {
    console.error('[ADMIN_DECLINE_ERROR]', err);
    return { error: 'Failed to decline deal registration.' };
  }
}

const DeclineDuplicateSchema = z.object({
  dealId: z.string().min(1),
  duplicateOfId: z.string().min(1),
});

/**
 * Decline a pending deal as a duplicate of another registration. The partner
 * sees the other reference only when it is their own deal; for another
 * partner's deal the reason stays neutral. The audit event keeps both.
 */
export async function declineDealAsDuplicateAction(formData: FormData) {
  const session = await requireAdminSession();
  const validated = DeclineDuplicateSchema.safeParse({
    dealId: formData.get('dealId'),
    duplicateOfId: formData.get('duplicateOfId'),
  });
  if (!validated.success || validated.data.dealId === validated.data.duplicateOfId) {
    return { error: 'Invalid duplicate decline request.' };
  }

  const { dealId, duplicateOfId } = validated.data;
  const [deal, original] = await Promise.all([
    prisma.dealRegistration.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        status: true,
        partner_organization_id: true,
        customer_legal_name: true,
        customer_domain: true,
        customer_contact_email: true,
      },
    }),
    prisma.dealRegistration.findUnique({
      where: { id: duplicateOfId },
      select: { id: true, public_reference: true, partner_organization_id: true },
    }),
  ]);

  if (!deal || !original) {
    return { error: 'Deal registration not found.' };
  }
  if (deal.status !== DealStatus.awaiting_approval) {
    return { error: 'Only deals awaiting approval can be declined as duplicates.' };
  }

  const samePartner = deal.partner_organization_id === original.partner_organization_id;
  const reason = samePartner
    ? `Duplicate of ${original.public_reference}.`
    : 'Duplicate of an existing registration for this customer held by another partner.';

  const match = (await findDealMatches(deal, { excludeDealId: deal.id })).find(
    (m) => m.candidate.id === original.id
  );

  return declineDeal(session.userId, deal.id, reason, {
    declined_as_duplicate: true,
    duplicate_of_deal_id: original.id,
    duplicate_of_reference: original.public_reference,
    duplicate_kind: samePartner ? 'duplicate' : 'conflict',
    match_reasons: match ? formatMatchReasons(match.reasons) : null,
  });
}

const ExtendSchema = z.object({
  dealId: z.string().min(1),
  daysToAdd: z.coerce.number().int().positive().default(90),
  reason: z.string().min(3, 'Extension rationale is required for audit compliance'),
});

export async function extendProtectionAction(formData: FormData) {
  const session = await requireAdminSession();
  const raw = {
    dealId: formData.get('dealId'),
    daysToAdd: formData.get('daysToAdd') || 90,
    reason: formData.get('reason'),
  };

  const validated = ExtendSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Invalid extension parameters.' };
  }

  const { dealId, daysToAdd, reason } = validated.data;

  try {
    await prisma.$transaction(async (tx) => {
      const deal = await tx.dealRegistration.findUnique({
        where: { id: dealId },
      });

      if (!deal) throw new Error('Deal not found');

      const newExpiry = extendProtection(deal.protection_expires_at, daysToAdd);

      await tx.dealRegistration.update({
        where: { id: dealId },
        data: {
          protection_expires_at: newExpiry,
        },
      });

      await tx.dealStatusHistory.create({
        data: {
          deal_registration_id: deal.id,
          previous_status: deal.status,
          new_status: deal.status,
          changed_by_user_id: session.userId,
          note: `Protection extended by ${daysToAdd} days until ${newExpiry.toLocaleDateString()}. Reason: ${reason}`,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: deal.partner_organization_id,
          entity_type: 'deal_registration',
          entity_id: deal.id,
          event_type: 'deal.protection_extended',
          metadata: {
            days_added: daysToAdd,
            new_expiry: newExpiry,
            rationale: reason,
            public_reference: deal.public_reference,
          },
        },
      });

      await tx.notification.create({
        data: {
          partner_organization_id: deal.partner_organization_id,
          title: `Deal Protection Extended: ${deal.public_reference}`,
          message: `Protection for ${deal.customer_legal_name} extended by ${daysToAdd} days until ${newExpiry.toLocaleDateString()}.`,
          link: `/partner-portal/deals/${deal.id}`,
          type: 'info',
        },
      });
    });

    revalidatePath('/channel-admin/deals');
    revalidatePath(`/channel-admin/deals/${dealId}`);
    revalidatePath('/channel-admin');
    revalidatePath('/partner-portal/deals');
    revalidatePath(`/partner-portal/deals/${dealId}`);
    revalidatePath('/partner-portal');
    return { success: true };
  } catch (err: unknown) {
    console.error('[EXTEND_PROTECTION_ERROR]', err);
    return { error: 'Failed to extend deal protection.' };
  }
}

const OutcomeSchema = z.object({
  dealId: z.string().min(1),
  outcome: z.enum(['closed_won', 'closed_lost']),
  note: z.string().optional(),
});

export async function setDealOutcomeAction(formData: FormData) {
  const session = await requireAdminSession();
  const raw = {
    dealId: formData.get('dealId'),
    outcome: formData.get('outcome'),
    note: formData.get('note') || undefined,
  };

  const validated = OutcomeSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Invalid outcome parameters.' };
  }

  const { dealId, outcome, note } = validated.data;
  const newStatus = outcome === 'closed_won' ? DealStatus.closed_won : DealStatus.closed_lost;
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const deal = await tx.dealRegistration.findUnique({
        where: { id: dealId },
      });

      if (!deal) throw new Error('Deal not found');

      await tx.dealRegistration.update({
        where: { id: dealId },
        data: {
          status: newStatus,
          closed_at: now,
        },
      });

      await tx.dealStatusHistory.create({
        data: {
          deal_registration_id: deal.id,
          previous_status: deal.status,
          new_status: newStatus,
          changed_by_user_id: session.userId,
          note: note || `Deal marked ${outcome.replace('_', ' ')} by Channel Admin.`,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: deal.partner_organization_id,
          entity_type: 'deal_registration',
          entity_id: deal.id,
          event_type: `deal.${outcome}`,
          metadata: {
            public_reference: deal.public_reference,
            note,
          },
        },
      });
    });

    revalidatePath('/channel-admin/deals');
    revalidatePath(`/channel-admin/deals/${dealId}`);
    revalidatePath('/channel-admin');
    revalidatePath('/partner-portal/deals');
    revalidatePath(`/partner-portal/deals/${dealId}`);
    revalidatePath('/partner-portal');
    return { success: true };
  } catch (err: unknown) {
    console.error('[SET_OUTCOME_ERROR]', err);
    return { error: 'Failed to update deal outcome.' };
  }
}
