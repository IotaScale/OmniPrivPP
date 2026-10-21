import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
  Building2,
  Lock,
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
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        'Deliver market-leading Privileged Access Management to commercial and enterprise clients. Earn up to 35% margin on registered deals with guaranteed pricing protection.',
      icon: TrendingUp,
      badge: 'VAR / Distributor',
      benefits: [
        'Guaranteed 90-day deal protection',
        'Direct co-selling with OmniPriv enterprise reps',
        'Tier-based margin discounts & incentives',
      ],
    },
    {
      title: 'Deploy OmniPriv',
      subtitle: 'System Integrators & Consultants',
      description:
        'Architect and deploy Zero-Trust privileged access, just-in-time credentialing, and session recording into complex multi-cloud and on-premise hybrid environments.',
      icon: Cpu,
      badge: 'Systems Integrator',
      benefits: [
        'Comprehensive technical implementation guides',
        'Direct access to Level 3 Solution Architects',
        'Professional services revenue enablement',
      ],
    },
    {
      title: 'Manage OmniPriv',
      subtitle: 'MSPs & MSSPs',
      description:
        'Embed OmniPriv multi-tenant PAM into your managed security service catalog. Offer credential rotation, vaulting, and compliance audit services as a monthly recurring model.',
      icon: Layers,
      badge: 'MSP / MSSP',
      benefits: [
        'Multi-tenant management architecture',
        'Monthly consumption and flexible licensing',
        'White-labeled client compliance reporting',
      ],
    },
    {
      title: 'Build / Technology Alliance',
      subtitle: 'ISVs & Technology Partners',
      description:
        'Integrate your identity provider, SIEM, SOAR, or cloud workload protection platforms with OmniPriv secure REST APIs and event stream webhooks.',
      icon: ShieldCheck,
      badge: 'Alliance Partner',
      benefits: [
        'Bi-directional API integrations & SDKs',
        'Joint go-to-market solution briefs',
        'Technology alliance marketplace listing',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-[130px] rounded-full" />
        <div className="absolute top-[800px] right-0 w-[600px] h-[500px] bg-cyan-600/5 blur-[150px] rounded-full" />
      </div>

      {/* Top Enterprise Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white flex items-center gap-2">
                OmniPriv <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Partner Program</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-sm font-medium">
                Partner Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="primary" size="sm" className="gap-1.5 text-sm font-medium shadow-sm shadow-cyan-950">
                <span>Become a Partner</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
          <Award className="h-3.5 w-3.5 text-cyan-400" />
          <span>OmniPriv Global Channel Partner Ecosystem</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Grow your privileged-access business with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-200 to-blue-400">
            OmniPriv
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Value-added resellers, system integrators, MSPs/MSSPs, and technology alliance partners use the OmniPriv Partner Portal to register customer opportunities, secure guaranteed margin protection, work assigned demand-gen leads, and scale enterprise Zero-Trust deployments.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 px-8 py-3.5 text-base font-semibold shadow-lg shadow-cyan-950/60">
              <Building2 className="h-5 w-5" />
              <span>Become an OmniPriv Partner</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-base text-slate-200 border-slate-700 hover:bg-slate-900">
              <span>Partner Sign In</span>
            </Button>
          </Link>
        </div>

        {/* Metric indicators */}
        <div className="mt-16 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/70">
            <div className="text-2xl font-bold text-white font-mono">90 Days</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Deal Price Protection</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/70">
            <div className="text-2xl font-bold text-white font-mono">&lt; 48 Hours</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Deal Review SLA</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/70">
            <div className="text-2xl font-bold text-white font-mono">100% Direct</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Partner Attribution</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/70">
            <div className="text-2xl font-bold text-white font-mono">Tier-Based</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Margin & MDF Support</div>
          </div>
        </div>
      </section>

      {/* Partner Program Tracks Cards */}
      <section className="relative py-20 bg-slate-900/50 border-y border-slate-800/80 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Partner Tracks</h2>
            <p className="mt-2 text-3xl font-bold text-white tracking-tight">
              Tailored Programs for Every Partner Business Model
            </p>
            <p className="mt-3 text-slate-400 text-sm">
              Whether you resell software, implement Zero-Trust architectures, deliver 24/7 managed security, or build integrations, OmniPriv provides dedicated tools and margin protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programTracks.map((track) => {
              const Icon = track.icon;
              return (
                <div
                  key={track.title}
                  className="rounded-xl bg-slate-950/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {track.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{track.title}</h3>
                    <div className="text-xs font-medium text-cyan-400/90 mb-3">{track.subtitle}</div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">{track.description}</p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 space-y-2">
                    {track.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What You Can Do in the Portal */}
      <section className="relative py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Partner Workspace</h2>
          <p className="mt-2 text-3xl font-bold text-white tracking-tight">
            What You Can Do in the OmniPriv Partner Portal
          </p>
          <p className="mt-3 text-slate-400 text-sm">
            Modeled after enterprise channel platforms, OmniPriv gives your organization full visibility into opportunities, leads, renewals, and technical enablement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portalCapabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700 transition-all flex gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">{cap.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cap.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Company Registration CTA Section (Two-Step Wizard Invitation) */}
      <section className="relative py-16 bg-gradient-to-b from-slate-900/60 to-slate-950 border-t border-slate-800/80 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-4">
                <span>Instant Company Workspace Setup</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Ready to protect deals and scale PAM revenue?
              </h2>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Complete our fast 2-step company registration. Your organization account, primary owner credentials, and access to Deal Registration will be activated immediately without waiting for application review.
              </p>

              {/* Steps preview */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">1</div>
                  <div>
                    <div className="text-xs font-semibold text-white">Company Profile</div>
                    <div className="text-[11px] text-slate-400">Legal entity, partner track & website</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">2</div>
                  <div>
                    <div className="text-xs font-semibold text-white">Owner Account</div>
                    <div className="text-[11px] text-slate-400">Work credentials & secure login</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 text-sm font-semibold px-6 shadow-md shadow-cyan-950">
                    <span>Begin Company Registration</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
                  Already registered? Sign in to your portal &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 relative z-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400 font-medium">OmniPriv Channel Partner Portal</span>
            <span>&copy; {new Date().getFullYear()} OmniPriv Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/become-a-partner" className="hover:text-slate-300">Partner Program</Link>
            <Link href="/sign-in" className="hover:text-slate-300">Portal Login</Link>
            <Link href="/channel-admin/login" className="hover:text-slate-300">Channel Admin Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
