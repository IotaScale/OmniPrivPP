'use server';

import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { PartnerTier } from '@prisma/client';

export async function updatePartnerTierAction(formData: FormData) {
  const session = await requireAdminSession();
  const partnerId = formData.get('partnerId') as string;
  const tier = formData.get('tier') as PartnerTier;
  const partnerManagerName = formData.get('partnerManagerName') as string;
  const partnerManagerEmail = formData.get('partnerManagerEmail') as string;

  if (!partnerId || !tier) return;

  try {
    await prisma.partnerOrganization.update({
      where: { id: partnerId },
      data: {
        tier,
        partner_manager_name: partnerManagerName?.trim() || null,
        partner_manager_email: partnerManagerEmail?.trim() || null,
      },
    });

    await prisma.auditEvent.create({
      data: {
        actor_user_id: session.userId,
        partner_organization_id: partnerId,
        entity_type: 'partner_organization',
        entity_id: partnerId,
        event_type: 'partner.tier_updated',
        metadata: {
          tier,
          partnerManagerName,
        },
      },
    });

    revalidatePath(`/channel-admin/partners/${partnerId}`);
    revalidatePath('/channel-admin/partners');
    revalidatePath('/partner-portal');
    revalidatePath('/partner-portal/company');
  } catch (err: unknown) {
    console.error('[UPDATE_TIER_ERROR]', err);
  }
}

/** target status -> statuses it may be reached from (admin decisions only). */
const COMMERCIAL_REQUEST_TRANSITIONS: Record<string, string[]> = {
  fulfilled: ['submitted', 'in_review', 'approved'],
  rejected: ['submitted', 'in_review'],
};

export async function updateCommercialRequestStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const requestId = formData.get('requestId') as string;
  const status = formData.get('status') as string;
  const adminNotes = formData.get('adminNotes') as string;

  if (!requestId || !status) return;
  // Allowed admin decisions by current status; fulfilled/rejected are final.
  const allowed = COMMERCIAL_REQUEST_TRANSITIONS[status];
  if (!allowed) return;

  try {
    const current = await prisma.commercialRequest.findUnique({
      where: { id: requestId },
      select: { status: true },
    });
    if (!current || !allowed.includes(current.status)) return;

    const req = await prisma.commercialRequest.update({
      where: { id: requestId },
      data: {
        status,
        // Keep earlier notes when a decision is made without a new note.
        admin_notes: adminNotes?.trim() || undefined,
        fulfilled_at: status === 'fulfilled' ? new Date() : undefined,
      },
    });

    await prisma.auditEvent.create({
      data: {
        actor_user_id: session.userId,
        partner_organization_id: req.partner_organization_id,
        entity_type: 'commercial_request',
        entity_id: req.id,
        event_type: 'commercial_request.status_changed',
        metadata: {
          status,
          adminNotes,
        },
      },
    });

    revalidatePath('/channel-admin/commercial-requests');
    revalidatePath('/partner-portal/commercial-requests');
    revalidatePath('/partner-portal');
  } catch (err: unknown) {
    console.error('[UPDATE_COMMERCIAL_REQUEST_ERROR]', err);
  }
}

/** JBP statuses an admin can decide on, and the decisions available. */
const JBP_REVIEWABLE = new Set(['submitted', 'under_review']);
const JBP_DECISIONS = new Set(['approved', 'changes_requested']);

export async function updateJbpStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const jbpId = formData.get('jbpId') as string;
  const status = formData.get('status') as string;
  const adminFeedback = formData.get('adminFeedback') as string;

  if (!jbpId || !status) return;
  // Admins decide only on plans awaiting review; an approved plan returns to
  // review only when the partner edits and resubmits it.
  if (!JBP_DECISIONS.has(status)) return;
  const feedback = adminFeedback?.trim() || '';
  if (status === 'changes_requested' && !feedback) return;

  try {
    const current = await prisma.jointBusinessPlan.findUnique({
      where: { id: jbpId },
      select: { status: true },
    });
    if (!current || !JBP_REVIEWABLE.has(current.status)) return;

    const jbp = await prisma.jointBusinessPlan.update({
      where: { id: jbpId },
      data: {
        status,
        // Keep earlier feedback when approving without a new note.
        admin_feedback: feedback || undefined,
        approved_at: status === 'approved' ? new Date() : undefined,
      },
    });

    await prisma.auditEvent.create({
      data: {
        actor_user_id: session.userId,
        partner_organization_id: jbp.partner_organization_id,
        entity_type: 'joint_business_plan',
        entity_id: jbp.id,
        event_type: 'jbp.status_changed',
        metadata: {
          status,
          adminFeedback,
        },
      },
    });

    revalidatePath('/channel-admin/jbp');
    revalidatePath('/partner-portal/joint-business-plan');
  } catch (err: unknown) {
    console.error('[UPDATE_JBP_ERROR]', err);
  }
}
