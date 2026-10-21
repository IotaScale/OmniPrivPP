'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePartnerSession, requireAdminSession } from '@/lib/auth/session';
import { calculateLeadDeadline } from '@/lib/utils/sla';
import { generateLeadReference } from '@/lib/utils/reference';
import { logAuditEvent } from '@/lib/audit';
import { LeadStatus, LeadAcceptanceStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const CreateLeadSchema = z.object({
  company: z.string().min(2, 'Company name is required'),
  customerDomain: z.string().optional(),
  contactFirstName: z.string().min(1, 'First name is required'),
  contactLastName: z.string().min(1, 'Last name is required'),
  contactEmail: z.string().email('Valid contact email is required'),
  contactPhone: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
  region: z.string().optional(),
  industry: z.string().optional(),
  leadSource: z.string().min(2, 'Lead source is required'),
  productInterest: z.string().optional(),
  estimatedSeatCount: z.coerce.number().int().positive().optional(),
  customerComment: z.string().optional(),
  partnerOrgId: z.string().optional(), // If assigned directly upon creation
});

export async function createLeadAction(formData: FormData) {
  const session = await requireAdminSession();
  const raw = {
    company: formData.get('company'),
    customerDomain: formData.get('customerDomain') || undefined,
    contactFirstName: formData.get('contactFirstName'),
    contactLastName: formData.get('contactLastName'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone') || undefined,
    country: formData.get('country'),
    region: formData.get('region') || undefined,
    industry: formData.get('industry') || undefined,
    leadSource: formData.get('leadSource') || 'OmniPriv Website Inbound',
    productInterest: formData.get('productInterest') || undefined,
    estimatedSeatCount: formData.get('estimatedSeatCount') || undefined,
    customerComment: formData.get('customerComment') || undefined,
    partnerOrgId: formData.get('partnerOrgId') || undefined,
  };

  const validated = CreateLeadSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Please correct form validation errors.' };
  }

  const data = validated.data;
  const publicReference = await generateLeadReference();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          public_reference: publicReference,
          customer_name: `${data.contactFirstName} ${data.contactLastName}`,
          company: data.company.trim(),
          customer_domain: data.customerDomain?.trim().toLowerCase() || null,
          contact_first_name: data.contactFirstName.trim(),
          contact_last_name: data.contactLastName.trim(),
          contact_email: data.contactEmail.trim().toLowerCase(),
          contact_phone: data.contactPhone?.trim() || null,
          country: data.country.trim(),
          region: data.region?.trim() || null,
          industry: data.industry?.trim() || null,
          lead_source: data.leadSource.trim(),
          product_interest: data.productInterest?.trim() || null,
          estimated_seat_count: data.estimatedSeatCount || null,
          customer_comment: data.customerComment?.trim() || null,
          status: data.partnerOrgId ? LeadStatus.assigned : LeadStatus.new,
        },
      });

      if (data.partnerOrgId) {
        const deadline = calculateLeadDeadline(new Date(), 7);
        await tx.leadAssignment.create({
          data: {
            lead_id: lead.id,
            partner_organization_id: data.partnerOrgId,
            assigned_by_user_id: session.userId,
            acceptance_deadline_at: deadline,
            partner_acceptance_status: LeadAcceptanceStatus.pending,
            current_status: 'assigned',
          },
        });

        await tx.notification.create({
          data: {
            partner_organization_id: data.partnerOrgId,
            title: `New Lead Assigned: ${lead.public_reference}`,
            message: `OmniPriv assigned an inbound prospect (${lead.company}) to your organization with a 7-day acceptance deadline.`,
            link: `/partner-portal/leads`,
            type: 'info',
          },
        });
      }

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: data.partnerOrgId || null,
          entity_type: 'lead',
          entity_id: lead.id,
          event_type: data.partnerOrgId ? 'lead.created_and_assigned' : 'lead.created',
          metadata: {
            public_reference: lead.public_reference,
            company: lead.company,
            partner_organization_id: data.partnerOrgId,
          },
        },
      });

      return lead;
    });

    revalidatePath('/channel-admin/leads');
    return { success: true, lead: result };
  } catch (err: unknown) {
    console.error('[CREATE_LEAD_ERROR]', err);
    return { error: 'Failed to create lead.' };
  }
}

export async function assignLeadAction(formData: FormData) {
  const session = await requireAdminSession();
  const leadId = formData.get('leadId') as string;
  const partnerOrgId = formData.get('partnerOrgId') as string;

  if (!leadId || !partnerOrgId) {
    return { error: 'Lead and Partner Organization are required.' };
  }

  const deadline = calculateLeadDeadline(new Date(), 7);

  try {
    await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: leadId } });
      if (!lead) throw new Error('Lead not found');

      const assignment = await tx.leadAssignment.create({
        data: {
          lead_id: leadId,
          partner_organization_id: partnerOrgId,
          assigned_by_user_id: session.userId,
          acceptance_deadline_at: deadline,
          partner_acceptance_status: LeadAcceptanceStatus.pending,
          current_status: 'assigned',
        },
      });

      await tx.lead.update({
        where: { id: leadId },
        data: { status: LeadStatus.assigned },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: partnerOrgId,
          entity_type: 'lead_assignment',
          entity_id: assignment.id,
          event_type: 'lead.assigned',
          metadata: {
            lead_id: lead.id,
            public_reference: lead.public_reference,
            deadline: deadline.toISOString(),
          },
        },
      });

      await tx.notification.create({
        data: {
          partner_organization_id: partnerOrgId,
          title: `New Lead Assigned: ${lead.public_reference}`,
          message: `OmniPriv assigned prospect ${lead.company} to your company. Please accept within 7 days.`,
          link: `/partner-portal/leads/${assignment.id}`,
          type: 'info',
        },
      });
    });

    revalidatePath('/channel-admin/leads');
    return { success: true };
  } catch (err: unknown) {
    console.error('[ASSIGN_LEAD_ERROR]', err);
    return { error: 'Failed to assign lead to partner.' };
  }
}

/**
 * Partner accepts an assigned lead.
 */
export async function acceptLeadAction(formData: FormData) {
  const session = await requirePartnerSession();
  const assignmentId = formData.get('assignmentId') as string;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await tx.leadAssignment.findUnique({
        where: { id: assignmentId },
        include: { lead: true },
      });

      if (!assignment || assignment.partner_organization_id !== session.partnerOrgId) {
        throw new Error('Unauthorized lead access.');
      }

      const res = await tx.leadAssignment.update({
        where: { id: assignmentId },
        data: {
          partner_acceptance_status: LeadAcceptanceStatus.accepted,
          accepted_at: new Date(),
          current_status: 'working',
        },
      });

      await tx.lead.update({
        where: { id: assignment.lead_id },
        data: { status: LeadStatus.working },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: session.partnerOrgId,
          entity_type: 'lead_assignment',
          entity_id: assignment.id,
          event_type: 'lead.accepted',
          metadata: {
            lead_reference: assignment.lead.public_reference,
            company: assignment.lead.company,
          },
        },
      });

      // Notification for Channel Admin
      await tx.notification.create({
        data: {
          title: `Lead Accepted: ${assignment.lead.public_reference}`,
          message: `${session.partnerOrgName} accepted lead ${assignment.lead.company} and is now actively working the opportunity.`,
          link: `/channel-admin/leads`,
          type: 'success',
        },
      });

      return res;
    });

    revalidatePath('/partner-portal/leads');
    revalidatePath(`/partner-portal/leads/${assignmentId}`);
    return { success: true, assignment: updated };
  } catch (err: unknown) {
    console.error('[ACCEPT_LEAD_ERROR]', err);
    return { error: 'Failed to accept lead.' };
  }
}

/**
 * Partner declines an assigned lead with a required reason.
 */
export async function declineLeadAction(formData: FormData) {
  const session = await requirePartnerSession();
  const assignmentId = formData.get('assignmentId') as string;
  const reason = (formData.get('reason') as string)?.trim();

  if (!reason || reason.length < 3) {
    return { error: 'Please provide a clear reason for declining this lead.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.leadAssignment.findUnique({
        where: { id: assignmentId },
        include: { lead: true },
      });

      if (!assignment || assignment.partner_organization_id !== session.partnerOrgId) {
        throw new Error('Unauthorized lead access.');
      }

      await tx.leadAssignment.update({
        where: { id: assignmentId },
        data: {
          partner_acceptance_status: LeadAcceptanceStatus.declined,
          declined_at: new Date(),
          decline_reason: reason,
          current_status: 'declined',
        },
      });

      await tx.lead.update({
        where: { id: assignment.lead_id },
        data: { status: LeadStatus.new }, // Return to unassigned queue for channel routing
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: session.partnerOrgId,
          entity_type: 'lead_assignment',
          entity_id: assignment.id,
          event_type: 'lead.declined',
          metadata: {
            lead_reference: assignment.lead.public_reference,
            decline_reason: reason,
          },
        },
      });

      await tx.notification.create({
        data: {
          title: `Lead Declined: ${assignment.lead.public_reference}`,
          message: `${session.partnerOrgName} declined lead ${assignment.lead.company}. Reason: ${reason}. Available for reassignment.`,
          link: `/channel-admin/leads`,
          type: 'warning',
        },
      });
    });

    revalidatePath('/partner-portal/leads');
    revalidatePath(`/partner-portal/leads/${assignmentId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('[DECLINE_LEAD_ERROR]', err);
    return { error: 'Failed to decline lead.' };
  }
}

/**
 * Update working progress notes for an accepted lead.
 */
export async function updateLeadStatusAction(formData: FormData) {
  const session = await requirePartnerSession();
  const assignmentId = formData.get('assignmentId') as string;
  const status = formData.get('status') as string;
  const updateNote = (formData.get('updateNote') as string)?.trim();

  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.leadAssignment.findUnique({
        where: { id: assignmentId },
        include: { lead: true },
      });

      if (!assignment || assignment.partner_organization_id !== session.partnerOrgId) {
        throw new Error('Unauthorized lead access.');
      }

      await tx.leadAssignment.update({
        where: { id: assignmentId },
        data: {
          current_status: status,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: session.partnerOrgId,
          entity_type: 'lead_assignment',
          entity_id: assignment.id,
          event_type: 'lead.progress_update',
          metadata: {
            new_status: status,
            note: updateNote,
          },
        },
      });
    });

    revalidatePath('/partner-portal/leads');
    revalidatePath(`/partner-portal/leads/${assignmentId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('[UPDATE_LEAD_PROGRESS_ERROR]', err);
    return { error: 'Failed to update progress.' };
  }
}
