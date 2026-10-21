<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OmniPriv Channel Partner Portal Agent Rules

1. **No Mock Data in Production**: All dashboards, lists, and metrics must query PostgreSQL directly through Prisma. Never use static fake arrays or client-side mock states.
2. **Strict Multi-Tenant Isolation**: Scopes must ALWAYS be derived server-side from the authenticated session and membership. Never trust `partner_organization_id` supplied in request bodies or query params.
3. **Channel Admin Boundary**: `/channel-admin/*` is strictly forbidden to partner users; return an in-app `403 Access Denied` UI. Never cross-render admin links in partner navigation.
4. **Immutable Audit Events**: Every state change (registration, deal submission, approval, decline, lead assignment, lead conversion) must record an immutable `AuditEvent`.
5. **Argon2id Hashing**: Always use Argon2id for password hashing.
6. **Async Headers/Cookies/Params**: In Next.js 16 App Router, `cookies()`, `headers()`, `params`, and `searchParams` are Promises and must be awaited.
7. **Always update `plan.md`** before and after implementing major phases.
