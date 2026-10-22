import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanMockData() {
  const adminEmail = (process.env.CHANNEL_ADMIN_EMAIL || 'admin@omnipriv.internal').trim().toLowerCase();
  const adminPassword = process.env.CHANNEL_ADMIN_PASSWORD || 'OmniPrivAdmin2026!';
  const adminName = process.env.CHANNEL_ADMIN_NAME || 'OmniPriv Channel Operations';

  console.log(`[CLEANUP] Retaining ONLY Channel Admin: ${adminEmail}`);

  // 1. Delete deal & lead relations
  console.log('[CLEANUP] Deleting deal status history, deals, lead assignments, leads...');
  await prisma.dealStatusHistory.deleteMany({});
  await prisma.dealRegistration.deleteMany({});
  await prisma.leadAssignment.deleteMany({});
  await prisma.lead.deleteMany({});

  // 2. Delete commercial and operational partner data
  console.log('[CLEANUP] Deleting renewals, commercial requests, JBPs...');
  await prisma.renewal.deleteMany({});
  await prisma.commercialRequest.deleteMany({});
  await prisma.jointBusinessPlan.deleteMany({});

  // 3. Delete partner enrollments, certifications and legal records
  console.log('[CLEANUP] Deleting enrollments, certs, event registrations, terms, locator...');
  await prisma.courseEnrollment.deleteMany({});
  await prisma.partnerCertification.deleteMany({});
  await prisma.eventRegistration.deleteMany({});
  await prisma.termsAcceptance.deleteMany({});
  await prisma.partnerLocatorProfile.deleteMany({});

  // 4. Delete memberships and notifications
  console.log('[CLEANUP] Deleting memberships and notifications...');
  await prisma.partnerMembership.deleteMany({});
  await prisma.notification.deleteMany({});

  // 5. Delete audit events
  console.log('[CLEANUP] Clearing audit events...');
  await prisma.auditEvent.deleteMany({});

  // 6. Delete all partner organizations
  console.log('[CLEANUP] Deleting all partner organizations...');
  const deletedOrgs = await prisma.partnerOrganization.deleteMany({});
  console.log(`[CLEANUP] Deleted ${deletedOrgs.count} partner organizations.`);

  // 7. Delete all users EXCEPT the channel admin
  console.log('[CLEANUP] Deleting all non-admin users...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        not: adminEmail,
      },
    },
  });
  console.log(`[CLEANUP] Deleted ${deletedUsers.count} non-admin users.`);

  // 8. Ensure Channel Admin user is properly set up with known credentials
  const passwordHash = await hash(adminPassword);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      full_name: adminName,
      password_hash: passwordHash,
      role: UserRole.channel_admin,
      is_active: true,
      email_verified_at: new Date(),
    },
    create: {
      email: adminEmail,
      full_name: adminName,
      password_hash: passwordHash,
      role: UserRole.channel_admin,
      is_active: true,
      email_verified_at: new Date(),
    },
  });

  // Record clean baseline audit event
  await prisma.auditEvent.create({
    data: {
      actor_user_id: adminUser.id,
      entity_type: 'system',
      entity_id: adminUser.id,
      event_type: 'system.database.reset_to_admin_only',
      metadata: {
        admin_email: adminEmail,
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log(`[CLEANUP] SUCCESS: Retained Channel Admin ${adminEmail} (ID: ${adminUser.id}). All mock data cleared.`);
}

cleanMockData()
  .catch((err) => {
    console.error('[CLEANUP ERROR]', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
