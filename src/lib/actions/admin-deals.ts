'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { calculateProtectionDates, extendProtection } from '@/lib/utils/sla';
import { logAuditEvent } from '@/lib/audit';
import { DealStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const ApproveSchema = z.object({
  dealId: z.string().min(1),
  decisionReason: z.string().optional(),
});

export async function approveDealAction(formData: FormData) {
  const session = await requireAdminSession();
  const raw = {
    dealId: formData.get('dealId'),
    decisionReason: formData.get('decisionReason') || undefined,
  };

  const validated = ApproveSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Invalid parameters for deal approval.' };
  }

  const { dealId, decisionReason } = validated.data;
  const now = new Date();
  const { protectionStartsAt, protectionExpiresAt } = calculateProtectionDates(now);

  try {
    const updated = await prisma.$transaction(async (tx) => {
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
          },
        },
      });

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
    return { success: true, deal: updated };
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

  const { dealId, reason } = validated.data;
  const now = new Date();

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const deal = await tx.dealRegistration.findUnique({
        where: { id: dealId },
      });

      if (!deal) throw new Error('Deal not found');
      const previousStatus = deal.status;

      const result = await tx.dealRegistration.update({
        where: { id: dealId },
        data: {
          status: DealStatus.declined,
          reviewed_by_user_id: session.userId,
          reviewed_at: now,
          admin_decision_reason: reason.trim(),
        },
      });

      await tx.dealStatusHistory.create({
        data: {
          deal_registration_id: deal.id,
          previous_status: previousStatus,
          new_status: DealStatus.declined,
          changed_by_user_id: session.userId,
          note: `Declined: ${reason.trim()}`,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: deal.partner_organization_id,
          entity_type: 'deal_registration',
          entity_id: deal.id,
          event_type: 'deal.declined',
          before_data: { status: previousStatus },
          after_data: { status: DealStatus.declined, reason: reason.trim() },
          metadata: {
            public_reference: deal.public_reference,
          },
        },
      });

      await tx.notification.create({
        data: {
          partner_organization_id: deal.partner_organization_id,
          title: `Deal Declined: ${deal.public_reference}`,
          message: `Your registration for ${deal.customer_legal_name} was not approved. Reason: ${reason.trim()}`,
          link: `/partner-portal/deals/${deal.id}`,
          type: 'danger',
        },
      });

      return result;
    });

    revalidatePath('/channel-admin/deals');
    return { success: true, deal: updated };
  } catch (err: unknown) {
    console.error('[ADMIN_DECLINE_ERROR]', err);
    return { error: 'Failed to decline deal registration.' };
  }
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
    return { success: true };
  } catch (err: unknown) {
    console.error('[SET_OUTCOME_ERROR]', err);
    return { error: 'Failed to update deal outcome.' };
  }
}
