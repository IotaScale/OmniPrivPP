'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePartnerSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { MembershipRole, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  website: z.string().min(3, 'Website is required'),
  region: z.string().min(2, 'Region is required'),
  partnerType: z.string().min(2, 'Partner type is required'),
  companySummary: z.string().optional(),
});

export async function updateCompanyProfileAction(formData: FormData) {
  const session = await requirePartnerSession();
  const raw = {
    displayName: formData.get('displayName'),
    website: formData.get('website'),
    region: formData.get('region'),
    partnerType: formData.get('partnerType'),
    companySummary: formData.get('companySummary') || undefined,
  };

  const validated = UpdateProfileSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Please correct profile validation errors.' };
  }

  const { displayName, website, region, partnerType, companySummary } = validated.data;

  try {
    await prisma.$transaction(async (tx) => {
      const org = await tx.partnerOrganization.update({
        where: { id: session.partnerOrgId },
        data: {
          display_name: displayName.trim(),
          website: website.trim().toLowerCase(),
          region: region.trim(),
          partner_type: partnerType.trim(),
          company_summary: companySummary?.trim() || null,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: session.partnerOrgId,
          entity_type: 'partner_organization',
          entity_id: org.id,
          event_type: 'partner.profile_updated',
          metadata: {
            display_name: displayName,
            region,
          },
        },
      });
    });

    revalidatePath('/partner-portal/company');
    return { success: true };
  } catch (err: unknown) {
    console.error('[UPDATE_PROFILE_ERROR]', err);
    return { error: 'Failed to update company profile.' };
  }
}

const InviteMemberSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid business email is required'),
  role: z.enum(['partner_owner', 'partner_member']),
});

export async function inviteTeamMemberAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (session.membershipRole !== 'partner_owner') {
    return { error: 'Only Partner Owners can invite or manage team members.' };
  }

  const raw = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    role: formData.get('role'),
  };

  const validated = InviteMemberSchema.safeParse(raw);
  if (!validated.success) {
    return { error: 'Invalid invitation fields.' };
  }

  const { fullName, email, role } = validated.data;
  const cleanEmail = email.trim().toLowerCase();
  const partnerOrgId = session.partnerOrgId!;

  try {
    await prisma.$transaction(async (tx) => {
      // Find or create user
      let user = await tx.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        // Initial random high-entropy temp password
        const initialTempPass = `OmniPriv-${Math.random().toString(36).substring(2, 10)}!2026`;
        const pHash = await hashPassword(initialTempPass);

        user = await tx.user.create({
          data: {
            email: cleanEmail,
            full_name: fullName.trim(),
            password_hash: pHash,
            role: UserRole.partner_user,
            is_active: true,
          },
        });
      }

      // Check if already a member of this organization
      const existingMembership = await tx.partnerMembership.findUnique({
        where: {
          user_id_partner_organization_id: {
            user_id: user.id,
            partner_organization_id: partnerOrgId,
          },
        },
      });

      if (existingMembership) {
        throw new Error('This user is already a member of your partner organization.');
      }

      await tx.partnerMembership.create({
        data: {
          user_id: user.id,
          partner_organization_id: partnerOrgId,
          role: role === 'partner_owner' ? MembershipRole.partner_owner : MembershipRole.partner_member,
          invited_by_user_id: session.userId,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: partnerOrgId,
          entity_type: 'partner_membership',
          entity_id: user.id,
          event_type: 'team.member_invited',
          metadata: {
            invited_email: cleanEmail,
            assigned_role: role,
          },
        },
      });
    });

    revalidatePath('/partner-portal/team');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add team member.';
    return { error: msg };
  }
}

export async function updateMemberRoleAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (session.membershipRole !== 'partner_owner') {
    return { error: 'Only Partner Owners can modify membership roles.' };
  }

  const membershipId = formData.get('membershipId') as string;
  const newRole = formData.get('role') as string;
  const partnerOrgId = session.partnerOrgId!;

  if (!membershipId || !['partner_owner', 'partner_member'].includes(newRole)) {
    return { error: 'Invalid parameters.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.partnerMembership.findUnique({
        where: { id: membershipId },
      });

      if (!membership || membership.partner_organization_id !== partnerOrgId) {
        throw new Error('Membership not found in your organization.');
      }

      // Check last remaining owner rule
      if (membership.role === MembershipRole.partner_owner && newRole === 'partner_member') {
        const ownerCount = await tx.partnerMembership.count({
          where: {
            partner_organization_id: partnerOrgId,
            role: MembershipRole.partner_owner,
          },
        });

        if (ownerCount <= 1) {
          throw new Error('Cannot demote the organization’s sole remaining owner. Promote another member first.');
        }
      }

      await tx.partnerMembership.update({
        where: { id: membershipId },
        data: {
          role: newRole === 'partner_owner' ? MembershipRole.partner_owner : MembershipRole.partner_member,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: partnerOrgId,
          entity_type: 'partner_membership',
          entity_id: membership.id,
          event_type: 'team.role_changed',
          metadata: {
            target_user_id: membership.user_id,
            previous_role: membership.role,
            new_role: newRole,
          },
        },
      });
    });

    revalidatePath('/partner-portal/team');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update member role.';
    return { error: msg };
  }
}

export async function removeTeamMemberAction(formData: FormData) {
  const session = await requirePartnerSession();
  if (session.membershipRole !== 'partner_owner') {
    return { error: 'Only Partner Owners can remove team members.' };
  }

  const membershipId = formData.get('membershipId') as string;
  const partnerOrgId = session.partnerOrgId!;

  try {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.partnerMembership.findUnique({
        where: { id: membershipId },
      });

      if (!membership || membership.partner_organization_id !== partnerOrgId) {
        throw new Error('Membership not found in your organization.');
      }

      // If target is an owner, verify there is at least one other owner
      if (membership.role === MembershipRole.partner_owner) {
        const ownerCount = await tx.partnerMembership.count({
          where: {
            partner_organization_id: partnerOrgId,
            role: MembershipRole.partner_owner,
          },
        });

        if (ownerCount <= 1) {
          throw new Error('Cannot remove the organization’s final remaining owner.');
        }
      }

      await tx.partnerMembership.delete({
        where: { id: membershipId },
      });

      await tx.auditEvent.create({
        data: {
          actor_user_id: session.userId,
          partner_organization_id: partnerOrgId,
          entity_type: 'partner_membership',
          entity_id: membership.id,
          event_type: 'team.member_removed',
          metadata: {
            removed_user_id: membership.user_id,
          },
        },
      });
    });

    revalidatePath('/partner-portal/team');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove team member.';
    return { error: msg };
  }
}
