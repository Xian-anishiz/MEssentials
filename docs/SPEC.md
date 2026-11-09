# MEssentials: Functional & Technical Blueprint (SPEC.md)

Version: KLP-1 (web app, updated). **Spec revision 3.** Date: 2026-11-09.
Team: Krispy Little Potatoes. Client: UP Diliman Department of Mechanical Engineering (DME), Mechanics Volcorps.

Companion files:
- `UI_DESIGN.md`: theme tokens, components, screens.
- `Changes.md`: every revision from the original KLP and KLP-1 documents and from spec revision 1, with reasons and fallback steps.
- `docs/archive/SPEC.pre-refinement.md`: the pre-refinement revision 2 snapshot.
- `docs/archive/UI_DESIGN.pre-refinement.md`: the UI guide before the expanded-screen and mobile additions.
- `Changes.md`: detailed revision history and rollback steps.

This file covers behavior, data, APIs, uploads, background jobs, and notifications.

Items marked **[ASSUMPTION]** are not stated in the project files or your answers. Confirm or change them. They are collected in section 14.

---

## 1. Purpose and Scope

### 1.1 Purpose

MEssentials is one web app for the DME student services that today are spread across Facebook, Messenger, Google Docs, Google Forms, and Google Sheets. It gives students one place to use these services and gives volunteers one place to run them.

| Service | Name in app | What students do |
|---|---|---|
| Honesty store | HonestME Store | Browse products, add to cart, check out |
| Item borrowing | ME-kailangan | Browse items, borrow and return units in the authenticated session |
| Review materials | MEg-aral | Search, preview, bookmark, and download reviewers |
| Events | ME Days | Browse events, register or unregister |
| Registration queue | Registration | Join the online queue, see position, get alerts |
| Notifications | Bell icon | Read alerts and service updates |

### 1.2 In scope

- Responsive web app built with SvelteKit and Tailwind CSS. Desktop uses the 80px navigation rail and 360px filter panel; viewports below 768px use an M3 bottom navigation bar and a modal filter drawer.
- Three actor groups: Student, Volunteer (five manager roles), Administrator.
- Three student login methods: Google UP Mail (primary), registered RFID card tap, and username/email plus an optional local password. New accounts are created through verified Google UP Mail; students may then link an RFID card and set a local password.
- Store, borrowing, reviewer, events, and registration queue features, each with student and manager functions.
- In-app notifications (the notification tab) and web push notifications.
- **Draft scope note:** Direct messaging is excluded from this draft. The final product is intended to replace it with a ticketing system; ticketing details are not part of this draft.
- File upload for reviewers and images.
- Background jobs in a PostgreSQL `jobs` table, claimed by a separate worker with `FOR UPDATE SKIP LOCKED`.
- Standard browser sessions on physical stations. Students sign in, complete the transaction, and log out or finish the session under the site’s human operating protocol; there is no kiosk mode, station account type, device lockout engine, or station-specific API token in v1.
- USB HID keyboard-emulation RFID scanning for student login and account linking. A student taps their UP ID; the reader types its configured card identifier into a focused field and sends Enter. Students link the card to their own account during registration or later in Profile. Borrowing and returning use the already authenticated student session. Dynamic QR generation and camera-based QR scanning are deferred; unit labels and stored `qr_code` strings remain catalog identifiers only.
- Scanned-PDF detection and manager-entered tags/summaries so image-only reviewers remain searchable without OCR.

### 1.3 Out of scope (this release)

- Native mobile apps. (The older preliminary mobile mockups are superseded.)
- Online payment. The store is an honesty store, so checkout only records a purchase.
- OCR for scanned PDFs. Image-only PDFs are detected and indexed from manual metadata; OCR is not part of v1.
- Dynamic QR-code image generation and browser-camera QR scanning.
- Kiosk automation, dedicated station authentication, device auto-lockout, and hardware session isolation.
- Email of any kind (verification, reset, notification), SMS, and third-party messaging fallbacks. System communications use the in-app notification tab and optional Web Push only.
- Redis and BullMQ; PostgreSQL is the durable job store.

### 1.4 Goals from the project files

- Remove the need for several external apps per task.
- Let students see their own queue status without exposing other students' data.
- Reduce clicks. The navigation scenario analysis totals 19 clicks, 10 keystrokes, 21 navigation actions, and 2 data-entry actions across six core scenarios. Keep each core flow at or under its counted clicks.
- Defect Removal Efficiency (DRE = E / (E + D)) is the quality metric. Track it per release.

### 1.5 Web mockup v1.0 boundary

The first frontend mockup is allowed to run without the production database. It must use the existing M3 UI rules and flows from `UI_DESIGN.md`, including the supplied registration-form fields, list-first volunteer management workspaces, screenshot-aligned Admin table layouts, a general queue view, the event form builder, and Account settings notification controls. Mockup-only Store products may be added and modified through versioned browser storage so the state survives reloads. This browser storage is not production persistence and must not replace the planned database.

The mockup does not include ticketing, repeated RFID scans during borrowing or returning, camera QR scanning, dynamic QR generation, kiosk controls, or academic-year calculation.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Svelte 5 with SvelteKit | Server-side rendering plus client navigation |
| Styling | Tailwind CSS | Tokens in `UI_DESIGN.md` |
| Backend | SvelteKit full-stack | API routes in `src/routes/api/v1/**/+server.ts` |
| Database | PostgreSQL on Supabase | Pooled connection strings only (section 3.2) |
| Object storage | Cloudflare R2 (S3-compatible) | Reviewer files and images |
| Web application hosting | Vercel | Confirmed for the SvelteKit web application |
| Background jobs | PostgreSQL `jobs` table + custom worker | Separate Node process (section 8) |
| Live updates | Client polling | Svelte timers, paused in hidden tabs (section 6.10) |
| Notifications | In-app tab + Web Push (VAPID) | `web-push` library, service worker (section 8.5) |
| Auth | Google OAuth + username/email and password | Cookie sessions |
| Bot protection | Cloudflare Turnstile | Free tier. Sign-up and repeated login failures |
| Validation | Zod | Shared between client and server |
| ORM / query layer | Drizzle ORM with `postgres` driver | Any typed query layer must disable prepared statements when used with the transaction pooler |
| Password hashing | argon2id via `@node-rs/argon2` | Prebuilt binaries, no native build step |
| PDF text extraction | `pdftotext` (poppler-utils) | Needs the binary on the worker host **[ASSUMPTION]** |
| Language | TypeScript everywhere | |
| Package manager | **pnpm** | Confirmed |

### 2.1 Architecture pattern

The project chose MVC (decision AD-002) and a composite linear plus networked structure for navigation (AD-001). Map them like this:

| MVC part | Location |
|---|---|
| Model | `src/lib/server/models/*` (query functions and domain rules, one file per service) |
| View | `src/routes/**/+page.svelte` and `src/lib/components/**` |
| Controller | `src/routes/**/+page.server.ts` and `src/routes/api/v1/**/+server.ts` (thin: parse, authorize, call model, respond) |
| Worker | `src/worker/*` (job handlers, call the same models) |

Navigation (AD-001): the left rail is the "networked" part (jump to any service from anywhere). Inside each service, flow goes down a linear path (list, detail, action).

### 2.2 Suggested repo layout

```
src/
  lib/
    components/          # Svelte UI (see UI_DESIGN.md)
    server/
      db/                # client, schema, migrations
      models/            # store, borrowing, reviewers, events, registration, notifications, users
      auth/              # sessions, Google OAuth, optional password, throttle
      storage/           # R2 client, presign, verify
      jobs/              # enqueue(), claim(), worker loop, scheduler
      push/              # web-push sender, subscription helpers
      validation/        # Zod schemas
    shared/              # types, constants, enums
  routes/
    (app)/store|borrow|reviewer|events|register|notifications|profile
    (staff)/staff/...
    (admin)/admin/...
    api/v1/...
  service-worker.ts      # push + notificationclick handlers
  worker/
    index.ts             # starts the worker loop and scheduler
    handlers/            # one file per job name
static/
  manifest.webmanifest   # installable web app (needed for push on iOS)
scripts/
  seed-admin.ts          # creates the first administrator
  import/                # one-off migration scripts
```

### 2.3 pnpm setup

- Install pnpm through Corepack: `corepack enable`. Pin the version in `package.json`: `"packageManager": "pnpm@<version>"` (use the current pnpm 10.x release).
- Commit `pnpm-lock.yaml`. In CI and on the server use `pnpm install --frozen-lockfile`.
- Set `"engines": { "node": ">=22" }` **[ASSUMPTION]** and add `.npmrc` with `engine-strict=true`.
- pnpm 10 blocks dependency build scripts by default. If a package needs one, list it in `package.json` under `pnpm.onlyBuiltDependencies`. `@node-rs/argon2` ships prebuilt binaries, so it needs none.
- Scripts:

| Script | Purpose |
|---|---|
| `pnpm dev` | Run SvelteKit in development |
| `pnpm build` / `pnpm preview` | Production build and preview |
| `pnpm worker` | Run the background worker process |
| `pnpm db:migrate` | Apply migrations through `DATABASE_URL_MIGRATE` |
| `pnpm seed:admin` | Create the first administrator (prompts in the terminal) |
| `pnpm vapid:generate` | Print a new VAPID key pair (`web-push generate-vapid-keys`) |
| `pnpm test` / `pnpm test:e2e` | Vitest and Playwright |
| `pnpm lint` / `pnpm check` | ESLint and `svelte-check` |

---

## 3. Environments and Configuration

### 3.1 Environment variables

```
# App
PUBLIC_APP_URL=
NODE_ENV=
SESSION_SECRET=
ALLOWED_EMAIL_DOMAINS=up.edu.ph

# Database (Supabase, pooled only)
DATABASE_URL=            # transaction pooler, port 6543, used by the web app and worker
DATABASE_URL_MIGRATE=    # session pooler, port 5432 on the pooler host, used only by migrations

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudflare Turnstile
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PRESIGN_TTL_SECONDS=300

# Web Push (VAPID)
PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=           # a mailto: or https: contact for push services, e.g. mailto:mevolcorps@example.org

# Worker
WORKER_POLL_INTERVAL_MS=3000
WORKER_CONCURRENCY=3
WORKER_DB_POOL_MAX=5

# Upload limits (bytes); keep the changeable definitions in PROJECT_DEFINITIONS.md
MAX_UPLOAD_PDF_BYTES=52428800        # 50 MB current draft definition
MAX_UPLOAD_IMAGE_BYTES=              # TBD; use PROJECT_DEFINITIONS.md

# Business rules; final values belong in PROJECT_DEFINITIONS.md
MAX_ACTIVE_LOANS=                    # TBD
MAX_LOAN_DAYS=                       # TBD
BORROW_REMINDER_LEAD_DAYS=           # TBD
REGISTRATION_ALERT_POSITION=         # TBD
```

There is no `REDIS_URL` and there are no email variables in this revision.

### 3.2 Supabase connection rules

Database access is strictly through pooled connection strings. Follow these rules everywhere (web app, worker, scripts):

1. Never use the direct database host.
2. Runtime traffic uses the **transaction pooler** string (port 6543).
3. Disable prepared statements in the driver (`prepare: false` for `postgres`), because the transaction pooler does not support them.
4. A transaction (`BEGIN` ... `COMMIT`) must run on one checked-out connection. Use the ORM's `db.transaction()` helper. Do not issue `BEGIN` across separate calls.
5. Do not use session features in runtime code: `LISTEN/NOTIFY`, session-level advisory locks, `SET` without `LOCAL`, temp tables that outlive a transaction. The job worker polls and does not use `LISTEN/NOTIFY`.
6. Migrations use the **session pooler** string (pooler host, port 5432). This is still pooled and supports the DDL features migrations need.
7. Keep the app's connection pool small (for example max 10 per web instance, `WORKER_DB_POOL_MAX` for the worker) so the pooler is not exhausted.

Use row locks (`SELECT ... FOR UPDATE`, `FOR UPDATE SKIP LOCKED`) and atomic `UPDATE ... WHERE` guards for concurrency. All of these work in transaction mode when they run inside one statement or one transaction.

---

## 4. Roles, Identity, and Permissions

### 4.1 Model

- Every account is a **Student**.
- A **Volunteer** is a student with one or more volunteer roles.
- An **Administrator** is a student with `is_admin = true`. Admins have all volunteer powers.

| Volunteer role (enum `volunteer_role`) | Manages |
|---|---|
| `store_manager` | HonestME Store |
| `kailangan_manager` | ME-kailangan |
| `megaral_manager` | MEg-aral |
| `medays_manager` | ME Days |
| `registration_manager` | Registration queue |

### 4.2 Account identity and access

Every account is created only after a successful Google OAuth sign-in with a Google-verified `@up.edu.ph` address. The application checks both the `email_verified` claim and the exact normalized domain. An address typed into a form is not proof of identity.

There is no unverified account state and no staff account-verification step. Once OAuth succeeds, the account has the same student permissions as every other student. Profile completion remains a separate requirement for workflows that need profile data.

Students may link their own UP ID RFID card to their account while signed in, during the first registration form or later in Profile. The USB HID reader types the card identifier into the focused field and sends Enter. The backend links the card only to the currently authenticated student, rejects identifiers already linked to another active account, and stores only a protected identifier digest. RFID login is unavailable until this link succeeds. After linking, a tap can authenticate the student. Students can revoke a lost card and link a replacement after signing in through UP Mail. A Registration Manager may help with reader troubleshooting but cannot bypass the student's authentication or link a card to an account on the student's behalf.

A local password is optional. A student may set one after signing in through UP Mail and then use either Google sign-in or the local password. If the student forgets the local password, they sign in through Google and set a new password while logged in. No recovery codes or staff-issued temporary passwords are used.

### 4.3 Permission matrix

| Capability | Student | Volunteer (matching role) | Admin |
|---|---|---|---|
| Sign up, log in, edit own profile, and notification settings | Yes | Yes | Yes |
| View, search, filter in all services | Yes | Yes | Yes |
| Cart and check out | Yes | Yes | Yes |
| Borrow and return (authenticated account; registered RFID may identify the student) | Yes | Yes | Yes |
| Open, bookmark, download reviewers | Yes | Yes | Yes |
| Register or unregister for events | Yes | Yes | Yes |
| Join or leave registration queue | Yes | Yes | Yes |
| Direct messaging | Excluded from this draft | Excluded from this draft | Excluded from this draft |
| Add or edit products, restock, view store metrics | No | `store_manager` | Yes |
| Add or edit borrowables and units, view borrowing details | No | `kailangan_manager` | Yes |
| Add or edit reviewers, toggle visibility | No | `megaral_manager` | Yes |
| Add or edit events, view registrants | No | `medays_manager` | Yes |
| Open or close queue, view queue, manage advisers | No | `registration_manager` | Yes |
| Link or update a physical ID card after inspection | No | `registration_manager` **[ASSUMPTION]** | Yes |
| Grant or remove volunteer roles, grant admin (not self) | No | No | Yes |

Enforce permissions in the model or a shared `authorize()` helper, not only in the UI.

### 4.4 Role-based navigation and dashboards

The app has one shared student-service dashboard and role-specific management links:

- **Students:** show the normal service navigation: Store, Events, Borrow, Reviewer, and Register. Students do not see management links.
- **Volunteers:** retain the same five student-service destinations and gain management links only for the volunteer roles they hold. A manager link opens the relevant edit/manage area; it does not replace the normal service page. Examples: Store plus **Manage Store** (add products, edit item details, update stock); Borrow plus **Manage Borrowables** (edit catalog items and units); Reviewer plus **Manage Reviewers** (upload, edit metadata, and manage visibility); Events plus **Manage Events** (create and edit events and view registrants); Register plus **Manage Queue** (configure sessions, advisers, and queue operations). A volunteer with several roles sees each matching management link.
- **Administrators:** do not use the normal student-service dashboard as their home or navigation. They use the Admin dashboard only, with **Usage Logs**, **Students**, **Volunteers**, and **Admins**. Admins retain system-level management permissions through the Admin area; do not show the normal Store, Events, Borrow, Reviewer, or Register destinations in the Admin navigation.

The role-based navigation is a presentation rule, not an authorization boundary. Every management route and API must still check the user's role on the server.


---

## 5. Database Schema

PostgreSQL. All ids are `uuid` with `default gen_random_uuid()` unless noted. All tables have `created_at timestamptz not null default now()`. Mutable tables also have `updated_at`. Money uses PostgreSQL `numeric(10,2)` and is displayed in Philippine pesos (₱).

Extensions: `pgcrypto` (or built-in `gen_random_uuid`), `citext`, `pg_trgm` (optional, for fuzzy search).

The schema was reviewed for 1NF, 2NF, 3NF, BCNF, 4NF, and 5NF. The applied fixes and deliberate exceptions are listed in section 5.11 and `Changes.md`.

### 5.1 Enums

```sql
CREATE TYPE volunteer_role AS ENUM
  ('store_manager','kailangan_manager','megaral_manager','medays_manager','registration_manager');
CREATE TYPE service AS ENUM ('store','kailangan','megaral','medays','registration','system');
CREATE TYPE unit_status AS ENUM ('available','borrowed','unavailable');
CREATE TYPE visibility AS ENUM ('visible','hidden');
CREATE TYPE index_status AS ENUM ('pending','processing','ready','failed');
CREATE TYPE session_status AS ENUM ('open','closed');
CREATE TYPE queue_status AS ENUM ('waiting','called','completed','left','removed');
CREATE TYPE adviser_status AS ENUM ('available','busy','offline');
CREATE TYPE recipient_kind AS ENUM ('to','cc');
CREATE TYPE upload_purpose AS ENUM
  ('reviewer_file','reviewer_preview','product_image','event_image','borrowable_image','unit_image','avatar');
CREATE TYPE upload_status AS ENUM ('pending','completed','rejected','expired');
CREATE TYPE job_status AS ENUM ('queued','running','succeeded','dead');
```

### 5.2 Identity and access

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,                  -- Google-verified UP Mail address
  username citext UNIQUE
    CHECK (username ~ '^[a-z0-9_.]{3,32}$'),     -- optional profile/login alias
  password_hash text,                            -- optional Argon2id password
  google_sub text NOT NULL UNIQUE,               -- every account is linked to Google identity
  first_name text,
  middle_initial text,
  last_name text,
  student_number text UNIQUE,
  phone_number text,
  college text,
  degree_program text,
  is_active boolean NOT NULL DEFAULT true,
  is_enrolled boolean NOT NULL DEFAULT true,
  avatar_key text,                               -- R2 key
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (google_sub IS NOT NULL)
);

-- RFID cards are login credentials. Store a protected digest of the scanner output,
-- not the raw card value. One active card identifier can belong to one account.
CREATE TABLE student_rfid_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identifier_hash text NOT NULL UNIQUE,       -- HMAC-SHA-256 using a server-side pepper
  display_suffix text,                        -- optional masked hint for the student's profile
  registered_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text
);
CREATE INDEX student_rfid_cards_user_active
  ON student_rfid_cards (user_id) WHERE revoked_at IS NULL;
-- Enforce one active RFID card per student for v1.
CREATE UNIQUE INDEX one_active_rfid_card_per_student
  ON student_rfid_cards (user_id) WHERE revoked_at IS NULL;

CREATE TABLE volunteer_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role volunteer_role NOT NULL,
  granted_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE sessions (
  id_hash text PRIMARY KEY,                      -- sha256 of the session token
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  user_agent text,
  ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON sessions (user_id);
CREATE INDEX ON sessions (expires_at);

CREATE TABLE auth_throttle (                     -- local-password login failure counters (no Redis)
  key text PRIMARY KEY,                          -- e.g. 'password_login:ip:1.2.3.4', 'password_login:user:<uuid>'
  failures integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

-- Request replay protection for sensitive mutations. The key and the business
-- write are committed in the same transaction. A retry with the same key and
-- request hash receives the saved response; a different payload gets 409.
CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,                 -- SHA-256 of canonical validated request body
  response_status smallint,                   -- null only inside the uncommitted transaction
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE (user_id, operation, idempotency_key),
  CHECK ((response_status IS NULL) = (response_body IS NULL))
);
CREATE INDEX idempotency_keys_expiry_idx ON idempotency_keys (expires_at);

CREATE TABLE notification_settings (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service service NOT NULL,
  in_app boolean NOT NULL DEFAULT true,          -- show in the notification tab
  push boolean NOT NULL DEFAULT true,            -- send web push to subscribed devices
  PRIMARY KEY (user_id, service),
  CHECK (NOT push OR in_app)                     -- push needs the in-app row
);
-- A missing row means the defaults (in_app = true, push = true).

CREATE TABLE push_subscriptions (                -- one row per browser or device
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz
);
CREATE INDEX ON push_subscriptions (user_id);

CREATE TABLE audit_logs (                        -- privilege changes and other sensitive actions
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,                          -- e.g. 'volunteer_roles.update', 'account.verify'
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Profile complete** means `first_name`, `last_name`, and `student_number` are set. Joining the registration queue and registering for events require a complete profile (matches the "Prompt student profile update" step).

Do not calculate year standing from an entry year. If a workflow needs current year standing, add a `current year standing` field to that workflow's form and validate it for that workflow. See `PROJECT_DEFINITIONS.md`.

### 5.3 HonestME Store

```sql
CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE                      -- Chips, Coffee, Candy, Stationery, Biscuits...
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_normalized text GENERATED ALWAYS AS (lower(btrim(name))) STORED,
  category_id uuid NOT NULL REFERENCES product_categories(id),
  unit_cost numeric(10,2) NOT NULL CHECK (unit_cost >= 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_key text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- B-tree prefix index for name search (algorithm: indexed product search)
CREATE INDEX products_name_prefix_idx ON products (name_normalized text_pattern_ops);
CREATE INDEX products_category_idx ON products (category_id);
CREATE INDEX products_price_idx ON products (unit_price);

CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id),
  total numeric(10,2) NOT NULL,                  -- kept on purpose, purchases are never edited (section 5.11)
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,             -- price snapshot at purchase time
  unit_cost numeric(10,2) NOT NULL,              -- cost snapshot, used for profit
  UNIQUE (purchase_id, product_id)               -- one line per product per purchase
);
CREATE INDEX ON purchase_items (product_id);
```

`name_normalized` is a generated column. Code never writes it.

Store metrics are **derived**, not stored:

- Total sales for a product = `SUM(quantity * unit_price)` over `purchase_items`.
- Total profit = `SUM(quantity * (unit_price - unit_cost))`.
- Quantity bought = `SUM(quantity)`.
- Store metrics = the sum of per-product metrics (use a materialized view or cached query if slow).

### 5.4 ME-kailangan

```sql
CREATE TABLE borrowable_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE                      -- school supplies, utilities, recreational
);

CREATE TABLE borrowables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_normalized text GENERATED ALWAYS AS (lower(btrim(name))) STORED,
  category_id uuid NOT NULL REFERENCES borrowable_categories(id),
  description text,
  components jsonb NOT NULL DEFAULT '[]',        -- component list (display only, section 5.11)
  image_key text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON borrowables (name_normalized text_pattern_ops);
CREATE INDEX ON borrowables (category_id);

CREATE TABLE borrowable_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrowable_id uuid NOT NULL REFERENCES borrowables(id) ON DELETE CASCADE,
  label text NOT NULL,                           -- e.g. "Calculator #3"
  qr_code text NOT NULL UNIQUE,                  -- stored unit identifier; dynamic QR image generation/camera scan deferred
  image_key text,
  status unit_status NOT NULL DEFAULT 'available',  -- kept on purpose (section 5.11)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON borrowable_units (borrowable_id, status);

-- A scan token is bound to one unit, purpose, and student, and can be consumed once.
CREATE TABLE borrowing_scan_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES borrowable_units(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('borrow','return')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX borrowing_scan_tokens_expiry_idx ON borrowing_scan_tokens (expires_at);

CREATE TABLE borrow_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES borrowable_units(id),
  borrower_id uuid NOT NULL REFERENCES users(id),
  borrowed_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  reminded_due_soon_at timestamptz,              -- set by the hourly reminder sweep
  reminded_overdue_at timestamptz                -- set by the hourly reminder sweep
);
-- A unit can have only one open loan
CREATE UNIQUE INDEX one_open_loan_per_unit ON borrow_records (unit_id) WHERE returned_at IS NULL;
CREATE INDEX ON borrow_records (borrower_id) WHERE returned_at IS NULL;
CREATE INDEX ON borrow_records (due_at) WHERE returned_at IS NULL;
```

Derived values for a borrowable: `total_quantity` = count of units, `quantity_available` = units with status `available`, `quantity_borrowed` = units with status `borrowed`.

### 5.5 MEg-aral

```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                     -- e.g. "ME 21"
  name text
);

CREATE TABLE reviewer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE reviewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authors text[] NOT NULL DEFAULT '{}',          -- display only (section 5.11)
  description text,
  file_key text NOT NULL,                        -- R2 key of the PDF
  file_size_bytes bigint NOT NULL,
  preview_image_key text,
  visibility visibility NOT NULL DEFAULT 'hidden',
  index_status index_status NOT NULL DEFAULT 'pending',
  index_error text,
  has_selectable_text boolean,                 -- false when extraction yields fewer than 50 meaningful characters
  search_vector tsvector,
  published_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Inverted index for search
CREATE INDEX reviewers_search_idx ON reviewers USING GIN (search_vector);
CREATE INDEX ON reviewers (visibility, published_at DESC);

CREATE TABLE reviewer_tag_map (
  reviewer_id uuid NOT NULL REFERENCES reviewers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES reviewer_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (reviewer_id, tag_id)
);

CREATE TABLE reviewer_courses (                  -- drives the Course 1/2/3 filter chips
  reviewer_id uuid NOT NULL REFERENCES reviewers(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (reviewer_id, course_id)
);

CREATE TABLE reviewer_texts (                    -- extracted text, kept out of the main table
  reviewer_id uuid PRIMARY KEY REFERENCES reviewers(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  manual_summary text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviewer_bookmarks (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES reviewers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, reviewer_id)
);
```

Search vector weights (set by the index job and refreshed after manager edits): title = A, tags/course codes = B, manual summary = B, extracted text = C. Build the tags/course-code text by joining the reviewer's linked `reviewer_tag_map` and `reviewer_courses` rows to their canonical names/codes; do not assume tags or courses are duplicate free-text columns on `reviewers`. The GIN vector supports keyword search and ranking. The relational tag and course tables support exact filter chips and counts; apply those filters with joins or `EXISTS` clauses in addition to the vector match. A scanned-PDF marker is stored separately from the text so the UI can explain why automatic text search has no extracted content.

### 5.6 ME Days

```sql
CREATE TABLE event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE                      -- recreational, academic, career
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES event_categories(id),
  description text,
  image_key text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  capacity integer CHECK (capacity IS NULL OR capacity > 0),   -- null = unlimited
  participation_constraints jsonb NOT NULL DEFAULT '{}',        -- e.g. {"current_year_standing":[1,2]} when a form requires it (section 5.11)
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON events (starts_at, name);
CREATE INDEX ON events (category_id);

CREATE TABLE event_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  position smallint NOT NULL,
  prompt text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  archived_at timestamptz                        -- prompts with answers are archived, not deleted
);
CREATE UNIQUE INDEX event_prompt_position ON event_prompts (event_id, position) WHERE archived_at IS NULL;

CREATE TABLE event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);
CREATE UNIQUE INDEX one_active_registration ON event_registrations (event_id, user_id) WHERE cancelled_at IS NULL;
CREATE INDEX ON event_registrations (user_id) WHERE cancelled_at IS NULL;
CREATE INDEX ON event_registrations (event_id) WHERE cancelled_at IS NULL;

CREATE TABLE event_registration_answers (
  registration_id uuid NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES event_prompts(id) ON DELETE RESTRICT,
  answer text NOT NULL,
  PRIMARY KEY (registration_id, prompt_id)
);
```

The registrant count is **not stored**. Count active rows in `event_registrations` while holding the event row lock (section 6.9).

A student can register when: the account is verified, the event is published and in the future, registration is within its open window, the profile passes `participation_constraints`, and capacity is not full. This matches the "registrable and profile passes constraints" branch in the swimlane diagram.

### 5.7 Registration queue

```sql
CREATE TABLE registration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                            -- e.g. "AY 2026-2027 Sem 2"
  status session_status NOT NULL DEFAULT 'closed',
  last_ticket integer NOT NULL DEFAULT 0,        -- atomic counter for queue numbers
  location text,                                 -- the venue (for example the IE-ME Building room)
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Only one open session at a time
CREATE UNIQUE INDEX one_open_session ON registration_sessions ((true)) WHERE status = 'open';

CREATE TABLE advisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  field text,
  status adviser_status NOT NULL DEFAULT 'offline',
  desk text                                      -- table or desk label inside the venue
);

CREATE TABLE queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES registration_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  queue_number integer NOT NULL,
  status queue_status NOT NULL DEFAULT 'waiting',
  adviser_id uuid REFERENCES advisers(id),
  notified_next_at timestamptz,                  -- set when the "you're next" alert is created
  joined_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  finished_at timestamptz,
  UNIQUE (session_id, user_id),                  -- one entry per student per session
  UNIQUE (session_id, queue_number)
);
CREATE INDEX ON queue_entries (session_id, status, queue_number);
```

Position of a waiting student = `1 + COUNT(waiting entries in the same session with a lower queue_number)`.

Registration details shown to a student: queue number, adviser name, adviser desk, and session venue (`registration_sessions.location`).

### 5.8 Notifications

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service service NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  link text,                                     -- in-app path
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_recipients (
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz,
  deleted_at timestamptz,
  pushed_at timestamptz,                         -- set when push delivery was attempted for this user
  PRIMARY KEY (notification_id, user_id)
);
CREATE INDEX ON notification_recipients (user_id, deleted_at, read_at);
CREATE INDEX ON notification_recipients (notification_id) WHERE pushed_at IS NULL;

```

The `notifications` table has no email columns in this revision. Direct messaging and ticketing are excluded from this draft. The final product is intended to replace direct messaging with a separately specified ticketing system.

### 5.9 Uploads

```sql
CREATE TABLE uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  purpose upload_purpose NOT NULL,
  object_key text NOT NULL UNIQUE,
  declared_mime text NOT NULL,
  declared_size_bytes bigint NOT NULL,
  verified_size_bytes bigint,
  status upload_status NOT NULL DEFAULT 'pending',
  reject_reason text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON uploads (status, expires_at);
```

### 5.10 Background jobs

```sql
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue text NOT NULL,                           -- 'push', 'reviewers', 'maintenance'
  name text NOT NULL,                            -- e.g. 'push.fanout'
  payload jsonb NOT NULL DEFAULT '{}',
  status job_status NOT NULL DEFAULT 'queued',
  run_after timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  timeout_seconds integer NOT NULL DEFAULT 120,  -- a running job older than this is treated as stuck
  locked_at timestamptz,
  locked_by text,
  last_error text,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX jobs_claim_idx ON jobs (queue, run_after) WHERE status = 'queued';
CREATE INDEX jobs_running_idx ON jobs (locked_at) WHERE status = 'running';
CREATE UNIQUE INDEX jobs_dedupe_key_idx ON jobs (dedupe_key) WHERE dedupe_key IS NOT NULL;
```

### 5.11 Normalization notes

The schema is in 3NF, with BCNF for all key-based tables. These are deliberate exceptions:

| Where | Exception | Why it stays | When to change it |
|---|---|---|---|
| `borrowable_units.status` | Repeats the fact "an open loan exists" | Updated under a row lock. The partial unique index `one_open_loan_per_unit` guards the pair. Lets list queries avoid a join | If drift is ever found, derive it from `borrow_records` |
| `purchases.total` | Derived from `purchase_items` | Purchases are never edited after insert | If purchases become editable, drop it and sum the lines |
| `reviewers.authors` (text[]) | Not atomic | Only displayed; no author-level filtering is in v1 | If you need to filter or link by author, add `authors` and `reviewer_authors` tables |
| `borrowables.components` (jsonb) | Not atomic | Only displayed; no component-level filtering is in v1 | If you need to filter by component, add a `borrowable_components` table |
| `events.participation_constraints` (jsonb) | Not atomic | Read and validated as one rule object by the app | If rules grow, add a constraints table |
| `audit_logs.target_type`, `target_id`, `metadata` | Polymorphic target, loose metadata | An audit trail should not need a foreign key per table | None |
| `queue_entries.notified_next_at` | Event timestamp stored next to state | Needed for exactly-once alerts | None |
| `reviewer_texts.manual_summary` | Free text in a separate one-to-one extension row | Manager-entered fallback text is searchable and belongs to the reviewer text payload; it is not a repeating group | Normalize into versioned annotations only if multiple independent summaries or authors are needed |
| Category and course names | Stored once in lookup tables (`product_categories`, `borrowable_categories`, `event_categories`, `courses`) and linked by ids | Prevents case variants and makes counts/renames consistent | Keep this pattern for new filter dimensions |
| Registration venue | Stored in `registration_sessions.location`; `advisers.desk` stores only a desk label | Avoids duplicate venue facts across advisers | Add adviser-specific location only if advisers can serve at distinct venues within one session |

---

## 6. API

### 6.1 Conventions

- Base path: `/api/v1`. JSON in, JSON out. UTF-8.
- Auth: session cookie (`__Host-session`, `HttpOnly`, `Secure`, `SameSite=Lax`). All routes need a session unless marked **Public**.
- CSRF: SvelteKit origin check on non-GET requests, plus `SameSite=Lax`.
- Validation: Zod on every body, query, and param. Reject unknown fields.
- Pagination: `?page=1&pageSize=24` (max 100). Response includes `{ items, page, pageSize, total }`.
- Search and filter queries are server-side. Debounce client input by 300 ms.
- Times are ISO 8601 UTC.
- Error shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Quantity must be at least 1", "fields": { "quantity": "min 1" } } }
```

| HTTP | Code examples |
|---|---|
| 400 | `VALIDATION_ERROR`, `CAPTCHA_FAILED` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `PROFILE_INCOMPLETE`, `DUPLICATE`, `OUT_OF_STOCK`, `EVENT_FULL`, `REGISTRATION_CLOSED`, `QUEUE_CLOSED`, `LOAN_LIMIT`, `UNIT_UNAVAILABLE` |
| 413 | `FILE_TOO_LARGE` |
| 415 | `UNSUPPORTED_FILE_TYPE` |
| 422 | `SCAN_INVALID`, `SCAN_WRONG_STUDENT` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL` |

Rate limits **[ASSUMPTION]**:
- **Local-password and RFID login failures** are stored in `auth_throttle` so they survive restarts and work across instances. Rule: 5 failures per account identifier/card digest or per IP within 15 minutes locks that key for 15 minutes. After 3 failures, require a Turnstile token for password login; RFID login remains rate-limited and returns a generic failure. Apply a separate modest limit to OAuth start/callback and account creation to reduce abuse; Google remains the primary identity provider.
- **Other limits** (scan verify 10 per minute per session, search 60 per minute per session, everything else 300 per minute per session) use an in-memory limiter in each web instance for a single-instance deployment. With several instances, move them to Postgres or a shared limiter. Final rate values belong in `PROJECT_DEFINITIONS.md`.

### 6.1.1 Idempotency for state-changing requests

For sensitive mutations, the client sends a random `Idempotency-Key` header (UUID or equivalent high-entropy value). The server scopes it to the authenticated user and a stable operation name. It hashes the canonical validated request body; do not hash raw JSON whose key order may vary.

1. Begin a database transaction.
2. Insert `(user_id, operation, idempotency_key, request_hash)` into `idempotency_keys` with `ON CONFLICT DO NOTHING`. The unique key is `(user_id, operation, idempotency_key)`. If another request is inserting the same key, the unique constraint makes this insert wait for that transaction to commit or roll back.
3. If the key already exists, read the committed row and compare hashes. A different hash returns `409 IDEMPOTENCY_KEY_REUSED`. A matching completed request returns its saved status and body without running the mutation again.
4. If the key is new, perform the business mutation and store the response status/body in the same transaction. Commit both together. A rollback removes the reservation and the business write, so a retry can run. A concurrent insert with the same key waits on the unique constraint, then replays the committed response.
5. Retain keys for at least 24 hours **[ASSUMPTION]**. Cleanup may delete expired rows only after the replay window.

Apply this to store checkout, borrow, return, event registration, queue joining, and other non-repeatable writes. UI buttons must also disable and show a loading state while a request is in flight, but UI state is not a security or concurrency control. Keep database transactions, unique constraints, and row locks; idempotency keys complement rather than replace them.

### 6.2 Auth and sign-up

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/auth/google` | Public | Start Google OAuth. Optional `intent=signup` may be used for UI copy; it does not change the identity checks. |
| GET | `/auth/google/callback` | Public | Validate Google identity, create or find the account, and set the session. |
| POST | `/auth/login` | Public | Local-password login. Body `{ identifier, password, turnstileToken? }`; identifier accepts username or email. |
| POST | `/auth/rfid/login` | Public | RFID login. Body `{ scannedIdentifier }`; hash the value server-side and find one active card link. Do not return account-existence details. |
| POST | `/auth/rfid/register` | User | Link a card to the signed-in student's account. Body `{ scannedIdentifier }`; require recent UP Mail re-authentication or current password before adding/replacing a card. |
| DELETE | `/auth/rfid/card` | User | Revoke the student's active card. Require a fresh authentication step. |
| POST | `/auth/password/set` | User | Set a password for a Google-authenticated account that has no password. Body `{ newPassword }`; require recent Google re-authentication. |
| POST | `/auth/password/change` | User | Change a local password. Body `{ currentPassword, newPassword }`; require current password or recent Google re-authentication. |
| POST | `/auth/logout` | User | Deletes the current session. |
| GET | `/auth/me` | User | Current user, roles, profile-completion flags, and notification unread count. |

There is no password-only registration route, email-verification route, recovery-code route, temporary-password route, or unverified-account state.

**UP Mail identity rule.** Require the Google `email_verified` claim and an exact normalized email domain of `up.edu.ph`. Do not accept lookalike domains such as `up.edu.ph.example.com`, nor infer verification from a typed address. Store the stable Google `sub` as `google_sub` with a unique constraint. Store the verified email as the unique account email.

**Account creation and Google sign-in**

1. The browser starts Google OAuth with state and PKCE protections.
2. The callback validates state, nonce, issuer, audience, signature, expiry, `email_verified`, and the exact `up.edu.ph` domain.
3. Find the account by `google_sub`. If found, update the verified email if policy permits and create a session.
4. If no `google_sub` match exists, look up the normalized email. If an account with that email but a different Google subject exists, stop and require an explicit account-linking process; never silently take over the account.
5. If no account exists, create it with the verified email and Google subject. Profile fields remain optional until the student completes the profile.
6. Create a session and send the student to the app. All successfully created accounts have the same base student permissions.

**RFID login and card linking**

- Google UP Mail is the primary sign-in and account creation method. A student must first create an account through a verified Google `@up.edu.ph` identity.
- During the registration/profile setup form, the student taps their UP ID while the RFID field is focused. The HID reader types the card identifier and sends Enter. The frontend submits the scanned value to the backend; it must not treat the typed value as trusted until the backend validates and stores its digest.
- The student may also link or replace a card later in Profile. Require a recent Google re-authentication or current local password for linking, replacing, or revoking a card.
- RFID login accepts the scanned identifier, computes its HMAC-SHA-256 digest with a server-side secret, finds the matching non-revoked card, and creates a normal student session. The login page must not reveal whether a card is registered.
- A lost card is revoked from Profile after UP Mail sign-in. A replacement card is then scanned and linked. Revocation takes effect for the next login attempt.
- **Security trade-off:** v1 accepts UID-only RFID login as a bearer credential: possession of a readable/copiable card identifier is treated as proof of identity. Do not claim cryptographic card authentication. Rate-limit failed scans, log successful and failed attempts without storing raw identifiers, and provide immediate card revocation. Sensitive actions still use their normal authorization and confirmation checks.
- Borrowing and return authorization use the already authenticated student session; no additional RFID scan is performed in those flows.

**Optional local password**

- Students may set a local password from Profile only after a successful UP Mail sign-in. Hash it with Argon2id. Local login accepts either username or email as the identifier.
- A student who forgets the local password signs in with Google and uses the logged-in password-set flow. No recovery code or staff reset is needed.
- A password change requires the current password or a fresh Google re-authentication within the configured step-up window. A normal old session alone is not enough.
- After a password change, revoke all other sessions and keep only the current session. Record the change in the audit log.
- Apply the password-login throttle to local password login. Do not expose whether an email has an account through error messages.

**First administrator.** Bootstrap the first Admin by first allowing the designated UP Mail account to complete Google sign-in, then running `pnpm seed:admin --email <verified-up-mail>` to promote that existing account. The script must refuse a missing account or an email that is not already bound to a Google-verified UP Mail identity; it must not create a password-only account. After bootstrap, Admins grant roles in the app.

### 6.3 Profile, notification settings, blocking

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/profile` | User | Own profile and `profileComplete`. |
| PATCH | `/profile` | User | Update username, first name, last name, and student number. |
| GET | `/profile/notification-settings` | User | Per-service `inApp` and `push` flags. |
| PUT | `/profile/notification-settings` | User | Set flags. `push` requires `inApp`. |

Avatar upload uses the generic upload flow (section 7) with purpose `avatar`, then `PATCH /profile` with `{ avatarUploadId }`.

### 6.4 Notifications and web push

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/notifications` | User | List own notifications. Query: `service`, `unread`, page. Hides deleted. |
| GET | `/notifications/unread-count` | User | `{ count }`. Polled every 30 seconds while the tab is visible. |
| GET | `/notifications/:id` | User | Details. Marks as read. |
| DELETE | `/notifications/:id` | User | Soft delete for this user. |
| POST | `/notifications/delete` | User | Bulk soft delete. Body `{ ids: [] }`. |
| GET | `/push/public-key` | User | Returns the VAPID public key. |
| POST | `/push/subscriptions` | User | Body `{ endpoint, keys: { p256dh, auth } }`. Upserts by `endpoint` and re-binds it to the caller. |
| DELETE | `/push/subscriptions` | User | Body `{ endpoint }`. Removes this device. |

Notifications are created by the system (restock, new reviewer, new event, event registration confirmation, due reminders, queue alerts). Managers trigger them through their own service routes. The notification tab is the source of truth. Push is a nudge on top (section 8.5).

### 6.5 Draft communications boundary

Direct messaging is excluded from this draft, so there are no message endpoints or message rate limits here. The final product is intended to replace direct messaging with a ticketing system. Define and implement that system only during final-product planning, using `PROJECT_DEFINITIONS.md` as the place for its changeable definitions.

### 6.6 HonestME Store

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/store/products` | User | Query: `q`, `categoryIds[]`, `available`, `minPrice`, `maxPrice`, page. |
| GET | `/store/categories` | User | Categories with product counts (for the filter checkboxes). |
| POST | `/store/purchases` | User | Check out. Body `{ items: [{ productId, quantity }] }`. Returns receipt. |
| POST | `/store/products` | `store_manager` | Add product. |
| PATCH | `/store/products/:id` | `store_manager` | Edit attributes. |
| POST | `/store/products/:id/restock` | `store_manager` | Body `{ quantity }`. Adds stock. |
| GET | `/store/products/:id/metrics` | `store_manager` | Per-product metrics. |
| GET | `/store/metrics` | `store_manager` | Whole-store metrics. |
| POST | `/store/restock-notifications` | `store_manager` | Notify students of a restock. Body `{ productIds: [], message? }`. |

Notes:
- The cart lives in the browser (a Svelte store). Only checkout calls the server **[ASSUMPTION]**.
- Search uses `name_normalized LIKE $prefix || '%'` on the B-tree index. If there is no prefix hit, fall back to category and name index candidates (matches the "Indexed product search" algorithm). Order by `name_normalized, id`.
- Remote stock counts may be slightly stale. Borrowing counts must be exact (AD-002 assumption).
- Duplicate product lines in one request are merged before insert, because of `UNIQUE (purchase_id, product_id)`.

**Checkout transaction** (algorithm: Purchase Logging):

1. Validate items (quantity integer, 1 to 99; product active). Merge duplicate product ids. Require an `Idempotency-Key` header and use operation `store.checkout`.
2. Begin transaction and reserve the key for `(user_id, operation="store.checkout", key)` with the SHA-256 hash of the canonical validated request. If the same key and hash already completed, return its saved response without creating another purchase. If the key exists with a different hash, return `409 IDEMPOTENCY_KEY_REUSED`.
3. Continue the transaction.
4. For each product, run `UPDATE products SET stock_quantity = stock_quantity - $q WHERE id = $id AND stock_quantity >= $q RETURNING unit_price, unit_cost`. Zero rows means `409 OUT_OF_STOCK`: roll back everything, including the reserved key.
5. Insert `purchases` and `purchase_items` with price and cost snapshots.
6. Store the response status and receipt body in `idempotency_keys` before commit.
7. Commit. Return the saved receipt (id, items, total, time) and refresh cached metrics.

**Restock notification flow** (algorithm: Stock Update): validate, begin transaction, update product(s), create the notification and its recipients (section 8.4), enqueue `push.fanout` in the same transaction, commit, refresh statistics, show success.

### 6.7 ME-kailangan

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/borrowables` | User | Query: `q`, `categoryIds[]`, `available`, page. Returns aggregated items with `quantityAvailable`. |
| GET | `/borrowables/categories` | User | Categories with counts. |
| GET | `/borrowables/:id` | User | Item detail with units. |
| GET | `/borrowing/me` | User | Summary: `{ onLoan, maxLoans, dueSoon, overdue, loans: [...] }`. |
| POST | `/borrowing/units/:unitId/borrow` | User | Body `{ dueAt }`; uses the already authenticated student context and requires `Idempotency-Key`. |
| POST | `/borrowing/units/:unitId/return` | User | Uses the already authenticated student context and requires `Idempotency-Key`. |
| POST | `/borrowables` | `kailangan_manager` | Add borrowable. |
| PATCH | `/borrowables/:id` | `kailangan_manager` | Edit. |
| POST | `/borrowables/:id/units` | `kailangan_manager` | Add unit. |
| PATCH | `/borrowing/units/:unitId` | `kailangan_manager` | Edit unit (label, status, image). |
| GET | `/borrowing/units/:unitId/details` | `kailangan_manager` | Current borrower, borrow date, expected return date, history. |

Flow (matches the BorrowBorrowable and ReturnBorrowable swimlanes):

**Physical station protocol (v1):** the station is a normal browser session, not a managed kiosk. The student signs in with their own account, completes checkout or the borrow/return confirmation, then logs out or completes the normal session flow. Staff manage physical device access and logout practice. The application does not issue station tokens, run device auto-lockouts, or isolate kiosk sessions. RFID is used for login or account linking only; the item is selected by its human-readable unit label / stored unit identifier.

1. Student selects an item, sees its units, picks one, and clicks Borrow or Return.
2. For borrow, the student picks a return date (must be after now and at most `MAX_LOAN_DAYS` days ahead **[ASSUMPTION]**).
3. The authenticated student confirms the borrow or return action. The UI calls the relevant endpoint with an `Idempotency-Key`; no second RFID scan is shown or required.

**Borrow/return replay protection.** Use operations `borrowing.borrow` and `borrowing.return` in the idempotency store. Save the final response in the same transaction as the loan state change. Keep the partial unique open-loan index as the final guard against two active loans for one unit. RFID identity is established before this flow through the authenticated session.

**Borrow transaction:**

1. Verify the authenticated student and begin the transaction.
2. `SELECT ... FROM borrowable_units WHERE id = $unit FOR UPDATE`. If status is not `available`: `409 UNIT_UNAVAILABLE`.
3. Count the borrower's open loans. If it is at or above `MAX_ACTIVE_LOANS`: `409 LOAN_LIMIT`.
4. Insert `borrow_records` (due_at from the request). Set unit status `borrowed`.
5. Commit. Return the confirmation with the expected return date.

No job is enqueued. The hourly reminder sweep finds the loan when it enters the reminder window (section 8.3).

**Return transaction:** verify the authenticated borrower, lock the unit, set `returned_at = now()`, set unit status `available`, commit, return confirmation. Nothing to cancel, because the sweep only looks at open loans.

Derived loan states for the UI: **Overdue** (`due_at < now`), **Due in N days** (`due_at - now <= BORROW_REMINDER_LEAD_DAYS` shows the stat card; list badge shows exact days), otherwise on loan.

### 6.8 MEg-aral

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/reviewers` | User | Query: `q`, `tagIds[]`, `courseIds[]`, `bookmarked`, page. Visible reviewers only (managers may pass `includeHidden=true`). |
| GET | `/reviewers/:id` | User | Metadata. 404 for hidden ones unless manager. |
| GET | `/reviewers/:id/preview-url` | User | Short-lived signed URL for inline PDF display. |
| GET | `/reviewers/:id/download-url` | User | Short-lived signed URL that forces download. |
| PUT | `/reviewers/:id/bookmark` | User | Enable bookmark. |
| DELETE | `/reviewers/:id/bookmark` | User | Disable bookmark. |
| GET | `/reviewer-tags` | User | Tags with counts. |
| GET | `/courses` | User | Courses (for the course chips). |
| POST | `/reviewers` | `megaral_manager` | Create from a completed upload. Body: title, authors, description, tagIds, courseIds, `fileUploadId`, optional `previewUploadId`. |
| PATCH | `/reviewers/:id` | `megaral_manager` | Edit attributes. |
| PATCH | `/reviewers/:id/visibility` | `megaral_manager` | Body `{ visibility }`. |
| POST | `/reviewers/:id/reindex` | `megaral_manager` | Re-run text extraction. |
| PATCH | `/reviewers/:id/search-metadata` | `megaral_manager` or Admin | Set supplementary tags/course links and a manual summary (maximum 10,000 characters); refresh the search vector. |
| POST / PATCH | `/courses`, `/courses/:id` | `megaral_manager` | Manage courses. |

Native PDF preview: the browser shows the PDF with its built-in viewer through `<iframe src={signedUrl}>` (or `<object>`). No PDF.js bundle. The signed URL sets `response-content-type=application/pdf` and `response-content-disposition=inline`. Add the R2 domain to the CSP `frame-src`. The download URL sets `response-content-disposition=attachment; filename="..."`.

Search (algorithm: MEg-aral item aggregation):

1. Normalize the keyword and validate filters.
2. If a keyword is present, build a safe `websearch_to_tsquery` and match `search_vector` (GIN). Rank with `ts_rank`. Weights: title A, tags/course codes B, manual summary B, extracted text C. Apply `tagIds[]` and `courseIds[]` as relational filters against `reviewer_tag_map` and `reviewer_courses`; a GIN full-text index does not replace those relations.
3. Filter `visibility = 'visible'` for students. Apply tag and course constraints.
4. Order by rank, then `published_at DESC`.
5. No keyword: list by `published_at DESC`.
6. Reviewers with `index_status <> 'ready'` still match on title and tags. Their text part joins once indexing finishes. Scanned PDFs with `index_status = 'ready'` and `has_selectable_text = false` remain searchable by title, tags, course codes, and the manager-entered manual summary.

Create flow (matches AddReviewer swimlane): upload file (section 7), submit metadata, server validates, saves the record with `visibility = hidden`, `index_status = pending`, and enqueues `reviewer.index` in the same transaction. The manager reviews and toggles visibility. When a reviewer becomes visible for the first time, set `published_at` and create a new-reviewer notification (section 8.4).

### 6.9 ME Days

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/events` | User | Query: `q`, `categoryIds[]`, `registrable`, `registered`, page. Response groups `registered` and `available`. |
| GET | `/events/categories` | User | Categories with counts. |
| GET | `/events/:id` | User | Details, prompts, `canRegister` with a reason if not. |
| POST | `/events/:id/registration` | User | Register. Body `{ answers: { promptId: text } }`; requires `Idempotency-Key`. |
| DELETE | `/events/:id/registration` | User | Unregister from a future event. |
| POST | `/events` | `medays_manager` | Add event (with prompts). |
| PATCH | `/events/:id` | `medays_manager` | Edit attributes and prompts. Prompts with answers are archived, not deleted. |
| GET | `/events/:id/registrants` | `medays_manager` | Count and list with profiles and answers. |

**Register transaction** (algorithm: Event Registration):

1. Check the profile is complete and passes `participation_constraints`. If current year standing is required, validate the value submitted in the relevant form; do not derive it from an academic-year calculation.
2. Validate answers against active prompts (all required prompts answered). Invalid: `400` with field errors and the UI prompts for re-entry.
3. Begin transaction and reserve the `events.registration.create` idempotency key. `SELECT ... FROM events WHERE id = $id FOR UPDATE`.
4. Check registration window: else `409 REGISTRATION_CLOSED`.
5. Check for an active registration: else `409 DUPLICATE`.
6. Count active registrations: `SELECT count(*) FROM event_registrations WHERE event_id = $id AND cancelled_at IS NULL`. If `capacity IS NOT NULL AND count >= capacity`: `409 EVENT_FULL` (roll back). The event row lock makes this count safe.
7. Insert `event_registrations` and one `event_registration_answers` row per answered prompt.
8. Create a confirmation notification for the student (section 8.4), save the final response in `idempotency_keys`, and commit. Return the confirmed registration.

Unregister: require an `Idempotency-Key`, lock the event, set `cancelled_at`, save the response, and commit. The count updates by itself.

For list views, get registrant counts with one grouped query over the `event_registrations (event_id) WHERE cancelled_at IS NULL` index.

### 6.10 Registration queue

Student routes:

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/registration/queue/me` | User | Own entry for the open session: `{ status, queueNumber, position, queueLength, adviser, desk, location, sessionOpen }`. Returns `{ inQueue: false }` if none. Supports `ETag`. |
| POST | `/registration/queue` | User | Join the open session. Requires a complete profile and `Idempotency-Key`. |
| DELETE | `/registration/queue/me` | User | Leave the queue (sets status `left`). |
| POST | `/registration/queue/me/continue` | User | Allowed when status is `called`. Returns the registration details (adviser, desk, venue). |

Join (algorithm: Registration Queue):

1. Check login, an open session, and a complete profile. Closed: `409 QUEUE_CLOSED`. Incomplete profile: `409 PROFILE_INCOMPLETE` (UI shows the profile update prompt). Require and reserve the `Idempotency-Key` for `registration.queue.join`.
2. Begin transaction.
3. Look for an existing entry for this student and session. If found and status is `waiting` or `called`, keep the original queue number and return it. If it was `left` or `removed`, return `409 DUPLICATE` with a manager-contact message **[ASSUMPTION]** (rejoining at the back needs a manager decision).
4. Otherwise `UPDATE registration_sessions SET last_ticket = last_ticket + 1 WHERE id = $s AND status = 'open' RETURNING last_ticket`. Insert the entry with that number.
5. Compute position (students ahead), save the response in `idempotency_keys`, and commit. Return the ticket and registration details.

Privacy: students only see their own number, position, and the queue length. Never return other students' names or numbers.

**Polling (the queue "engine" on the client).** The Register page uses a Svelte `$effect` with a timer:

- Poll `GET /registration/queue/me` every **10 seconds**. Send `If-None-Match`. A `304` response costs almost nothing.
- Pause polling when the tab is hidden (`document.visibilityState`). Refresh at once when the tab becomes visible again.
- On network error, back off: 10, 20, 40 seconds, up to 60.
- Stop polling when the status is `completed`, `left`, or `removed`, or the session is closed.
- The bell badge polls `/notifications/unread-count` every 30 seconds with the same pause rule.

**"You're next" alerts** are created inside the same database transaction as the queue change (section 8.3), not by a job. Alerts are created after advance, complete, remove, leave, and transfer. They are not created on join. A student who joins at position 1 sees it on screen, so a push would add nothing.

Manager routes (`registration_manager`):

| Method | Path | Description |
|---|---|---|
| GET | `/registration/sessions` | List sessions. |
| POST | `/registration/sessions` | Create a session. |
| PATCH | `/registration/sessions/:id` | Open or close (`{ status }`). Opening closes any other open session first, in one transaction. |
| GET | `/registration/sessions/:id/queue` | Entries with profiles and registration details. |
| POST | `/registration/sessions/:id/advance` | Call the next waiting student to an adviser. Body `{ adviserId }`. |
| PATCH | `/registration/queue/:entryId` | Set `completed` or `removed`. |
| GET / POST | `/registration/advisers` | List or create advisers. |
| PATCH | `/registration/advisers/:id` | Update status and desk. |
| POST | `/registration/advisers/:id/transfer` | Move the adviser's waiting students to a proxy adviser. Body `{ proxyAdviserId }`. |

### 6.11 Staff and Admin

Admin routes:

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/admin/usage-logs` | Admin | List usage logs with service type, date/time range, sorting, and pagination. |
| GET | `/admin/students` | Admin | List student directory fields with college, program, active, enrolled, and student-number filters; supports sorting and pagination. |
| GET | `/admin/volunteers` | Admin | List volunteer accounts with assigned roles and ordinary profile fields; supports role, college, program, and active filters plus sorting and pagination. |
| GET | `/admin/admins` | Admin | List Admin ID, Nickname, and Is Active with active filter, sorting, and pagination. |
| GET | `/admin/users` | Admin | Search a student profile. Query: `q`, page. |
| GET | `/admin/users/:id` | Admin | Profile with roles and privileges. |
| PUT | `/admin/users/:id/volunteer-roles` | Admin | Body `{ roles: [...], confirm: true }`. An empty array removes all volunteer privileges. |
| PUT | `/admin/users/:id/admin` | Admin | Body `{ isAdmin, confirm: true }`. Cannot target self. |

Rules (matches the ToggleVolunteerPrivileges swimlane): granting needs at least one role selected, else `400`. Both grant and removal need `confirm: true` after the UI disclaimer. Write an `audit_logs` row for each change. Delete the target's sessions on removal of privileges so changes apply at once **[ASSUMPTION]**.

### 6.12 Health

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | `{ db: "ok", jobs: { oldestQueuedSeconds, running, dead } }`. No secrets. Alert when `oldestQueuedSeconds` stays above 300 or `dead` rises. |

---

## 7. File Uploads

### 7.1 Limits and types

| Purpose | Allowed MIME types | Max size | R2 key prefix |
|---|---|---|---|
| `reviewer_file` | `application/pdf` | **50 MB** (52,428,800 bytes) | `reviewers/{reviewerId}/` |
| `reviewer_preview` | `image/png`, `image/jpeg`, `image/webp` | **50 MB** [ASSUMPTION] | `reviewers/{reviewerId}/preview/` |
| `product_image` | same image types | 50 MB [ASSUMPTION] | `products/` |
| `event_image` | same image types | 50 MB [ASSUMPTION] | `events/` |
| `borrowable_image`, `unit_image` | same image types | 50 MB [ASSUMPTION] | `borrowables/` |
| `avatar` | same image types | 50 MB [ASSUMPTION] | `avatars/` |

Limits come from env vars. If you want smaller image limits (for example 5 MB), change `MAX_UPLOAD_IMAGE_BYTES` only. Reject any other type with `415`. Reject larger files with `413`.

The bucket is **private**. R2 serves files only through short-lived signed URLs (`R2_PRESIGN_TTL_SECONDS`, default 300). For reviewer PDFs, accept text-based and image-only PDFs; successful upload does not depend on text extraction. A PDF with no selectable text enters the manual indexing fallback in section 8.3.

### 7.2 Flow (direct to R2)

Large files go straight to R2, not through the app server.

1. **Presign:** `POST /uploads/presign` with `{ purpose, filename, contentType, sizeBytes, targetId? }`.
   - Check the caller's permission for the purpose (for example, `reviewer_file` needs `megaral_manager`).
   - Check type and declared size against the table.
   - Create an `uploads` row (`pending`, `expires_at` = now + 15 minutes).
   - Return `{ uploadId, url, method: "PUT", headers, expiresAt }`. Object key is `<prefix><uuid>.<ext>`. Never use the user's filename in the key.
2. **Upload:** the browser sends the file with `PUT` to R2.
3. **Complete:** `POST /uploads/:id/complete`.
   - `HEAD` the object. Read real size and content type.
   - If real size is above the limit, or does not match the declared size, or the type is wrong: delete the object, set `rejected`, return `413` or `415`.
   - Fetch the first bytes (ranged GET) and check the magic number (`%PDF-` for PDF, PNG, JPEG, and WebP signatures for images).
   - Set `completed` and save `verified_size_bytes`.
4. **Attach:** the next API call (for example `POST /reviewers`) references the `uploadId`. The server only accepts uploads that are `completed`, owned by the caller, and not yet attached.
5. **Cleanup:** the hourly `uploads.cleanup` job (section 8.3) deletes objects for `pending` or `rejected` uploads past `expires_at` and marks them `expired`.

R2 presigned PUT URLs cannot enforce a maximum size themselves. That is why step 3 re-checks real size and deletes bad files. Also set a Cloudflare lifecycle rule that aborts incomplete multipart uploads after one day.

### 7.3 CORS

Set R2 bucket CORS to allow `PUT` and `GET` from `PUBLIC_APP_URL` only, with headers `Content-Type`.

---

## 8. Background Jobs, Scheduling, and Push (PostgreSQL, no Redis)

### 8.1 How the job system works

Jobs are rows in the `jobs` table (section 5.10). A worker process polls the table, claims rows, runs handlers, and records the result.

**Enqueue.** Producers insert a row. Do it **inside the same database transaction** as the business change. If the transaction rolls back, the job disappears with it. If it commits, the job exists. There is no "enqueue failed after commit" case, so no retry-pending sweeper is needed.

```ts
// src/lib/server/jobs/enqueue.ts
enqueue(tx, { queue: 'push', name: 'push.fanout', payload: { notificationIds }, runAfter?, maxAttempts?, timeoutSeconds?, dedupeKey? })
```

**Claim.** One statement, safe with many workers, works on the transaction pooler:

```sql
WITH next AS (
  SELECT id FROM jobs
  WHERE status = 'queued' AND run_after <= now() AND queue = ANY($1)
  ORDER BY run_after, created_at
  LIMIT $2
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs j
SET status = 'running', locked_at = now(), locked_by = $3,
    attempts = j.attempts + 1, updated_at = now()
FROM next
WHERE j.id = next.id
RETURNING j.*;
```

**Worker loop** (`pnpm worker`, one long-running Node process):

1. Claim up to `WORKER_CONCURRENCY` minus running jobs.
2. If nothing was claimed, sleep `WORKER_POLL_INTERVAL_MS` (default 3 seconds) plus a small random jitter.
3. Run each handler with a timeout of `timeout_seconds`.
4. **Success:** set `status = 'succeeded'`, `finished_at = now()`.
5. **Failure:** if `attempts >= max_attempts` or the handler threw a non-retryable error, set `status = 'dead'` and save `last_error`. Otherwise set `status = 'queued'`, save `last_error`, and set `run_after = now() + LEAST(5s * 2^(attempts-1), 15 min)` plus jitter.
6. On `SIGTERM`: stop claiming, wait for running jobs (up to 30 seconds), exit.

**Stuck jobs.** Every minute the worker runs:

```sql
UPDATE jobs
SET status = CASE WHEN attempts >= max_attempts THEN 'dead'::job_status ELSE 'queued'::job_status END,
    locked_at = NULL, locked_by = NULL,
    last_error = COALESCE(last_error, 'lock timeout'), updated_at = now()
WHERE status = 'running' AND locked_at < now() - make_interval(secs => timeout_seconds);
```

**Idempotency.** Every handler must be safe to run twice. Re-read the database state before acting. A crash after a side effect and before the success update will cause a second run.

**Cost.** One idle worker sends about one tiny query every 3 seconds. That is small for the Supabase pooler.

### 8.2 Scheduler for recurring tasks

Postgres has no repeatable jobs, so the worker has a tiny scheduler. Every 60 seconds each worker instance runs, for each recurring task:

```sql
INSERT INTO jobs (queue, name, dedupe_key, max_attempts, timeout_seconds)
VALUES ($queue, $name, $name || ':' || $bucket, 3, $timeout)
ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
```

`$bucket` is `floor(epoch_seconds / interval_seconds)`. With two workers, only one insert wins for each time bucket. The job then runs once.

| Recurring task | Interval | Queue |
|---|---|---|
| `borrow.reminder-sweep` | 1 hour | `maintenance` |
| `uploads.cleanup` | 1 hour | `maintenance` |
| `jobs.retention` | 1 day | `maintenance` |

Run only one worker unless you need more. A second worker is safe, but not needed at this scale.

### 8.3 Job catalog

| Queue | Job name | Trigger | Payload | Timeout | Notes |
|---|---|---|---|---|---|
| `push` | `push.fanout` | Inserted in the same transaction that creates notifications | `{ notificationIds: [] }` | 120 s | Sends web push for those notifications (section 8.5). |
| `reviewers` | `reviewer.index` | After a reviewer is created, replaced, or reindexed | `{ reviewerId }` | 300 s | Text extraction and search index. See below. |
| `maintenance` | `borrow.reminder-sweep` | Scheduler, hourly | none | 120 s | Due-soon and overdue reminders. See below. |
| `maintenance` | `uploads.cleanup` | Scheduler, hourly | none | 120 s | Deletes expired pending uploads from R2 and marks them `expired`. |
| `maintenance` | `jobs.retention` | Scheduler, daily | none | 120 s | Deletes `succeeded` jobs older than 7 days and `dead` jobs older than 30 days. Deletes expired sessions and stale `auth_throttle` rows. |

There are no jobs for registration alerts and no jobs for email.

**`borrow.reminder-sweep`** (replaces the old delayed jobs)

In one transaction:

```sql
-- Due soon (once per loan)
UPDATE borrow_records
SET reminded_due_soon_at = now()
WHERE returned_at IS NULL
  AND reminded_due_soon_at IS NULL
  AND due_at > now()
  AND due_at <= now() + make_interval(days => $lead)
RETURNING id, borrower_id, unit_id, due_at;

-- Overdue (once per loan)
UPDATE borrow_records
SET reminded_overdue_at = now()
WHERE returned_at IS NULL
  AND reminded_overdue_at IS NULL
  AND due_at <= now()
RETURNING id, borrower_id, unit_id, due_at;
```

For each returned row, create a notification for that borrower (service `kailangan`) using the helper in section 8.4. After the loop, enqueue one `push.fanout` with all new notification ids, still in the same transaction.

- Because the sweep runs hourly, a reminder arrives up to one hour late. That is fine for day-level deadlines.
- Nothing needs cancelling on return, because the query only reads open loans. A lost or restarted worker misses nothing. The next sweep catches up.
- The overdue reminder is sent once per loan; final reminder timing belongs in `PROJECT_DEFINITIONS.md`.
- If a loan is created inside the lead window, the next sweep sends the due-soon reminder.
- Join `borrowable_units` and `borrowables` to put the item name in the body.

**"You're next" alerts** (replaces `registration.evaluate`)

Run `alertNextInQueue(tx, sessionId)` as the last step inside the transaction of advance, complete, remove, leave, and transfer:

```sql
WITH ranked AS (
  SELECT id, user_id, row_number() OVER (ORDER BY queue_number) AS pos
  FROM queue_entries
  WHERE session_id = $1 AND status = 'waiting'
)
UPDATE queue_entries q
SET notified_next_at = now()
FROM ranked r
WHERE q.id = r.id AND r.pos <= $N AND q.notified_next_at IS NULL
RETURNING q.user_id;
```

(`$N` is `REGISTRATION_ALERT_POSITION`.) For each returned user, create a notification (service `registration`, subject "You're next in the registration queue") and enqueue `push.fanout`, all in the same transaction. The `notified_next_at IS NULL` guard runs under row locks, so two concurrent transactions cannot alert the same student twice. The alert and the on-screen position use the same ordering, so they agree.

**`reviewer.index`** (algorithm: Reviewer Upload)

1. Set `index_status = 'processing'`.
2. Stream the PDF from R2 to a temp file. Enforce the size limit again.
3. Extract text with `pdftotext`. Cap stored text at 5 MB of characters **[ASSUMPTION]**.
4. In one transaction: upsert `reviewer_texts`, build `search_vector` = `setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', tags), 'B') || setweight(to_tsvector('english', text), 'C')`, set `index_status = 'ready'`.
5. Delete the temp file in a `finally` block.
6. Timeout 300 seconds. After the final failed attempt, set `index_status = 'failed'` and save `index_error`. The manager sees it and can call `/reviewers/:id/reindex`.
7. **Scanned-PDF fallback:** after extraction, count meaningful non-whitespace characters. If fewer than 50 remain, set `has_selectable_text = false`, set `reviewer_texts.content = ''`, and set `index_status = 'ready'` (the file is valid; it simply has no selectable text). The management screen shows `Scanned PDF (No selectable text detected)`. A `megaral_manager` or Admin can add supplementary tags/course codes and a manual summary/transcription of up to 10,000 characters. Refresh the vector on every save using title A + tags/course codes B + manual summary B + extracted text C. Do not run OCR. If 50 or more meaningful characters are extracted, set `has_selectable_text = true` and index the extracted text as usual. If extraction itself errors, use retry handling and eventually `index_status = 'failed'`; do not mislabel a processing error as a scanned PDF.

### 8.4 Creating notifications

All notification creation goes through one helper, `createNotification(tx, { service, subject, body, link, createdBy, audience })`, which runs inside the caller's transaction:

1. Insert the `notifications` row.
2. Insert `notification_recipients` for the audience, skipping users whose setting for that service has `in_app = false`:
   - `audience: { type: 'all' }` (restock, new reviewer, new event): `INSERT ... SELECT` from `users` with `LEFT JOIN notification_settings` and `COALESCE(in_app, true)`.
   - `audience: { type: 'user', userId }` (due reminders, queue alert, event confirmation): one row.
3. Return the notification id. The caller enqueues one `push.fanout` job with the ids after creating all of its notifications.

In-app rows exist as soon as the transaction commits. "View notifications" does not depend on the worker.

Events that create notifications:

| Event | Service | Audience |
|---|---|---|
| Product restock (manager action) | `store` | all |
| Reviewer becomes visible for the first time | `megaral` | all |
| New event published | `medays` | all |
| Event registration confirmed | `medays` | the student |
| Borrow due soon | `kailangan` | the borrower |
| Borrow overdue | `kailangan` | the borrower |
| You're next in the registration queue | `registration` | the student |

### 8.5 Web push

Push costs nothing per message. The browser vendors run the delivery service. Students must allow it on each device.

**Server (`push.fanout` handler)**

1. Load the notifications and their recipients where `pushed_at IS NULL`.
2. Keep recipients whose setting for the service has `push = true` (missing row = true) and who have at least one row in `push_subscriptions`.
3. Send in batches of 200 recipients, up to 10 sends at a time, with the `web-push` library (`VAPID_SUBJECT`, `PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).
4. Result handling per subscription:
   - `201`: update `last_success_at`.
   - `404` or `410`: the subscription is gone. Delete the row.
   - `429` or `5xx` or network error: transient. Do not mark the recipient. After the batch, throw so the job retries with backoff.
5. Set `pushed_at = now()` for a recipient once all of their subscriptions were tried and none failed transiently, or when they have no subscriptions. A retry only touches recipients where `pushed_at IS NULL`, so nobody gets a duplicate.

**Payload** (keep it under 4 KB, and generic, because it may show on a lock screen):

```json
{ "title": "Item due soon", "body": "A borrowed item is due in 2 days.", "url": "/borrow", "tag": "kailangan-<notificationId>", "notificationId": "..." }
```

Do not put names, student numbers, or queue numbers in push text.

**Delivery options by type**

| Notification | TTL | Urgency |
|---|---|---|
| You're next in the queue | 600 s | high |
| Due soon, overdue | 86,400 s | normal |
| Restock, new reviewer, new event | 86,400 s | low |
| Event registration confirmed | 3,600 s | normal |

**Client**

- `src/service-worker.ts` (SvelteKit registers it automatically):
  - `push` event: parse the payload and call `self.registration.showNotification(title, { body, tag, data: { url } })`.
  - `notificationclick` event: close the notification, then focus an open window and navigate to `data.url`, or open a new window.
  - `pushsubscriptionchange` event: subscribe again and call `POST /push/subscriptions`.
- `static/manifest.webmanifest`: `name`, `short_name` "MEssentials", `display: "standalone"`, `start_url: "/store"`, `theme_color: "#6750A4"`, icons 192 and 512 px (one maskable).
- **Opt-in UI** (Profile page and a one-time banner on the Notifications page): a "Turn on alerts on this device" button. It must run from a click, never on page load.
  1. `Notification.requestPermission()`.
  2. `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` with the key from `GET /push/public-key`.
  3. `POST /push/subscriptions`.
  - Show one of these states: **Not supported**, **Blocked** (explain how to unblock in browser settings), **Off**, **On** (with a "Turn off" button that calls `DELETE /push/subscriptions` and `subscription.unsubscribe()`).
- On each app load, if permission is granted and a subscription exists, call `POST /push/subscriptions` to keep the server copy fresh.

**Limits to plan for**

- HTTPS is required (`localhost` is allowed for development).
- Students who decline get the notification tab only.
- iPhone and iPad (iOS 16.4 and later) support push only when the site is **added to the Home Screen** as an installed web app. Show "Add to Home Screen" instructions on iOS Safari when the app is not installed.
- Delivery is best effort. Push is a nudge. The notification tab is the record.
- Desktop Chrome, Edge, Firefox, Safari 16+, and Android Chrome support it.

---

## 9. Key Algorithms Summary

| Algorithm | Data structure | Where |
|---|---|---|
| Product and borrowable name search | B-tree prefix index on the generated `name_normalized` column | Postgres |
| Reviewer search | Inverted index (GIN on `tsvector`) | Postgres |
| Event and borrowable listing | Arrays, sorted in the query | Models |
| Duplicate removal, lookups | Hash maps and sets | App memory |
| Registration queue | FIFO using `queue_number` and `last_ticket` counter | Postgres |
| State values (unit, queue, upload, job) | Enums with checked transitions | Postgres and TypeScript |
| Job scheduling | `jobs` table ordered by `run_after` (earliest first, like a priority queue) with `SKIP LOCKED` | Postgres |
| Reminder scheduling | Hourly sweep over open loans using reminder timestamps | Postgres |

Allowed state changes (reject all others with `409`):

- `queue_status`: `waiting` to `called`, `completed`, `left`, `removed`. `called` to `completed`, `removed`, `waiting` (manager sends back).
- `unit_status`: `available` to `borrowed`, `unavailable`. `borrowed` to `available`. `unavailable` to `available`.
- `index_status`: `pending` to `processing` to `ready` or `failed`. `failed` to `pending`.
- `job_status`: `queued` to `running`. `running` to `succeeded`, `queued` (retry), or `dead`.

---

## 10. Frontend Routing

Student and Volunteer page routes follow the navigation order in the design: Store, Events, Borrow, Reviewer, Register, then Notifications and Profile as account utilities. Volunteers also see role-specific management routes. Admins use the separate Admin navigation. See `UI_DESIGN.md` for layouts. Add a Google UP Mail sign-in screen, optional password setup/change screen, and push opt-in screens using the same M3 tokens.

| Route | Screen | API used |
|---|---|---|
| `/login` | Three methods: Continue with UP Mail (primary), tap registered RFID card, or username/email and password | `/auth/*` |
| `/signup` | UP Mail OAuth account creation followed by student profile form and UP ID tap to link RFID card; card linking may be skipped and completed later | `/auth/google*`, `/auth/rfid/*`, `/profile*` |
| `/store` | Product grid + filters + cart | `/store/*` |
| `/events` | Registered and available events | `/events*` |
| `/borrow` | Loan stats, on loan list, available list | `/borrowables`, `/borrowing/*` |
| `/reviewer` | Reviewer list + filters | `/reviewers*`, `/courses` |
| `/register` | Queue position, next steps | `/registration/queue*` |
| `/notifications` | Notification list, push opt-in banner | `/notifications*`, `/push/*` |
| Ticketing | Excluded from this draft | Final-product scope only |
| `/profile` | Profile, optional local password setup/change, linked RFID card status/link/revoke, notification settings, device alerts | `/profile*`, `/auth/*`, `/push/*` |
| `/manage/store`, `/manage/borrow`, `/manage/reviewer`, `/manage/events`, `/manage/registration` | Manager tools (role-gated) | service manager routes |
| `/admin/users` | Roles and privileges | `/admin/*` |
| `/admin/usage-logs` | Usage logs with service and date filters | `/admin/usage-logs*` |
| `/admin/students` | Student directory with college/program/status/number filters | `/admin/students*` |
| `/admin/volunteers` | Volunteer directory, role filters, and role management | `/admin/volunteers*` |
| `/admin/admins` | Administrator directory and active status | `/admin/admins*` |

Use `+layout.server.ts` to load the session and block pages by role. Account creation already proves UP Mail identity; profile completion checks remain specific to workflows that need profile data. Client navigation keeps the rail visible. The Admin area is separate from the student-service dashboard and includes Usage Logs, Students, Volunteers, and Admins pages; their fields and filters are defined in `UI_DESIGN.md` section 9.4.

---

## 11. Non-Functional Requirements

**Performance**
- List and search endpoints: p95 under 500 ms at expected load.
- Checkout and borrow: p95 under 800 ms.
- Push fan-out starts within about 5 seconds of the notification (poll interval plus processing).
- Risk "High Traffic" (80% probability, impact 2): load test before launch (for example k6, simulating registration-day spikes on `/registration/queue*` and `/store/products`). Polling at 10 seconds with `ETag` keeps the queue page cheap. Check the pooler connection count during the test.

**Reliability**
- Backups: use Supabase backups. Jobs live in Postgres, so they are backed up with everything else. Test a restore before launch (the FP form rates backup and recovery at 5).
- Transactions on every multi-row write (store, borrow, event, queue). Job inserts join the same transactions.
- A worker outage delays push and reviewer indexing only. The web app and the notification tab keep working.

**Security**
- Argon2id for passwords. Session tokens stored hashed. Constant-time compares.
- Turnstile after repeated local-password login failures. Durable lockouts in `auth_throttle`; apply rate limits to OAuth entry and callback endpoints.
- Every account must have a Google-verified `@up.edu.ph` identity. Students can also log in with a linked RFID card or username/email and password. RFID UID-only login is a documented bearer-credential trade-off; support revocation, rate limits, audit events, and re-linking. Optional local passwords are set or changed only after Google sign-in or current-password verification.
- Validate and escape all input. Parameterized queries only.
- Row-level access in code: students read only their own notifications, loans, and queue entry.
- Never expose other students' data in queue or registrant views to students.
- Signed URLs only for files. No public bucket.
- Push payloads carry no personal data.
- Secrets in env vars. Never commit `.env`. Keep `VAPID_PRIVATE_KEY` server-only.
- Security headers: CSP (allow R2 for `frame-src` and `img-src`, `worker-src 'self'`, Turnstile's `script-src` and `frame-src`), `X-Content-Type-Options`, `Referrer-Policy`.

**Accessibility and usability**
- WCAG AA contrast. Labels on icon buttons. Keyboard access (see `UI_DESIGN.md`).
- Clear error messages and disabled states for unavailable actions.

**Maintainability**
- Documentation for turnover (risk "App Turnover", 100% probability): keep this file, `Changes.md`, `UI_DESIGN.md`, a README with setup and deploy steps, and an account handover checklist (Supabase, R2, Google OAuth, Turnstile, VAPID keys, worker host).
- Document the VAPID key pair. If it is lost or replaced, every device must subscribe again.

**Compatibility and responsive behavior**
- Current Chrome, Edge, Firefox, and Safari. The project file lists minimum mobile specs (1 GB RAM, iOS 12+, Android 5+).
- At widths below 768px, replace the left navigation rail with an M3 bottom navigation bar and move the 360px filter panel into an overlay modal drawer. The drawer must support keyboard focus, Escape to close, and focus return.
- Web Push on iOS requires iOS 16.4 or later and an installed Home Screen web app. Show the onboarding instructions in section 8.5.

---

## 11.1 Financial reporting boundary

V1 records each purchase with immutable `unit_price`, `unit_cost`, and `total` snapshots and supports instantaneous per-product and store aggregate metrics. It does not include historical sales trend charts, revenue graphs, arbitrary date-range or semester filters, or CSV/Excel transaction exports. Defer those features until baseline inventory logging has been verified after launch.

## 12. Testing and Quality

- Unit tests (Vitest): models, validation, state transitions, current-year-standing form validation where applicable, and position calculation.
- Integration tests: API routes against a test Postgres. Cover each swimlane flow and its failure branches (invalid input, authentication failure, full event, closed queue, out of stock).
- Auth tests: Google OAuth success and rejection for unverified email, wrong domain, invalid state/nonce, duplicate email with a different Google subject, optional password setup/change, current-password and fresh-OAuth step-up, login throttle and lockout, session revocation, and first-admin bootstrap.
- Concurrency tests: repeated and simultaneous identical checkout requests with the same idempotency key create one purchase; same key with a different payload returns 409; two borrows of one unit create one open loan; scan token is consumed once; two registrations for the last event slot create one registration per student; two queue joins by the same student return the same ticket; queue alerts are not duplicated.
- Job tests: two workers claiming at once (each job runs once), stuck-job recovery, retry with backoff, dead after max attempts, scheduler creates one job per time bucket with two workers, idempotent re-runs.
- Reminder sweep tests: due-soon once, overdue once, nothing after return, catch-up after worker downtime.
- Push tests (with a mock push service): `410` removes the subscription, transient failure retries without duplicates, `pushed_at` set once, settings respected.
- Index job tests: success, failure then `failed` status, scanned PDF with no text.
- E2E (Playwright): the six navigation scenarios and their click budgets, plus Google UP Mail account creation, optional password setup/change, and password-forgotten recovery by signing in through Google and setting a new password.
- Track DRE: count errors found before delivery (E) and defects found after (D).
- Schedule from the plan: prototype build 12 days, database setup 5, system test 3, user test 3, polish 7, migration 4, system test 3, deployment 1. The original plan was **not** recalculated for the expanded work (Google OAuth account creation, optional local passwords, PostgreSQL worker, Web Push, expanded staff/admin screens, scanned-PDF fallback, and mutation idempotency). Treat the 114 FP estimate and 28-day Gantt as historical baseline values, not validated estimates for this revision. Re-estimate effort and schedule before committing to a delivery date. See `Changes.md`.

---

## 13. Migration from Current Tools

The plan includes a Migration phase (4 days). Import from the existing Google Sheets and Forms:

- Reviewers (links and metadata), HonestME stock, ME-kailangan items and units, event details.
- Write one-off import scripts under `scripts/import/`. Run them through `DATABASE_URL_MIGRATE`.
- Dry-run mode first. Log rejected rows.
- Reviewer files currently on Google Docs need a manual export to PDF before upload **[ASSUMPTION]**.
- **No accounts exist at launch.** Students create their own. Open loans from the old borrowing sheet can only be attached to a student who already has an account with a matching student number. Write the rest to a rejected-rows file and let the ME-kailangan manager enter them by hand after the students sign up **[ASSUMPTION]**.
- Create the first admin with `pnpm seed:admin` before any other step.

---

## 14. Assumptions and Open Items

The following operational details still need confirmation. Core identity and v1 scope decisions stated as confirmed below are not open choices.

1. **Station operating protocol (confirmed scope).** Stations use the standard web app in a browser. A student signs in, completes the transaction, and logs out or finishes the session. Physical supervision and device security are handled by staff. There is no kiosk state engine, station account type, device auto-lockout, or station-specific API token in v1.
2. **Scanner and item-code scope (confirmed scope).** Use USB HID keyboard-emulation RFID reader hardware for student identity, login, and account linking. It types the card identifier into a focused field and sends Enter. The student links the card to their own account while signed in through UP Mail; the protected digest is stored in `student_rfid_cards`. Borrowing and returning use the already authenticated student session and do not repeat the RFID scan. Borrowable units keep a plaintext human-readable label and a `qr_code` text identifier in PostgreSQL. Dynamic QR image generation and camera scanning are deferred; no QR camera workflow is required for v1.
3. **Changeable definitions.** Final image limits, loan rules, reminder timing, queue alert positions, rate limits, idempotency retention, and similar operational values belong in `PROJECT_DEFINITIONS.md` so they can be changed without rewriting the product specification.
4. **Image storage.** You named R2 for reviewer files. This spec also stores product, event, borrowable, and avatar images in R2.
5. **Hosting.** Vercel is confirmed for the web application. The final worker deployment model is not chosen. The worker still needs an always-on process and the `pdftotext` binary; record the final worker choice in `PROJECT_DEFINITIONS.md`.
6. **VAPID subject.** `VAPID_SUBJECT` needs a contact (`mailto:` or `https:`). Pick one the team controls.
7. **Turnstile.** Needs a free Cloudflare account and a site key. If you prefer no third party, replace it with a rate limit only (weaker).
8. **UP Mail identity rule (confirmed).** Google OAuth is required to create an account. Require `email_verified=true` and the exact `up.edu.ph` domain. Local password login is optional and can only be enabled after Google sign-in.
9. **Physical ID-card linking (confirmed).** The student links their own UP ID by tapping it while signed in through UP Mail, during registration or later in Profile. RFID login is unavailable until the card is linked. Registration staff may help with reader issues but cannot link a card on the student's behalf or bypass authentication.
11. **Current year standing.** No academic-year calculation is used. If a workflow needs year standing, add a current year standing field to that workflow's form and validate the submitted value.
12. **Cart.** Kept in the browser until checkout.
13. **Loan rules.** Maximum active loans, loan duration, and reminder lead time are TBD and belong in `PROJECT_DEFINITIONS.md`. Do not treat the earlier card values as final.
14. **Registration rules.** Students who left or were removed cannot rejoin the same session without a manager. One open session at a time. "You're next" alerts do not fire on join.
15. **Queue updates.** Polling every 10 seconds with `ETag`, not live push. Pauses in hidden tabs.
16. **Admin and staff changes** delete the target user's sessions.
17. **Rate limiting.** Local-password login failures are stored in Postgres. OAuth entry/callback and other endpoint limits must also be applied. The final values belong in `PROJECT_DEFINITIONS.md`.
18. **Wording fix.** The queue screen reads "Your are in line". Use "You are in line".
19. **Scanned PDFs.** OCR is excluded. The extraction threshold and manager fallback are specified in sections 5.5, 6.8, and 8.3.
20. **Design additions.** The expanded auth, staff/admin, mobile, and iOS push onboarding screens are specified in `UI_DESIGN.md`. Earlier recovery-code and unverified-account screens are superseded.
21. **Plan numbers.** The 114 FP estimate, 28-day Gantt chart, and effort breakdown remain historical. Re-estimate them before setting a delivery commitment.
22. **Financial analytics.** V1 includes only baseline stock deduction, purchase snapshots, and instantaneous metrics. Historical charts, date-range reports, and exports are deferred.
23. **Web push delivery.** Push is best effort and depends on browser permission and supported platform installation. In-app notifications remain the source of truth.
24. **Mutation replay protection.** Sensitive state-changing endpoints require `Idempotency-Key`; responses and writes are committed in one transaction. Retention belongs in `PROJECT_DEFINITIONS.md`. UI loading/disabled states supplement, but do not replace, server and database controls.
25. **Communications boundary.** Direct messaging is excluded from this draft. The final product is intended to replace it with a ticketing system; define that system separately during final-product planning.


## 16. Role-based dashboard and Admin data contract (Revision 6)

The application presents different navigation based on role:

- Students use the normal service dashboard: Store, Events, Borrow, Reviewer, and Register.
- Volunteers keep all five student-facing service pages and see extra management links for each assigned role. The management workspace is separate from the public/student-facing service page.
- Administrators use a separate Admin dashboard and do not see the normal service navigation. Its four pages are Usage Logs, Students, Volunteers, and Admins.

The Admin dashboard is not a general service catalog. Do not add a Services directory page. Service ID and Service Type remain fields in Usage Logs.

### 16.1 Usage Logs

Filters: Service Type, Date Range Start, Date Range End. Table columns, in order: Usage Log ID, Service ID, Service Type, Student Number, Admin ID, Date Time Start, Date Time End, Location. Date filters include time-zone-aware date/time values. Every column supports server-side ascending and descending sort. The UI shows up/down arrows beside the column label and marks the active sort field and direction. Pagination and an empty state are required.

### 16.2 Students

Filters: College, Degree Program, Is Active, Is Enrolled, Minimum Student Number, Maximum Student Number. Table columns: Student Number, First Name, Middle Initial, Last Name, Email, Phone Number, College, Program. `Is Active` and `Is Enrolled` are separate states. Student-number range filters must be validated against the stored student-number format. Every displayed column supports server-side sorting.

Show ordinary directory data only. Do not return password hashes, Google subject IDs, session data, RFID identifier hashes, or other authentication/security fields.

### 16.3 Volunteers

Show each student who has one or more rows in `volunteer_roles`, once per student. Filters: Volunteer Role (multi-select), College, Degree Program, Is Active. Table columns: Student Number, First Name, Middle Initial, Last Name, Email, Volunteer Role(s), Is Active. Aggregate multiple roles into one display cell. Every displayed column supports server-side sorting. Do not return authentication/security fields.

### 16.4 Admins

Show users where `is_admin = true`. Filter: Is Active. Table columns: Admin ID, Nickname, Is Active. Admin ID is the stable user ID; Nickname uses the user's username/display alias. Every displayed column supports server-side sorting. Do not return authentication/security fields. Admin role changes require confirmation, are audit logged, and cannot remove the acting Admin's own Admin role.

### 16.5 Shared query and presentation rules

All four pages use server-side filtering, sorting, and pagination. Validate sort keys against an allowlist; never interpolate a client-provided column name into SQL. Use stable tie-break sorting by primary key. Restrict every page to Administrators. Log privilege changes and other sensitive Admin actions in `audit_logs`.
