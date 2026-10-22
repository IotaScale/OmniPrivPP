import React from 'react';
import Link from 'next/link';
import { requirePartnerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { CheckSquare, CheckCircle2, Circle, ArrowRight, BookOpen, FileSpreadsheet, Award, Users2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function PartnerOnboardingPage() {
  const session = await requirePartnerSession();
  const orgId = session.partnerOrgId!;

  // Query live counts to dynamically evaluate completion milestones
  const [dealCount, resourceCount, teamCount, org] = await Promise.all([
    prisma.dealRegistration.count({ where: { partner_organization_id: orgId } }),
    prisma.resourceItem.count({ where: { is_published: true } }),
    prisma.partnerMembership.count({ where: { partner_organization_id: orgId } }),
    prisma.partnerOrganization.findUnique({
      where: { id: orgId },
      select: { tier: true, legal_name: true, partner_manager_name: true },
    }),
  ]);

  const onboardingSteps = [
    {
      id: 1,
      title: 'Welcome to OmniPriv & Partner Workspace Provisioned',
      description: 'Your organization account, starting tier, and partner owner credentials are now active.',
      completed: true,
      href: '/partner-portal',
      cta: 'View Dashboard',
    },
    {
      id: 2,
      title: 'Partner Program Benefits & Margin Protection Policy',
      description: 'Review 90-day deal price protection, tier progression requirements, and partner tracks.',
      completed: true,
      href: '/become-a-partner',
      cta: 'Review Benefits',
    },
    {
      id: 3,
      title: 'OmniPriv AI-PAM Engine & 9 Platform Modules',
      description: 'Understand AI-PAM real-time ML scoring (39 features), 53 permission-gated MCP tools, and 3-level key vaulting (KEK/DEK/SEK).',
      completed: true,
      href: '/partner-portal/resources',
      cta: 'Explore Whitepapers',
    },
    {
      id: 4,
      title: 'Submit Your First Deal Registration',
      description: 'Register a prospective customer opportunity to lock in price protection and prevent conflict.',
      completed: dealCount > 0,
      href: '/partner-portal/deals/new',
      cta: dealCount > 0 ? 'Deal Registered' : 'Register a Deal',
    },
    {
      id: 5,
      title: 'Sales Enablement & Competitive Battlecards',
      description: 'Access the 2026 Channel Sales Playbook and CyberArk/BeyondTrust comparison battlecards.',
      completed: true,
      href: '/partner-portal/resources?category=sales_playbook',
      cta: 'Browse Sales Playbooks',
    },
    {
      id: 6,
      title: 'Technical Enablement & AI Agent Security Deployment',
      description: 'Study deployment blueprints for VPN-free RDP/SSH gateways, prompt-injection guards, and 10s auto-block anomaly rules.',
      completed: true,
      href: '/partner-portal/resources?category=technical_enablement',
      cta: 'Read Tech Guides',
    },
    {
      id: 7,
      title: 'Marketing Resources & Demand Generation Kit',
      description: 'Download approved OmniPriv co-marketing assets, email templates, and brand kits.',
      completed: true,
      href: '/partner-portal/campaigns',
      cta: 'View Campaigns',
    },
    {
      id: 8,
      title: 'Invite Your Team & Manage Organization Access',
      description: 'Add sales reps, pre-sales engineers, and operations managers to your company account.',
      completed: teamCount > 1,
      href: '/partner-portal/team',
      cta: teamCount > 1 ? `${teamCount} Members Active` : 'Invite Colleague',
    },
    {
      id: 9,
      title: 'Assessment & Program Completion Certificate',
      description: 'Verify your partner technical and commercial readiness to advance to Silver tier.',
      completed: dealCount > 0 && teamCount > 1,
      href: '/partner-portal/certifications',
      cta: 'View Certifications',
    },
  ];

  const completedCount = onboardingSteps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / onboardingSteps.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <CheckSquare className="h-6 w-6 text-cyan-400" />
          <span>Partner Onboarding Checklist</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Follow this 9-step guided checklist to ensure your company takes full advantage of OmniPriv Deal Protection, enablement, and channel incentives.
        </p>
      </div>

      {/* Progress Card */}
      <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Overall Onboarding Readiness</span>
          <span className="font-mono text-cyan-400 font-bold">{completedCount} of 9 Completed ({progressPercent}%)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Steps */}
      <div className="space-y-3">
        {onboardingSteps.map((step) => (
          <div
            key={step.id}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              step.completed
                ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/80 border-slate-800/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold font-mono">
                    {step.id}
                  </div>
                )}
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${step.completed ? 'text-white' : 'text-slate-300'}`}>
                  {step.id}. {step.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>

            <div className="sm:shrink-0 self-end sm:self-center">
              <Link href={step.href}>
                <Button
                  variant={step.completed ? 'ghost' : 'outline'}
                  size="sm"
                  className="text-xs gap-1.5"
                >
                  <span>{step.cta}</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
