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
8. **No Git Actions**: Never run `git add`, `git commit`, `git push`, `git stash`, or any other staging/version-control command on your own. The user performs all Git operations manually. You may only make working-tree file edits.

OmniPriv Partner Portal — Master Build Prompt
Use this prompt with the coding agent that will build or repair the portal.
You are the lead product engineer, product designer, security engineer, and QA owner for a production-quality OmniPriv Partner Portal. Build this in the existing repository; do not make a throwaway demo or a generic dashboard.

The target experience is inspired by the information architecture of the Kaspersky Partner Portal: a real B2B channel workspace where partner companies register deals they bring, act on vendor-assigned leads, manage commercial renewals, access enablement and marketing content, and manage their own company team. Do not copy Kaspersky branding, code, visuals, copy, or proprietary content.

Before editing:
1. Inspect the current repository, stack, authentication setup, database layer, routes, components, and existing migrations.
2. Write or update `plan.md` with the current architecture, every implementation phase, completed work, outstanding work, local run instructions, test commands, and known risks.
3. Preserve useful existing code, but replace placeholder, mock, hard-coded, and insecure implementations that conflict with these requirements.
4. Do not claim a feature is complete until it works with real PostgreSQL data, authorization, validation, and an empty-state test.
1. Product interpretation — non-negotiable
This is not:
- an affiliate/referral portal;
- a consumer signup product;
- a static marketing form;
- a portal where partners wait to receive access after an application review;
- a route into customer PAM tenants;
- an access path to vaults, passwords, secrets, sessions, recordings, HSM keys, or privileged accounts.
This is:
- a B2B channel-partner workspace;
- a multi-company product where each partner organization sees only its own commercial data;
- a place where a partner registers opportunities it sourced;
- a place where OmniPriv routes qualified inbound leads to selected partners;
- a separate internal channel-operations console for OmniPriv employees;
- a commercial/enablement portal that remains hard-separated from the OmniPriv PAM product.
Correct onboarding model
A prospective partner company registers itself at `/partners/register`. On successful registration:
1. Create a real `partner_organization`.
2. Create the first real user account.
3. Create an organization membership with the `partner_owner` role.
4. Start the organization at the `registered` program tier.
5. Email-verify the user and establish a secure session.
6. Send the user directly to `/partner-portal`.
Do not build an “application pending” workspace as the main product. The partner does not log in merely to wait for a company application decision. They log in to operate: register deals, receive leads, review renewals, use resources, complete enablement, and manage their team.

The statuses a partner primarily tracks are operational statuses, especially their Deal Registration status:

`draft → awaiting_approval → information_requested → approved/protected → closed_won or closed_lost → expired`

OmniPriv Channel Admins may later verify the organization, assign its Partner Manager, approve program tracks, and promote its tier. That is internal governance, not a barrier to the partner’s basic workspace.
2. Required routes and product areas
Create a clean route architecture. Adapt route conventions to the existing application if necessary, but preserve the separation.
Public pages
- `/partners` — partner-program landing page
- `/partners/register` — company registration
- `/sign-in` — partner sign-in
- `/forgot-password` and `/reset-password`
- `/verify-email`
- `/find-a-partner` — public partner directory, phase 3
Authenticated partner workspace
- `/partner-portal` — dashboard
- `/partner-portal/deals`
- `/partner-portal/deals/new`
- `/partner-portal/deals/[dealId]`
- `/partner-portal/leads`
- `/partner-portal/leads/[leadId]`
- `/partner-portal/renewals`
- `/partner-portal/commercial-requests`
- `/partner-portal/resources`
- `/partner-portal/onboarding`
- `/partner-portal/learning`
- `/partner-portal/certifications`
- `/partner-portal/joint-business-plan`
- `/partner-portal/campaigns`
- `/partner-portal/events`
- `/partner-portal/company`
- `/partner-portal/team`
- `/partner-portal/terms`
- `/partner-portal/locator-profile` — phase 3
Internal Channel Admin workspace
- `/channel-admin/login`
- `/channel-admin`
- `/channel-admin/partners`
- `/channel-admin/partners/[partnerId]`
- `/channel-admin/deals`
- `/channel-admin/deal-conflicts`
- `/channel-admin/leads`
- `/channel-admin/renewals`
- `/channel-admin/commercial-requests`
- `/channel-admin/programs`
- `/channel-admin/resources`
- `/channel-admin/learning`
- `/channel-admin/campaigns`
- `/channel-admin/events`
- `/channel-admin/jbp`
- `/channel-admin/audit-log`
Every `/channel-admin/*` route must be protected on the server. A partner user must receive a proper in-app `403 Access Denied` response and must never see hidden admin navigation, data, API responses, or action controls.
3. Authentication, organization creation, and roles
Partner registration form
Build a polished multi-section registration page, not an ugly one-column raw form. Collect:
- legal company name;
- trading name, optional;
- website;
- country, region/state, city;
- company type: reseller, system integrator, MSP/MSSP, technology alliance;
- company size;
- industry focus;
- primary contact first name and last name;
- business email;
- phone;
- job title;
- password and password confirmation;
- requested partner tracks: Sell, Deploy, Manage, Build;
- partner terms, privacy policy, and marketing-consent checkboxes where applicable.
Use client- and server-side validation, accessible field errors, email verification, duplicate-email protection, duplicate-organization handling, password strength rules, rate limiting, and a success confirmation.
Roles
Implement at least:
- `channel_admin` — OmniPriv internal staff, cross-partner access;
- `partner_owner` — partner company owner; can manage company profile and users;
- `partner_member` — partner company employee; operates allowed business modules;
- optional `partner_finance` or `partner_marketing` only if roles are implemented fully.
Do not use client-side role checks as security. Enforce role and organization authorization server-side for pages, API routes/server actions, mutations, exports, file access, and direct object URLs.
Seeded internal admin
Do not hard-code an administrator email, username, or password in source code. Bootstrap exactly one Channel Admin only from environment variables or a secure explicit seed command:
- `CHANNEL_ADMIN_EMAIL`
- `CHANNEL_ADMIN_PASSWORD`
- `CHANNEL_ADMIN_NAME`
- `CHANNEL_ADMIN_SEED_ENABLED`
Document the command and required environment variables in `.env.example` and `README`. Never print secrets in logs, UI, seed output, screenshots, tests, or documentation.
4. Data model and PostgreSQL rules
PostgreSQL is the production source of truth. Do not ship static arrays pretending to be database records, fake dashboard totals, mock users, mock leads, mock deals, or hard-coded login credentials.

Create real migrations and a secure data-access layer for at least:
- `users`
- `partner_organizations`
- `partner_memberships`
- `partner_program_tracks`
- `partner_program_enrollments`
- `partner_managers`
- `deal_registrations`
- `deal_products`
- `deal_status_history`
- `deal_conflicts`
- `partner_leads`
- `lead_activities`
- `renewal_opportunities`
- `commercial_requests`
- `resources`
- `resource_access_rules`
- `courses`
- `course_enrollments`
- `certifications`
- `partner_certifications`
- `campaigns`
- `events`
- `event_registrations`
- `joint_business_plans`
- `terms_acceptances`
- `partner_locator_profiles`
- `audit_logs`
- `announcements`
Use UUIDs or another strong non-guessable public identifier strategy. Use timestamps, creator/updater references, soft deletion where appropriate, database constraints, indexes for organization filtering and deadlines, and transaction boundaries for multi-record actions.

Every partner-scoped read and write must derive `partner_organization_id` from the trusted authenticated server session. Never trust an organization ID supplied by the browser. A partner user must not be able to change a URL, request body, query parameter, or API response to see another partner’s information.
5. Partner workspace information architecture
Use a polished desktop-first B2B app design with a responsive tablet/mobile fallback.

Primary navigation:
- Dashboard
- Sales
  - Deal Registrations
  - Assigned Leads
  - Renewals
  - Commercial Requests
- Partner Program
  - My Program
  - Onboarding
  - Learning
  - Certifications
  - Joint Business Plan
- Marketing
  - Campaigns
  - Events & Webinars
  - Marketing Resources
- Resources
- Company
  - Company Profile
  - Team
  - Terms
  - Locator Profile
The visual direction should be premium, calm, modern, security-focused, and information-dense without looking crowded:
- OmniPriv brand, not a clone of Kaspersky;
- strong sidebar or top-app navigation with clear active states;
- a compact page header with title, short explanatory copy, and primary action;
- real metric cards, status badges, filters, searchable tables, column controls, pagination, export only when fully authorized;
- readable typography, generous but disciplined spacing, consistent radii, subtle borders, restrained shadows, and accessible contrast;
- loading, empty, error, and permission-denied states designed intentionally;
- no giant empty dark panels, random gradients, excessive animation, dashboard wallpaper, or generic AI-generated form UI;
- keyboard accessible controls, visible focus states, labelled inputs, and responsive tables.
6. Partner dashboard
Create `/partner-portal` using live database queries only.

Show:
- active deal registrations;
- deals awaiting OmniPriv review;
- approved/protected deals;
- deals closing soon;
- assigned leads;
- leads approaching or exceeding the response SLA;
- accepted leads being worked;
- upcoming renewals;
- open commercial requests;
- onboarding completion;
- expiring certifications;
- recent announcements;
- assigned OmniPriv Partner Manager;
- recent activity.
Add quick actions:
- Register a Deal
- View Assigned Leads
- Request a Trial or POC
- Invite a Team Member
When there are no records, use honest empty states, for example:

“No deals registered yet. Protect a new customer opportunity by registering it before engagement.”

Do not render zero-value demo graphs or invented pipeline metrics.
7. Deal Registration — highest-priority workflow
This must be a production-quality three-step wizard, not a basic submit form.
Step 1: Customer details
Collect:
- legal customer company name;
- primary customer domain;
- country;
- city and region;
- industry;
- customer website;
- employee range;
- customer contact first and last name;
- job title;
- work email;
- phone.
Step 2: Opportunity details
Collect:
- OmniPriv product/edition;
- PAM use case;
- deployment preference: cloud, self-hosted, hybrid;
- estimated seats/nodes;
- estimated annual contract value;
- expected close date;
- procurement/deployment timeline;
- distributor, optional;
- competitor, optional;
- opportunity notes;
- secure file attachments if enabled.
Step 3: Review and submit
Show a complete review summary, terms acknowledgement, field edits, and final submit action.
Deal behavior
On submit:
- create the deal in `awaiting_approval`;
- store a status-history record;
- notify relevant Channel Admins;
- make the partner able to see its own deal immediately;
- calculate all dashboard counts from the actual record.
Deal statuses:
- `draft`
- `awaiting_approval`
- `information_requested`
- `approved`
- `declined`
- `conflict_detected`
- `protected`
- `closed_won`
- `closed_lost`
- `expired`
Channel Admins approve, decline, request information, resolve conflicts, and mark outcomes. On approval, start a 90-day protection period and persist its expiry. Show the protection expiry to the partner. Only authorized admin actions can extend it, and every extension must be audited.
Domain conflict engine
Normalize the customer domain and check it against active/protected deals. If the same domain is already registered or recently closed by another partner:
- do not disclose the other partner’s name or deal details;
- set `conflict_detected`;
- create an internal conflict record;
- show the submitting partner a neutral message that OmniPriv is reviewing an existing customer claim;
- route the case to Channel Admin arbitration.
Deal pages
The partner Deals table needs:
- “New Deal Registration” action;
- search;
- filters;
- saved/default filter “All Deal Registrations”;
- sortable columns;
- configurable visible columns;
- pagination;
- status badges;
- dates and protection-expiry warnings;
- row click to the deal detail view.
Default columns:
- Opportunity Name
- Customer Company
- Status
- Estimated Close Date
- Deal Protection Expiration Date
- Deal Value
- Product/Edition
- Won
- Closed
The deal detail page needs a status timeline, activity/history, OmniPriv requests for information, partner updates, documents, and a clear next action.
8. Assigned Leads — separate from deal registration
Do not merge this with Deal Registration.
- A Deal Registration is a customer opportunity sourced by the partner.
- An Assigned Lead is a prospect OmniPriv generated and routed to that partner.
Partner Leads list:
- search and filters;
- contact first name and last name;
- company;
- country/state/city;
- work email and phone;
- job title;
- product interest;
- estimated seats/nodes;
- lead source;
- customer comment;
- description;
- Partner Acceptance status;
- operational status;
- SLA deadline;
- source and assignment timestamps.
Partner actions:
- Accept;
- Decline with a mandatory reason;
- add activity/update;
- mark working;
- mark qualified;
- mark disqualified with reason;
- convert to a Deal Registration;
- record a conversion outcome.
Lead status flow:

`assigned → accepted or declined → working → qualified → converted`

Alternative end-state:

`assigned/accepted/working → disqualified`

Set a persistent seven-day acceptance SLA from the moment the lead is assigned. Show the remaining time prominently. Channel Admin must be able to configure the SLA later, but do not hard-code a fake timer in the client.

On conversion, prefill an editable Deal Registration draft with the lead data, retain the relationship between the lead and deal, and run the normal domain-conflict workflow.
9. Renewals
Build a commercial renewal area for partner-authorized customer accounts only.

Partner table fields:
- opportunity/customer;
- OmniPriv edition;
- contracted seats/nodes;
- license/contract expiration date;
- annual contract value;
- distributor;
- renewal status;
- internal owner/partner owner;
- commercial notes.
Features:
- search;
- filter by renewal window and status;
- upcoming-expiry widgets;
- request assistance;
- renewal activity history.
This area contains commercial metadata only. It must never show customer PAM tenant contents, credentials, vaults, privileged sessions, recordings, encryption keys, or tenant administration.
10. Commercial requests and order support
Build this after Deals, Leads, and Renewals are working.

Partner request types:
- Proof of Concept;
- customer trial;
- NFR/internal lab license;
- quote request;
- subscription/order assistance;
- license change/expansion.
Statuses:

`draft → submitted → in_review → approved/rejected → fulfilled`

Show request details, status timeline, requestor, related customer/deal, required admin action, and approved entitlement metadata. This is commercial workflow only; it must not provision PAM access.
11. Program, enablement, learning, and certifications
My Program
Partner users should see:
- current tier: Registered, Silver, Gold, Platinum;
- active tracks: Sell, Deploy, Manage, Build;
- benefits;
- requirements to advance;
- assigned Partner Manager;
- program progress and compliance.
Only Channel Admin can modify tier, approved tracks, partner-manager assignment, or compliance status.
Onboarding
Build a guided, persisted checklist:
1. Welcome to OmniPriv
2. Partner program benefits
3. OmniPriv products and use cases
4. Deal registration and lead process
5. Sales enablement
6. Technical enablement
7. Marketing resources
8. Portal tools
9. Assessment and completion certificate
Show real completion based on database records.
Learning library
Include:
- Sales courses;
- Presales courses;
- Technical courses;
- search;
- track/application-area filters;
- language, duration, level, and status;
- progress persistence;
- completion records.
Certifications
Show:
- all certificates;
- valid certificates;
- expiring certificates;
- expired certificates;
- requirements by program track/tier;
- organization-level coverage;
- expiry dates and renewal instructions.
Channel Admin controls rules, validity dates, and verification.
12. Resources, campaigns, and events
Resource library
Create a database-backed resource library with:
- full-text search;
- filters for product, industry, asset type, language, region, partner tier, and track;
- sort by newest/relevance;
- permission rules;
- download/view tracking if appropriate.
Asset types can include:
- datasheets;
- solution briefs;
- sales decks;
- battlecards;
- product presentations;
- deployment guides;
- case studies;
- email templates;
- social copy;
- co-marketing assets;
- brand guidelines.
Campaigns
Campaign records should support:
- title and summary;
- product;
- audience;
- start/end dates;
- campaign status;
- downloadable assets;
- email copy;
- social copy;
- presentation;
- landing-page guidance;
- partner tier/access rules.
Events and webinars
Support:
- upcoming events;
- past events and recordings;
- title, type, description, date, timezone, duration, product area;
- registration;
- attendance or recording entitlement;
- database-backed event status.
13. Joint Business Plan
Allow partners to create a yearly Joint Business Plan that can be sent to their OmniPriv Partner Manager.

Fields:
- year;
- growth goals;
- revenue/pipeline targets;
- focus products;
- target industries;
- key accounts;
- technical enablement plan;
- marketing activities;
- quarterly milestones;
- notes and attachments.
Statuses:

`draft → submitted → under_review → changes_requested → approved → archived`

Provide partner and admin list views, detail views, status history, comments, and audit records.
14. Company settings and team management
Company Profile
Partner Owner can update:
- company profile;
- logo;
- website;
- broad business location;
- partner type;
- industry focus;
- primary business contact.
Team
Partner Owner can:
- invite team members by email;
- assign permitted roles;
- resend/revoke invites;
- deactivate members;
- view user activity relevant to their organization;
- prevent removal of the last Partner Owner.
Legal and program records
Show:
- accepted terms and policy versions;
- company certifications;
- user certifications;
- program track/tier status.
Do not implement bank-account, payout-account, account-number reveal, reimbursement banking, or sensitive financial-detail screens in this scope.
15. Partner Locator — phase 3
Build a public directory only after the core operational portal is secure.

Public search/filter:
- country/region;
- partner type;
- program track;
- product expertise;
- industry specialization;
- tier.
Partner controls:
- opt in/out;
- public company description;
- public logo;
- public website;
- broad location;
- public preview.
Admin moderation is required before a profile becomes public. Never publish private contact data or exact physical addresses by default.
16. Channel Admin Console
Create a truly separate internal console. It must provide real cross-partner governance:
Overview
- total partner organizations;
- new registrations;
- active partners;
- deals awaiting review;
- conflict cases;
- unassigned leads;
- leads nearing SLA;
- channel pipeline value;
- upcoming renewals;
- commercial request queue;
- certification/program compliance.
Partner organizations
- search and filters;
- organization profile;
- team members;
- tracks and tier;
- Partner Manager assignment;
- account status;
- audit history;
- public locator approval.
Deal queue and conflicts
- review submitted deals;
- request information;
- approve or decline;
- view normalized customer domains;
- resolve conflicts;
- grant/extend protection;
- record internal decision notes;
- inspect immutable history.
Lead routing
- create/import inbound leads;
- route leads by region, language, track, tier, capacity, and specialization;
- reassign;
- monitor acceptance SLAs;
- view conversion rates and lead outcomes.
Commercial and enablement administration
- renewals;
- commercial requests;
- program tracks and tiers;
- resources;
- courses;
- certifications;
- campaigns;
- events;
- Joint Business Plans.
Audit log
Persist immutable audit events for at least:
- registration;
- user invite/role changes;
- company profile changes;
- deal creation and status changes;
- conflict decisions;
- protection extensions;
- lead assignment/reassignment/acceptance/decline;
- renewal updates;
- commercial request decisions;
- admin role or program changes;
- resource or content publication.
Audit records need actor, organization when applicable, timestamp, action type, entity type/ID, and redacted structured before/after metadata.
17. Security and privacy acceptance criteria
Implement and test all of the following:
- server-side session validation;
- secure cookie configuration;
- password hashing;
- CSRF/mutation protection appropriate to the framework;
- input validation and output encoding;
- rate limiting for registration, login, password reset, and uploads;
- authorization tests for every partner-scoped route and mutation;
- object-level authorization tests proving Partner A cannot read/write Partner B data;
- `403` response for partner access to Channel Admin routes;
- no sensitive secrets in client bundles, logs, screenshots, or error pages;
- secure upload type/size validation and access controls if attachments are supported;
- audit logs for privileged actions;
- production errors do not leak database, session, or stack details;
- hard PAM separation.
PAM hard separation means:
- no partner portal route can retrieve a customer tenant;
- no partner portal route can retrieve vaults or secrets;
- no partner portal route can start privileged sessions;
- no partner portal role has inherited customer access;
- a partner engineer who needs customer support access must use OmniPriv’s separate, customer-approved, MFA-protected JIT access workflow.
18. UX and content requirements
Every page must have:
- a clear page title;
- one concise purpose statement;
- a meaningful primary CTA where an action exists;
- useful empty-state content;
- loading/error/permission states;
- accessible labels and validation messages;
- real data or an honest “no records yet” state.
Use professional product language. Examples:
- Dashboard: “Manage your OmniPriv partnership, customer opportunities, and enablement progress.”
- Deals: “Register and track customer opportunities you bring to OmniPriv.”
- Leads: “Work qualified customer leads assigned to your organization.”
- Renewals: “Plan renewals for customer subscriptions you are authorized to manage.”
- Commercial Requests: “Request trials, POCs, quotes, or internal lab entitlements.”
- Resources: “Find the latest sales, technical, and marketing material.”
- Team: “Manage the people in your partner organization.”
Avoid empty buzzwords, fake success messages, generic lorem ipsum, and “affiliate earnings” language.
19. Implementation phases
Phase 1 — working core
1. PostgreSQL migrations, auth, sessions, roles, organization isolation.
2. Company self-registration and immediate Partner Owner workspace access.
3. Separate environment-seeded Channel Admin login.
4. Partner dashboard with live empty states and metrics.
5. Deal Registration wizard, deal list/detail, admin review, conflict detection, 90-day protection.
6. Assigned Leads, SLA, accept/decline, conversion to deal.
7. Company profile, team invitations, terms acceptance.
8. Audit logging and security tests.
Phase 2 — commercial and enablement
1. Renewals.
2. Commercial requests: POC, trial, NFR, quote/order support.
3. Resources library.
4. Program tracks/tiers.
5. Onboarding, learning, and certifications.
6. Joint Business Plans.
Phase 3 — growth ecosystem
1. Campaigns.
2. Events/webinars.
3. Public Partner Locator with moderation.
4. MDF/activity workflow if needed, but no bank-account module unless separately specified.
5. Advanced reporting and exports.
20. Definition of done
Do not stop at screens. The work is complete only when:
- all primary pages use PostgreSQL-backed records;
- no production mock data remains;
- a new company can register, verify, sign in, and see its own workspace;
- a partner can submit a real Deal Registration;
- a Channel Admin can review it and protection is calculated correctly;
- a partner can see only its own deals, leads, renewals, team, and documents;
- a Channel Admin can see cross-partner operational data;
- a partner is blocked from `/channel-admin`;
- an assigned lead can be accepted, declined, and converted to a deal;
- empty states are intentional and useful;
- all status changes are auditable;
- no customer PAM data is reachable from this portal;
- UI is polished, responsive, accessible, and consistent;
- migrations, environment variables, tests, and setup documentation are complete.
21. Final handoff requirements
At the end, provide:
1. A concise list of files changed.
2. Database migrations and schema summary.
3. Environment variables required.
4. Exact local setup and seed commands.
5. Routes implemented.
6. Role/authorization matrix.
7. Test results and manual verification checklist.
8. Any intentionally deferred Phase 2/3 work.
9. Known limitations, with no false claims of completion.
Do not ask me to manually fix implementation details that you can safely implement and test yourself. Make sensible, secure product decisions consistent with this specification, preserve existing working code where possible, and leave the repository in a runnable state.
