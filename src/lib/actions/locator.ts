'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePartnerSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

const LocatorProfileSchema = z.object({
  optIn: z.union([z.boolean(), z.string()]).transform((val) => val === true || val === 'on' || val === 'true'),
  publicCompanyName: z.string().min(2, 'Company name is required'),
  publicDescription: z.string().optional(),
  website: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
  city: z.string().optional(),
});

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function updateLocatorProfileAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePartnerSession();
  const rawData = Object.fromEntries(formData.entries());
  const validated = LocatorProfileSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: 'Please check your inputs and try again.' };
  }

  const { optIn, publicCompanyName, publicDescription, website, country, city } = validated.data;
  const orgId = session.partnerOrgId!;

  try {
    const org = await prisma.partnerOrganization.findUnique({
      where: { id: orgId },
      select: { partner_type: true, tier: true },
    });

    await prisma.partnerLocatorProfile.upsert({
      where: { partner_organization_id: orgId },
      update: {
        opt_in: optIn,
        public_company_name: publicCompanyName.trim(),
        public_description: publicDescription?.trim() || null,
        website: website?.trim() || null,
        country: country.trim(),
        city: city?.trim() || null,
      },
      create: {
        partner_organization_id: orgId,
        opt_in: optIn,
        is_approved: false, // Moderated by Channel Admin
        is_published: false,
        public_company_name: publicCompanyName.trim(),
        public_description: publicDescription?.trim() || null,
        website: website?.trim() || null,
        country: country.trim(),
        city: city?.trim() || null,
        partner_type: org?.partner_type || 'Reseller',
        tier: org?.tier || 'Registered',
      },
    });

    await prisma.auditEvent.create({
      data: {
        actor_user_id: session.userId,
        partner_organization_id: orgId,
        entity_type: 'partner_locator_profile',
        entity_id: orgId,
        event_type: 'locator_profile.updated',
        metadata: { optIn, country },
      },
    });

    revalidatePath('/partner-portal/locator-profile');
    revalidatePath('/find-a-partner');
    revalidatePath('/channel-admin/partners');
    return { success: true };
  } catch (err: unknown) {
    console.error('[LOCATOR_PROFILE_ERROR]', err);
    return { error: 'Failed to update locator profile' };
  }
}
