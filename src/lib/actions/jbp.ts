'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePartnerSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

const JbpSchema = z.object({
  year: z.coerce.number().min(2025).max(2035),
  growthGoals: z.string().min(10, 'Growth goals are required'),
  revenueTarget: z.coerce.number().min(1000, 'Valid revenue target is required'),
  focusProducts: z.string().min(2, 'Focus products are required'),
  targetIndustries: z.string().min(2, 'Target industries are required'),
  keyAccounts: z.string().optional(),
  technicalPlan: z.string().optional(),
  marketingActivities: z.string().optional(),
  milestones: z.string().optional(),
});

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function submitJbpAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePartnerSession();
  const rawData = Object.fromEntries(formData.entries());
  const validated = JbpSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: 'Please fill in all required fields.',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const {
    year,
    growthGoals,
    revenueTarget,
    focusProducts,
    targetIndustries,
    keyAccounts,
    technicalPlan,
    marketingActivities,
    milestones,
  } = validated.data;

  const partnerOrgId = session.partnerOrgId!;

  try {
    const existing = await prisma.jointBusinessPlan.findFirst({
      where: { partner_organization_id: partnerOrgId, year },
    });

    if (existing) {
      await prisma.jointBusinessPlan.update({
        where: { id: existing.id },
        data: {
          growth_goals: growthGoals,
          revenue_target: revenueTarget,
          focus_products: focusProducts,
          target_industries: targetIndustries,
          key_accounts: keyAccounts || null,
          technical_plan: technicalPlan || null,
          marketing_activities: marketingActivities || null,
          milestones: milestones || null,
          status: 'submitted',
          submitted_at: new Date(),
        },
      });
    } else {
      await prisma.jointBusinessPlan.create({
        data: {
          partner_organization_id: partnerOrgId,
          year,
          growth_goals: growthGoals,
          revenue_target: revenueTarget,
          focus_products: focusProducts,
          target_industries: targetIndustries,
          key_accounts: keyAccounts || null,
          technical_plan: technicalPlan || null,
          marketing_activities: marketingActivities || null,
          milestones: milestones || null,
          status: 'submitted',
          submitted_at: new Date(),
        },
      });
    }

    await prisma.auditEvent.create({
      data: {
        actor_user_id: session.userId,
        partner_organization_id: partnerOrgId,
        entity_type: 'joint_business_plan',
        entity_id: `${partnerOrgId}-${year}`,
        event_type: 'jbp.submitted',
        metadata: {
          year,
          revenue_target: revenueTarget,
        },
      },
    });

    revalidatePath('/partner-portal/joint-business-plan');
    revalidatePath('/channel-admin/jbp');
    revalidatePath('/partner-portal');
    return { success: true };
  } catch (err: unknown) {
    console.error('[JBP_SUBMIT_ERROR]', err);
    return { error: 'Failed to submit Joint Business Plan' };
  }
}
