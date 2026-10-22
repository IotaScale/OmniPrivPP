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
  } catch (err: unknown) {
    console.error('[UPDATE_TIER_ERROR]', err);
  }
}

export async function updateCommercialRequestStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const requestId = formData.get('requestId') as string;
  const status = formData.get('status') as string;
  const adminNotes = formData.get('adminNotes') as string;

  if (!requestId || !status) return;

  try {
    const req = await prisma.commercialRequest.update({
      where: { id: requestId },
      data: {
        status,
        admin_notes: adminNotes?.trim() || null,
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
  } catch (err: unknown) {
    console.error('[UPDATE_COMMERCIAL_REQUEST_ERROR]', err);
  }
}

export async function updateJbpStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const jbpId = formData.get('jbpId') as string;
  const status = formData.get('status') as string;
  const adminFeedback = formData.get('adminFeedback') as string;

  if (!jbpId || !status) return;

  try {
    const jbp = await prisma.jointBusinessPlan.update({
      where: { id: jbpId },
      data: {
        status,
        admin_feedback: adminFeedback?.trim() || null,
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
  } catch (err: unknown) {
    console.error('[UPDATE_JBP_ERROR]', err);
  }
}
