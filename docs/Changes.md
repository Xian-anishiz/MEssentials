# MEssentials — Change Log and Rollback Guide

**Document version:** 1.1  
**Date:** 2026-11-09  
**Baseline documents:** `KLP.pdf` (19 pages) and `KLP-1.pdf` (49 pages)  
**Updated technical documents:** `SPEC.md` and `UI_DESIGN.md` (revision 4)  
**Guidance applied:** `scope_refinements.md` (version 1.0, 2026-11-08), `user_roles.md` (version 1.1, 2026-11-09), and `PROJECT_DEFINITIONS.md` (current draft definitions).

---

## 1. Purpose and change policy

This file records the changes made when turning the original KLP project proposal and the expanded KLP-1 requirements/design document into an implementation-ready web application specification.

The two PDF baselines are retained as source records. They have **not** been overwritten. The authoritative implementation documents are now `SPEC.md` and `UI_DESIGN.md`. This keeps the academic baseline available while giving developers one current set of technical rules.

Each change below states:

1. **Original:** what KLP or KLP-1 said, including the relevant section or page.
2. **Change:** what the revised specification now says.
3. **Reason:** why the change is needed.
4. **Fallback:** how to return to the old behavior or remove the revision.

A fallback is not always safe as a direct production rollback. Database changes must use migrations and data backups. Never drop columns or tables until the app version that uses them has been rolled back and the data has been backed up.

## 2. Baseline comparison

### 2.1 KLP.pdf — original project proposal

| Location | Original content | Revision made | Reason |
|---|---|---|---|
| pp. 2–7, Customer Statement of Requirements | Describes the service problem: information spread across Facebook/Messenger and Google Docs, Forms, and Sheets. Lists HonestME Store, ME-kailangan, MEg-aral, ME Days, registration, student profiles, notifications, and volunteer functions. | Kept these five service areas as the product scope. Converted the prose into named student, manager, and admin workflows in `SPEC.md` sections 1, 4, and 6. | The proposal states the user need, but developers need clear permissions, routes, data, and success rules. |
| pp. 5–7 | Students log in using UP Mail, update profiles, use services, receive notices, and send feedback. | Added Google OAuth plus a username/email and password sign-up path, staff identity checks, recovery codes, and explicit verified/unverified account states. | A blank system has no existing student accounts. Password sign-up also needs a safe way to prove identity and recover access without paid email delivery. |
| pp. 6–7 | Volunteers update information, validate borrowing, track events, and view feedback. | Split volunteers into five role-based managers: `store_manager`, `kailangan_manager`, `megaral_manager`, `medays_manager`, and `registration_manager`. Admins inherit all manager powers and control role grants. | Each service needs clear ownership and least-privilege access. This follows KLP-1's actor model and the separate user-role guide. |
| pp. 8–9 | Preliminary mobile screens show a login page, service pages, profile, notifications, store, borrowing, and event layouts. | Retained the service concepts, but use the detailed M3 desktop shell from `UI_DESIGN.md` and add a defined mobile layout below 768px. | The original mockups are a visual starting point, not a full responsive implementation spec. |
| p. 10 | Navigation is described as Login → Home → chosen feature → details/action. | Use a persistent navigation rail on desktop and direct access to all five services. On mobile, use a bottom navigation bar. | This matches KLP-1's composite linear/networked navigation decision and reduces steps between services. |
| pp. 10–11 | Development resources are broad: three developers, computers, database software, and a possible server. | Named SvelteKit, Svelte 5, Tailwind, PostgreSQL on Supabase, Cloudflare R2, and a separate worker process. | Developers need a concrete stack to implement and deploy the system. The stack choices were settled in the Claude discussion and reflected in `SPEC.md`. |
| pp. 11–13 | Function-point estimate is 108 unadjusted points, with `Fi = 41`, yielding 114 FP; mobile minimums are 1 GB RAM, iOS 12+, Android 5+. | Kept 114 FP as the historical baseline, but marked it as not re-estimated for the new auth, recovery, worker, push, expanded admin, and scanned-PDF work. | The old estimate does not include the expanded implementation. Reusing it as a current estimate would understate effort. |
| p. 14 | Gantt chart totals 28 days across prototype, database setup, tests, polish, migration, and deployment. | Kept the old durations as history and required a new schedule estimate before committing to a delivery date. | The new scope adds work that the original Gantt chart did not plan for. |
| pp. 15–17 | DRE is the quality metric; effort breakdown assigns modules to three developers. | Kept DRE as the release quality metric. The old effort table is treated as a baseline, not a current allocation. Add tasks for account security, worker, push, mobile, admin, and indexing fallback during replanning. | The work split must match the actual revised scope. |
| pp. 18–19 | Risks include high traffic, QR scanner incompatibility, low usage, event overbooking, storage exhaustion, delivery delays, data mismatch, and app turnover. | Retained relevant risks and changed the QR risk response to a phased approach: HID barcode/ID scanning for v1; camera QR scanning and QR image generation deferred. Add operational risks for worker hosting, push permission/delivery, and manual reviewer indexing. | The scope refinements deliberately reduce hardware and QR complexity in v1. |

### 2.2 KLP-1.pdf — expanded requirements and design baseline

| Location | Original content | Revision made | Reason |
|---|---|---|---|
| pp. 2–8, Content and Interaction Models | Defines Students, Volunteers, five service manager roles, and Administrators. Lists profile, notification, ticket, store, borrowing, reviewer, events, and registration use cases. | Preserved the service/use-case coverage. Turned use cases into permission-checked API operations and concrete account state rules in `SPEC.md` sections 4 and 6. | Use-case labels alone do not define request bodies, errors, access checks, or transaction behavior. |
| pp. 9–10, Use Case Diagrams | Visualizes the actors and service use cases. | Used these diagrams as the behavior baseline for the API and role matrix. Added staff account verification and password recovery because the expanded account flow needs them. | The diagrams remain useful for coverage, but they do not cover all new identity workflows. |
| pp. 11–14, System Sequence Diagrams | Shows checkout, borrowing, return, reviewer open/upload, event registration, queueing, and volunteer privilege changes. | Preserved the core sequence and added validation, rollback, locking, idempotency, and failure outcomes in `SPEC.md`. | The revised design must prevent overselling, double borrowing, event overbooking, duplicate queue entries, and duplicate alerts. |
| p. 15, Configuration Model | Shows personal devices, web server, database server, third-party notification/QR services, and RFID scanning. | Replaced the generic deployment choices with SvelteKit, Supabase PostgreSQL, Cloudflare R2, Web Push, and a separate PostgreSQL-backed worker. QR creation and camera scanning are deferred. | The team chose a specific stack and reduced v1's physical scanning scope. |
| pp. 16–18, Architecture Decisions | AD-001 selects a composite linear/networked student navigation structure. AD-002 selects MVC. | Kept both decisions. Mapped MVC to SvelteKit models, views, controllers, and worker handlers. Kept the service rail as networked navigation and each service's list→detail→action flow as linear navigation. | This preserves the approved architecture while making it actionable in the selected framework. |
| pp. 19–20, Class and ER Diagrams | Shows users, admin/volunteer/student, tickets, registration adviser, cart, products, catalogues, borrowables, reviewers, libraries, events, and notifications. | Replaced the conceptual model with a PostgreSQL schema for users, roles, sessions, recovery codes, products, purchase snapshots, borrowable units/loans, courses/tags/reviewers, event prompts/answers, queue sessions/entries/advisers, notifications, messages, uploads, push subscriptions, audit logs, and jobs. | The original diagrams do not define keys, constraints, indexes, state fields, or transaction safety. |
| pp. 21–23, Data Flow Diagrams | Shows Level 0–2 flows among students, volunteers, interfaces, MEssentials, database, and scanner. | Converted flows into route groups, transaction rules, and background tasks. Removed dependence on external email and QR services for v1. | A data flow diagram is a useful map but is not an API or worker contract. |
| pp. 24–35, Algorithms | Includes purchase logging, stock updates, borrowing/returning, reviewer upload, event registration, queueing, and search/filter algorithms. | Added input checks, row locks, atomic stock decrement, event-capacity locking, unique constraints, job retries, and scanned-PDF fallback behavior. | The revised algorithms need to work under concurrent requests and recover from worker failures. |
| pp. 36–38, Data Structures and COTS | Lists arrays, hash maps, B-trees, inverted indexes, FIFO queues, enums, priority queues, OAuth, databases, file viewers, notification services, QR creation, and RFID hardware. | Selected PostgreSQL B-tree and GIN indexes, FIFO queue ordering, enums, and a PostgreSQL `jobs` table. Dropped Redis/BullMQ and external email. Retained a browser-native PDF viewer and HID barcode/ID scanner. | PostgreSQL is sufficient at the expected one-department scale and reduces service cost and handover burden. |
| pp. 41–44, Interface and Aesthetic Design | Defines the M3 navigation rail, content region, right-side filters, grid/list layouts, responsive intent, typography, colors, and accessibility goals. | Kept the M3 design system and added missing auth, recovery, verification, staff/admin, scanned-PDF, push onboarding, and mobile patterns to `UI_DESIGN.md`. | The old guide did not define screens needed by the expanded account and operations workflows. |
| pp. 45–48, Navigation Scenario Analysis | Counts 19 clicks, 10 keystrokes, 21 navigation actions, and 2 data-entry actions across six scenarios. | Retained the figures as a baseline and require revised screens to preserve or improve each flow's click budget. | It is the only measured navigation baseline in the source documents. |

---

## 3. Technical revisions applied to SPEC.md

### 3.1 Platform and architecture

- **Original:** KLP and KLP-1 describe a web app, MVC, PostgreSQL/MySQL as possible database choices, and a generic web/database deployment. The early proposal also shows mobile app-like screens.
- **Change:** The implementation stack is Svelte 5 + SvelteKit, Tailwind CSS, TypeScript, Supabase PostgreSQL, Cloudflare R2, Zod, Drizzle with the `postgres` driver, and `pnpm`. MVC remains the architecture. Runtime database access uses the Supabase transaction pooler with prepared statements disabled; migrations use the session pooler.
- **Reason:** The Claude discussion selected SvelteKit and PostgreSQL and confirmed `pnpm`. The pooler rules avoid unsupported prepared statements and session-level features.
- **Fallback:** To return to a generic stack, revert the stack table and repo layout in `SPEC.md` to the KLP-1 architecture description. To change the database provider, first write a new migration/connection plan and test transaction locks, generated columns, partial indexes, and GIN search. Do not switch providers by changing only an environment variable.

- **Current hosting decision:** Vercel hosts the web application. The final deployment model for the separate worker remains undecided and must not be inferred from the Vercel decision.

### 3.2 Authentication, sign-up, verification, and recovery

- **Original:** KLP p. 6 says students log in using UP Mail. KLP-1 pp. 3–4 describes login through UP mail but does not define first-time account creation, password recovery, or how to seed the first administrator.
- **Change:** Add two sign-in paths: Google OAuth using a verified `up.edu.ph` address, and username/email plus password. Password sign-up creates an unverified account, uses Cloudflare Turnstile, hashes passwords with Argon2id, and creates eight one-time 16-character recovery codes. Google sign-in verifies the same email. A Registration Manager or Admin may verify a physical UP ID and link its scanned code. Recovery uses a single-use code or a staff-issued temporary password that forces a password change. The first Admin is created by `pnpm seed:admin`.
- **Reason:** The system launches without pre-existing accounts. Email delivery was removed for cost, so the design needs an alternative proof and recovery path. The recovery codes are not a replacement for identity checks; staff still inspect a physical ID when needed.
- **Fallback:** To return to Google-only login, disable password registration/login and recovery routes, then migrate or link existing password accounts before removing `password_hash`, `username`, `recovery_codes`, and `auth_throttle`. To return to email-based reset, first select and configure an email provider, add verified-email tokens and delivery logs, and only then restore email reset routes. Do not remove recovery tables while active accounts still depend on them.

### 3.3 Role model and access control

- **Original:** KLP-1 pp. 3–8 separates Student, Volunteers, and Admins and lists five service manager roles. KLP's volunteer tasks are broader and less formal.
- **Change:** Every account is a Student. Volunteer status is one or more roles in `volunteer_roles`; Admin status is `is_admin`. A role matrix gates every management action. Admins inherit all service manager permissions. Sensitive actions create audit log entries. Unverified users can browse, buy, read reviewers, and message, but cannot borrow, register for events, or join the registration queue.
- **Reason:** This supports one student who manages more than one service and avoids a rigid one-role-per-user model. It also separates identity verification from service-role assignment.
- **Fallback:** To return to the simpler actor model, remove role-specific gates only after mapping every current volunteer to the broader volunteer permission set. Preserve `audit_logs` and role history until the organization confirms they are no longer needed.

### 3.4 Database platform and schema normalization

- **Original:** KLP-1 pp. 19–20 has conceptual class and ER diagrams. The diagrams do not fully define relational keys, unique constraints, normalization, or concurrency guards.
- **Change:** `SPEC.md` defines PostgreSQL tables, keys, foreign keys, checks, partial indexes, and indexes for all modules. The schema was reviewed through 3NF/BCNF and higher normal forms where relevant. The specific Claude review findings are handled as follows:

| Finding | Original concern | Applied result | Reason / fallback |
|---|---|---|---|
| 1. `products.name_normalized`, `borrowables.name_normalized` | Stored normalized text duplicates `name` and can become stale. | Use generated stored columns `lower(btrim(name))` with B-tree prefix indexes. | The database keeps the value in sync. Fallback: replace generated columns with expression indexes on `lower(btrim(name))`, update search queries, then drop the generated columns in a migration. |
| 2. `events.registrant_count` | A stored count duplicates rows in `event_registrations` and can drift. | Do not store `registrant_count`; count active registrations while holding the event row lock for sign-up. | The locked count is safe for capacity checks. Fallback: add a counter only after load tests show the count query is too slow; update it in the same transaction and reconcile it against the registration rows. |
| 3. `event_registrations.answers` JSON | Answers are a repeating group and do not link cleanly to prompt records. | Use `event_registration_answers(registration_id, prompt_id, answer)` with a composite primary key. | Each answer refers to a prompt and can be retained when prompts are archived. Fallback: only collapse answers into JSON if prompts are immutable and the team accepts weaker query and integrity rules. |
| 4. `reviewer_tags.course` | Course is a different concept from a free-form tag. | Use `courses`, `reviewer_courses`, and `reviewer_tags`/`reviewer_tag_map` separately. | Course names/codes are stored once and filter chips use stable IDs. Fallback: migrate course links into tags only if the app no longer needs course-specific filtering. |
| 5. Free-text borrowable/event categories | Free text permits inconsistent spellings and filter counts. | Use `borrowable_categories` and `event_categories` lookup tables. The Store already uses `product_categories`. | One canonical category row drives filtering and counts. Fallback: return to text only after exporting and mapping all category IDs to canonical labels; expect weaker integrity. |
| 6. Duplicate venue/location fields | The same venue could be stored in both a session and adviser. | Store the venue in `registration_sessions.location`; `advisers.desk` stores only a desk label. No second adviser location is defined. | Avoids conflicting venue values. Fallback: add adviser-specific location only if a real workflow requires advisers at different venues within one session. |
| 7. `borrowable_units.status` | It repeats whether an open loan exists. | Keep the status intentionally; update it under a row lock and guard one open loan with the partial unique index `one_open_loan_per_unit`. | It makes inventory lists fast while the database constraint guards consistency. Fallback: derive status from `borrow_records` if reconciliation finds drift; remove the status only after updating all reads/writes. |
| 8. `purchases.total` | It can be derived from purchase lines. | Keep the immutable total snapshot; purchases are not edited after insertion. | A stable receipt total is useful and does not drift if rows are immutable. Fallback: drop it only if purchases become editable and all reads can sum line items. |
| 9. `authors`, `components`, `participation_constraints` | Arrays/JSON are not atomic under strict 1NF. | Keep `reviewers.authors` and `borrowables.components` only for display; keep `events.participation_constraints` as one validated rule object. | There is no v1 filtering by individual authors/components. Normalize later if these become query dimensions or require independent edits. |
| 10. `users.year_standing` | Year standing changes over time. | Store `entry_year`; compute year standing from the academic-year start month. | Avoids stale standing values. Fallback: store a snapshot only if a historical event needs the standing at registration time; do not use it as the current profile value. |
| 11. Email notification fields | `notifications.email_status` and `notification_settings.email` become dead fields when email is dropped. | Do not include email delivery fields. Use `notification_settings.in_app`, `notification_settings.push`, `push_subscriptions`, and notification recipient rows. | Keeps the schema aligned with the no-email policy. Fallback: add email preference/status fields only with a real email provider and a defined delivery/retry policy. |

- **Additional constraints:** `purchase_items` has `UNIQUE (purchase_id, product_id)`; active `event_prompts` have a unique `(event_id, position)` index; `audit_logs` remains polymorphic by design. The schema review found no need to split the junction tables for 4NF/5NF.
- **Reason:** The changes address stale derived values, inconsistent labels, weak relationships, and duplicated facts without over-normalizing fields that are only displayed.
- **Fallback:** Use the per-finding rollback in the table. For a full schema rollback, restore the matching database backup and migration set from the previous release. Never run a down migration that drops data without a verified backup.

### 3.5 HonestME Store

- **Original:** KLP-1 use cases include product browsing, searching, filtering, cart operations, checkout, stock management, and metrics. The algorithm diagram shows stock validation and purchase logging.
- **Change:** Add product/category tables, immutable purchase and purchase-item snapshots (`unit_price`, `unit_cost`, quantity), atomic stock deduction, and manager metrics. Cart state stays in the browser until checkout. Store metrics are instantaneous aggregates only.
- **Reason:** The database must prevent a negative stock count and preserve the price/cost at the time of sale. The scope refinement defers advanced financial reporting.
- **Fallback:** To restore a simpler inventory-only store, disable checkout and metrics routes after exporting purchase records. Do not delete purchase history; it is needed for audit and later reporting.

### 3.6 ME-kailangan borrowing and station behavior

- **Original:** KLP-1 pp. 5–7 and pp. 12–13 describe borrowable items, units, borrowing/returning, a borrowing station, ID scanning, and RFID/QR references in diagrams.
- **Change:** Track each physical unit and each loan. Borrow/return operations use a transaction, a row lock, and a short-lived scan token tied to the unit, purpose, and borrower. The physical station is a standard browser. The student signs in, completes the transaction, and logs out or finishes the session. Staff manage physical security and logout practice. The application has no kiosk state, station account, auto-lockout, or station API token in v1.
- **Scanner change:** Student identity scanning uses USB HID keyboard-emulation ID/barcode hardware. It types the card code into a focused field and sends Enter. The code is linked to the student's profile after staff inspect the physical UP ID. Borrowable units have a human-readable label and a stored `qr_code` string as an identifier.
- **Deferred:** Dynamic QR SVG/PNG generation and client-side camera scanning are not part of v1. Do not build camera permission flows or QR generation endpoints now.
- **Reason:** The refinements explicitly simplify the physical model and defer QR features until core database, borrowing, and queue flows are stable. This avoids building and securing a special kiosk system before it is needed.
- **Fallback:** To restore kiosk support, first define device ownership, authentication, timeout, lockout, session reset, and threat model. Then add a dedicated station identity and API token flow. To restore camera QR, add a generated QR format/version, generation endpoint, camera permission UX, scanner library, and tests. Keep the current HID path as a fallback.

### 3.7 MEg-aral reviewer files and scanned-PDF fallback

- **Original:** KLP-1 includes reviewer upload and search. The earlier design assumes text extraction and a GIN full-text index. It does not define what happens when a scanned PDF has no text layer.
- **Change:** Reviewer PDFs upload to private Cloudflare R2 storage, with a 50 MB limit and signed preview/download URLs. The worker runs `pdftotext`. If fewer than 50 meaningful non-whitespace characters are found, it marks `has_selectable_text = false`, stores empty extracted text, and sets `index_status = 'ready'`. The management screen shows a scanned-PDF badge. A MEg-aral Manager or Admin can add course codes/tags and a manual summary/transcription up to 10,000 characters. The search vector uses title A, tags/course codes B, manual summary B, extracted text C. OCR is not used.
- **Reason:** A scanned PDF is still a valid reviewer file. Marking it failed would confuse a lack of text layer with an upload/indexing error. Manual metadata keeps it discoverable without OCR cost or complexity.
- **Fallback:** To return to text-only indexing, hide the manual summary form and remove the manual-summary term from the vector only after exporting its contents. Keep `has_selectable_text` and the scanned badge during the transition so managers can identify affected records. To add OCR later, create a separate opt-in job, define language/quality limits, and preserve the original PDF.

### 3.8 ME Days and registration queue

- **Original:** KLP-1 includes event registration, capacity, custom prompts, queue sessions, advisers, queue position, and manager operations.
- **Change:** Event registration uses an event-row lock and active-registration count; answers are stored in a normalized child table. The queue uses an atomic ticket counter, unique per-session student and queue-number constraints, 10-second client polling with ETags, and transactional “you’re next” alerts when the manager advances or changes the queue. Alerts are not queued as a separate job and do not fire just because a student joins at position one.
- **Reason:** These rules prevent overbooking, duplicate registration, duplicate queue entries, and duplicate alerts while keeping queue status private to each student.
- **Fallback:** To restore the old simpler queue, keep the session and entry records but disable adviser transfer and push alerts. Do not remove unique constraints or row locks unless a new concurrency design replaces them.

### 3.9 Notifications and communications

- **Original:** KLP/KLP-1 refer to notifications and messages; KLP-1 configuration/COTS material lists third-party notification/mail services.
- **Change:** In-app notifications are the source of truth. Optional Web Push uses a VAPID key pair, a service worker, and one `push_subscriptions` row per browser/device. External email, SMS, Telegram, Discord, and other messaging fallbacks are out of scope. iOS users need an Add to Home Screen onboarding banner and steps.
- **Reason:** The user raised cost concerns about email. Web Push has no per-message vendor charge, but browser permission and platform support are required. Keeping the in-app tab as the record avoids treating push delivery as guaranteed.
- **Fallback:** If Web Push is unreliable or not wanted, turn off push preferences and keep in-app notifications. To restore email, select a provider and define sender identity, cost, bounce handling, verification, unsubscribe rules, and data retention before adding email columns or jobs.

- **Draft communications boundary:** Direct messaging is excluded from the current draft. The final product is intended to replace it with a ticketing system; ticket fields, assignment, status, reply, notification, retention, and audit rules are intentionally deferred to final-product planning.

### 3.10 Background jobs and queue engine

- **Original:** KLP-1 lists a background worker/third-party queue as a possible COTS component. The first Claude SPEC draft used Redis and BullMQ.
- **Change:** Use PostgreSQL `jobs` and a custom Node worker. Claim jobs with `FOR UPDATE SKIP LOCKED`, use retry/backoff, leases/timeouts, dedupe keys, and a dead state. Use a separate always-on worker for long PDF extraction. Queue position updates remain client polling; “you’re next” alerts run in the queue transaction. Borrow reminders use an hourly database sweep. No Redis/BullMQ or `LISTEN/NOTIFY` is used.
- **Reason:** For a single department, Postgres is sufficient and removes Redis hosting and handover. SvelteKit request handlers are not a durable job runner. The worker must survive app restarts and avoid duplicate processing.
- **Fallback:** To restore Redis/BullMQ, provision Redis, migrate queued jobs and retry policy, replace the claim loop, and test idempotency before switching traffic. Keep the PostgreSQL queue until the new worker is proven. Do not use in-process Svelte timers as the durable queue. If moving to `pg_cron`, use a protected endpoint only for tasks with safe execution limits; keep long PDF work on a worker.

### 3.11 File uploads and storage

- **Original:** KLP-1 mentions reviewer processing, object storage, and file viewers but has no complete upload contract or hard limits.
- **Change:** Reviewer PDFs and app images use private R2 storage, presigned PUTs, a pending/completed upload state, size/type/magic-byte checks, short-lived signed URLs, and cleanup of expired pending uploads. PDF max is 50 MB; image max is 50 MB in the current config (configurable lower).
- **Reason:** Large files should not pass through the SvelteKit request process. Declared MIME type alone is not trustworthy, so the server checks the stored object.
- **Fallback:** To return to server-mediated uploads, implement streaming, size caps, timeout limits, and malware checks before removing presigned upload routes. To change image limits, update the environment variable and matching UI validation together.

### 3.12 User interface and responsive behavior

- **Original:** KLP-1 pp. 41–44 defines a Material Design 3 desktop rail, content panel, filter panel, grids, lists, and accessibility goals. The Claude-generated UI guide covers six main student screens but has no full account, staff/admin, or mobile specs.
- **Change:** Keep the M3 purple tokens, Roboto type scale, navigation rail, list/grid patterns, and desktop filter panel. Add M3 patterns for sign-in, sign-up, one-time recovery codes, unverified-account banner, staff verification, admin role tables, scanned-PDF metadata, and push opt-in. At viewport widths below 768px, change the rail to a bottom navigation bar and the right filter panel to an overlay modal drawer. Keep all six destinations accessible. Add iOS Safari instructions on Notifications and Profile when not in standalone mode.
- **Reason:** These screens are required by the revised auth and operations workflows. The mobile behavior is an explicit new requirement in the scope refinements, not a later optional phase.
- **Fallback:** Restore the previous desktop-only layout from `docs/archive/UI_DESIGN.pre-refinement.md`. Keep the new screens but render them with the old desktop shell if the responsive release must be paused. Do not remove account security or staff verification screens as a UI rollback.

### 3.13 Financial reporting boundary

- **Original:** KLP-1 includes product/store metrics and the store manager's ability to view metrics. It does not define a post-launch boundary for advanced reports.
- **Change:** V1 records stock deductions and immutable per-purchase snapshots (`unit_price`, `unit_cost`, `total`) and supports instantaneous per-product and aggregate store metrics. Defer historical sales charts, revenue graphs, custom date/semester filters, and CSV/Excel exports.
- **Reason:** The refinement says to verify baseline inventory logging before investing in advanced financial reporting. This limits scope without losing the transaction data needed later.
- **Fallback:** Re-enable advanced reports after purchase data has been reconciled and validated. Build charts and exports as a new module; do not change the immutable purchase snapshots.

### 3.14 Scope, estimates, and risk

- **Original:** KLP p. 13 and the scope note use 114 FP and a 28-day plan. KLP-1's navigation analysis counts the six student flows. The project risk list includes QR incompatibility and app turnover.
- **Change:** Keep 114 FP and 28 days as historical reference values only. Add a re-estimation task for account creation/recovery, PostgreSQL jobs, Web Push, staff/admin workflows, mobile UI, and scanned-PDF manual indexing. Retain DRE and the six navigation budgets. Treat QR camera scanning/generation and advanced financial analytics as deferred.
- **Reason:** The current implementation scope is larger than the original estimate. The refinements formalize deferred work and require the team to reconcile schedule/effort during technical debt sweeps.
- **Fallback:** To return to the original plan, use the original KLP schedule and effort tables as the planning baseline, but first remove the expanded features from the committed release scope. Do not label the old estimate as covering features that were added later.

---

## 4. Specific schema review verdicts

The following is the full disposition of the Claude normal-form review. The schema changes are already reflected in `SPEC.md`; items marked **retained by design** are not defects that require a forced normalization migration.

| # | Finding | Final disposition | Revert / future-change path |
|---:|---|---|---|
| 1 | Generated or expression index for normalized product/borrowable names | **Applied:** generated `name_normalized` columns and B-tree prefix indexes. | Replace with expression indexes only through a migration and query update. |
| 2 | Remove duplicate `events.registrant_count` | **Applied:** no stored counter; count under event row lock. | Add only after measured performance need and transactional reconciliation design. |
| 3 | Normalize event answers | **Applied:** `event_registration_answers` child table keyed by registration and prompt. | JSON only if prompts become immutable and integrity trade-offs are accepted. |
| 4 | Separate courses from reviewer tags | **Applied:** `courses` and `reviewer_courses` are separate from tags. | Merge only if course filters are removed. |
| 5 | Normalize borrowable/event categories | **Applied:** lookup tables; Store already uses `product_categories`. | Text categories require a data cleanup and migration. |
| 6 | Remove duplicate registration venue | **Applied:** one session venue; adviser stores desk only. | Add adviser location only for a proven multi-venue workflow. |
| 7 | `borrowable_units.status` duplicates open loan state | **Retained by design:** row-locked updates plus partial unique open-loan index. | Derive from loans if reconciliation finds drift. |
| 8 | `purchases.total` derives from line items | **Retained by design:** immutable receipt snapshot. | Remove only if purchases become editable. |
| 9 | `authors[]`, `components` JSON, event constraints JSON | **Retained by design:** display-only or one validated rule object; no v1 subfield filtering. | Normalize when individual values need filtering, linking, or independent updates. |
| 10 | `year_standing` changes over time | **Applied:** store `entry_year`; calculate current standing. | Store historical snapshots only for historical reporting. |
| 11 | Email status/preferences after email removal | **Applied:** no email columns; in-app and push only. | Add email fields only with a defined provider and delivery policy. |
| S1 | Unique `(purchase_id, product_id)` | **Applied:** unique constraint in `purchase_items`. | Keep unless multiple lines for one product in a purchase have a real business meaning. |
| S2 | Unique `(event_id, position)` for active prompts | **Applied:** partial unique index on non-archived prompts. | Preserve ordering integrity if prompt lifecycle changes. |
| S3 | Polymorphic audit log target | **Retained by design:** `target_type`, `target_id`, and JSON metadata. | Replace only if strict foreign keys per audited table become a requirement. |

---

## 5. Scope refinements checklist

| Refinement | Applied location | Status |
|---|---|---|
| No automated kiosk mode, device lockout, or isolated station session | `SPEC.md` 1.2, 1.3, 6.7; `UI_DESIGN.md` 4 and 9.9 | Applied |
| Standard browser login and manual logout/session handling at stations | `SPEC.md` 1.2 and 6.7; `UI_DESIGN.md` 9.9 | Applied |
| HID keyboard-emulation ID/barcode scan for student identity | `SPEC.md` 1.2, 6.7, 14.2 | Applied |
| Dynamic QR generation and camera scanning deferred | `SPEC.md` 1.3, 5.4; `UI_DESIGN.md` 9.9 | Applied |
| M3 auth/sign-up screen and one-time recovery-code step | `UI_DESIGN.md` 9.1; `SPEC.md` 6.2 | Applied |
| Account verification banner and staff ID-check guidance | `UI_DESIGN.md` 9.2; `SPEC.md` 6.11 | Applied |
| Staff and Admin tables for account/role operations | `UI_DESIGN.md` 9.3–9.4; `SPEC.md` 6.11 | Applied |
| Responsive bottom nav and filter drawer below 768px | `SPEC.md` 1.2, 11; `UI_DESIGN.md` 9.7 | Applied |
| Instant store metrics only; advanced financial reports deferred | `SPEC.md` 1.3, 11.1; `UI_DESIGN.md` 9.8 | Applied |
| In-app notification tab plus Web Push only | `SPEC.md` 1.3, 6.4, 8.5; `UI_DESIGN.md` 9.6 | Applied |
| iOS Safari Add to Home Screen instructions | `UI_DESIGN.md` 9.6; `SPEC.md` 8.5 | Applied |
| Scanned-PDF detection at fewer than 50 meaningful characters | `SPEC.md` 5.5, 6.8, 8.3; `UI_DESIGN.md` 9.5 | Applied |
| Manual tags/course codes and summary up to 10,000 chars | `SPEC.md` 5.5, 6.8, 8.3; `UI_DESIGN.md` 9.5 | Applied |
| Search vector weighting title A, tags B, summary B, extracted text C | `SPEC.md` 5.5 and 8.3 | Applied |
| Add PostgreSQL worker and Web Push/Argon2id/Turnstile/recovery codes to revision notes | `SPEC.md` 2, 5, 8; this file | Applied |
| Reconcile the old 114 FP / 28-day plan | `SPEC.md` 12 and 14; this file | Flagged for re-estimation; no unsupported new estimate invented |

---

## 6. Rollback and recovery procedure

### 6.1 Restore the pre-refinement Markdown files

The pre-refinement files were copied before the current revisions were applied:

- `docs/archive/SPEC.pre-refinement.md`
- `docs/archive/UI_DESIGN.pre-refinement.md`

To restore them in a working tree:

```bash
cp docs/archive/SPEC.pre-refinement.md SPEC.md
cp docs/archive/UI_DESIGN.pre-refinement.md UI_DESIGN.md
```

This restores the revision 2 SPEC and the prior UI guide. It does not undo database migrations or remove new data.

### 6.2 Return to the original academic baseline

The original files remain unchanged:

- `KLP.pdf`
- `KLP-1.pdf`

To use the original baseline for planning, refer to those PDFs and their original 114 FP / 28-day plan. Do not delete the revised Markdown files; keep them as a record of the implementation decisions. If a repository has committed revisions, use version control to restore the exact original PDFs rather than recreating them from text extraction.

### 6.3 Safe production rollback

1. Stop new deployments and pause the background worker.
2. Take a fresh database backup and record the current migration version.
3. Deploy the prior application version that matches the prior schema.
4. Restore the matching database backup, or run a reviewed down migration only if it is lossless and tested.
5. Restore the prior UI guide if the interface must match the old release.
6. Re-enable any old infrastructure only if the old application requires it. Do not start Redis, BullMQ, email, QR camera scanning, or kiosk services unless they were part of the exact version being restored.
7. Check sign-in, stock counts, open loans, event capacity, queue order, notification history, and reviewer files before reopening service.

### 6.4 Feature-level rollback

- **Web Push:** disable push in user settings and stop `push.fanout`; retain in-app notifications and subscriptions until no longer needed.
- **Postgres jobs:** pause the worker; do not delete queued jobs. Restore the previous job runner only after migrating pending jobs and verifying idempotency.
- **Recovery codes:** keep existing accounts usable. Disable new password sign-ups only after choosing a supported recovery path for current users.
- **Scanned-PDF manual indexing:** hide the editor, export manual summaries/tags, and preserve the data. Do not mark these valid PDFs as failed.
- **Mobile layout:** restore the old desktop shell from the archived UI guide while keeping all routes usable. This is a layout rollback, not a feature rollback.
- **Financial reporting:** advanced reports are not in v1. No rollback is needed; if a future report is deployed, disable that module without deleting purchase snapshots.
- **QR camera features:** they are not in v1. If a future QR scanner is added, retain the HID barcode path until the camera path passes device tests.

---

## 7. Known open decisions (not silently guessed)

The following remain operational choices or assumptions in `SPEC.md` section 14 and are centralized in `PROJECT_DEFINITIONS.md`: the final image upload cap; VAPID contact; Turnstile account setup; maximum active loans; loan duration; reminder lead time; queue alert position; rejoin policy for students who leave a queue; rate limits; idempotency-key retention; and final worker deployment model. Vercel is confirmed for the web application, and `up.edu.ph` is the only allowed sign-up domain.

The scope refinements themselves are treated as decisions, not open questions: no kiosk automation, no QR camera/generation in v1, no external message fallback, no direct messaging in the draft, no advanced financial reports in v1, mobile behavior below 768px, and the scanned-PDF manual indexing fallback. The final product ticketing replacement is recorded but not included in the draft.

## 9. Current document updates

- Vercel is the confirmed web application host; the worker deployment model remains TBD.
- Sign-up is restricted to the exact `up.edu.ph` domain.
- Academic-year calculation is removed. Forms may collect current year standing only when a workflow needs it.
- Changeable values are centralized in `PROJECT_DEFINITIONS.md`.
- Direct messaging is excluded from the draft. The final product is intended to use ticketing instead, but ticketing is not specified here.

## 10. Web mockup v1.0 decisions

- Missing mockup screens follow `UI_DESIGN.md` M3 standards and use simple, operational layouts when no reference design is supplied.
- The registration form includes First Name, Middle Initial, Surname, Student Number, Phone Number, College, Degree Program, and UP Mail local part with the fixed `@up.edu.ph` suffix.
- Volunteer management is list-first with filters, **Add entry**, and row-level **Edit/Modify** actions. The Admin dashboard follows the reference information architecture using M3 styling; reference images are not embedded in workflow files.
- Event registration uses a Google Forms-like builder with unlimited question/statement and answer-field blocks. Student Name and Student Number are included in the blank template and prefilled for signed-in students.
- Queueing uses a general visual treatment only for this mockup.
- Borrow and return do not repeat RFID scanning; the authenticated student session supplies identity.
- Notification settings are a separate Account settings section with a link to future iOS Web Push instructions. The instruction page may be omitted from mockup v1.0.
- Store products can be added and modified without a database through versioned browser storage. This persistence is mockup-only.


## 8. Follow-up decisions applied after review

This section records the later decisions that supersede earlier authentication and account-state descriptions in this file. Where sections 3.2, 3.3, or the scope checklist below conflict with this amendment, this section is the current decision.

### 8.1 UP Mail is required to create an account

- **Earlier revision:** A student could register with a typed email, username, and password, then prove identity later through Google OAuth or a staff check of a physical ID. This created unverified accounts and a permission split.
- **Current change:** A student must complete Google OAuth with `email_verified=true` and an exact `up.edu.ph` email domain before an account is created. The stable Google `sub` is stored as a required, unique `google_sub`. A typed email address alone never proves identity.
- **Optional password:** After Google sign-in, a student may set an Argon2id local password and use it for later login. To change or set a password, require the current password or a fresh Google re-authentication. A student who forgets the local password signs in through Google and sets a new one.
- **Removed:** Password-only account creation, unverified account state, `ACCOUNT_NOT_VERIFIED`, account verification by staff, recovery codes, recovery-code regeneration, staff-issued temporary passwords, and forced password-change state. Remove the related routes, UI steps, tests, and schema fields (`verified_at`, `verified_via`, `verified_by`, `must_change_password`, and `recovery_codes`). Keep `password_hash` nullable because Google-only accounts are valid.
- **Physical ID remains separate:** Staff may inspect a physical UP ID and link its HID-scanned card code to an existing Google-authenticated account. This link is used for borrowing and returns only. It does not verify the account or change permissions.
- **First Admin:** The designated UP Mail account must first sign in through Google. `pnpm seed:admin --email <verified-up-mail>` promotes that existing account; it must not create a password-only identity.
- **Reason:** Google verifies control of the UP Mail account at account creation. This removes the unverified permission branch and avoids recovery codes and staff password resets without adding an email service.
- **Migration note:** Before deploying this model, map existing accounts to verified Google subjects. Resolve duplicate email/subject conflicts manually. Do not auto-link a different Google subject to an existing account solely because the email strings match.

### 8.2 Search without OCR

- **Decision:** OCR remains out of v1. Scanned PDFs are detected by the existing `pdftotext` threshold and marked as having no selectable text. Managers can add tags, course links, and a manual summary of up to 10,000 characters.
- **Search behavior:** The GIN full-text vector ranks title (A), tags and course codes (B), manual summary (B), and extracted text (C). Exact tag and course filters use the normalized `reviewer_tag_map` and `reviewer_courses` relations. The vector supports keyword search; it does not replace relational filters or their counts.
- **Reason:** Tags, course links, title, and a short summary make scanned material findable without the cost and errors of OCR. Add OCR only if real use shows that users need to search text inside scanned pages and the team can test its accuracy and operating cost.

### 8.3 Repeated submissions and concurrency safety

- **Earlier behavior:** The specification described atomic stock decrement, row locks, unique constraints, and UI loading states. These prevent several race conditions, but did not prevent two repeated checkout requests from creating two purchases when stock remained.
- **Current change:** Add an `idempotency_keys` table and require an `Idempotency-Key` header for checkout, borrow, return, event registration, queue joining, and other non-repeatable writes. Scope each key to the authenticated user and operation. Store a hash of the canonical validated request and the final response status/body. Commit the idempotency record and business write in one transaction.
- **Replay rules:** Same user + operation + key + same request hash returns the saved response without repeating the write. Reusing a key with a different request hash returns `409 IDEMPOTENCY_KEY_REUSED`. If the transaction rolls back, the key reservation rolls back too. Retain keys for at least 24 hours **[ASSUMPTION]**.
- **Borrow scan tokens:** Persist a unique token ID/nonce and consume it once in the same transaction as the borrow or return write. Keep the unique open-loan index, event row lock/capacity check, and queue uniqueness constraints as final database safeguards.
- **UI behavior:** Disable the submit button and show a loading state while a request is in flight. This improves feedback but does not replace server-side idempotency, transactions, locks, or constraints.
- **Reason:** A double-click, retry after a timeout, or repeated network request should not create duplicate purchases, loans, registrations, or queue tickets.

### 8.4 Rate-limit scope after the auth change

- **Change:** Durable `auth_throttle` counters now cover local-password login failures only; there is no recovery endpoint to throttle. Keep the rule of five failures per identifier or IP in 15 minutes, with a 15-minute lock and Turnstile after three failures **[ASSUMPTION]**.
- **Additional protection:** Apply limits to OAuth start/callback and account creation. Other endpoint limits may remain in memory for one web instance; use Postgres or a shared limiter when running multiple instances. Keep the 20-message-per-hour per-user limit as an assumption until tested.

### 8.5 UI and test updates

- Replace password sign-up and recovery-code screens with a Google UP Mail sign-in screen and optional password setup/change in Profile security.
- Remove unverified-account banners, verification status controls, and temporary-password actions. Retain staff ID-card linking for physical borrow/return checks.
- Add tests for wrong-domain and unverified Google identities, duplicate email with a different Google subject, optional password setup/change, step-up authentication, session revocation, first-admin bootstrap, same-key replay, mismatched-payload rejection, concurrent checkout, and one-time scan-token use.


### 8.6 Current decision checklist corrections

| Topic | Current status |
|---|---|
| Google UP Mail required at account creation | Confirmed; supersedes earlier recovery-code and staff-verification design |
| Optional local password after Google sign-in | Confirmed |
| Recovery codes and temporary passwords | Removed from v1 |
| Physical ID card linking | Retained only for borrow/return scan matching |
| OCR | Deferred; manual tags/course links/summary remain |
| Search | GIN full-text ranking plus relational tag/course filters |
| Double-click/retry protection | Idempotency keys plus database transactions and constraints |
| Key retention | At least 24 hours; operational assumption to validate |


---

# Revision 5 — RFID login and Admin dashboard fields

This revision incorporates the latest RFID login decision and the supplied registration/Admin dashboard screenshots. It supersedes the earlier Revision 4 note that limited the scanned ID code to borrowing/return identity checks.

## 1. Authentication methods

- **Decision:** MEssentials offers three login methods: Google UP Mail (primary), RFID card tap, and username/email plus local password.
- **Account creation:** Students first establish an account through verified Google OAuth with an exact `@up.edu.ph` domain. RFID and local password are linked after account creation.
- **RFID login:** A student taps their registered UP ID. The USB HID reader types the identifier into the focused field and sends Enter. The backend hashes the received value, looks up the active card link, and creates a normal student session.
- **Security trade-off:** RFID-only login treats the card identifier as a bearer credential. It is not cryptographic card authentication. A lost or copied identifier may be used to sign in. v1 mitigations are rate limiting, generic errors, audit events, protected identifier storage, and student-controlled revocation/replacement.
- **Local login:** Username or email plus the optional Argon2id password. UP Mail remains the primary account creation and recovery path.

## 2. Student card-linking workflow

- Student signs in through UP Mail.
- Student completes the registration/profile fields: first name, middle initial, surname, student number, phone number, college, degree program, and UP Mail username.
- Student taps the UP ID while the RFID input is focused. The reader types the card identifier and sends Enter.
- The student submits the form; the backend links the card to the authenticated account and rejects a card already linked to another active account.
- The student may skip card linking and do it later in Profile.
- To replace a lost card, the student signs in with UP Mail, revokes the old card, and taps the replacement card.
- The system stores an HMAC-SHA-256 digest of the card identifier using a server-side secret, not the raw value. One active card per student and one account per active card are enforced.

## 3. Roles and staff process

- Students register their own RFID card to their own authenticated account.
- Staff can help with scanner issues but no longer perform account verification or issue temporary passwords.
- The same card can be used for borrowing/return identification, but transaction permissions remain separate from login.

## 4. Admin dashboard information architecture

The supplied screenshots add four Admin pages and define their data fields. Their visual style must follow Material Design 3, not copy the screenshot styling.

| Page | Filters | Table columns |
|---|---|---|
| Usage Logs | Service Type; Date Range Start; Date Range End | Usage Log ID; Service ID; Service Type; Student Number; Admin ID; Date Time Start; Date Time End; Location |
| Students | College Programs; Colleges; Is Active; Is Enrolled; Min Student Number; Max Student Number | Student Number; First Name; Middle Initial; Last Name; Email; Phone Number; College; Program |
| Services | Service Type; In Use | Service ID; Service Name; Service Type; In Use |
| Admins | Is Active | Admin ID; Nickname; Is Active |

The pages require server-side filters, sorting, and pagination, plus M3 loading, empty, and error states. Active and enrolled are separate student attributes. Service `In Use` means enabled/available in the app.

## 5. Files changed

- `SPEC.md`: login options, RFID card table, registration and revocation routes, rate limits, auth rules, dashboard data contract, and routes.
- `UI_DESIGN.md`: student card-linking form and the four M3 Admin dashboard pages.
- `messentials_user_roles_responsibilities.md`: student self-linking workflow, revised staff duties, and Admin dashboard responsibilities.

## 6. Assumptions to validate

- The RFID reader sends a stable card identifier and appends Enter. Confirm the reader's output format and whether it can be configured to send Enter.
- The scanner's identifier is suitable for use as a lookup secret only under the accepted UID-only risk. If the reader emits a public, cloneable UID, the documented risk remains.
- The exact student number format and whether min/max comparisons are numeric or lexical must be confirmed before implementation.
- Confirm the source of `Is Enrolled` and `Is Active` values and the service status rule for `In Use`.


---

# Revision 6 — Role-based dashboards and Admin directories

**Date:** 2026-11-09

## Decisions applied

### 1. Student and Volunteer navigation
- Students use the normal dashboard: Store, Events, Borrow, Reviewer, and Register.
- Volunteers retain those five pages and gain separate management links for each assigned role.
- Management pages edit service information without replacing the student-facing service pages.
- Store managers can add products and edit existing product details and stock through Manage Store. The same separate-workspace rule applies to Borrowables, Reviewers, Events, and the Registration Queue.

### 2. Separate Admin dashboard
- Admins do not see the normal student-service navigation.
- The Admin dashboard contains Usage Logs, Students, Volunteers, and Admins.
- Removed the Services directory page from the Admin dashboard. Service ID and Service Type remain visible in Usage Logs.

### 3. Admin directory data
- Students: Student Number, First Name, Middle Initial, Last Name, Email, Phone Number, College, Program. Filters: College, Degree Program, Is Active, Is Enrolled, and minimum/maximum Student Number.
- Volunteers: Student Number, First Name, Middle Initial, Last Name, Email, Volunteer Role(s), Is Active. Filters: Volunteer Role, College, Degree Program, Is Active.
- Admins: Admin ID, Nickname, Is Active. Filter: Is Active.
- Usage Logs: Usage Log ID, Service ID, Service Type, Student Number, Admin ID, Date Time Start, Date Time End, Location. Filters: Service Type and start/end date-time.
- All listed columns support ascending/descending server-side sorting. The active sort direction is shown with up/down arrows beside the column name.

### 4. Data exposure and M3 rules
- Directory tables show ordinary operational data only. They do not expose password hashes, OAuth subject IDs, session data, RFID identifier hashes, or other authentication/security fields.
- Admin pages use the existing Material Design 3 tokens and components. The supplied screenshots define information and fields, not a replacement visual style.
- Server-side role checks remain required even when a link is hidden in the UI.

## Files updated
- `SPEC.md`
- `UI_DESIGN.md`
- `messentials_user_roles_responsibilities.md`

## Notes
- The Admin ID maps to the stable user ID. Nickname maps to the user's username/display alias in the current data model.
- Sortable column names must be checked against a server-side allowlist; client-provided sort keys must never be inserted into SQL directly.
