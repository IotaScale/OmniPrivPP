'use server';

import { prisma } from '@/lib/db';
import { requirePartnerSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function enrollCourseAction(formData: FormData) {
  const session = await requirePartnerSession();
  const courseId = formData.get('courseId') as string;

  if (!courseId) return;

  try {
    await prisma.courseEnrollment.upsert({
      where: {
        course_id_user_id: {
          course_id: courseId,
          user_id: session.userId,
        },
      },
      update: {
        progress_percent: 100,
        status: 'completed',
        completed_at: new Date(),
      },
      create: {
        course_id: courseId,
        user_id: session.userId,
        partner_organization_id: session.partnerOrgId!,
        status: 'completed',
        progress_percent: 100,
        completed_at: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        actor_user_id: session.userId,
        partner_organization_id: session.partnerOrgId,
        entity_type: 'course_enrollment',
        entity_id: courseId,
        event_type: 'course.completed',
        metadata: {
          course_id: courseId,
          user_email: session.email,
        },
      },
    });

    revalidatePath('/partner-portal/learning');
    revalidatePath('/partner-portal/onboarding');
    revalidatePath('/partner-portal');
  } catch (err: unknown) {
    console.error('[ENROLL_COURSE_ERROR]', err);
  }
}
