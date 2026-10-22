'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePartnerSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const CommercialRequestSchema = z.object({
  requestType: z.enum(['poc', 'customer_trial', 'nfr_license', 'quote_request', 'order_assistance', 'license_expansion']),
  title: z.string().min(3, 'Title is required'),
  customerName: z.string().optional(),
  seatsNodes: z.coerce.number().optional(),
  details: z.string().min(10, 'Please provide comprehensive details for this commercial request'),
});

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function submitCommercialRequestAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePartnerSession();
  const rawData = Object.fromEntries(formData.entries());
  const validated = CommercialRequestSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: 'Please complete all required fields.',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { requestType, title, customerName, seatsNodes, details } = validated.data;
  const partnerOrgId = session.partnerOrgId!;
  const userId = session.userId;

  const count = await prisma.commercialRequest.count();
  const publicReference = `CR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  try {
    const request = await prisma.$transaction(async (tx) => {
      const cr = await tx.commercialRequest.create({
        data: {
          public_reference: publicReference,
          partner_organization_id: partnerOrgId,
          requested_by_user_id: userId,
          request_type: requestType,
          status: 'submitted',
          title: title.trim(),
          customer_name: customerName?.trim() || null,
          seats_nodes: seatsNodes || null,
          details: details.trim(),
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: userId,
          partner_organization_id: partnerOrgId,
          entity_type: 'commercial_request',
          entity_id: cr.id,
          event_type: 'commercial_request.submitted',
          metadata: {
            public_reference: cr.public_reference,
            request_type: cr.request_type,
            title: cr.title,
          },
        },
      });

      await tx.notification.create({
        data: {
          title: 'Commercial Request Submitted',
          message: `${session.partnerOrgName} submitted ${cr.public_reference}: ${cr.title}`,
          link: `/channel-admin/commercial-requests`,
          type: 'info',
        },
      });

      return cr;
    });

    revalidatePath('/partner-portal/commercial-requests');
    revalidatePath('/partner-portal');
    revalidatePath('/channel-admin/commercial-requests');
    revalidatePath('/channel-admin');
  } catch (err: unknown) {
    console.error('[COMMERCIAL_REQUEST_ERROR]', err);
    return { error: 'Failed to submit commercial request. Please try again.' };
  }

  redirect('/partner-portal/commercial-requests?submitted=true');
}
