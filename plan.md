# OmniPriv Channel Partner Portal — Master Architecture & Implementation Plan

This document tracks all completed phases, schema models, route implementations, security boundaries, testing, and operational status for the production-grade standalone OmniPriv Channel Partner Portal.

---

## 1. Architecture & Stack Overview

- **Framework**: Next.js 16 (App Router, Server Components & Server Actions, Turbopack)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (v16/18)
- **ORM**: Prisma ORM with native PostgreSQL migrations & schema synchronization
- **Authentication**: Secure HTTP-only cookie sessions with Jose signed JWTs and Argon2id password hashing
- **Styling**: Tailwind CSS (dark navy/graphite foundation, restrained blue and cyan accents, accessible contrast)
- **Validation**: Zod + React Hook Form
- **Testing**: Vitest for unit & multi-tenant integration flows (23/23 tests passing)
- **Target Repository**: `https://github.com/IotaScale/OmniPrivPP`

---

## 2. Implementation Phases Status

| Phase | Description | Status | Verification / Notes |
|-------|-------------|--------|----------------------|
| **Phase 1** | Repository setup, Docker Compose, `.env.example`, `plan.md`, `AGENTS.md`, `README.md` | Completed | Docker compose, env templates, and agent rules active |
| **Phase 2** | PostgreSQL schema (`prisma/schema.prisma`), Prisma Client, idempotent seed (`prisma/seed.ts`) | Completed | 24 relational models with indexes, foreign keys & comprehensive seed routine |
| **Phase 3** | Authentication & sessions: Argon2id hashing, secure cookies, `/partners/register`, `/sign-in`, Channel Admin seed | Completed | Auto-provisioning transaction & instant workspace access with zero application waiting gates |
| **Phase 4** | RBAC middleware & route protection (`partner_owner`, `partner_member`, `channel_admin`), in-app 403 screen | Completed | Server-side boundary enforcement & in-app 403 screen |
| **Phase 5** | Partner layout & workspace shell (topbar, navigation, active organization context) | Completed | Exclusively scoped to authenticated organization with 4 major navigation categories |
| **Phase 6** | Partner Overview dashboard (`/partner-portal`) with real PostgreSQL data & purposeful empty states | Completed | Zero fake charts, live DB queries, announcements, assigned Partner Manager & quick actions |
| **Phase 7** | Deal registration 3-step wizard (`/partner-portal/deals/new`) + domain normalization & conflict detection | Completed | Submits into `awaiting_approval` with audit & admin notification |
| **Phase 8** | Deal list (`/partner-portal/deals`) & detail view (`/partner-portal/deals/[id]`) with status timeline | Completed | Multi-tenant isolated, status badge & next step guidance |
| **Phase 9** | Channel Admin console (`/channel-admin/*`) deal approval, 90-day protection & domain conflict arbitration | Completed | Approval grants exactly 90-day protection window, conflict arbitration queue |
| **Phase 10** | Lead operations: Inbound leads, assignment to partners, 7-day SLA deadline, partner accept/decline/convert | Completed | CSV import, SLA countdown calculations, lead-to-deal conversion |
| **Phase 11** | Renewals (`/partner-portal/renewals`), Resources (`/partner-portal/resources`), Company & Team management | Completed | Last-owner removal protection & tier-restricted collateral |
| **Phase 12** | Commercial Requests (`/partner-portal/commercial-requests`): PoC, Customer Trial, NFR lab license, Quote | Completed | Multi-request workflow with admin fulfillment queue (`/channel-admin/commercial-requests`) |
| **Phase 13** | Enablement Suite: Onboarding 9-step checklist, Learning catalog & progress, Certifications tracking | Completed | Database-backed completions, course enrollment action, admin course manager |
| **Phase 14** | Marketing & Channel Growth: Co-Marketing Campaigns, Events & Webinars registration | Completed | Database-driven asset bundles, webinar RSVP, admin campaign & event managers |
| **Phase 15** | Joint Business Plans (`/partner-portal/joint-business-plan` & `/channel-admin/jbp`) | Completed | Annual target setting, quarterly milestones, notes, admin review & status lifecycle |
| **Phase 16** | Legal & Directory: Terms & Policies (`/partner-portal/terms`), Public Partner Locator (`/find-a-partner`) | Completed | Partner opt-in/edit (`/partner-portal/locator-profile`), admin approval requirement |
| **Phase 17** | Channel Admin Governance: Partner detail (`/channel-admin/partners/[partnerId]`), Programs & Audit Log | Completed | Tier upgrade, Partner Manager assignment, tier criteria & forensic audit viewer |
| **Phase 18** | Unit tests (Vitest), Next.js 16 production build verification & handoff | Completed | 23/23 tests pass, Next.js 16 build compiles all 48 routes with 0 errors |
| **Phase 19** | Local PostgreSQL connection: Windows PostgreSQL 18 service (`D:\Program Files\PostgreSQL\18`), `omnipriv_partner` database, `omnipriv` role, `.env` DATABASE_URL, initial migration + seed applied | Completed | 12 tables in public schema; `psql` connection verified; seed created Channel Admin + enablement resources |
| **Phase 20** | Supabase Cloud PostgreSQL Migration & Project Link (`nyciurohneqvijropvwf`): Configured IPv4 transaction pooler (port 6543) and session pooler (port 5432), synchronized 27 Prisma models/enums, seeded Channel Admin and playbooks, linked Supabase CLI project, verified 23/23 tests | Completed | Live cloud database synchronized via Prisma (`directUrl` + pooled `DATABASE_URL`); 23/23 test suite passing; 48 Next.js routes built |
| **Phase 21** | Light/dark theme system (dark default) with a global client toggle | Completed | `ThemeProvider` + `ThemeToggle`; `.dark` class strategy with flash-free head script; Tailwind v4 palette remap flips the dark-first UI; toggle placed in Partner Portal header and Channel Admin header (before Sign Out) |
| **Phase 22** | Partner Portal UI/UX Elevation (Typography, Solid Surfaces, Emil Kowalski Motion) | Completed | Inter font integration via `next/font/google`, complete removal of muddy gradients, solid matte dark surfaces, Emil Kowalski button press physics (`scale(0.97)`), 3-step wizard & dashboard visual refinement; 23/23 tests passing & 49 routes built |
| **Phase 23** | Cross-Portal Support Incident Integration, CSS Syntax Fix & SSO Session Resolution | Completed | Fixed `CssSyntaxError` on Turbopack in `support-portal/src/app/globals.css`, prioritized Channel Admin session resolution across both portals, reset ticket status to `open`, added explicit confirmation dialogs before ticket resolution, dynamic portal URLs; both Next.js 16 builds passing cleanly |
| **Phase 24** | Modern Toast Notification System & In-App Confirmation Modals | Completed | Replaced raw browser `window.confirm` with custom dark glassmorphic confirmation dialogs for ticket resolution and closure; built lightweight hydration-safe `Toaster` component with `useToast()` hook across both portals; removed stale footer database text; both builds and 23/23 tests passing |
| **Phase 25** | Support Portal: Role-Based User Experience, Permissions & Ticket Management | Completed | Complete role-based separation: dedicated Partner Dashboard (`/dashboard`), Channel Admin Operations Console, distinct navigation bars, scoped ticket workspaces, dual-mode composer (`Public Reply` vs `🔒 Internal Staff Note`), server-side RBAC & tenant boundaries, priority controller, and zero data leakage |
| **Phase 26** | OmniPrive Organization License Management & Verification API (`/channel-admin/licenses`, `/api/licenses/verify`) | Completed | Added `ProductLicense` table (`product_licenses`) in Supabase, Channel Admin UI to generate/renew/revoke license keys bound to OmniPrive `org_id`, and authenticated `POST /api/licenses/verify` endpoint for OmniPrive's daily midnight cron |
| **Phase 27** | RBAC gaps: partner-visible licenses, admin Support console SSO, live access checks, data-isolation audit | Completed (migration not yet applied) | Sign-up keeps instant activation (org `active`, no review gate). `requirePartnerSession` re-reads membership, user `is_active` and org status from the DB on every request; suspended orgs / removed or deactivated users only reach `/partner-portal/account-status`. `ProductLicense.partner_organization_id` + `/partner-portal/licenses` (masked keys, owner-only audited copy); admin `Support console` -> `/api/support-sso`. Apply `scripts/sql/license_partner_link.sql` (same as `prisma/migrations/20261113120000_license_partner_link`, additive column + index + FK only) before deploying. Destructive integration test now opt-in via `RUN_DB_INTEGRATION_TESTS=1`. |
| **Phase 28** | Deal review: live duplicate & conflict matching | Completed (no schema change) | Pure matcher `src/lib/utils/deal-matching.ts` (same domain, related/sub-domain incl. naive 2-part suffixes, similar company name after legal-suffix stripping, contact email domain; duplicate = same partner, conflict = other partner; blocking = approved with active protection or closed-won <90 days on same/related domain) with unit tests. `findDealMatches` / `findMatchesForDeals` in `src/lib/utils/domain.ts` (candidates: pending, protected, won <90d; cap 2000). Submission flags new deal and matching pending deals (`conflict_detected` / `conflict_reason`, audit `deal.conflict_flagged`). Admin deals table badges + 'Needs attention' filter, drawer 'Possible duplicates & conflicts' panel, `deal-conflicts` page groups live pairs side by side. `approveDealAction` re-checks; blocking matches need `override=true` + decision reason (audit `deal.approval_override`). `declineDealAsDuplicateAction`. Partners see a neutral 'possible overlap' note (only their own references are named). |

---

## 3. Database Schema Models (PostgreSQL Source of Truth)

- [x] `User`: id, email (unique), password_hash, full_name, email_verified_at, is_active, timestamps
- [x] `PartnerOrganization`: id, legal_name, display_name, website, country, region, partner_type, market_vertical, company_summary, tier (Registered/Silver/Gold/Platinum), status, partner_manager_name, partner_manager_email, timestamps
- [x] `PartnerMembership`: id, user_id, partner_organization_id, role (partner_owner/partner_member), joined_at, timestamps
- [x] `DealRegistration`: id, public_reference (OPR-YYYY-XXXXXX), partner_organization_id, submitted_by_user_id, customer_legal_name, customer_domain, customer_country, customer_industry, customer_contact_name, customer_contact_email, customer_contact_phone, product_interest, deployment_type, estimated_arr, estimated_deal_value, currency, expected_seat_count, expected_close_date, deployment_timeline, opportunity_source, partner_notes, status, conflict_detected, conflict_reason, reviewed_by_user_id, reviewed_at, admin_decision_reason, protection_starts_at, protection_expires_at, closed_at, timestamps
- [x] `DealStatusHistory`: id, deal_registration_id, previous_status, new_status, changed_by_user_id, note, created_at
- [x] `Lead`: id, public_reference, customer_name, customer_domain, contact_first_name, contact_last_name, contact_email, contact_phone, company, country, region, industry, lead_source, product_interest, estimated_seat_count, customer_comment, internal_notes, status, timestamps
- [x] `LeadAssignment`: id, lead_id, partner_organization_id, assigned_by_user_id, assigned_at, acceptance_deadline_at, partner_acceptance_status, accepted_at, declined_at, decline_reason, current_status, converted_deal_registration_id, timestamps
- [x] `Renewal`: id, partner_organization_id, customer_name, product_plan, contracted_capacity, renewal_date, contract_value, currency, commercial_status, timestamps
- [x] `ResourceItem`: id, title, description, category, url, visible_to_tiers, is_published, timestamps
- [x] `AuditEvent`: id, actor_user_id, partner_organization_id, entity_type, entity_id, event_type, before_data, after_data, metadata, ip_address, created_at
- [x] `Notification`: id, user_id, partner_organization_id, title, message, link, is_read, type, created_at
- [x] `CommercialRequest`: id, public_reference, partner_organization_id, requested_by_user_id, request_type (poc, customer_trial, nfr_license, quote_request, license_expansion, order_support), customer_name, customer_domain, seats_requested, notes, status (submitted, in_review, approved, rejected, fulfilled), admin_notes, fulfilled_at, timestamps
- [x] `Course`: id, title, slug, track (sales, presales, technical), level (beginner, intermediate, advanced), duration_minutes, description, modules_count, is_published, timestamps
- [x] `CourseEnrollment`: id, course_id, user_id, partner_organization_id, status (enrolled, in_progress, completed), progress_percent, completed_at, timestamps
- [x] `Certification`: id, name, code, track, validity_months, description, timestamps
- [x] `PartnerCertification`: id, certification_id, user_id, partner_organization_id, certificate_number, issued_at, expires_at, status, timestamps
- [x] `Campaign`: id, title, code, summary, product, target_audience, start_date, end_date, status, asset_count, downloadable_assets, timestamps
- [x] `Event`: id, title, event_type (webinar, hands_on_lab, partner_briefing, executive_summit), description, start_time, duration_minutes, timezone, product_area, recording_url, status, timestamps
- [x] `EventRegistration`: id, event_id, user_id, partner_organization_id, registered_at, attended
- [x] `JointBusinessPlan`: id, partner_organization_id, year, growth_goals, revenue_target, pipeline_target, focus_products, target_industries, key_accounts, technical_plan, marketing_plan, q1_milestones, q2_milestones, q3_milestones, q4_milestones, status (draft, submitted, under_review, changes_requested, approved, archived), admin_feedback, timestamps
- [x] `TermsAcceptance`: id, user_id, partner_organization_id, terms_type, version, ip_address, accepted_at
- [x] `PartnerLocatorProfile`: id, partner_organization_id (unique), is_published, opt_in, public_company_name, public_website, country, city, partner_type, tiers, certified_engineers_count, specializations, overview, reviewed_by_user_id, reviewed_at, timestamps
- [x] `Announcement`: id, title, summary, category, is_active, pinned, published_at, timestamps

---

## 4. Complete Route Map & Authorization Matrix

### Public Routes
| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Home redirect to portal or program landing |
| `/partners` | Public | Branded Partner Program landing page |
| `/partners/register` | Public | Enterprise partner company registration wizard |
| `/become-a-partner` | Public | Program overview & value proposition |
| `/sign-in` | Public / Guest | Partner authentication with Argon2id |
| `/sign-up` | Public / Guest | Registration alternative |
| `/forgot-password` | Public | Self-service password recovery initiation |
| `/reset-password` | Public | Secure tokenized password reset |
| `/verify-email` | Public | Instant email verification confirmation |
| `/find-a-partner` | Public | Searchable OmniPriv Certified Partner Directory |

### Authenticated Partner Workspace (`/partner-portal/*`)
*Strictly scoped by authenticated session `partner_organization_id`.*

| Route | Minimum Role | Module Description |
|-------|--------------|--------------------|
| `/partner-portal` | `partner_member` | Live KPI cards, SLA alerts, announcements, Partner Manager, quick actions |
| `/partner-portal/deals` | `partner_member` | Deal registrations list, search, filters, pagination, protection warnings |
| `/partner-portal/deals/new` | `partner_member` | 3-step opportunity wizard with real-time domain conflict engine |
| `/partner-portal/deals/[id]` | `partner_member` | Opportunity details, immutable status timeline & history, admin feedback |
| `/partner-portal/leads` | `partner_member` | Vendor-assigned leads list, 7-day SLA countdown badge |
| `/partner-portal/leads/[id]` | `partner_member` | Lead detail, accept/decline actions, prefilled Deal Registration conversion |
| `/partner-portal/renewals` | `partner_member` | Commercial renewals list, expiry countdown, assistance requests |
| `/partner-portal/commercial-requests` | `partner_member` | Commercial requests list (PoC, Trials, NFR lab license, Quotes) |
| `/partner-portal/commercial-requests/new` | `partner_member` | Request submission form with customer & seat parameters |
| `/partner-portal/resources` | `partner_member` | Searchable sales battlecards, technical datasheets, brand guides |
| `/partner-portal/onboarding` | `partner_member` | 9-step guided enablement checklist with completion tracker |
| `/partner-portal/learning` | `partner_member` | Role-based training catalog (Sales, Presales, Technical) with instant enrollment |
| `/partner-portal/certifications` | `partner_member` | Active, expiring & expired certifications with renewal instructions |
| `/partner-portal/joint-business-plan` | `partner_member` | Annual growth targets, quarterly milestones, submission to Partner Manager |
| `/partner-portal/campaigns` | `partner_member` | Co-marketing campaign packs, email templates, social copy |
| `/partner-portal/events` | `partner_member` | Technical webinars & lab schedule with 1-click RSVP |
| `/partner-portal/company` | `partner_member` | Company profile, business vertical, legal location |
| `/partner-portal/team` | `partner_owner` | Team invitations, role assignments, last-owner removal protection |
| `/partner-portal/terms` | `partner_member` | Legal agreements, partner code of conduct, and accepted policy versions |
| `/partner-portal/locator-profile` | `partner_owner` | Public directory profile editor, specializations, opt-in moderation request |

### Internal Channel Admin Console (`/channel-admin/*`)
*Strictly restricted to `channel_admin` role. Returns in-app `403 Access Denied` to partners.*

| Route | Role | Governance Capability |
|-------|------|----------------------|
| `/channel-admin/login` | Public / Admin | Admin portal login |
| `/channel-admin/access-denied` | Any | In-app 403 Security Boundary UI |
| `/channel-admin` | `channel_admin` | Cross-partner operational KPIs, pipeline value, SLA risk queue |
| `/channel-admin/partners` | `channel_admin` | Global partner directory, status filtering, tier breakdown |
| `/channel-admin/partners/[partnerId]` | `channel_admin` | Partner tier promotion, Partner Manager assignment, audit history |
| `/channel-admin/deals` | `channel_admin` | Deal approval queue, 90-day protection assignment, term extensions |
| `/channel-admin/deal-conflicts` | `channel_admin` | Customer domain conflict arbitration, evidence review, claim ruling |
| `/channel-admin/leads` | `channel_admin` | Inbound lead creation, CSV batch import, multi-partner routing |
| `/channel-admin/renewals` | `channel_admin` | Commercial renewal tracking across partner network |
| `/channel-admin/commercial-requests` | `channel_admin` | Review, approve, reject, or fulfill PoC/Trial/NFR requests |
| `/channel-admin/programs` | `channel_admin` | Program tiers, margin schedules, and track criteria |
| `/channel-admin/resources` | `channel_admin` | Enablement asset publishing and tier visibility settings |
| `/channel-admin/learning` | `channel_admin` | Curriculum management and course authoring |
| `/channel-admin/campaigns` | `channel_admin` | Co-marketing campaign creator and pack distributor |
| `/channel-admin/events` | `channel_admin` | Partner event and webinar scheduler |
| `/channel-admin/jbp` | `channel_admin` | Partner Joint Business Plan review and feedback queue |
| `/channel-admin/audit-log` | `channel_admin` | Immutable security audit trail with actor and entity tracking |

---

## 5. Security & Isolation Verification

1. **Zero Mock Data in Production**: All dashboards, lists, and metrics directly query PostgreSQL via Prisma.
2. **Multi-Tenant Server Isolation**: Every partner query strictly derives `partner_organization_id` from the trusted authenticated session.
3. **Hard PAM Separation**: The portal contains zero access paths to customer PAM tenants, vaults, credentials, privileged sessions, session recordings, or HSM encryption keys.
4. **Channel Admin Boundary**: Any partner accessing `/channel-admin/*` is immediately blocked by server-side session checks and redirected to `/channel-admin/access-denied` (in-app 403 UI).
5. **Argon2id Hashing**: Password hashing uses Argon2id with salt generation.
6. **Immutable Audit Events**: All critical state changes (registration, approval, decline, extension, conflict resolution, lead conversion, request fulfillment) append an immutable `AuditEvent`.

---

## 6. Test Suite & Verification Results

- **Unit & Integration Suite (`npm test`)**:
  - `domain.test.ts`: FQDN parsing, subdomain stripping, protocol normalization (6/6 passing)
  - `sla-and-protection.test.ts`: 90-day protection date calculation & 7-day lead SLA (4/4 passing)
  - `rbac-and-transitions.test.ts`: Permission evaluation, boundary enforcement & deal transitions (8/8 passing)
  - `flows.test.ts`: Complete database integration flows covering registration, deal creation, conflict detection, approval, 90-day protection, multi-tenant isolation, and lead conversion (5/5 passing)
  - **Result**: 23/23 tests passing in < 1 second.
- **Production Build (`npm run build`)**:
  - Next.js 16.4.2 (Turbopack)
  - Zero TypeScript errors (`Finished TypeScript in 5.2s`)
  - All 48 routes compiled successfully.

---

## 7. Official OmniPriv Visual Branding & UI Polish Pass

### Reference Assets Source (`Webomnipriv`)
- **Logo**: Extracted vector `omnipriv-logo.svg` (200x50 SVG containing the official gradient shield `#00D4FF` to `#0099CC` and bold OmniPriv logotype).
- **Favicon & App Icons**: Copied `icon.svg`, `favicon.ico`, `favicon-16x16.png`, and `apple-touch-icon.png` into `public/` and `src/app/`.
- **Color Palette & Theme Tokens**:
  - Primary Cyan: `#00b8ff` / `#00d4ff`
  - Space Navy Dark Background: `#030711`
  - Surface Background: `#0a1628`
  - Elevated Background: `#0d1e36`
  - Navy Border: `#133052`
  - Brand Glows: Atmospheric cyan ambient gradients with `prefers-reduced-motion` compliance.

### Implemented Enhancements
1. **Centralized Vector Logo (`OmniPrivLogo`)**:
   - Replaced all ad-hoc shield icons and plain text headers across Partner Portal, Channel Admin, Sign-in, Sign-up, Forgot/Reset Password, Verify Email, Find a Partner, 403 Access Denied, and Home page.
   - Built with crisp responsive scaling (`variant="partner"`, `"admin"`, `"icon"`, `"full"`).
2. **Metadata & Favicon Setup**:
   - Updated `src/app/layout.tsx` metadata with official favicon icons, Apple touch icons, and accurate enterprise PAM channel platform descriptions.
3. **CSS Design Tokens**:
   - Centralized OmniPriv tokens in `src/app/globals.css` with atmospheric page gradients, subtle border utilities, and reduced-motion fallbacks.
4. **Copy & Identity Scrubbing**:
   - Completely purged non-OmniPriv naming and Kaspersky copy from signup wizard and comments.
5. **Architectural Integrity**:
   - Zero changes to database schema, API contracts, RBAC authorization, or multi-tenant scoping.

---

## 8. Phase 21: UI Elevation, Real-Time Bidirectional Synchronization & End-to-End Verification

- **Form & Card Modernization**:
  - `Card` components upgraded with dark ambient gradients (`from-[#0c182c]/95 via-[#081222]/95 to-[#060c18]/95`), cyan sheen borders, and subtle ring tokens.
  - Developed custom `Select` matching standard Input heights (`h-11`/`h-12`), chevron glyphs, and accessibility focus states.
  - Elevated forms across Deal Registration wizard (`/partner-portal/deals/new`), Commercial Requests (`/partner-portal/commercial-requests/new`), Joint Business Plans (`/partner-portal/joint-business-plan`), Company Profile (`/partner-portal/company`), Team Management (`/partner-portal/team`), and Partner Locator (`/partner-portal/locator-profile`).
- **Real-Time Cross-Portal Data Synchronization**:
  - Enforced `export const dynamic = 'force-dynamic'` across all partner and channel admin server-rendered routes.
  - Added dual cross-portal `revalidatePath` triggers in Server Actions (`deals.ts`, `admin-deals.ts`, `leads.ts`, `commercial-requests.ts`, `admin-ops.ts`, `admin-partners.ts`, `learning.ts`, `events.ts`, `jbp.ts`, `locator.ts`) to ensure immediate reflection without browser cache lag.
- **Clean Slate Database Verification**:
  - Integration suite passing (23/23 tests against Supabase PostgreSQL).
  - Database sanitized via `npm run db:clean`, retaining strictly the single internal Channel Administrator (`admin@omnipriv.internal`) so the partner can test onboarding end to end from a clean state.

---

## 9. Phase 22: OmniPriv AI-PAM Product Messaging Alignment (`omnipriv.com`)

- **Purged Generic PAM Clichés**: Removed generic "Zero Trust Architecture", "ephemeral credentials", and generic PAM placeholders across public pages, portal wizard, and database seed.
- **Direct OmniPriv Product Alignment**:
  - **Core Value Proposition**: "AI-Powered Privileged Access Management" | "Secure AI Access. Control Every Privileged Move."
  - **AI-PAM Engine Highlights**: 39 behavioural features scored in real time per session, 10-second auto-block sweeps with grace periods, 53 permission-gated MCP tool actions with prompt-injection defense.
  - **Cryptographic Vaulting**: 3-level key encryption hierarchy (KEK: Key Encryption Key, per-org DEK: Data Encryption Key, per-secret SEK: Secret Encryption Key) with automated rotation.
  - **HMAC-SHA256 Audit Trail**: Hash-chained audit logs checkpointed every 50 rows and re-verified periodically.
  - **The 9 Core Modules**: Secure AI Agents, Credential Management, Secure Remote Access (VPN-free RDP/SSH), Workflow & Access Control, Application Security, AI Threat Protection, Audit & Compliance, Enterprise Integration, Infrastructure & Deployment.
- **Seeded Collateral & Courses**: Refreshed `prisma/seed.ts` with authentic OmniPriv collateral (AI-PAM competitive battlecards, MCP tool governance blueprints, 3-level key vault architecture whitepaper, legacy PAM migration playbooks).
- **Quality & Baseline Integrity**: Verified typecheck (`tsc --noEmit`), Vitest suite (23/23 tests passed), and pristine database reset with only `admin@omnipriv.internal`.

---

## 10. Phase 23: Standalone Support Portal (`support-portal/`) for Vercel Subdomain Deployment

- **Dedicated Next.js 16 Application (`support-portal/`)**:
  - Independent root directory configured for separate Vercel deployment (e.g. `support.omnipriv.com` or `support-omnipriv.vercel.app`).
  - Shares the production PostgreSQL database (Supabase pooler) without duplicating user credentials or wiping data.
- **Shared Authentication & Session**:
  - Seamless login via existing partner or Channel Administrator accounts (`users` table with Argon2id verification).
  - Compatible session validation via `omnipriv_support_session` and SSO support with `omnipriv_session`.
- **AI-PAM Knowledge Base & FAQs (`/faq`)**:
  - Real database-backed FAQ search engine (`support_faqs` table) covering the 39-feature behavioral engine, 53 MCP tool controls, 3-level key vaults, and deal protection.
  - Category filters, real-time query matching, interactive accordion answers, and community helpfulness counters.
- **Incident & Ticketing Helpdesk (`/tickets`)**:
  - Ticket creation wizard (`/tickets/new`) with severity selection (Urgent, High, Medium, Low) and auto-generated tracking numbers (`OPT-2026-XXXXX`).
  - Threaded conversation workspace (`/tickets/[ticketId]`) supporting replies, status transitions (`open`, `in_progress`, `awaiting_partner`, `resolved`, `closed`), and internal staff notes locked for Channel Admins.
  - Strict tenant isolation: partner organizations only view and update their own tickets; Channel Admins have cross-organizational triage and resolution controls.
- **Independent Build & Verification**:
  - `support-portal`: All 8 routes build with Turbopack with 0 errors.
  - Root Partner Portal: All 48 routes build with Turbopack with 0 errors.
  - Database preserved without any destructive reset (`db:clean` avoided).

## 11. Channel Admin Delete Controls

- **Server actions** (`src/lib/actions/admin-delete.ts`): `requireAdminSession()` → zod id → one `$transaction` → `AuditEvent` (actor = admin, `partner_organization_id` NULL so org cascades never erase it; org/name/reference in metadata) → `revalidatePath`.
  - Partner organization (typed-name confirmation re-checked on the server): removes all org-owned rows, deletes members with no other membership (never `channel_admin`, never users with records in other orgs), unlinks `product_licenses`, resets leads left without assignments to `new`, and purges the `customer_support` tenant `pp_<orgId>` (case messages, cases, audit events, entitlements, users, tenant) via guarded raw SQL that no-ops if the schema/columns are absent.
  - Partner user: blocked for self, Channel Admins and the sole `partner_owner` of any org; their deals/commercial requests are reassigned to another member (owner first); linked support-portal user removed (cases/messages handed to a tenant teammate, else deleted).
  - Deal registration (+ status history), lead (+ assignments; converted deals kept and unlinked), product license, commercial request, course (+ enrollments), event (+ registrations), campaign, resource. Announcements have no admin page, so no delete.
- **Pure guards** (`src/lib/utils/admin-delete-guards.ts`) with unit tests in `src/tests/unit/admin-delete-guards.test.ts`.
- **UI** (`src/components/ui/confirm-delete.tsx`): one reusable "Delete" danger trigger + portal confirm dialog (impact counts, warnings, typed-name gate for orgs, toast feedback, Esc/focus trap, stacked buttons at 375px). Rendered only inside `/channel-admin/*`.





## 12. Transactional Email, Team Invites & Real Password Reset

- **Mailer** (`src/lib/email/mailer.ts`, server-only, `nodemailer`): same `SMTP_HOST/PORT/SECURE/USER/PASSWORD/FROM` vars as the support app; `isEmailConfigured()`, `sendEmail()` never throws (returns `{ sent, error? }`), branded HTML + text. Links use `APP_BASE_URL` (default `https://partner.omnipriv.com`).
- **Set-password tokens** (`src/lib/auth/password-token.ts`, pure, unit-tested): HS256 JWT (key derived from `SESSION_SECRET`, domain-separated from the session key), `sub`/`purpose`/`pwv` (+ `org` on invites), iss `omnipriv-partner-portal`, aud `omnipriv-partner-portal-password`; invite 7 days, reset 1 hour. Single-use via `pwv` = sha256(password_hash)[0:16]. DB glue + email copy in `src/lib/auth/password-flows.ts`.
- **Invites**: new users get a "Set your password" link (`/reset-password?token=…&invite=1`); existing users get an "added to <Org>" email. If email isn't sent, the owner sees a copyable invite link. "Invite pending" + owner-only "Resend invite" (60 s cooldown) for invited members with no `team.invite_accepted` / `user.password_reset` / `user.authenticated` audit event.
- **Forgot / reset**: `requestPasswordResetAction` (generic response, max 3/hour/user via `user.password_reset_requested` events); `/reset-password` validates the token server-side, `resetPasswordAction` re-verifies and compare-and-sets the hash, audits `team.invite_accepted` or `user.password_reset`, redirects to `/sign-in?reset=1` (success banner).
- **Known limits**: sessions are stateless JWTs, so a reset does not sign out other existing sessions; unknown emails are not rate-limited (nothing is sent to them).
