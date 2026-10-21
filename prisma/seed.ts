import { PrismaClient, UserRole, ResourceCategory } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting OmniPriv Seed Routine ---');

  // 1. Seed Channel Admin from environment variables
  const adminEmail = process.env.CHANNEL_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.CHANNEL_ADMIN_PASSWORD;
  const adminName = process.env.CHANNEL_ADMIN_NAME?.trim() || 'OmniPriv Channel Operations';

  if (adminEmail && adminPassword) {
    const passwordHash = await hash(adminPassword);

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        full_name: adminName,
        password_hash: passwordHash,
        role: UserRole.channel_admin,
        is_active: true,
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

    // Record immutable audit event
    await prisma.auditEvent.create({
      data: {
        actor_user_id: adminUser.id,
        entity_type: 'user',
        entity_id: adminUser.id,
        event_type: 'system.channel_admin.seeded',
        metadata: {
          email: adminEmail,
          role: 'channel_admin',
        },
      },
    });

    console.log(`[SEED] Channel Admin seeded successfully: ${adminEmail} (${adminUser.id})`);
  } else {
    console.warn('[SEED] Warning: CHANNEL_ADMIN_EMAIL or CHANNEL_ADMIN_PASSWORD not set in environment.');
  }

  // 2. Seed Standard Enablement Resources
  const standardResources = [
    {
      title: 'OmniPriv PAM Enterprise Channel Sales Playbook 2026',
      description: 'Comprehensive guide covering qualification criteria, competitive positioning against legacy vaults, and pricing packaging.',
      category: ResourceCategory.sales_playbook,
      url: 'https://docs.omnipriv.com/playbooks/channel-sales-2026.pdf',
      visible_to_tiers: ['Registered', 'Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'OmniPriv Architecture & Zero Trust Technical Whitepaper',
      description: 'Deep-dive technical blueprint for security architects detailing ephemeral credential brokers, micro-segmentation, and zero-standing privilege.',
      category: ResourceCategory.technical_enablement,
      url: 'https://docs.omnipriv.com/technical/zero-trust-architecture.pdf',
      visible_to_tiers: ['Registered', 'Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'OmniPriv vs Legacy PAM (CyberArk, BeyondTrust) Battlecard',
      description: 'Direct comparison matrix highlighting deployment speed, licensing transparency, and cloud-native architecture advantages.',
      category: ResourceCategory.product_collateral,
      url: 'https://docs.omnipriv.com/collateral/battlecard-q1-2026.pdf',
      visible_to_tiers: ['Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'OmniPriv Certified Implementation Engineer (OCIE) Exam Blueprint',
      description: 'Curriculum, hands-on lab prerequisites, and sample questions for partner engineers seeking technical certification.',
      category: ResourceCategory.certification,
      url: 'https://academy.omnipriv.com/certification/ocie-blueprint.pdf',
      visible_to_tiers: ['Registered', 'Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'Partner Co-Marketing Guidelines & Enterprise Brand Kit',
      description: 'Approved logo assets, typography rules, enterprise solution brief templates, and email banner assets for joint campaigns.',
      category: ResourceCategory.marketing_asset,
      url: 'https://assets.omnipriv.com/brand/partner-brand-kit-2026.zip',
      visible_to_tiers: ['Registered', 'Silver', 'Gold', 'Platinum'],
    },
  ];

  for (const item of standardResources) {
    const existing = await prisma.resourceItem.findFirst({
      where: { title: item.title },
    });

    if (!existing) {
      await prisma.resourceItem.create({
        data: item,
      });
      console.log(`[SEED] Created resource: "${item.title}"`);
    }
  }

  console.log('--- OmniPriv Seed Routine Complete ---');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
