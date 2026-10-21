# OmniPriv Channel Partner Portal

A production-quality B2B Channel Partner Portal inspired by enterprise operational models (such as the Kaspersky Partner Portal). 

This portal enables authorized partner companies to register customer opportunities for OmniPriv PAM, track deal approvals and protection status, work inbound leads assigned by OmniPriv, and manage commercial renewals and enablement resources—with strict tenant isolation and zero exposure of PAM customer secrets or infrastructure.

OmniPriv Channel Administrators operate through a dedicated, isolated management console at `/channel-admin` to review deals, detect and resolve domain conflicts, grant 90-day deal protections, route leads, and monitor channel operations.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Server Components & Server Actions)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (v16+)
- **ORM**: [Prisma ORM](https://www.prisma.io/) with migrations
- **Authentication**: Secure HTTP-only cookie sessions with AES-256-GCM / Jose signed tokens and Argon2id password hashing
- **Styling**: Tailwind CSS (dark navy/graphite palette, subtle cyan/blue accents)
- **Validation**: Zod + React Hook Form
- **Testing**: Vitest for unit tests, Playwright for end-to-end flows

---

## Getting Started

### 1. Prerequisites

- **Node.js**: v20 or v22+
- **PostgreSQL**: v16+ (running locally or via Docker Compose)
- **npm** or **pnpm**

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure your PostgreSQL connection string and Channel Admin seed variables are configured:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omnipriv_partner?schema=public"
SESSION_SECRET="generate-a-strong-32-byte-secret-for-omnipriv-portal"
CHANNEL_ADMIN_EMAIL="admin@omnipriv.internal"
CHANNEL_ADMIN_PASSWORD="YourSecurePasswordHere!"
CHANNEL_ADMIN_NAME="OmniPriv Channel Operations"
```

### 3. Database Migration & Seed

Run the migrations and initialize the idempotent seed:

```bash
npx prisma db push
npm run db:seed
```

The seed script idempotently creates the initial Channel Admin account from the environment variables without hardcoded credentials.

### 4. Running the Development Server

```bash
npm run dev
```

The portal will be accessible at:
- **Partner Portal**: [http://localhost:3000/sign-in](http://localhost:3000/sign-in) or [http://localhost:3000/sign-up](http://localhost:3000/sign-up)
- **Channel Admin Console**: [http://localhost:3000/channel-admin/login](http://localhost:3000/channel-admin/login)

---

## Security Model & Tenant Isolation

1. **Automatic Partner Provisioning**: When a new partner registers via `/sign-up`, a database transaction creates their `partner_organization`, owner `user`, `partner_membership` (`partner_owner`), assigns the `Registered` tier, and creates an audit event before logging them in immediately to an operational workspace.
2. **Strict Server-Side Derivation**: Scope is never inferred from request bodies or URL parameters; queries filter strictly on the server-authenticated user's `partner_organization_id`.
3. **Admin Isolation**: Channel Admin routes (`/channel-admin/*`) are protected by server-side middleware and layout guards. Any partner attempting to access `/channel-admin` is served a customized in-app 403 screen.
4. **90-Day Deal Protection**: Deal registrations submit into `awaiting_approval`. Approval grants a strict 90-day protection window (`protection_starts_at` to `protection_expires_at`).
5. **Domain Conflict Detection**: Customer domains are normalized server-side to detect existing active or protected deals across the channel.
6. **Immutable Audit Events**: All state transitions (deal submission, approval, decline, lead assignment, lead conversion) record an immutable `AuditEvent`.

---

## Running Tests

Run Vitest unit tests:

```bash
npm test
```
