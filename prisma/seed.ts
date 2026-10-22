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
      title: 'OmniPriv AI-PAM Enterprise Channel Sales Playbook 2026',
      description: 'Comprehensive guide covering qualification criteria, competitive positioning against legacy vaults (CyberArk, BeyondTrust), and 9-module platform packaging.',
      category: ResourceCategory.sales_playbook,
      url: 'https://docs.omnipriv.com/playbooks/channel-sales-2026.pdf',
      visible_to_tiers: ['Registered', 'Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'OmniPriv AI-PAM Engine Architecture & MCP Tool Governance Blueprint',
      description: 'Deep-dive technical blueprint for security architects detailing 39 behavioral features, 10s auto-block sweep, and 53 permission-gated MCP tool controls.',
      category: ResourceCategory.technical_enablement,
      url: 'https://docs.omnipriv.com/technical/ai-pam-architecture.pdf',
      visible_to_tiers: ['Registered', 'Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'OmniPriv Isolated Vault (KEK/DEK/SEK) & Key Hierarchy Technical Whitepaper',
      description: 'Architectural guide explaining three-level key encryption hierarchy (Key Encryption Key, per-org Data Encryption Key, per-secret Secret Encryption Key) and automatic rotation.',
      category: ResourceCategory.technical_enablement,
      url: 'https://docs.omnipriv.com/technical/three-level-vault-hierarchy.pdf',
      visible_to_tiers: ['Registered', 'Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'OmniPriv vs Legacy PAM (CyberArk, BeyondTrust) Battlecard',
      description: 'Direct comparison matrix highlighting AI-PAM real-time ML detection, MCP agent governance, and stack consolidation advantages.',
      category: ResourceCategory.product_collateral,
      url: 'https://docs.omnipriv.com/collateral/battlecard-q1-2026.pdf',
      visible_to_tiers: ['Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'OmniPriv Certified Implementation Engineer (OCIE) Exam Blueprint',
      description: 'Curriculum, hands-on lab prerequisites, and sample questions for partner engineers seeking technical certification on the 9-module platform.',
      category: ResourceCategory.certification,
      url: 'https://academy.omnipriv.com/certification/ocie-blueprint.pdf',
      visible_to_tiers: ['Registered', 'Silver', 'Gold', 'Platinum'],
    },
    {
      title: 'Partner Co-Marketing Guidelines & Enterprise Brand Kit',
      description: 'Approved logo assets, typography rules, enterprise solution brief templates, and email banner assets for joint AI-PAM campaigns.',
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

  // 3. Seed Courses
  const standardCourses = [
    {
      title: 'OmniPriv AI-PAM Fundamentals & 9 Platform Modules',
      description: 'Master enterprise AI-PAM value drivers, buyer personas, and consolidation of identity security across people, machines, and AI agents.',
      track: 'Sales',
      level: 'Fundamental',
      duration_minutes: 45,
      modules_count: 4,
    },
    {
      title: 'Secure AI Agents & 53 MCP Tools Governance',
      description: 'Learn how OmniPriv governs autonomous AI agent access, prompt-injection guards, and deterministic tool-level authorization.',
      track: 'Presales',
      level: 'Intermediate',
      duration_minutes: 90,
      modules_count: 6,
    },
    {
      title: 'Isolated Credential Vaulting (3-Level KEK/DEK/SEK)',
      description: 'Master three-level key hierarchies, automated credential rotation, and VPN-free brokered RDP/SSH gateways.',
      track: 'Technical',
      level: 'Advanced',
      duration_minutes: 120,
      modules_count: 8,
    },
    {
      title: 'AI Threat Protection: 39 Behavioral Features & 10s Auto-Block',
      description: 'Advanced configuration of machine learning session anomaly detection, impossible travel, and automated 10-second session termination.',
      track: 'Technical',
      level: 'Intermediate',
      duration_minutes: 60,
      modules_count: 5,
    },
  ];

  for (const course of standardCourses) {
    const existing = await prisma.course.findFirst({ where: { title: course.title } });
    if (!existing) {
      await prisma.course.create({ data: course });
      console.log(`[SEED] Created course: "${course.title}"`);
    }
  }

  // 4. Seed Certifications
  const standardCertifications = [
    {
      code: 'OCSP',
      name: 'OmniPriv Certified Sales Professional',
      description: 'Validates commercial expertise in qualifying AI-PAM requirements, ROI articulation, and competitive sales execution against legacy vaults.',
      track: 'Sell',
      level: 'Fundamental',
      validity_months: 24,
    },
    {
      code: 'OCIE',
      name: 'OmniPriv Certified Implementation Engineer',
      description: 'Validates hands-on deployment competence for AI agent security, 3-level key vaults, and deterministic policy enforcement.',
      track: 'Deploy',
      level: 'Advanced',
      validity_months: 24,
    },
    {
      code: 'OCSE',
      name: 'OmniPriv Certified Security Expert',
      description: 'Demonstrates deep mastery of ML behavioral threat detection, HMAC-SHA256 audit chaining, and high-availability clustered deployments.',
      track: 'Manage',
      level: 'Expert',
      validity_months: 24,
    },
  ];

  for (const cert of standardCertifications) {
    const existing = await prisma.certification.findUnique({ where: { code: cert.code } });
    if (!existing) {
      await prisma.certification.create({ data: cert });
      console.log(`[SEED] Created certification: ${cert.code}`);
    }
  }

  // 5. Seed Campaigns
  const standardCampaigns = [
    {
      title: 'Consolidate Legacy PAM into OmniPriv AI-PAM Q1 2026',
      summary: 'Turnkey demand-gen package targeting CISOs running antiquated, fragmented vaults and unmonitored AI agents.',
      related_product: 'OmniPriv AI-PAM Enterprise Platform',
      target_audience: 'CISOs, VPs of Infrastructure, Security Operations Directors',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-06-30'),
      status: 'active',
      assets_url: 'https://assets.omnipriv.com/campaigns/legacy-vault-replacement.zip',
      email_copy: 'Subject: Eliminating PAM complexity and 6-figure maintenance renewals in 2026',
      social_copy: 'Is your legacy credential vault slowing down your cloud migration? Discover how OmniPriv delivers AI-powered PAM in weeks.',
    },
    {
      title: 'Secure AI Agents & Autonomous Workflows Campaign',
      summary: 'Target enterprise DevOps, Security, and Engineering leaders deploying AI agents without privileged governance.',
      related_product: 'OmniPriv Secure AI Agents',
      target_audience: 'Head of AI, CISO, Lead Platform Architect',
      start_date: new Date('2026-02-01'),
      end_date: new Date('2026-08-31'),
      status: 'active',
      assets_url: 'https://assets.omnipriv.com/campaigns/ai-agent-governance.zip',
      email_copy: 'Subject: Governing autonomous AI agents with 53 permission-gated MCP tools',
      social_copy: 'AI agents making unmonitored tool calls? OmniPriv delivers prompt-injection guards and deterministic tool-level authorization.',
    },
  ];

  for (const camp of standardCampaigns) {
    const existing = await prisma.campaign.findFirst({ where: { title: camp.title } });
    if (!existing) {
      await prisma.campaign.create({ data: camp });
      console.log(`[SEED] Created campaign: "${camp.title}"`);
    }
  }

  // 6. Seed Events & Webinars
  const standardEvents = [
    {
      title: 'Quarterly Global Partner Briefing: AI-PAM Engine Roadmap & Incentives',
      event_type: 'partner_briefing',
      description: 'Exclusive executive briefing with OmniPriv Product Leadership on MCP agent security and 2026 partner incentives.',
      starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 days
      duration_minutes: 60,
      timezone: 'UTC',
      product_area: 'AI-PAM Engine & Agent Security',
      meeting_link: 'https://webinar.omnipriv.com/briefing-q1-2026',
    },
    {
      title: 'Hands-on Technical Lab: Deploying 53 MCP Tool Guards & VPN-Free Access',
      event_type: 'technical_workshop',
      description: 'Live interactive technical workshop configuring AI-PAM session brokers and deterministic policy engines.',
      starts_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // In 14 days
      duration_minutes: 90,
      timezone: 'UTC',
      product_area: 'Secure AI Agents & MCP Gateway',
      meeting_link: 'https://webinar.omnipriv.com/lab-mcp-governance',
    },
  ];

  for (const ev of standardEvents) {
    const existing = await prisma.event.findFirst({ where: { title: ev.title } });
    if (!existing) {
      await prisma.event.create({ data: ev });
      console.log(`[SEED] Created event: "${ev.title}"`);
    }
  }

  // 7. Seed Announcements
  const standardAnnouncements = [
    {
      title: 'OmniPriv 2026 Partner Deal Protection Rules Updated',
      content: 'All verified deal registrations now receive a guaranteed 90-day price lock and exclusive margin reservation upon Channel Admin review.',
      priority: 'important',
      published_at: new Date(),
    },
    {
      title: 'New Zero-Trust Cloud Workload Integrations Released',
      content: 'OmniPriv has introduced native integrations for AWS IAM Identity Center and Azure Entra Privileged Identity Management.',
      priority: 'normal',
      published_at: new Date(),
    },
  ];

  for (const ann of standardAnnouncements) {
    const existing = await prisma.announcement.findFirst({ where: { title: ann.title } });
    if (!existing) {
      await prisma.announcement.create({ data: ann });
      console.log(`[SEED] Created announcement: "${ann.title}"`);
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
