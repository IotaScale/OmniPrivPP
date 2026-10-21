# OmniPriv Channel Partner Portal — Implementation Plan

This document tracks all completed phases, schema migrations, route implementations, security boundaries, testing, and operational status for the standalone OmniPriv Channel Partner Portal.

---

## 1. Architecture & Stack Overview

- **Framework**: Next.js 16 (App Router, Server Components & Server Actions)
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
| **Phase 2** | PostgreSQL schema (`prisma/schema.prisma`), Prisma Client, idempotent seed (`prisma/seed.ts`) | Completed | 11 relational models with indexes, foreign keys & seed routine |
| **Phase 3** | Authentication & sessions: Argon2id hashing, secure cookies, `/sign-up`, `/sign-in`, Channel Admin seed | Completed | Auto-provisioning transaction & instant workspace access |
| **Phase 4** | RBAC middleware & route protection (`partner_owner`, `partner_member`, `channel_admin`), 403 screen | Completed | Server-side boundary enforcement & in-app 403 screen |
| **Phase 5** | Partner layout & workspace shell (topbar, navigation, active organization context) | Completed | Exclusively scoped to authenticated organization |
| **Phase 6** | Partner Overview dashboard (`/partner-portal`) with real data & purposeful empty states | Completed | Zero fake charts, live DB queries & actionable cards |
| **Phase 7** | Deal registration 3-step wizard (`/partner-portal/deals/new`) + domain normalization & conflict detection | Completed | Submits into `awaiting_approval` with audit & admin notification |
| **Phase 8** | Deal list (`/partner-portal/deals`) & detail view (`/partner-portal/deals/[id]`) with status timeline | Completed | Multi-tenant isolated, status badge & next step guidance |
| **Phase 9** | Channel Admin console (`/channel-admin/*`) deal approval, 90-day protection & extension workflow | Completed | Approval grants exactly 90-day protection window |
| **Phase 10** | Lead operations: Inbound leads, assignment to partners, 7-day SLA deadline, partner accept/decline/convert | Completed | CSV import, SLA calculations, lead-to-deal conversion |
| **Phase 11** | Renewals (`/partner-portal/renewals`), Resources (`/partner-portal/resources`), Company & Team management | Completed | Last-owner removal protection & tier-restricted collateral |
| **Phase 12** | Audit log (`/channel-admin/audit`) & in-app notifications system | Completed | Multi-parameter filtering on immutable audit events |
| **Phase 13** | UI/UX refinement, enterprise dark/light contrast, mobile responsiveness & keyboard accessibility | Completed | High density, professional PAM enterprise aesthetic |
| **Phase 14** | Unit tests (Vitest), end-to-end flows, production build validation & documentation | Completed | 23/23 tests pass, Next.js build clean with 0 errors |

---

## 3. Database Schema Models

- [x] `User`: id, email (unique), password_hash, full_name, email_verified_at, is_active, timestamps
- [x] `PartnerOrganization`: id, legal_name, display_name, website, country, region, partner_type, market_vertical, company_summary, tier (Registered/Silver/Gold/Platinum), status (active/suspended), timestamps
- [x] `PartnerMembership`: id, user_id, partner_organization_id, role (partner_owner/partner_member), invited_by_user_id, joined_at, timestamps (unique on [user_id, partner_organization_id])
- [x] `DealRegistration`: id, public_reference (OPR-YYYY-XXXXXX), partner_organization_id, submitted_by_user_id, customer_legal_name, customer_domain, customer_country, customer_industry, customer_contact_name, customer_contact_email, customer_contact_phone, product_interest, deployment_type, estimated_arr, estimated_deal_value, currency, expected_seat_count, expected_close_date, deployment_timeline, opportunity_source, partner_notes, status (draft, awaiting_approval, approved, declined, closed_won, closed_lost, expired), conflict_detected, conflict_reason, reviewed_by_user_id, reviewed_at, admin_decision_reason, protection_starts_at, protection_expires_at, closed_at, timestamps
- [x] `DealStatusHistory`: id, deal_registration_id, previous_status, new_status, changed_by_user_id, note, created_at
- [x] `Lead`: id, public_reference, customer_name, customer_domain, contact_first_name, contact_last_name, contact_email, contact_phone, company, country, region, industry, lead_source, product_interest, estimated_seat_count, customer_comment, internal_notes, status, timestamps
- [x] `LeadAssignment`: id, lead_id, partner_organization_id, assigned_by_user_id, assigned_at, acceptance_deadline_at, partner_acceptance_status (pending, accepted, declined), accepted_at, declined_at, decline_reason, current_status, converted_deal_registration_id, timestamps
- [x] `Renewal`: id, partner_organization_id, customer_name, product_plan, contracted_capacity, renewal_date, contract_value, currency, commercial_status, timestamps
- [x] `ResourceItem`: id, title, description, category, url, visible_to_tiers, is_published, timestamps
- [x] `AuditEvent`: id, actor_user_id, partner_organization_id, entity_type, entity_id, event_type, before_data, after_data, metadata, ip_address, created_at
- [x] `Notification`: id, user_id, partner_organization_id, title, message, link, is_read, type, created_at

---

## 4. Protected Routes & Authorization Matrix

| Route | Minimum Role Required | Scope | Status |
|-------|----------------------|-------|--------|
| `/` | Public | Landing page / Session redirect | Implemented |
| `/sign-up`, `/sign-in` | Public / Guest | Unauthenticated | Implemented |
| `/partner-portal` | `partner_member` or `partner_owner` | Scoped to user's `partner_organization_id` | Implemented |
| `/partner-portal/deals` | `partner_member` or `partner_owner` | Own deals list with filters | Implemented |
| `/partner-portal/deals/new` | `partner_member` or `partner_owner` | 3-step registration wizard | Implemented |
| `/partner-portal/deals/[id]` | `partner_member` or `partner_owner` | Own deal detail + timeline | Implemented |
| `/partner-portal/leads` | `partner_member` or `partner_owner` | Own assigned leads + SLA | Implemented |
| `/partner-portal/leads/[id]` | `partner_member` or `partner_owner` | Accept/decline & deal conversion | Implemented |
| `/partner-portal/renewals` | `partner_member` or `partner_owner` | Own renewals only | Implemented |
| `/partner-portal/resources` | `partner_member` or `partner_owner` | Filtered by partner tier | Implemented |
| `/partner-portal/company` | `partner_owner` (view for member) | Own organization | Implemented |
| `/partner-portal/team` | `partner_owner` | Team invitations & last-owner protection | Implemented |
| `/channel-admin/login` | Public / Guest | Unauthenticated admin login | Implemented |
| `/channel-admin/access-denied` | Public / Partner | In-app 403 Security Boundary | Implemented |
| `/channel-admin` | `channel_admin` | Global cross-partner dashboard | Implemented |
| `/channel-admin/partners` | `channel_admin` | Partner management & tier updates | Implemented |
| `/channel-admin/deals` | `channel_admin` | Approval queue & 90-day protection | Implemented |
| `/channel-admin/leads` | `channel_admin` | Inbound lead routing & CSV import | Implemented |
| `/channel-admin/renewals` | `channel_admin` | Global commercial renewals | Implemented |
| `/channel-admin/audit` | `channel_admin` | Immutable forensic audit log | Implemented |

---

## 5. Test Suite Verification

- **Unit & Integration Suite (`npm test`)**:
  - `domain.test.ts`: FQDN parsing, subdomain stripping, protocol normalization (6/6 tests passing)
  - `sla-and-protection.test.ts`: 90-day protection date calculation & 7-day lead SLA (4/4 tests passing)
  - `rbac-and-transitions.test.ts`: Permission evaluation, boundary enforcement & deal transitions (8/8 tests passing)
  - `flows.test.ts`: Database integration flows covering registration, deal creation, conflict detection, approval, 90-day protection, multi-tenant isolation, and lead conversion (5/5 tests passing)
  - **Total**: 23/23 tests passing in < 1 second.
- **Production Build Pipeline (`npm run build`)**:
  - Zero TypeScript compile errors.
  - Zero routing errors.
  - All 21 app routes generated and validated.
