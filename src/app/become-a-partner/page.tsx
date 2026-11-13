import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
  Building2,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Award,
  Users2,
  RefreshCw,
  FolderKanban,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PublicFooter, PublicHeader } from '@/components/ui/public-chrome';

export const dynamic = 'force-dynamic';

export default async function BecomeAPartnerPage() {
  const session = await getSession();

  if (session) {
    if (session.role === 'channel_admin') {
      redirect('/channel-admin');
    } else {
      redirect('/partner-portal');
    }
  }

  const programTracks = [
    {
      title: 'Sell OmniPriv',
      subtitle: 'Value-Added Resellers & Distributors',
      description:
        'Deliver modern AI-Powered Privileged Access Management to commercial and enterprise clients. Earn up to 35% margin on registered opportunities with guaranteed pricing protection.',
      icon: TrendingUp,
      badge: 'VAR / Distributor',
      benefits: [
        'Guaranteed 90-day deal price protection',
        'Direct co-selling with OmniPriv enterprise specialists',
        'Tier-based margin discounts & MDF funding',
      ],
    },
    {
      title: 'Deploy OmniPriv',
      subtitle: 'System Integrators & Consultants',
      description:
        'Architect and deploy secure AI agent governance, 53 permission-gated MCP tool controls, brokered VPN-free RDP/SSH gateways, and HMAC-SHA256 hash-chained audit trails.',
      icon: Cpu,
      badge: 'Systems Integrator',
      benefits: [
        'Comprehensive technical architecture blueprints',
        'Direct access to Level 3 Solutions Architects',
        'Professional services & implementation revenue',
      ],
    },
    {
      title: 'Manage OmniPriv',
      subtitle: 'MSPs & MSSPs',
      description:
        'Embed OmniPriv into your managed security services catalog. Deliver automated credential rotation, Just-in-Time (JIT) access, 10-second anomaly auto-block, and signed compliance reports across 42 controls.',
      icon: Layers,
      badge: 'MSP / MSSP',
      benefits: [
        'Multi-tenant management & policy engine',
        'Monthly consumption and flexible seat licensing',
        'Automated compliance reporting across 6 frameworks',
      ],
    },
    {
      title: 'Build / Technology Alliance',
      subtitle: 'ISVs & Technology Partners',
      description:
        'Integrate your identity provider, SIEM, SOAR, cloud platforms, or AI agent toolchains (Anthropic, OpenAI, Okta, Splunk, Kubernetes) with OmniPriv deterministic policy APIs.',
      icon: ShieldCheck,
      badge: 'Alliance Partner',
      benefits: [
        'Bi-directional REST API integrations & webhooks',
        'Joint go-to-market solution briefs & co-branding',
        'OmniPriv Technology Alliance partner directory listing',
      ],
    },
  ];

  const portalCapabilities = [
    {
      title: 'Register Deals',
      description: 'Submit customer opportunities in under 3 minutes. Lock in exclusive pricing and prevent channel conflict.',
      icon: FolderKanban,
    },
    {
      title: 'Track Deal Protection',
      description: 'Transparent review SLAs with live countdown to 90-day margin protection upon OmniPriv channel approval.',
      icon: Shield,
    },
    {
      title: 'Receive Assigned Leads',
      description: 'Get warm, pre-qualified inbound inquiries routed directly from OmniPriv demand-gen campaigns to your queue.',
      icon: Users2,
    },
    {
      title: 'Monitor Renewals',
      description: 'Automated 90-day renewal alerts with contract history, license count tracking, and upsell opportunity alerts.',
      icon: RefreshCw,
    },
    {
      title: 'Access Sales & Technical Resources',
      description: 'Official battlecards, RFP templates, competitive comparisons, architecture blueprints, and certifications.',
      icon: FileText,
    },
    {
      title: 'Manage Your Partner Team',
      description: 'Granular role-based controls for sales reps, pre-sales engineers, and company executives in one portal.',
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-dvh bg-page text-ink-soft flex flex-col">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="op-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="op-glow pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 md:pt-24 md:pb-20 text-center">
          <span className="op-eyebrow">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            <span>AI-Powered PAM &bull; Global Partner Program</span>
          </span>

          <h1 className="op-h1 mt-6 max-w-4xl mx-auto">
            Secure AI access. Control every privileged move with{' '}
            <span className="text-brand-ink">OmniPriv.</span>
          </h1>

          <p className="op-lede mt-6 max-w-3xl mx-auto">
            AI, automation, applications, and human identities are reshaping privileged access. Join the OmniPriv Channel Partner Program to deliver AI-driven controls, Just-in-Time access, isolated 3-level credential vaulting, and complete session visibility.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up" className={buttonVariants({ size: 'lg', className: 'group w-full sm:w-auto' })}>
              <Building2 className="h-5 w-5" />
              <span>Become an OmniPriv Partner</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/sign-in" className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'w-full sm:w-auto' })}>
              Partner Sign In
            </Link>
          </div>

          {/* Metric indicators */}
          <dl className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
            {[
              ['39 Features', 'ML behavioral scoring'],
              ['53 Tools', 'Permission-gated MCP'],
              ['10s Sweep', 'Auto-block grace engine'],
              ['90 Days', 'Guaranteed deal protection'],
            ].map(([value, label]) => (
              <div key={value} className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-[var(--op-card-shadow)]">
                <dt className="font-heading text-xl sm:text-2xl font-bold tracking-[-0.03em] text-ink">{value}</dt>
                <dd className="text-[0.8125rem] text-ink-muted mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Partner Program Tracks Cards */}
      <section className="relative py-16 lg:py-24 bg-surface-muted border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-[0.8125rem] font-semibold text-brand-ink">Partner tracks</p>
            <h2 className="op-h2 mt-2">Tailored programs for every partner business model</h2>
            <p className="op-lede mt-4">
              Whether you resell software, implement AI agent governance, deliver 24/7 managed security, or build integrations, OmniPriv provides dedicated tools, 90-day deal protection, and generous margin bands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {programTracks.map((track) => {
              const Icon = track.icon;
              return (
                <div
                  key={track.title}
                  className="rounded-2xl bg-surface border border-line p-6 flex flex-col justify-between shadow-[var(--op-card-shadow)] transition-[border-color,box-shadow,transform] duration-200 hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(0,110,200,0.35)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <span className="op-icon">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[0.6875rem] font-semibold text-ink-muted bg-surface-muted border border-line px-2 py-0.5 rounded-full">
                        {track.badge}
                      </span>
                    </div>
                    <h3 className="font-heading text-[1.0625rem] font-bold tracking-[-0.015em] text-ink">{track.title}</h3>
                    <div className="text-[0.8125rem] font-semibold text-brand-ink mt-1 mb-3">{track.subtitle}</div>
                    <p className="text-[0.875rem] text-ink-muted leading-relaxed mb-6">{track.description}</p>
                  </div>

                  <ul className="border-t border-line pt-4 space-y-2">
                    {track.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-[0.8125rem] text-ink-soft">
                        <CheckCircle2 className="h-4 w-4 text-brand-ink mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What You Can Do in the Portal */}
      <section className="relative py-16 lg:py-24 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-[0.8125rem] font-semibold text-brand-ink">Partner workspace</p>
          <h2 className="op-h2 mt-2">What you can do in the OmniPriv Partner Portal</h2>
          <p className="op-lede mt-4">
            Modeled after enterprise channel platforms, OmniPriv gives your organization full visibility into opportunities, leads, renewals, and technical enablement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {portalCapabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="group p-6 rounded-2xl bg-surface border border-line shadow-[var(--op-card-shadow)] hover:border-brand/40 transition-colors flex gap-4"
              >
                <span className="op-icon">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-[1rem] font-bold tracking-[-0.015em] text-ink">{cap.title}</h3>
                  <p className="text-[0.875rem] text-ink-muted mt-1.5 leading-relaxed">{cap.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Company Registration CTA Section (Two-Step Wizard Invitation) */}
      <section className="relative pb-16 lg:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="dark op-band-navy relative overflow-hidden rounded-3xl border border-white/[0.08] p-6 sm:p-12">
            <div className="op-glow pointer-events-none absolute inset-0" aria-hidden="true" />

            <div className="relative max-w-2xl">
              <span className="op-eyebrow">Instant company workspace setup</span>
              <h2 className="mt-4 font-heading text-[1.75rem] sm:text-[2.25rem] font-bold leading-[1.1] tracking-[-0.03em] text-white">
                Ready to protect deals and scale PAM revenue?
              </h2>
              <p className="mt-4 text-slate-400 text-[0.9375rem] leading-relaxed">
                Complete our fast 2-step company registration. Your organization account, primary owner credentials, and access to Deal Registration will be activated immediately without waiting for application review.
              </p>

              {/* Steps preview */}
              <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-[#00B8DB] text-[#03121c] text-[0.8125rem] font-bold flex items-center justify-center">1</div>
                  <div>
                    <div className="text-[0.875rem] font-semibold text-white">Company Profile</div>
                    <div className="text-[0.75rem] text-slate-400">Legal entity, partner track &amp; website</div>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06] border border-white/[0.12] text-[#7FE3F2] text-[0.8125rem] font-bold flex items-center justify-center">2</div>
                  <div>
                    <div className="text-[0.875rem] font-semibold text-white">Owner Account</div>
                    <div className="text-[0.75rem] text-slate-400">Work credentials &amp; secure login</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
                <Link href="/sign-up" className={buttonVariants({ size: 'lg', className: 'group w-full sm:w-auto' })}>
                  <span>Begin Company Registration</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link href="/sign-in" className="text-[0.875rem] font-semibold text-slate-300 hover:text-[#7FE3F2] transition-colors text-center sm:text-left">
                  Already registered? Sign in to your portal &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
