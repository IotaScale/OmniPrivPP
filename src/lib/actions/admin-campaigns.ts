'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth/session';
import { getAppBaseUrl, isEmailConfigured, renderBrandedEmail, sendEmail } from '@/lib/email/mailer';

export type CreateCampaignState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Partner users the announcement email was queued for. */
  recipients?: number;
  emailConfigured?: boolean;
  notifiedOrgs?: number;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const CampaignSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160),
    summary: z.string().trim().min(10, 'Summary must be at least 10 characters').max(2000),
    relatedProduct: z.string().trim().min(2, 'Product is required').max(120),
    targetAudience: z.string().trim().min(2, 'Target audience is required').max(300),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: optionalText(20),
    assetsUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => !v || /^https:\/\/\S+$/i.test(v), 'Assets link must start with https://'),
    emailCopy: optionalText(6000),
    socialCopy: optionalText(3000),
    notifyPartners: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'Enter a valid start date' });
    }
    if (data.endDate) {
      const end = new Date(data.endDate);
      if (Number.isNaN(end.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Enter a valid end date' });
      } else if (!Number.isNaN(start.getTime()) && end < start) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be after the start date' });
      }
    }
  });

function campaignStatus(start: Date, end: Date | null, now = new Date()): 'upcoming' | 'active' | 'ended' {
  if (start > now) return 'upcoming';
  if (end && end < now) return 'ended';
  return 'active';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/**
 * Channel Admin creates a partner marketing campaign. Every active partner
 * organization gets an in-app notification, and (unless unticked) every active
 * partner user is emailed from partner@omnipriv.com after the response is sent.
 */
export async function createCampaignAction(
  _prev: CreateCampaignState | undefined,
  formData: FormData
): Promise<CreateCampaignState> {
  const session = await requireAdminSession();

  const validated = CampaignSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) {
    return {
      error: 'Please fix the highlighted fields.',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }
  const data = validated.data;
  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;
  const status = campaignStatus(startDate, endDate);
  const notifyPartners = data.notifyPartners === 'on' || data.notifyPartners === 'true';

  let campaignId: string;
  let notifiedOrgs = 0;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          title: data.title,
          summary: data.summary,
          related_product: data.relatedProduct,
          target_audience: data.targetAudience,
          start_date: startDate,
          end_date: endDate,
          status,
          assets_url: data.assetsUrl ?? null,
          email_copy: data.emailCopy ?? null,
          social_copy: data.socialCopy ?? null,
        },
      });

      // In-app notification for every active partner organization.
      const orgs = await tx.partnerOrganization.findMany({
        where: { status: 'active' },
        select: { id: true },
      });
      if (orgs.length) {
        await tx.notification.createMany({
          data: orgs.map((org) => ({
            partner_organization_id: org.id,
            title: `New campaign: ${campaign.title}`,
            message: campaign.summary.slice(0, 280),
            link: '/partner-portal/campaigns',
            type: 'info',
          })),
        });
      }

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          entity_type: 'campaign',
          entity_id: campaign.id,
          event_type: 'campaign.created',
          metadata: { title: campaign.title, status, notify_partners: notifyPartners, notified_orgs: orgs.length },
        },
      });
      return { campaignId: campaign.id, notifiedOrgs: orgs.length };
    });
    campaignId = result.campaignId;
    notifiedOrgs = result.notifiedOrgs;
  } catch (err) {
    console.error('[CREATE_CAMPAIGN_ERROR]', err);
    return { error: 'The campaign could not be created. Please try again.' };
  }

  revalidatePath('/channel-admin/campaigns');
  revalidatePath('/partner-portal/campaigns');
  revalidatePath('/partner-portal');

  if (!notifyPartners) {
    return { success: true, recipients: 0, emailConfigured: isEmailConfigured(), notifiedOrgs };
  }

  // Active partner users in active partner organizations (one email each, never BCC-shared).
  const recipients = await prisma.user.findMany({
    where: {
      role: 'partner_user',
      is_active: true,
      memberships: { some: { organization: { status: 'active' } } },
    },
    select: { email: true, full_name: true },
  });
  const emailConfigured = isEmailConfigured();

  if (emailConfigured && recipients.length) {
    const announcement = {
      id: campaignId,
      title: data.title,
      summary: data.summary,
      product: data.relatedProduct,
      audience: data.targetAudience,
      runs: `${formatDate(startDate)} – ${endDate ? formatDate(endDate) : 'Ongoing'}`,
      status,
    };
    const actorId = session.userId;

    // Send after the response so the admin isn't kept waiting on SMTP.
    after(async () => {
      const link = new URL('/partner-portal/campaigns', getAppBaseUrl()).toString();
      let sent = 0;
      let failed = 0;
      const BATCH = 5;
      for (let i = 0; i < recipients.length; i += BATCH) {
        const batch = recipients.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map((r) => {
            const { html, text } = renderBrandedEmail({
              preheader: `${announcement.product} · ${announcement.runs}`,
              heading: `New campaign: ${announcement.title}`,
              paragraphs: [
                `Hi ${r.full_name},`,
                `OmniPriv has ${announcement.status === 'upcoming' ? 'scheduled' : 'launched'} a new partner marketing campaign you can run with your customers.`,
                announcement.summary,
                'The campaign kit (assets, email copy and social copy) is ready in the Partner Portal.',
              ],
              details: [
                { label: 'Product', value: announcement.product },
                { label: 'Target audience', value: announcement.audience },
                { label: 'Runs', value: announcement.runs },
              ],
              cta: { label: 'View campaign kit', url: link },
              footnote: 'You received this because you are a member of an OmniPriv partner organization.',
            });
            return sendEmail({
              to: r.email,
              subject: `New OmniPriv campaign: ${announcement.title}`,
              text,
              html,
            });
          })
        );
        for (const r of results) (r.sent ? sent++ : failed++);
      }

      await prisma.auditEvent
        .create({
          data: {
            actor_user_id: actorId,
            entity_type: 'campaign',
            entity_id: announcement.id,
            event_type: 'campaign.announced',
            metadata: { recipients: recipients.length, sent, failed },
          },
        })
        .catch((err) => console.error('[CAMPAIGN_ANNOUNCE_AUDIT_ERROR]', err));
    });
  }

  return { success: true, recipients: recipients.length, emailConfigured, notifiedOrgs };
}
