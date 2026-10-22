'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePartnerSession } from '@/lib/auth/session';
import { normalizeDomain, detectDomainConflict } from '@/lib/utils/domain';
import { generateDealReference } from '@/lib/utils/reference';
import { logAuditEvent } from '@/lib/audit';
import { DealStatus, UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const DealSubmissionSchema = z.object({
  customerLegalName: z.string().min(2, 'Customer legal name is required'),
  customerDomain: z.string().min(3, 'Valid customer domain is required'),
  customerCountry: z.string().min(2, 'Customer country is required'),
  customerIndustry: z.string().optional(),
  customerContactName: z.string().min(2, 'Customer contact name is required'),
  customerContactEmail: z.string().email('Valid contact email is required'),
  customerContactPhone: z.string().optional(),
  productInterest: z.string().min(2, 'Product plan interest is required'),
  deploymentType: z.string().min(2, 'Deployment architecture is required'),
  estimatedDealValue: z.coerce.number().positive('Estimated deal value must be positive').optional(),
  estimatedArr: z.coerce.number().positive().optional(),
  currency: z.string().default('USD'),
  expectedSeatCount: z.coerce.number().int().positive().optional(),
  expectedCloseDate: z.string().optional(),
  deploymentTimeline: z.string().optional(),
  opportunitySource: z.string().optional(),
  partnerNotes: z.string().optional(),
  declarationConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm the commercial engagement declaration' }),
  }),
  leadAssignmentId: z.string().optional(),
});

export type DealActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  dealId?: string;
  reference?: string;
  conflictDetected?: boolean;
};

/**
 * Submits a new deal registration into awaiting_approval.
 * Detects domain conflicts against active protected deals across PostgreSQL.
 */
export async function submitDealRegistrationAction(
  prevState: DealActionState | undefined,
  formData: FormData
): Promise<DealActionState> {
  const session = await requirePartnerSession();
  const partnerOrgId = session.partnerOrgId!;
  const userId = session.userId;

  const raw = {
    customerLegalName: formData.get('customerLegalName'),
    customerDomain: formData.get('customerDomain'),
    customerCountry: formData.get('customerCountry'),
    customerIndustry: formData.get('customerIndustry'),
    customerContactName: formData.get('customerContactName'),
    customerContactEmail: formData.get('customerContactEmail'),
    customerContactPhone: formData.get('customerContactPhone'),
    productInterest: formData.get('productInterest'),
    deploymentType: formData.get('deploymentType'),
    estimatedDealValue: formData.get('estimatedDealValue') || undefined,
    estimatedArr: formData.get('estimatedArr') || undefined,
    currency: formData.get('currency') || 'USD',
    expectedSeatCount: formData.get('expectedSeatCount') || undefined,
    expectedCloseDate: formData.get('expectedCloseDate') || undefined,
    deploymentTimeline: formData.get('deploymentTimeline') || undefined,
    opportunitySource: formData.get('opportunitySource') || undefined,
    partnerNotes: formData.get('partnerNotes') || undefined,
    declarationConfirmed: formData.get('declarationConfirmed') === 'on' ? true : false,
    leadAssignmentId: formData.get('leadAssignmentId') || undefined,
  };

  const validated = DealSubmissionSchema.safeParse(raw);
  if (!validated.success) {
    return {
      error: 'Please resolve the highlighted validation errors.',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;
  const normalizedDomain = normalizeDomain(data.customerDomain);

  // Check for domain conflict
  const conflict = await detectDomainConflict(normalizedDomain, partnerOrgId);
  const publicReference = await generateDealReference();

  try {
    const newDeal = await prisma.$transaction(async (tx) => {
      // 1. Create Deal Registration
      const deal = await tx.dealRegistration.create({
        data: {
          public_reference: publicReference,
          partner_organization_id: partnerOrgId,
          submitted_by_user_id: userId,
          customer_legal_name: data.customerLegalName.trim(),
          customer_domain: normalizedDomain,
          customer_country: data.customerCountry.trim(),
          customer_industry: data.customerIndustry?.trim() || null,
          customer_contact_name: data.customerContactName.trim(),
          customer_contact_email: data.customerContactEmail.trim().toLowerCase(),
          customer_contact_phone: data.customerContactPhone?.trim() || null,
          product_interest: data.productInterest,
          deployment_type: data.deploymentType,
          estimated_deal_value: data.estimatedDealValue || null,
          estimated_arr: data.estimatedArr || null,
          currency: data.currency,
          expected_seat_count: data.expectedSeatCount || null,
          expected_close_date: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
          deployment_timeline: data.deploymentTimeline || null,
          opportunity_source: data.opportunitySource || null,
          partner_notes: data.partnerNotes?.trim() || null,
          status: DealStatus.awaiting_approval,
          conflict_detected: conflict.hasConflict,
          conflict_reason: conflict.reason || null,
          converted_from_lead_assignment_id: data.leadAssignmentId || null,
        },
      });

      // 2. Create Deal Status History
      await tx.dealStatusHistory.create({
        data: {
          deal_registration_id: deal.id,
          previous_status: null,
          new_status: DealStatus.awaiting_approval,
          changed_by_user_id: userId,
          note: conflict.hasConflict
            ? `Deal submitted by partner. Domain conflict detected with active registration.`
            : `Deal submitted by partner for OmniPriv Channel review.`,
        },
      });

      // 3. Immutable Audit Event
      await tx.auditEvent.create({
        data: {
          actor_user_id: userId,
          partner_organization_id: partnerOrgId,
          entity_type: 'deal_registration',
          entity_id: deal.id,
          event_type: 'deal.submitted',
          metadata: {
            public_reference: deal.public_reference,
            customer_legal_name: deal.customer_legal_name,
            customer_domain: normalizedDomain,
            conflict_detected: conflict.hasConflict,
            estimated_deal_value: deal.estimated_deal_value,
          },
        },
      });

      // 4. In-App Notification for Channel Admins
      await tx.notification.create({
        data: {
          title: 'New Deal Registration Submitted',
          message: `${session.partnerOrgName} submitted deal ${deal.public_reference} (${deal.customer_legal_name})${
            conflict.hasConflict ? ' [DOMAIN CONFLICT DETECTED]' : ''
          }.`,
          link: `/channel-admin/deals?id=${deal.id}`,
          type: conflict.hasConflict ? 'warning' : 'info',
        },
      });

      // 5. If converting an assigned lead, mark lead assignment and lead converted
      if (data.leadAssignmentId) {
        const leadAssignment = await tx.leadAssignment.findUnique({
          where: { id: data.leadAssignmentId },
        });

        if (leadAssignment && leadAssignment.partner_organization_id === partnerOrgId) {
          await tx.leadAssignment.update({
            where: { id: leadAssignment.id },
            data: {
              current_status: 'converted',
            },
          });

          await tx.lead.update({
            where: { id: leadAssignment.lead_id },
            data: {
              status: 'converted',
            },
          });

          await tx.auditEvent.create({
            data: {
              actor_user_id: userId,
              partner_organization_id: partnerOrgId,
              entity_type: 'lead_assignment',
              entity_id: leadAssignment.id,
              event_type: 'lead.converted_to_deal',
              metadata: {
                lead_id: leadAssignment.lead_id,
                deal_id: deal.id,
                public_reference: deal.public_reference,
              },
            },
          });
        }
      }

      return deal;
    });

    revalidatePath('/partner-portal/deals');
    revalidatePath('/partner-portal');
    revalidatePath('/channel-admin/deals');
    revalidatePath('/channel-admin');

    redirect(`/partner-portal/deals/${newDeal.id}?submitted=true`);
  } catch (err: unknown) {
    // If it's a Next.js redirect exception, rethrow
    if (err && typeof err === 'object' && 'digest' in err && typeof (err as { digest: string }).digest === 'string' && (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')) {
      throw err;
    }

    console.error('[SUBMIT_DEAL_ERROR]', err);
    return {
      error: 'Failed to submit deal registration. Please verify your connection and try again.',
    };
  }
}
