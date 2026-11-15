# MEssentials: Functional & Technical Blueprint (SPEC.md)

Version: KLP-1 (web app, updated). **Spec revision 2.** Date: 2026-11-08.
Team: Krispy Little Potatoes. Client: UP Diliman Department of Mechanical Engineering (DME), Mechanics Volcorps.

Companion files:
- `UI_DESIGN.md`: theme tokens, components, screens.
- `Changes.md`: every revision from the original KLP and KLP-1 documents and from spec revision 1, with reasons and fallback steps.
- `docs/archive/SPEC.v1.md`: the first draft of this spec (Redis, BullMQ, email). Kept as the fallback.

This file covers behavior, data, APIs, uploads, background jobs, and notifications.

Items marked **[ASSUMPTION]** are not stated in the project files or your answers. Confirm or change them. They are collected in section 14.

---

## 1. Purpose and Scope

### 1.1 Purpose

MEssentials is one web app for the DME student services that today are spread across Facebook, Messenger, Google Docs, Google Forms, and Google Sheets. It gives students one place to use these services and gives volunteers one place to run them.

| Service | Name in app | What students do |
|---|---|---|
| Honesty store | HonestME Store | Browse products, add to cart, check out |
| Item borrowing | ME-kailangan | Browse items, borrow and return units with an ID scan |
| Review materials | MEg-aral | Search, preview, bookmark, and download reviewers |
| Events | ME Days | Browse events, register or unregister |
| Registration queue | Registration | Join the online queue, see position, get alerts |
| Notifications and messages | Bell icon | Read alerts, message volunteers |

### 1.2 In scope

- Desktop-first responsive web app (Svelte). Mobile layouts come after the desktop template, per the design document.
- Three actor groups: Student, Volunteer (five manager roles), Administrator.
- Account creation (sign-up) with username or email plus password, and login with Google (UP Mail). Account verification by Google sign-in or by a volunteer.
- Store, borrowing, reviewer, events, and registration queue features, each with student and manager functions.
- In-app notifications (the notification tab) and web push notifications.
- A student-to-volunteer message system.
- File upload for reviewers and images.
- Background jobs in a PostgreSQL `jobs` table, run by a worker process.

### 1.3 Out of scope (this release)

- Native mobile apps. (The older preliminary mobile mockups are superseded.)
- Online payment. The store is an honesty store, so checkout only records a purchase.
- OCR for scanned PDFs.
- Email of any kind (verification, reset, notification). Removed because of cost.
- Redis and BullMQ.

### 1.4 Goals from the project files

- Remove the need for several external apps per task.
- Let students see their own queue status without exposing other students' data.
- Reduce clicks. The navigation scenario analysis totals 19 clicks, 10 keystrokes, 21 navigation actions, and 2 data-entry actions across six core scenarios. Keep each core flow at or under its counted clicks.
- Defect Removal Efficiency (DRE = E / (E + D)) is the quality metric. Track it per release.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Svelte 5 with SvelteKit | Server-side rendering plus client navigation |
| Styling | Tailwind CSS | Tokens in `UI_DESIGN.md` |
| Backend | SvelteKit full-stack | API routes in `src/routes/api/v1/**/+server.ts` |
| Database | PostgreSQL on Supabase | Pooled connection strings only (section 3.2) |
| Object storage | Cloudflare R2 (S3-compatible) | Reviewer files and images |
| Background jobs | PostgreSQL `jobs` table + custom worker | Separate Node process (section 8) |
| Live updates | Client polling | Svelte timers, paused in hidden tabs (section 6.10) |
| Notifications | In-app tab + Web Push (VAPID) | `web-push` library, service worker (section 8.5) |
| Auth | Google OAuth + username/email and password | Cookie sessions |
| Bot protection | Cloudflare Turnstile | Free tier. Sign-up and repeated login failures |
| Validation | Zod | Shared between client and server |
| ORM / query layer | Drizzle ORM with `postgres` driver | **[ASSUMPTION]** Any typed query layer works if it can disable prepared statements |
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
      models/            # store, borrowing, reviewers, events, registration, notifications, messages, users
      auth/              # sessions, oauth, password, recovery codes, throttle
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

# Upload limits (bytes)
MAX_UPLOAD_PDF_BYTES=52428800        # 50 MB
MAX_UPLOAD_IMAGE_BYTES=52428800      # 50 MB [ASSUMPTION: same as PDF, from the "50MB PDF/Image" example]

# Business rules
MAX_ACTIVE_LOANS=5                   # [ASSUMPTION] from the "3 of 5" stat card
MAX_LOAN_DAYS=7                      # [ASSUMPTION]
BORROW_REMINDER_LEAD_DAYS=2          # the "Due within x days" value
REGISTRATION_ALERT_POSITION=1        # alert when a student is this many places from the front
ACADEMIC_YEAR_START_MONTH=8          # [ASSUMPTION] used to compute year standing
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

## 4. Roles, Account States, and Permissions

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

### 4.2 Account states

| State | How it happens | What it means |
|---|---|---|
| Unverified | Sign-up with username/email and password | Limited access (table below) |
| Verified | Google sign-in with the same email, or a staff check of the physical ID, or the admin seed script | Full student access |
| Must change password | Staff set a temporary password | Only password change and logout work until the student sets a new password |

Access by state:

| Feature | Unverified | Verified |
|---|---|---|
| Browse all services, notification tab, messages | Yes | Yes |
| Store checkout | Yes | Yes |
| Reviewers (open, bookmark, download) | Yes | Yes |
| Borrow and return items | No | Yes (and ID scan) |
| Register for events | No | Yes |
| Join registration queue | No | Yes |

Blocked actions return `403 ACCOUNT_NOT_VERIFIED`.

### 4.3 Permission matrix

| Capability | Student | Volunteer (matching role) | Admin |
|---|---|---|---|
| Sign up, log in, edit own profile, notification settings, block senders | Yes | Yes | Yes |
| View, search, filter in all services | Yes | Yes | Yes |
| Cart and check out | Yes | Yes | Yes |
| Borrow and return (verified, with ID scan) | Yes | Yes | Yes |
| Open, bookmark, download reviewers | Yes | Yes | Yes |
| Register or unregister for events (verified) | Yes | Yes | Yes |
| Join or leave registration queue (verified) | Yes | Yes | Yes |
| Send message to volunteers | Yes | Yes | Yes |
| Send message to a student (carbon copy to others) | No | Yes (any role) | Yes |
| Add or edit products, restock, view store metrics | No | `store_manager` | Yes |
| Add or edit borrowables and units, view borrowing details | No | `kailangan_manager` | Yes |
| Add or edit reviewers, toggle visibility | No | `megaral_manager` | Yes |
| Add or edit events, view registrants | No | `medays_manager` | Yes |
| Open or close queue, view queue, manage advisers | No | `registration_manager` | Yes |
| Verify an account, link an ID card, set a temporary password | No | `registration_manager` **[ASSUMPTION]** | Yes |
| Grant or remove volunteer roles, grant admin (not self) | No | No | Yes |

Enforce permissions in the model or a shared `authorize()` helper, not only in the UI.

---

## 5. Database Schema

PostgreSQL. All ids are `uuid` with `default gen_random_uuid()` unless noted. All tables have `created_at timestamptz not null default now()`. Mutable tables also have `updated_at`. Money uses `numeric(10,2)` in PHP.

Extensions: `pgcrypto` (or built-in `gen_random_uuid`), `citext`, `pg_trgm` (optional, for fuzzy search).

The schema was checked against 3NF and BCNF. Deliberate exceptions are listed in section 5.11.

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
  email citext NOT NULL UNIQUE,                  -- UP Mail. Unproven until the account is verified
  username citext UNIQUE
    CHECK (username ~ '^[a-z0-9_.]{3,32}$'),     -- null for Google-only accounts
  password_hash text,                            -- argon2id. Null for Google-only accounts
  google_sub text UNIQUE,                        -- null for password-only accounts
  first_name text,
  last_name text,
  student_number text UNIQUE,
  entry_year smallint CHECK (entry_year BETWEEN 2000 AND 2100),  -- academic year the student entered; standing is derived
  id_card_code text UNIQUE,                      -- value read by the ID scanner [ASSUMPTION]
  avatar_key text,                               -- R2 key
  is_admin boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_via text CHECK (verified_via IN ('google','staff','seed')),
  verified_by uuid REFERENCES users(id),         -- staff member who verified, if any
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL),
  CHECK ((verified_at IS NULL) = (verified_via IS NULL))
);

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

CREATE TABLE recovery_codes (                    -- one-time codes for password reset without email
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,                -- sha256 of a 16-character base32 code (80 bits)
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON recovery_codes (user_id) WHERE used_at IS NULL;

CREATE TABLE auth_throttle (                     -- login and recovery failure counters (no Redis)
  key text PRIMARY KEY,                          -- e.g. 'login:ip:1.2.3.4', 'login:id:jdoe', 'recovery:id:jdoe'
  failures integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

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

CREATE TABLE blocked_profiles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blocked_user_id),
  CHECK (user_id <> blocked_user_id)
);

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

**Profile complete** means `first_name`, `last_name`, `student_number`, and `entry_year` are set. Joining the registration queue and registering for events require a complete profile (matches the "Prompt student profile update" step).

**Year standing** is derived, not stored:

```
ayStartYear = (currentMonth >= ACADEMIC_YEAR_START_MONTH) ? currentYear : currentYear - 1
yearStanding = ayStartYear - entry_year + 1
```

Use it for display and for `participation_constraints`. Students who shifted programs or are irregular may not match their entry year. Managers can still register them by hand through a message to the event manager **[ASSUMPTION]**.

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
  qr_code text NOT NULL UNIQUE,                  -- printed on the unit
  image_key text,
  status unit_status NOT NULL DEFAULT 'available',  -- kept on purpose (section 5.11)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON borrowable_units (borrowable_id, status);

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
  content text NOT NULL
);

CREATE TABLE reviewer_bookmarks (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES reviewers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, reviewer_id)
);
```

Search vector weights (set by the index job): title = A, tags = B, extracted text = C.

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
  participation_constraints jsonb NOT NULL DEFAULT '{}',        -- e.g. {"year_standings":[1,2]} (section 5.11)
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

### 5.8 Notifications and messages

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

CREATE TABLE messages (                          -- "tickets" in the class diagram
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id),
  category text NOT NULL CHECK (category IN ('question','concern','feedback','reminder','reply','other')),
  department service,                            -- which service it concerns
  subject text NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES messages(id),        -- for replies
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE message_recipients (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind recipient_kind NOT NULL DEFAULT 'to',
  read_at timestamptz,
  deleted_at timestamptz,
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX ON message_recipients (user_id, deleted_at);
```

The `notifications` table has no email columns in this revision.

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
| `reviewers.authors` (text[]) | Not atomic | Only displayed | If you need to filter or link by author, add `authors` and `reviewer_authors` tables |
| `borrowables.components` (jsonb) | Not atomic | Only displayed | If you need to filter by component, add a `borrowable_components` table |
| `events.participation_constraints` (jsonb) | Not atomic | Read as one rule object by the app | If rules grow, add a constraints table |
| `audit_logs.target_type`, `target_id`, `metadata` | Polymorphic target, loose metadata | An audit trail should not need a foreign key per table | None |
| `queue_entries.notified_next_at` | Event timestamp stored next to state | Needed for exactly-once alerts | None |

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
| 403 | `FORBIDDEN`, `ACCOUNT_NOT_VERIFIED`, `PASSWORD_CHANGE_REQUIRED` |
| 404 | `NOT_FOUND` |
| 409 | `PROFILE_INCOMPLETE`, `DUPLICATE`, `OUT_OF_STOCK`, `EVENT_FULL`, `REGISTRATION_CLOSED`, `QUEUE_CLOSED`, `LOAN_LIMIT`, `UNIT_UNAVAILABLE` |
| 413 | `FILE_TOO_LARGE` |
| 415 | `UNSUPPORTED_FILE_TYPE` |
| 422 | `SCAN_INVALID`, `SCAN_WRONG_STUDENT`, `INVALID_RECOVERY_CODE` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL` |

Rate limits **[ASSUMPTION]**:
- **Login and recovery failures** are stored in `auth_throttle` so they survive restarts and work across instances. Rule: 5 failures per identifier or per IP within 15 minutes locks that key for 15 minutes. After 3 failures, require a Turnstile token.
- **Other limits** (scan verify 10 per minute per session, search 60 per minute per session, everything else 300 per minute per session) use an in-memory limiter in each web instance. This is fine for one instance. With several instances, move them to Postgres.

### 6.2 Auth and sign-up

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account. Returns the user and 8 recovery codes (shown once). |
| POST | `/auth/login` | Public | Body `{ identifier, password, turnstileToken? }`. `identifier` is a username or an email. |
| GET | `/auth/google` | Public | Start Google OAuth. |
| GET | `/auth/google/callback` | Public | Finish OAuth, create or link a user, set session. |
| POST | `/auth/recovery/reset` | Public | Body `{ identifier, code, newPassword, turnstileToken }`. Resets the password with one recovery code. |
| POST | `/auth/recovery/regenerate` | User | Body `{ password }`. Replaces all unused codes with 8 new ones (shown once). |
| POST | `/auth/password/change` | User | Body `{ currentPassword?, newPassword }`. `currentPassword` is not needed when `must_change_password` is set or the account has no password yet. |
| POST | `/auth/logout` | User | Deletes the session. |
| GET | `/auth/me` | User | Current user, roles, state flags, notification unread count. |

There are no email routes (`verify-email`, `forgot`) in this revision.

**First administrator.** Nobody can approve the first admin, so run `pnpm seed:admin`. It prompts for an email, a username, and a password in the terminal, creates the user with `is_admin = true`, `verified_via = 'seed'`, and prints recovery codes once. After that, admins grant roles in the app.

**Sign-up (`POST /auth/register`)**

1. Body: `{ email, username, password, firstName, lastName, studentNumber, entryYear, turnstileToken }`.
2. Verify the Turnstile token. Failure: `400 CAPTCHA_FAILED`.
3. Check the email domain against `ALLOWED_EMAIL_DOMAINS`. The domain is only a claim at this point, because no email is sent.
4. Check the username pattern `^[a-z0-9_.]{3,32}$`. Check the password: at least 10 characters and not on a list of common passwords **[ASSUMPTION]**.
5. Reject duplicates of email, username, or student number with `409 DUPLICATE`.
6. Hash the password with argon2id. Insert the user with `verified_at = NULL`.
7. Create 8 recovery codes. Each is 16 base32 characters (80 bits), shown in groups of 4. Store only the SHA-256 hash.
8. Create a session. Return `{ user, recoveryCodes }`. The UI must make the student save or print the codes before continuing.

**Login (`POST /auth/login`)**

1. Look up by `identifier` (email or username, case-insensitive). Run the same password check on a dummy hash when no user is found, so timing does not reveal accounts.
2. Apply the throttle rules in section 6.1. Failure: `401 INVALID_CREDENTIALS` with one generic message.
3. Success: reset the counters, create a session. If `must_change_password` is true, the session can only call `/auth/password/change`, `/auth/logout`, and `/auth/me`. All other routes return `403 PASSWORD_CHANGE_REQUIRED`.

**Google sign-in**

1. Require the `email_verified` claim from Google and a domain in `ALLOWED_EMAIL_DOMAINS`.
2. Find the user by `google_sub`. If found, log in.
3. If not found, find by email.
   - **No account:** create a verified account (`verified_via = 'google'`). Profile fields stay empty until the student completes them.
   - **Unverified password account:** link `google_sub`, set `verified_via = 'google'`, **clear `password_hash`**, delete all sessions and recovery codes, and log the Google user in. This stops someone from squatting on another student's email with a password account. The real owner can set a new password later in Profile.
   - **Verified account** (verified by staff earlier): link `google_sub`, keep the password.

**Recovery without email**

- **Recovery code:** `POST /auth/recovery/reset`. Check the throttle. Find an unused code whose hash matches, for a user matching the identifier. Mark it used, set the new password, delete all sessions. Wrong code: `422 INVALID_RECOVERY_CODE`.
- **No codes left:** the student shows their physical UP ID to a registration manager or admin. Staff use `POST /staff/accounts/:id/temporary-password` (section 6.11). The student must change it at the next login.

### 6.3 Profile, notification settings, blocking

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/profile` | User | Own profile, including computed `yearStanding` and `profileComplete`. |
| PATCH | `/profile` | User | Update username, first name, last name, student number, entry year. |
| GET | `/profile/notification-settings` | User | Per-service `inApp` and `push` flags. |
| PUT | `/profile/notification-settings` | User | Set flags. `push` requires `inApp`. |
| GET | `/profile/blocked` | User | Blocked senders. |
| PUT | `/profile/blocked/:userId` | User | Block a sender. |
| DELETE | `/profile/blocked/:userId` | User | Unblock. |

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

### 6.5 Messages

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/messages` | User | Inbox and sent. Query: `box=inbox\|sent`. |
| GET | `/messages/:id` | User | One message with its thread. |
| POST | `/messages` | User | Send. See below. |
| DELETE | `/messages/:id` | User | Soft delete for this user. |

Send body:

```json
{
  "category": "question",
  "department": "store",
  "subject": "Restock?",
  "content": "...",
  "targets": ["service_managers", "all_volunteers", "administrators"],
  "toUserIds": [],
  "ccUserIds": [],
  "parentId": null
}
```

- **Students** may use `targets` only. Targets resolve to user ids at send time (`service_managers` uses `department`).
- **Volunteers and admins** may also use `toUserIds` (a student) with `ccUserIds` for other volunteers and admins.
- Drop recipients who blocked the sender. Do not tell the sender who blocked them.
- Rate limit message sending per user, because unverified accounts can send **[ASSUMPTION]** (for example 20 per hour).

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

1. Validate items (quantity integer, 1 to 99; product active). Merge duplicate product ids.
2. Begin transaction.
3. For each product, run `UPDATE products SET stock_quantity = stock_quantity - $q WHERE id = $id AND stock_quantity >= $q RETURNING unit_price, unit_cost`. Zero rows means `409 OUT_OF_STOCK`: roll back everything.
4. Insert `purchases` and `purchase_items` with price and cost snapshots.
5. Commit.
6. Return a receipt (id, items, total, time). Refresh cached metrics.

**Restock notification flow** (algorithm: Stock Update): validate, begin transaction, update product(s), create the notification and its recipients (section 8.4), enqueue `push.fanout` in the same transaction, commit, refresh statistics, show success.

### 6.7 ME-kailangan

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/borrowables` | User | Query: `q`, `categoryIds[]`, `available`, page. Returns aggregated items with `quantityAvailable`. |
| GET | `/borrowables/categories` | User | Categories with counts. |
| GET | `/borrowables/:id` | User | Item detail with units. |
| GET | `/borrowing/me` | User | Summary: `{ onLoan, maxLoans, dueSoon, overdue, loans: [...] }`. |
| POST | `/borrowing/scans/verify` | Verified user | Body `{ code, purpose: "borrow"\|"return", unitId }`. Returns student profile and a `scanToken` valid 60 seconds. |
| POST | `/borrowing/units/:unitId/borrow` | Verified user | Body `{ dueAt, scanToken }`. |
| POST | `/borrowing/units/:unitId/return` | Verified user | Body `{ scanToken }`. |
| POST | `/borrowables` | `kailangan_manager` | Add borrowable. |
| PATCH | `/borrowables/:id` | `kailangan_manager` | Edit. |
| POST | `/borrowables/:id/units` | `kailangan_manager` | Add unit. |
| PATCH | `/borrowing/units/:unitId` | `kailangan_manager` | Edit unit (label, status, image). |
| GET | `/borrowing/units/:unitId/details` | `kailangan_manager` | Current borrower, borrow date, expected return date, history. |

Flow (matches the BorrowBorrowable and ReturnBorrowable swimlanes):

1. Student selects an item, sees its units, picks one, and clicks Borrow or Return.
2. For borrow, the student picks a return date (must be after now and at most `MAX_LOAN_DAYS` days ahead **[ASSUMPTION]**).
3. The station prompts for an ID scan. The scanner sends the card code to `/borrowing/scans/verify`.
4. Server looks up `users.id_card_code`.
   - No match: `422 SCAN_INVALID`. The UI prompts for a rescan.
   - For return, if the scanned student is not the borrower: `422 SCAN_WRONG_STUDENT`.
   - Match: return the student profile and `scanToken` (signed, bound to unit, purpose, and borrower).
5. Student confirms. The UI calls borrow or return with the token. "Choose not to confirm" means rescan: start again at step 3.

**Borrow transaction:**

1. Verify the token. Begin transaction.
2. `SELECT ... FROM borrowable_units WHERE id = $unit FOR UPDATE`. If status is not `available`: `409 UNIT_UNAVAILABLE`.
3. Count the borrower's open loans. If it is at or above `MAX_ACTIVE_LOANS`: `409 LOAN_LIMIT`.
4. Insert `borrow_records` (due_at from the request). Set unit status `borrowed`.
5. Commit. Return the confirmation with the expected return date.

No job is enqueued. The hourly reminder sweep finds the loan when it enters the reminder window (section 8.3).

**Return transaction:** verify token, lock the unit, set `returned_at = now()`, set unit status `available`, commit, return confirmation. Nothing to cancel, because the sweep only looks at open loans.

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
| POST / PATCH | `/courses`, `/courses/:id` | `megaral_manager` | Manage courses. |

Native PDF preview: the browser shows the PDF with its built-in viewer through `<iframe src={signedUrl}>` (or `<object>`). No PDF.js bundle. The signed URL sets `response-content-type=application/pdf` and `response-content-disposition=inline`. Add the R2 domain to the CSP `frame-src`. The download URL sets `response-content-disposition=attachment; filename="..."`.

Search (algorithm: MEg-aral item aggregation):

1. Normalize the keyword and validate filters.
2. If a keyword is present, build a safe `websearch_to_tsquery` and match `search_vector` (GIN). Rank with `ts_rank`. Weights: title A, tags B, extracted text C.
3. Filter `visibility = 'visible'` for students. Apply tag and course constraints.
4. Order by rank, then `published_at DESC`.
5. No keyword: list by `published_at DESC`.
6. Reviewers with `index_status <> 'ready'` still match on title and tags. Their text part joins once indexing finishes.

Create flow (matches AddReviewer swimlane): upload file (section 7), submit metadata, server validates, saves the record with `visibility = hidden`, `index_status = pending`, and enqueues `reviewer.index` in the same transaction. The manager reviews and toggles visibility. When a reviewer becomes visible for the first time, set `published_at` and create a new-reviewer notification (section 8.4).

### 6.9 ME Days

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/events` | User | Query: `q`, `categoryIds[]`, `registrable`, `registered`, page. Response groups `registered` and `available`. |
| GET | `/events/categories` | User | Categories with counts. |
| GET | `/events/:id` | User | Details, prompts, `canRegister` with a reason if not. |
| POST | `/events/:id/registration` | Verified user | Register. Body `{ answers: { promptId: text } }`. |
| DELETE | `/events/:id/registration` | Verified user | Unregister from a future event. |
| POST | `/events` | `medays_manager` | Add event (with prompts). |
| PATCH | `/events/:id` | `medays_manager` | Edit attributes and prompts. Prompts with answers are archived, not deleted. |
| GET | `/events/:id/registrants` | `medays_manager` | Count and list with profiles and answers. |

**Register transaction** (algorithm: Event Registration):

1. Check the profile is complete and passes `participation_constraints` (using the derived year standing).
2. Validate answers against active prompts (all required prompts answered). Invalid: `400` with field errors and the UI prompts for re-entry.
3. Begin transaction. `SELECT ... FROM events WHERE id = $id FOR UPDATE`.
4. Check registration window: else `409 REGISTRATION_CLOSED`.
5. Check for an active registration: else `409 DUPLICATE`.
6. Count active registrations: `SELECT count(*) FROM event_registrations WHERE event_id = $id AND cancelled_at IS NULL`. If `capacity IS NOT NULL AND count >= capacity`: `409 EVENT_FULL` (roll back). The event row lock makes this count safe.
7. Insert `event_registrations` and one `event_registration_answers` row per answered prompt.
8. Create a confirmation notification for the student (section 8.4). Commit. Return the confirmed registration.

Unregister: lock the event, set `cancelled_at`, commit. The count updates by itself.

For list views, get registrant counts with one grouped query over the `event_registrations (event_id) WHERE cancelled_at IS NULL` index.

### 6.10 Registration queue

Student routes:

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/registration/queue/me` | User | Own entry for the open session: `{ status, queueNumber, position, queueLength, adviser, desk, location, sessionOpen }`. Returns `{ inQueue: false }` if none. Supports `ETag`. |
| POST | `/registration/queue` | Verified user | Join the open session. Requires a complete profile. |
| DELETE | `/registration/queue/me` | User | Leave the queue (sets status `left`). |
| POST | `/registration/queue/me/continue` | User | Allowed when status is `called`. Returns the registration details (adviser, desk, venue). |

Join (algorithm: Registration Queue):

1. Check login, verified account, an open session, and a complete profile. Closed: `409 QUEUE_CLOSED`. Incomplete profile: `409 PROFILE_INCOMPLETE` (UI shows the profile update prompt).
2. Begin transaction.
3. Look for an existing entry for this student and session. If found and status is `waiting` or `called`, keep the original queue number and return it. If it was `left` or `removed`, return `409 DUPLICATE` with a manager-contact message **[ASSUMPTION]** (rejoining at the back needs a manager decision).
4. Otherwise `UPDATE registration_sessions SET last_ticket = last_ticket + 1 WHERE id = $s AND status = 'open' RETURNING last_ticket`. Insert the entry with that number.
5. Commit. Compute position (students ahead). Return the ticket and registration details.

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

Staff account tools (`registration_manager` or Admin):

| Method | Path | Description |
|---|---|---|
| GET | `/staff/accounts` | Search accounts by name, username, email, or student number. Query: `q`, `verified`, page. |
| POST | `/staff/accounts/:id/verify` | Body `{ idCardCode? }`. Staff confirm they saw the physical UP ID. Sets `verified_at`, `verified_via = 'staff'`, `verified_by`. Links `id_card_code` when sent (scan it at the same time). |
| POST | `/staff/accounts/:id/temporary-password` | Returns a random 12-character password once. Sets `must_change_password = true`, deletes the target's sessions. |

Every call writes an `audit_logs` row. Staff cannot use these routes on their own account or on an admin account unless they are an admin **[ASSUMPTION]**.

Admin routes:

| Method | Path | Access | Description |
|---|---|---|---|
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

The bucket is **private**. R2 serves files only through short-lived signed URLs (`R2_PRESIGN_TTL_SECONDS`, default 300).

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
- The overdue reminder is sent once per loan **[ASSUMPTION]**. A volunteer can message the student for follow-ups.
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
7. A PDF with no text layer (scanned) ends as `ready` with empty text. Search still works on title and tags. OCR is out of scope.

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

Page routes follow the rail order in the design: Store, Borrow, Reviewer, Events, Register, then Notifications and Profile at the bottom. See `UI_DESIGN.md` for layouts. The login, sign-up, recovery-code, verification, and push opt-in screens are **not** in the current design files. Build them from the same M3 tokens and flag them to the designer.

| Route | Screen | API used |
|---|---|---|
| `/login` | Log in (username or email), Google button | `/auth/*` |
| `/signup` | Sign-up form with Turnstile, then the recovery codes screen | `/auth/register` |
| `/recover` | Reset password with a recovery code | `/auth/recovery/reset` |
| `/store` | Product grid + filters + cart | `/store/*` |
| `/borrow` | Loan stats, on loan list, available list | `/borrowables`, `/borrowing/*` |
| `/reviewer` | Reviewer list + filters | `/reviewers*`, `/courses` |
| `/events` | Registered and available events | `/events*` |
| `/register` | Queue position, next steps | `/registration/queue*` |
| `/notifications` | Notification list, push opt-in banner | `/notifications*`, `/push/*` |
| `/messages` | Inbox and compose | `/messages*` |
| `/profile` | Profile, security (recovery codes, password), notification settings, device alerts | `/profile*`, `/auth/*`, `/push/*` |
| `/manage/store`, `/manage/borrow`, `/manage/reviewer`, `/manage/events`, `/manage/registration` | Manager tools (role-gated) | service manager routes |
| `/staff/accounts` | Verify accounts, link ID cards, temporary passwords | `/staff/*` |
| `/admin/users` | Roles and privileges | `/admin/*` |

Use `+layout.server.ts` to load the session and block pages by role and account state. Show a banner on unverified accounts that explains how to get verified. Client navigation keeps the rail visible.

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
- Turnstile on sign-up and after repeated login failures. Durable lockouts in `auth_throttle`.
- Recovery codes are shown once, stored hashed, single use, and replaced on regeneration.
- Temporary passwords are shown once and force a change.
- Validate and escape all input. Parameterized queries only.
- Row-level access in code: students read only their own notifications, messages, loans, and queue entry.
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

**Compatibility**
- Current Chrome, Edge, Firefox, Safari. The project file lists minimum mobile specs (1 GB RAM, iOS 12+, Android 5+). Treat these as a floor for the later responsive release; the first release targets desktop. Web push needs a newer browser (iOS 16.4+ as an installed web app).

---

## 12. Testing and Quality

- Unit tests (Vitest): models, validation, state transitions, year standing, position calculation.
- Integration tests: API routes against a test Postgres. Cover each swimlane flow and its failure branches (invalid input, invalid scan, wrong student, full event, closed queue, out of stock).
- Auth tests: sign-up, duplicate checks, login throttle and lockout, Turnstile failure, Google link over an unverified password account (password cleared, sessions deleted), recovery code single use, regenerate codes, staff verify, temporary password and forced change, unverified access blocks.
- Concurrency tests: two simultaneous checkouts of the last item, two borrows of one unit, two registrations for the last event slot, two joins by the same student, two transactions that both try to alert the same queue entry.
- Job tests: two workers claiming at once (each job runs once), stuck-job recovery, retry with backoff, dead after max attempts, scheduler creates one job per time bucket with two workers, idempotent re-runs.
- Reminder sweep tests: due-soon once, overdue once, nothing after return, catch-up after worker downtime.
- Push tests (with a mock push service): `410` removes the subscription, transient failure retries without duplicates, `pushed_at` set once, settings respected.
- Index job tests: success, failure then `failed` status, scanned PDF with no text.
- E2E (Playwright): the six navigation scenarios and their click budgets, plus sign-up and recovery-code flows.
- Track DRE: count errors found before delivery (E) and defects found after (D).
- Schedule from the plan: prototype build 12 days, database setup 5, system test 3, user test 3, polish 7, migration 4, system test 3, deployment 1. The plan was **not** recalculated for the new work (sign-up and recovery, jobs table, web push). See `Changes.md`.

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

Please confirm or correct these. Each affects the schema or API.

1. **Station devices.** The files mention a "designated store device interface" and "borrowing station interface". This spec treats them as normal browsers on a logged-in account. Borrow and return are proven by an ID scan token, not by who is logged in. Do the stations need their own account type or kiosk mode?
2. **ID scanner type.** The files say "ID Scanner" in the swimlanes, "RFID Scanner" in the deployment and data flow diagrams, and "QR" for item codes. This spec assumes the scanner types the card code like a keyboard into the page, matched to `users.id_card_code`, and QR codes only identify units. Staff link the card when they verify an account (`/staff/accounts/:id/verify`).
3. **Image size limit.** Your example was "50MB PDF/Image max". This spec uses 50 MB for both. Images at 50 MB are large. Do you want a lower image limit?
4. **Image storage.** You named R2 for reviewer files. This spec also stores product, event, borrowable, and avatar images in R2.
5. **Hosting.** Web app and worker hosting is not chosen. The worker needs an always-on process (a small VM or container) and the `pdftotext` binary. Serverless-only hosting will not work for the worker. An alternative is Supabase `pg_cron` calling a protected endpoint every minute, but long PDF extraction could hit time limits.
6. **VAPID subject.** `VAPID_SUBJECT` needs a contact (`mailto:` or `https:`). Pick one the team controls.
7. **Turnstile.** Needs a free Cloudflare account and a site key. If you prefer no third party, replace it with a rate limit only (weaker).
8. **Sign-up email domain.** `ALLOWED_EMAIL_DOMAINS=up.edu.ph` applies to sign-up, but without email the address is only a claim. Verification (Google or staff) is what proves identity. If you want non-UP emails, say so.
9. **Who can verify accounts and set temporary passwords.** This spec says `registration_manager` and admins, because they already handle student identity. Say if you want another role.
10. **Unverified limits.** Unverified accounts can browse, buy, read reviewers, and message, but cannot borrow, register for events, or join the queue.
11. **Entry year.** Profiles store the year a student entered, and year standing is computed with August as the start of the academic year. Shifters and irregular students may not match.
12. **Cart.** Kept in the browser until checkout.
13. **Loan rules.** `MAX_ACTIVE_LOANS = 5` comes from the "3 of 5" card. `MAX_LOAN_DAYS = 7` and the lead time of 2 days are guesses. The overdue reminder is sent once.
14. **Registration rules.** Students who left or were removed cannot rejoin the same session without a manager. One open session at a time. "You're next" alerts do not fire on join.
15. **Queue updates.** Polling every 10 seconds with `ETag`, not live push. Pauses in hidden tabs.
16. **Admin and staff changes** delete the target user's sessions.
17. **Rate limiting.** Login and recovery limits are stored in Postgres. All other limits are in memory per instance. Fine for one web instance.
18. **Wording fix.** The queue screen reads "Your are in line". Use "You are in line".
19. **Scanned PDFs** are not OCR'd.
20. **Design gaps.** `UI_DESIGN.md` has no login, sign-up, recovery codes, verification banner, push opt-in, or staff account screens. They need design.
21. **Plan numbers.** The FP estimate (114), the 28-day Gantt chart, and the effort breakdown were not recalculated for the new scope.
