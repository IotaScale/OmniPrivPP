'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit';
import { MembershipRole, PartnerTier, OrgStatus, UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

const SignUpSchema = z.object({
  companyLegalName: z.string().min(2, 'Company legal name is required'),
  companyDisplayName: z.string().min(2, 'Display name is required'),
  website: z.string().min(3, 'Valid company website domain is required'),
  country: z.string().min(2, 'Country is required'),
  region: z.string().min(2, 'Region is required'),
  partnerType: z.string().min(2, 'Partner type is required'),
  fullName: z.string().min(2, 'Contact full name is required'),
  email: z.string().email('Valid business email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Atomic partner organization registration.
 * Creates Organization, Owner User, Membership, Registered Tier, and Audit Event in one transaction.
 */
export async function signUpPartnerAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = SignUpSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: 'Please fix the errors below.',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const {
    companyLegalName,
    companyDisplayName,
    website,
    country,
    region,
    partnerType,
    fullName,
    email,
    password,
  } = validated.data;

  const cleanEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    return {
      error: 'An account with this email address already exists. Please sign in instead.',
    };
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Partner Organization
      const org = await tx.partnerOrganization.create({
        data: {
          legal_name: companyLegalName.trim(),
          display_name: companyDisplayName.trim(),
          website: website.trim().toLowerCase(),
          country: country.trim(),
          region: region.trim(),
          partner_type: partnerType.trim(),
          tier: PartnerTier.Registered,
          status: OrgStatus.active,
        },
      });

      // 2. Create User
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          password_hash: passwordHash,
          full_name: fullName.trim(),
          role: UserRole.partner_user,
          is_active: true,
          email_verified_at: new Date(),
        },
      });

      // 3. Create Partner Membership as partner_owner
      const membership = await tx.partnerMembership.create({
        data: {
          user_id: user.id,
          partner_organization_id: org.id,
          role: MembershipRole.partner_owner,
        },
      });

      // 4. Create immutable Audit Event
      await tx.auditEvent.create({
        data: {
          actor_user_id: user.id,
          partner_organization_id: org.id,
          entity_type: 'partner_organization',
          entity_id: org.id,
          event_type: 'partner.organization.created',
          metadata: {
            organization_id: org.id,
            legal_name: org.legal_name,
            owner_user_id: user.id,
            owner_email: user.email,
            tier: org.tier,
          },
        },
      });

      return { org, user, membership };
    });

    // Establish secure session cookie
    await createSession({
      userId: result.user.id,
      email: result.user.email,
      fullName: result.user.full_name,
      role: 'partner_user',
      partnerOrgId: result.org.id,
      partnerOrgName: result.org.display_name,
      partnerTier: result.org.tier,
      membershipRole: result.membership.role,
    });
  } catch (err: unknown) {
    console.error('[SIGN_UP_ERROR]', err);
    return {
      error: 'Failed to create partner account. Please check your details and try again.',
    };
  }

  redirect('/partner-portal');
}

const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Authenticates partner user or redirects admin to admin portal.
 */
export async function signInAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = SignInSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: 'Please enter valid credentials.',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;
  const cleanEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user || !user.is_active) {
    return { error: 'Invalid email or password.' };
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    return { error: 'Invalid email or password.' };
  }

  // Handle Channel Admin sign in at main screen
  if (user.role === UserRole.channel_admin) {
    await createSession({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: 'channel_admin',
    });

    redirect('/channel-admin');
  }

  // Handle Partner User
  const activeMembership = user.memberships.find(
    (m) => m.organization.status === OrgStatus.active
  );

  if (!activeMembership) {
    return {
      error: 'Your partner organization account is inactive or suspended. Please contact OmniPriv Channel Support.',
    };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: 'partner_user',
    partnerOrgId: activeMembership.organization.id,
    partnerOrgName: activeMembership.organization.display_name,
    partnerTier: activeMembership.organization.tier,
    membershipRole: activeMembership.role,
  });

  await logAuditEvent({
    actorUserId: user.id,
    partnerOrgId: activeMembership.organization.id,
    entityType: 'user',
    entityId: user.id,
    eventType: 'user.authenticated',
    metadata: { method: 'password' },
  });

  redirect('/partner-portal');
}

/**
 * Dedicated Channel Admin login action.
 */
export async function signInAdminAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = SignInSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: 'Please enter valid credentials.',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;
  const cleanEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user || !user.is_active) {
    return { error: 'Invalid administrator credentials.' };
  }

  if (user.role !== UserRole.channel_admin) {
    return {
      error: 'Access Denied: This account is not authorized for OmniPriv Channel Operations.',
    };
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    return { error: 'Invalid administrator credentials.' };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: 'channel_admin',
  });

  await logAuditEvent({
    actorUserId: user.id,
    entityType: 'user',
    entityId: user.id,
    eventType: 'channel_admin.authenticated',
  });

  redirect('/channel-admin');
}

/**
 * Sign out and destroy session.
 */
export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect('/sign-in');
}
