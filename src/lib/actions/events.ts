'use server';

import { prisma } from '@/lib/db';
import { requirePartnerSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function registerForEventAction(formData: FormData) {
  const session = await requirePartnerSession();
  const eventId = formData.get('eventId') as string;

  if (!eventId) return;

  try {
    await prisma.eventRegistration.upsert({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: session.userId,
        },
      },
      update: {
        registered_at: new Date(),
      },
      create: {
        event_id: eventId,
        user_id: session.userId,
        partner_organization_id: session.partnerOrgId!,
        registered_at: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        actor_user_id: session.userId,
        partner_organization_id: session.partnerOrgId,
        entity_type: 'event_registration',
        entity_id: eventId,
        event_type: 'event.registered',
        metadata: {
          event_id: eventId,
          email: session.email,
        },
      },
    });

    revalidatePath('/partner-portal/events');
    revalidatePath('/channel-admin/events');
    revalidatePath('/partner-portal');
  } catch (err: unknown) {
    console.error('[EVENT_REGISTRATION_ERROR]', err);
  }
}
