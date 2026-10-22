'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { PartnerTier, OrgStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const TierSchema = z.object({
  partnerOrgId: z.string().min(1),
  tier: z.enum(['Registered', 'Silver', 'Gold', 'Platinum']),
  reason: z.string().min(2, 'Tier update justification is required for audit records'),
});

export async function updatePartnerTierAction(formData: FormData) {
  const session = await requireAdminSession();
  const raw = {
    partnerOrgId: formData.get('partnerOrgId'),
    tier: formData.get('tier'),
    reason: formData.get('reason'),
  };

  const validated = TierSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Invalid tier parameters.' };
  }

  const { partnerOrgId, tier, reason } = validated.data;

  try {
    await prisma.$transaction(async (tx) => {
      const org = await tx.partnerOrganization.findUnique({
        where: { id: partnerOrgId },
      });
      if (!org) throw new Error('Partner not found');

      const prevTier = org.tier;

      await tx.partnerOrganization.update({
        where: { id: partnerOrgId },
        data: { tier: tier as PartnerTier },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: org.id,
          entity_type: 'partner_organization',
          entity_id: org.id,
          event_type: 'partner.tier_updated',
          metadata: {
            previous_tier: prevTier,
            new_tier: tier,
            justification: reason,
          },
        },
      });

      await tx.notification.create({
        data: {
          partner_organization_id: org.id,
          title: `Partner Tier Updated: ${tier}`,
          message: `Your organization's OmniPriv Channel Partner tier has been promoted to ${tier}. Access tier-exclusive enablement assets in Resources.`,
          link: '/partner-portal/company',
          type: 'success',
        },
      });
    });

    revalidatePath('/channel-admin/partners');
    revalidatePath('/partner-portal');
    revalidatePath('/partner-portal/company');
    return { success: true };
  } catch (err: unknown) {
    console.error('[UPDATE_TIER_ERROR]', err);
    return { error: 'Failed to update partner tier.' };
  }
}

export async function togglePartnerStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const partnerOrgId = formData.get('partnerOrgId') as string;
  const newStatus = formData.get('status') as string;

  if (!partnerOrgId || !['active', 'suspended'].includes(newStatus)) {
    return { error: 'Invalid parameters.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const org = await tx.partnerOrganization.findUnique({
        where: { id: partnerOrgId },
      });
      if (!org) throw new Error('Partner not found');

      await tx.partnerOrganization.update({
        where: { id: partnerOrgId },
        data: { status: newStatus as OrgStatus },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: org.id,
          entity_type: 'partner_organization',
          entity_id: org.id,
          event_type: `partner.${newStatus}`,
          metadata: {
            previous_status: org.status,
            new_status: newStatus,
          },
        },
      });
    });

    revalidatePath('/channel-admin/partners');
    return { success: true };
  } catch (err: unknown) {
    console.error('[STATUS_ERROR]', err);
    return { error: 'Failed to update partner status.' };
  }
}

const CreateRenewalSchema = z.object({
  partnerOrgId: z.string().min(1, 'Partner organization is required'),
  customerName: z.string().min(2, 'Customer name is required'),
  productPlan: z.string().min(2, 'Product plan is required'),
  contractedCapacity: z.string().optional(),
  renewalDate: z.string().min(1, 'Renewal date is required'),
  contractValue: z.coerce.number().positive().optional(),
  currency: z.string().default('USD'),
  commercialStatus: z.string().default('upcoming'),
});

export async function createRenewalAction(formData: FormData) {
  const session = await requireAdminSession();
  const raw = {
    partnerOrgId: formData.get('partnerOrgId'),
    customerName: formData.get('customerName'),
    productPlan: formData.get('productPlan'),
    contractedCapacity: formData.get('contractedCapacity') || undefined,
    renewalDate: formData.get('renewalDate'),
    contractValue: formData.get('contractValue') || undefined,
    currency: formData.get('currency') || 'USD',
    commercialStatus: formData.get('commercialStatus') || 'upcoming',
  };

  const validated = CreateRenewalSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Invalid renewal fields.' };
  }

  const data = validated.data;

  try {
    await prisma.$transaction(async (tx) => {
      const renewal = await tx.renewal.create({
        data: {
          partner_organization_id: data.partnerOrgId,
          customer_name: data.customerName.trim(),
          product_plan: data.productPlan.trim(),
          contracted_capacity: data.contractedCapacity?.trim() || null,
          renewal_date: new Date(data.renewalDate),
          contract_value: data.contractValue || null,
          currency: data.currency,
          commercial_status: data.commercialStatus,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: data.partnerOrgId,
          entity_type: 'renewal',
          entity_id: renewal.id,
          event_type: 'renewal.created',
          metadata: {
            customer_name: renewal.customer_name,
            renewal_date: renewal.renewal_date.toISOString(),
          },
        },
      });
    });

    revalidatePath('/channel-admin/renewals');
    revalidatePath('/partner-portal/renewals');
    revalidatePath('/partner-portal');
    return { success: true };
  } catch (err: unknown) {
    console.error('[CREATE_RENEWAL_ERROR]', err);
    return { error: 'Failed to create renewal record.' };
  }
}
