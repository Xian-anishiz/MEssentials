# MEssentials — Database Implementation

**Status:** Database Foundation V1 implemented (users, sessions, volunteer_roles, auth_throttle). Service tables are designed and scheduled for the V2.x stages.
**Official source:** This document is the new official source of database-related memory. Section 2 carries the authoritative database design (copied from `docs/SPEC.md` §5). Schema changes are made here first and then reflected into `src/lib/server/db/schema.ts` and a new Drizzle migration.
**Last updated:** 2026-11-15

---

## 1. System Requirements

### 1.1 Main functionalities the system must support

MEssentials is a centralized responsive web app for the student services of the UP Diliman Department of Mechanical Engineering and Mechanics Volcorps. It replaces separate Facebook, Messenger, Google Docs, Google Forms, and Google Sheets workflows. The database must support:

| # | Functionality | Database responsibilities |
|---|---|---|
| F1 | **Accounts and authentication** | Google OAuth (`up.edu.ph`, `email_verified=true`) identities, optional Argon2id local passwords, cookie session storage, RFID card digests as bearer credentials, durable login-failure throttling |
| F2 | **HonestME Store** | Products, categories, stock, checkout purchases with price/cost snapshots, restock notifications, sales/profit metrics |
| F3 | **ME-kailangan (borrowing)** | Borrowable catalog, individual physical units, loans with due dates, returns, reminders, scan-token one-time use |
| F4 | **MEg-aral (reviewers)** | Reviewer PDF metadata, tags and course-code filters, full-text search vector, bookmarks, visibility and indexing states |
| F5 | **ME Days (events)** | Events with categories, registration windows, capacity limits, custom registration prompts and answers, participation constraints |
| F6 | **Registration queue** | Queue sessions, FIFO queue entries with ticket numbers, adviser routing, join/leave/advance/complete transitions, "you're next" alerts |
| F7 | **Notifications** | In-app notifications as the source of truth, per-service per-user settings, optional Web Push subscriptions |
| F8 | **Volunteer management** | Service-manager roles (`store_manager`, `kailangan_manager`, `megaral_manager`, `medays_manager`, `registration_manager`) granted per student |
| F9 | **Administration** | Admin status, role grant/revoke, audit trail of privilege changes, access removal, protection of student data |
| F10 | **File uploads** | Upload records for R2 objects with purpose, MIME, size, status, and expiry |
| F11 | **Background jobs** | Durable job queue (push fan-out, reviewer indexing, maintenance sweeps) with retries, leases, dedupe, and a dead state |

### 1.2 Business constraints embedded in the database design

These constraints are enforced **in the database** (constraints, partial unique indexes, locks), not only in application code:

| Constraint | Enforcement |
|---|---|
| Only verified Google `up.edu.ph` identities create accounts; no unverified-account states | `users.google_sub NOT NULL UNIQUE`, `users.email NOT NULL UNIQUE`; no `verified_at`/`verified_via`/`must_change_password` columns |
| RFID identifiers are stored as protected digests, never raw card values | `student_rfid_cards.identifier_hash NOT NULL UNIQUE` (HMAC-SHA-256 with server-side pepper); `display_suffix` only as masked hint |
| One active RFID card per student | Partial unique index `one_active_rfid_card_per_student … WHERE revoked_at IS NULL` |
| Local passwords are optional (Google-only accounts are valid) | `users.password_hash` is nullable |
| No academic-year calculation | No entry-year column anywhere; a workflow needing year standing stores `current year standing` in its own form data (`events.participation_constraints` jsonb when event-driven) |
| Stock can never go negative | `products.stock_quantity CHECK (stock_quantity >= 0)` plus conditional `UPDATE … WHERE stock_quantity >= :qty` inside the checkout transaction |
| Money is exact and displayed in ₱ | `numeric(10,2)` for `unit_cost`, `unit_price`, `purchases.total` |
| Purchase history is immutable and preserves the price at sale time | `purchase_items.unit_price` / `unit_cost` snapshots; `purchases.total` kept because purchases are never edited |
| A physical unit can have only one open loan | Partial unique index `one_open_loan_per_unit ON borrow_records (unit_id) WHERE returned_at IS NULL`, guarded together with `borrowable_units.status` updated under a row lock |
| Loan rules (max active loans, loan duration, reminder lead) are changeable values | Enforced in the borrow transaction and reminder sweeps using `PROJECT_DEFINITIONS.md` values; not hard-coded as schema checks |
| One active event registration per student per event | Partial unique index `one_active_registration … WHERE cancelled_at IS NULL` |
| Event capacity is not a stored counter | Registrant count is `COUNT(*)` of active rows taken while holding the `events` row lock; `event_registrations` cancelled rows are history |
| Event prompts with answers are archived, not deleted | `event_prompts.archived_at`; unique `(event_id, position)` applies only to non-archived prompts |
| Only one open queue session at a time | Partial unique index `one_open_session ON registration_sessions ((true)) WHERE status = 'open'` |
| One queue entry per student per session; ticket numbers unique per session | `queue_entries UNIQUE (session_id, user_id)` and `UNIQUE (session_id, queue_number)`; `registration_sessions.last_ticket` is the atomic counter |
| In-app notifications are the source of truth; no email delivery in v1 | `notifications` has no email columns; `notification_settings` carries only `in_app`/`push`; push requires the in-app row (`CHECK (NOT push OR in_app)`) |
| Sensitive mutations are replay-safe | `idempotency_keys` unique `(user_id, operation, idempotency_key)`; response stored in the same transaction as the business write |
| Login-failure throttling survives restarts without Redis | `auth_throttle` durable counters keyed by user/card/IP |
| Privilege changes are auditable | `audit_logs` polymorphic trail for every role/admin action |
| Accounts are soft-deleted; identity tables cascade | `users.deleted_at`; `sessions`/`volunteer_roles`/`student_rfid_cards` `ON DELETE CASCADE` |
| No online payment; checkout records a purchase only | `purchases` has no payment fields |
| No direct messaging or ticketing in the current draft | No message/ticket tables |

---

## 2. Database Design

> **Provenance.** The design below is the complete database design originally specified in `docs/SPEC.md` §5 (Database Schema), carried over verbatim. Per the team decision on 2026-11-15, **this section is the official source for database-related memory**; update the design here first, then mirror it into the Drizzle schema and migrations. `docs/SPEC.md` §5 remains as a synchronized historical copy with a pointer to this document.

PostgreSQL. All ids are `uuid` with `default gen_random_uuid()` unless noted. All tables have `created_at timestamptz not null default now()`. Mutable tables also have `updated_at`. Money uses PostgreSQL `numeric(10,2)` and is displayed in Philippine pesos (₱).

Extensions: `pgcrypto` (or built-in `gen_random_uuid`), `citext`, `pg_trgm` (optional, for fuzzy search).

The schema was reviewed for 1NF, 2NF, 3NF, BCNF, 4NF, and 5NF. The applied fixes and deliberate exceptions are listed in section 2.11 and `Changes.md`.

### 2.1 Enums

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

### 2.2 Identity and access

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

### 2.3 HonestME Store

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
  total numeric(10,2) NOT NULL,                  -- kept on purpose, purchases are never edited (section 2.11)
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

### 2.4 ME-kailangan

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
  components jsonb NOT NULL DEFAULT '[]',        -- component list (display only, section 2.11)
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
  status unit_status NOT NULL DEFAULT 'available',  -- kept on purpose (section 2.11)
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

### 2.5 MEg-aral

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
  authors text[] NOT NULL DEFAULT '{}',          -- display only (section 2.11)
  description text,                              -- manager-entered description/summary
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

-- reviewer_texts table removed: no PDF text extraction in v1.
-- Search relies entirely on manager-entered metadata: title, authors, tags, course codes, description.

CREATE TABLE reviewer_bookmarks (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES reviewers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, reviewer_id)
);
```

Search vector weights (set by the index job and refreshed after manager edits): title = A, authors = A, tags = B, course codes = B, description = C. Build the tags/course-code text by joining the reviewer's linked `reviewer_tag_map` and `reviewer_courses` rows to their canonical names/codes; do not assume tags or courses are duplicate free-text columns on `reviewers`. The GIN vector supports keyword search and ranking. The relational tag and course tables support exact filter chips and counts; apply those filters with joins or `EXISTS` clauses in addition to the vector match. **No PDF text extraction in v1** — search relies entirely on manager-entered metadata.

### 2.6 ME Days

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
  participation_constraints jsonb NOT NULL DEFAULT '{}',        -- e.g. {"current_year_standing":[1,2]} when a form requires it (section 2.11)
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

The registrant count is **not stored**. Count active rows in `event_registrations` while holding the event row lock (section 6.9 of `SPEC.md`).

A student can register when: the account is verified, the event is published and in the future, registration is within its open window, the profile passes `participation_constraints`, and capacity is not full. This matches the "registrable and profile passes constraints" branch in the swimlane diagram.

### 2.7 Registration queue

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

### 2.8 Notifications

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

### 2.9 Uploads

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

### 2.10 Background jobs

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

### 2.11 Normalization notes

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
| Category and course names | Stored once in lookup tables (`product_categories`, `borrowable_categories`, `event_categories`, `courses`) and linked by ids | Prevents case variants and makes counts/renames consistent | Keep this pattern for new filter dimensions |
| Registration venue | Stored in `registration_sessions.location`; `advisers.desk` stores only a desk label | Avoids duplicate venue facts across advisers | Add adviser-specific location only if advisers can serve at distinct venues within one session |

---

## 3. Implementation

### 3.1 Chosen DBMS

| Aspect | Choice |
|---|---|
| Database engine | **PostgreSQL 17.11** (verified live: `select version()` on the dev project) |
| Hosting | **Supabase** (managed PostgreSQL; the dev project is used for local development and testing) |
| Connection modes | Runtime app/worker: Supabase **transaction pooler, port 6543**, prepared statements disabled (`prepare: false`). Migrations: Supabase **session pooler, port 5432** |
| Forbidden | The direct `db.<ref>.supabase.co` host must never be used |
| Query layer | **Drizzle ORM 0.45.4** with the **`postgres` (postgres.js) driver 4.1.1** |
| Migrations | **drizzle-kit 0.31.11** (`pnpm db:generate` to generate SQL from the Drizzle schema, `pnpm db:migrate` to apply; env auto-injected from `.env.local`) |
| Object storage | Files (product images, reviewer PDFs, avatars) live in **Cloudflare R2**; the database stores only object keys |

### 3.2 Position of the database in the system architecture

MEssentials follows the MVC architecture (AD-002). The database sits at the model layer, and **only server-side code touches it** — the browser never connects to PostgreSQL directly.

```
Browser (Svelte 5 views + stores)
   │  fetch / form posts
   ▼
SvelteKit route handlers (thin controllers: parse, authorize, call models)     ┌──────────────────┐
   ▼                                                                          │  Supabase        │
Server models (src/lib/server/models/* — queries + domain rules) ────────────▶ │  PostgreSQL 17   │
   │  Drizzle ORM + postgres driver (tx pooler 6543, prepare:false)           │                  │
   ▼                                                                          │  tx pooler :6543 │
Zod validation guards every request body before it reaches a model            │  session pooler  │
                                                                              │  :5432 (migrate) │
Background worker (separate Node process, planned) ──────────────────────────▶ └──────────────────┘
   claims jobs with FOR UPDATE SKIP LOCKED
seed script (pnpm seed:admin, planned) ──────────────────────────────────────▶
drizzle-kit migrate (pnpm db:migrate) ───────────────────────────────────────▶ (session pooler only)
```

**Components with direct integrations:**

| Component | Integration | Notes |
|---|---|---|
| SvelteKit server (`src/lib/server/db/client.ts`) | Runtime queries via `DATABASE_URL` | `prepare: false` required by the transaction pooler; pool `max: 10` |
| drizzle-kit CLI | Schema migrations via `DATABASE_URL_MIGRATE` | Session pooler only; scripts `db:generate`, `db:migrate` |
| Background worker (planned) | Runtime queries + job claiming | Reuses the same server models and pooler rules |
| `seed:admin` script (planned) | One-time first-Admin creation | Prompts for credentials, Argon2id hashing, rerun-safe |
| Cloudflare R2 | **No direct DB relation** — files are stored in R2; only object keys are stored in tables | Presigned upload/download URLs |
| Frontend stores / browser | **No direct DB integration** | Mockup browser storage is explicitly not production persistence |

### 3.3 Database model choice

The **relational model** is used; no other database model (document, key-value, graph, or wide-column) is deployed, so no secondary database system is introduced. Justification:

- Every core flow (purchases, loans, registrations, queue entries, roles) is inherently relational with strong integrity requirements (unique active loan per unit, one open session, one active registration) that PostgreSQL enforces declaratively.
- One-department scale does not justify operating a second database system; PostgreSQL alone covers the needs that would otherwise motivate one:
  - **Document-style needs** (component lists, participation constraints, job payloads, audit metadata, idempotency response bodies) are handled with **`jsonb` columns inside the relational model** — queried and validated by the app, never joined on. This keeps one system while still storing semi-structured data.
  - **Full-text search** for reviewers uses PostgreSQL `tsvector` + a **GIN inverted index** (`reviewers_search_idx`), avoiding an external search engine in v1.
  - **Queue durability and concurrency** use PostgreSQL row locks (`FOR UPDATE SKIP LOCKED` for jobs; `SELECT … FOR UPDATE` for event capacity and unit borrowing), avoiding Redis/BullMQ.
  - **Rate limiting** uses the `auth_throttle` table instead of an in-memory store so limits survive restarts.

Introduction to the system: PostgreSQL is an open-source object-relational DBMS with full ACID transactions, rich constraint types (CHECK, UNIQUE, partial indexes, FKs with referential actions), generated columns, enums, and advanced indexing (B-tree, GIN, partial). Supabase provides managed PostgreSQL with connection poolers (PgBouncer-style transaction and session modes) and is the confirmed hosting platform for MEssentials (Vercel hosts the web app; **Fly.io Micro VM hosts the worker** — $5/mo free credit covers always-on deployment; no pdftotext needed).

### 3.4 Implementation status (Database Foundation V1)

The first migration, **`0000_broken_scream.sql`**, is applied to the development Supabase project and verified:

- Tables live: `users`, `sessions`, `volunteer_roles`, `auth_throttle`
- Enum live: `volunteer_role` with the 5 service-manager roles
- Drizzle journal: 1 entry; re-running `pnpm db:migrate` is a safe no-op
- Connection verified on both pooler URLs (PostgreSQL 17.11)

Remaining §2 tables (store, borrow, reviewers, events, queue, notifications, uploads, jobs, audit, idempotency, RFID, settings/subscriptions) are **designed but not yet migrated**; they follow in the V2.x stages (Admin pages first, then student services, then volunteer pages).

### 3.5 DDL — applied foundation migration

The following is the applied migration `src/lib/server/db/migrations/0000_broken_scream.sql` (generated by `pnpm db:generate` from `src/lib/server/db/schema.ts`):

```sql
CREATE TYPE "public"."volunteer_role" AS ENUM('store_manager', 'kailangan_manager', 'megaral_manager', 'medays_manager', 'registration_manager');--> statement-breakpoint
CREATE TABLE "auth_throttle" (
	"key" text,
	"failures" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	CONSTRAINT "auth_throttle_pkey" PRIMARY KEY("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id_hash" text,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_pkey" PRIMARY KEY("id_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid DEFAULT gen_random_uuid(),
	"email" text NOT NULL,
	"username" text,
	"password_hash" text,
	"google_sub" text NOT NULL,
	"first_name" text,
	"middle_initial" text,
	"last_name" text,
	"student_number" text,
	"phone_number" text,
	"college" text,
	"degree_program" text,
	"avatar_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_enrolled" boolean DEFAULT true NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_pkey" PRIMARY KEY("id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub"),
	CONSTRAINT "users_student_number_unique" UNIQUE("student_number")
);
--> statement-breakpoint
CREATE TABLE "volunteer_roles" (
	"user_id" uuid NOT NULL,
	"role" "volunteer_role" NOT NULL,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "volunteer_roles_pkey" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_roles" ADD CONSTRAINT "volunteer_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_roles" ADD CONSTRAINT "volunteer_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_throttle_locked_until_idx" ON "auth_throttle" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_student_number_idx" ON "users" USING btree ("student_number");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "volunteer_roles_role_idx" ON "volunteer_roles" USING btree ("role");
```

### 3.6 Known deltas between the official design (§2) and the applied foundation

| Design (§2.2) | Applied migration (0000) | Disposition |
|---|---|---|
| `users.email citext` | `email text` (case-sensitivity handled by the app/Google identity) | Acceptable for foundation; revisit when the citext extension migration is added |
| `users.username citext CHECK (username ~ '^[a-z0-9_.]{3,32}$')` | `username text`, no CHECK | Add the format CHECK in the next users-table migration |
| `sessions.id_hash text PRIMARY KEY` (NOT NULL) | `id_hash text` nullable, then promoted to PK (PK columns are implicitly NOT NULL in PostgreSQL, so the PK enforces it) | Effectively equivalent; verify on insert |
| `sessions.ip inet` | `ip text` | Fine for v1; switch to `inet` if IP queries/operations are needed |
| `users` CHECK on `google_sub` | Covered by `NOT NULL` on the column | Equivalent |

---

## 4. Use Cases / Queries

> Queries below target the full §2 design. Sections 4.1.1–4.1.2 and the store/borrow queries require the service-table migrations; transaction patterns that only need foundation tables (4.1.6–4.1.8) work today. Every sensitive mutation follows the idempotency pattern in §2.2 (`idempotency_keys` insert + business write in one transaction).

### 4.1 Transactions (write operations)

#### 4.1.1 Store checkout (insert + stock update + snapshot)

**Functional spec:** F2 — checkout records a purchase and deducts stock; the honesty-system price at sale time must be preserved.

```sql
BEGIN;

-- Replay protection (SPEC 6.1.1): reserve the key first
INSERT INTO idempotency_keys (user_id, operation, idempotency_key, request_hash)
VALUES (:user_id, 'store.checkout', :idempotency_key, :request_hash)
ON CONFLICT (user_id, operation, idempotency_key) DO NOTHING;
-- If a row already exists: compare request_hash (same → replay saved response, different → 409)

-- Lock and deduct stock; the conditional WHERE is the real guard
UPDATE products
SET stock_quantity = stock_quantity - :qty, updated_at = now()
WHERE id = :product_id AND stock_quantity >= :qty
RETURNING unit_price, unit_cost;                       -- 0 rows → ROLLBACK, 409 OUT_OF_STOCK

INSERT INTO purchases (buyer_id, total) VALUES (:buyer_id, :total) RETURNING id;
INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, unit_cost)
VALUES (:purchase_id, :product_id, :qty, :unit_price, :unit_cost);   -- snapshots

UPDATE idempotency_keys SET response_status = 200, response_body = :response_json
WHERE user_id = :user_id AND operation = 'store.checkout' AND idempotency_key = :idempotency_key;

COMMIT;
```

#### 4.1.2 Borrow a physical unit (update + insert under row lock)

**Functional spec:** F3 — a unit can have only one open loan; identity comes from the authenticated session (no second RFID scan).

```sql
BEGIN;

SELECT id FROM borrowable_units WHERE id = :unit_id FOR UPDATE;      -- row lock

UPDATE borrowable_units SET status = 'borrowed', updated_at = now()
WHERE id = :unit_id AND status = 'available';                        -- 0 rows → 409 UNIT_UNAVAILABLE

INSERT INTO borrow_records (unit_id, borrower_id, due_at)
VALUES (:unit_id, :borrower_id, now() + (:max_loan_days || ' days')::interval);
-- App-level loan-limit check (MAX_ACTIVE_LOANS) runs before the transaction.

COMMIT;
```

#### 4.1.3 Return a unit (update + history preserved)

```sql
BEGIN;

UPDATE borrow_records SET returned_at = now()
WHERE unit_id = :unit_id AND returned_at IS NULL;                    -- 0 rows → 409 (not on loan)

UPDATE borrowable_units SET status = 'available', updated_at = now()
WHERE id = :unit_id;

COMMIT;
-- The borrow_records row is kept; it becomes the loan history.
```

#### 4.1.4 Event registration (insert under event row lock)

**Functional spec:** F5 — capacity is checked by counting active registrations while holding the event row lock; the partial unique index blocks double registration.

```sql
BEGIN;

SELECT capacity FROM events WHERE id = :event_id FOR UPDATE;         -- lock the event row

SELECT COUNT(*) AS taken FROM event_registrations
WHERE event_id = :event_id AND cancelled_at IS NULL;
-- taken >= capacity → ROLLBACK, 409 EVENT_FULL

INSERT INTO event_registrations (event_id, user_id) VALUES (:event_id, :user_id);
-- one_active_registration partial unique index → duplicate → 409 (already registered)

INSERT INTO event_registration_answers (registration_id, prompt_id, answer)
VALUES (:registration_id, :prompt_id, :answer);                      -- one row per prompt

COMMIT;
```

#### 4.1.5 Queue join (atomic ticket counter)

**Functional spec:** F6 — FIFO ticket numbers with no gaps or duplicates per session.

```sql
BEGIN;

SELECT id FROM registration_sessions WHERE id = :session_id AND status = 'open' FOR UPDATE;
-- No row → 409 QUEUE_CLOSED

UPDATE registration_sessions SET last_ticket = last_ticket + 1
WHERE id = :session_id
RETURNING last_ticket;                                               -- atomic ticket

INSERT INTO queue_entries (session_id, user_id, queue_number)
VALUES (:session_id, :user_id, :ticket);
-- UNIQUE (session_id, user_id) → already in queue → 409

COMMIT;
```

#### 4.1.6 Grant / revoke a volunteer role (insert / delete + audit)

**Functional spec:** F8/F9 — admin actions must always write an audit row in the same transaction.

```sql
BEGIN;

INSERT INTO volunteer_roles (user_id, role, granted_by)
VALUES (:student_id, 'store_manager', :admin_id)
ON CONFLICT (user_id, role) DO NOTHING;                              -- idempotent grant

INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
VALUES (:admin_id, 'volunteer_roles.grant', 'user', :student_id,
        '{"role":"store_manager"}');

COMMIT;

-- Revoke (delete):
BEGIN;
DELETE FROM volunteer_roles WHERE user_id = :student_id AND role = 'store_manager';
INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
VALUES (:admin_id, 'volunteer_roles.revoke', 'user', :student_id, '{"role":"store_manager"}');
COMMIT;
```

#### 4.1.7 Session lifecycle (insert on login, delete on logout/cleanup)

```sql
-- Login success: store sha256(token) only — the raw token stays in the cookie
INSERT INTO sessions (id_hash, user_id, expires_at, user_agent, ip)
VALUES (sha256(:raw_token), :user_id, now() + interval '30 days', :user_agent, :ip);

-- Logout
DELETE FROM sessions WHERE id_hash = sha256(:raw_token);

-- Maintenance sweep (worker, hourly)
DELETE FROM sessions WHERE expires_at < now();
```

#### 4.1.8 Auth throttle (upsert + reset)

**Functional spec:** F1 — 5 failures per key within 15 minutes locks the key for 15 minutes; a successful login clears it.

```sql
-- On failed attempt:
INSERT INTO auth_throttle (key, failures, window_started_at)
VALUES (:key, 1, now())
ON CONFLICT (key) DO UPDATE SET
  failures = CASE WHEN auth_throttle.window_started_at < now() - interval '15 minutes'
                  THEN 1 ELSE auth_throttle.failures + 1 END,
  window_started_at = CASE WHEN auth_throttle.window_started_at < now() - interval '15 minutes'
                  THEN now() ELSE auth_throttle.window_started_at END,
  locked_until = CASE WHEN (CASE WHEN auth_throttle.window_started_at < now() - interval '15 minutes'
                            THEN 1 ELSE auth_throttle.failures + 1 END) >= 5
                  THEN now() + interval '15 minutes' ELSE auth_throttle.locked_until END
RETURNING failures, locked_until;

-- On successful login:
DELETE FROM auth_throttle WHERE key = :key;
```

### 4.2 Analytical queries

#### 4.2.1 Store sales and profit per product (Store Manager metrics, F2)

```sql
SELECT p.name,
       SUM(pi.quantity)                                  AS units_sold,
       SUM(pi.quantity * pi.unit_price)                  AS total_sales,
       SUM(pi.quantity * (pi.unit_price - pi.unit_cost)) AS total_profit
FROM purchase_items pi
JOIN products p ON p.id = pi.product_id
GROUP BY p.id, p.name
ORDER BY total_sales DESC;
```

#### 4.2.2 Daily sales trend (₱ per day)

```sql
SELECT date_trunc('day', pu.created_at)::date AS day,
       SUM(pi.quantity * pi.unit_price)       AS sales
FROM purchases pu
JOIN purchase_items pi ON pi.purchase_id = pu.id
GROUP BY day ORDER BY day;
```

#### 4.2.3 Restock candidates (low active stock)

```sql
SELECT name, stock_quantity, unit_cost
FROM products
WHERE is_active AND stock_quantity <= 5
ORDER BY stock_quantity ASC, name;
```

#### 4.2.4 Borrow utilization per item (ME-kailangan, F3)

```sql
SELECT b.name,
       COUNT(u.id)                                        AS total_units,
       COUNT(*) FILTER (WHERE u.status = 'borrowed')      AS currently_borrowed,
       round(100.0 * COUNT(*) FILTER (WHERE u.status = 'borrowed') / COUNT(u.id), 1) AS utilization_pct
FROM borrowables b
JOIN borrowable_units u ON u.borrowable_id = b.id
GROUP BY b.id, b.name
ORDER BY utilization_pct DESC;
```

#### 4.2.5 Overdue and due-soon loans (reminder sweep input, F3)

```sql
SELECT u.label, usr.email, r.borrowed_at, r.due_at,
       r.due_at < now()                                   AS is_overdue
FROM borrow_records r
JOIN borrowable_units u ON u.id = r.unit_id
JOIN users usr ON usr.id = r.borrower_id
WHERE r.returned_at IS NULL
  AND r.due_at < now() + interval '2 days'                -- BORROW_REMINDER_LEAD_DAYS
ORDER BY r.due_at;
```

#### 4.2.6 Event fill rate (ME Days, F5)

```sql
SELECT e.name, e.starts_at, e.capacity,
       COUNT(r.id) FILTER (WHERE r.cancelled_at IS NULL)  AS registered,
       round(100.0 * COUNT(r.id) FILTER (WHERE r.cancelled_at IS NULL) / e.capacity, 1) AS fill_pct
FROM events e
LEFT JOIN event_registrations r ON r.event_id = e.id
WHERE e.capacity IS NOT NULL AND e.is_published
GROUP BY e.id, e.name, e.starts_at, e.capacity
ORDER BY fill_pct DESC;
```

#### 4.2.7 Queue wait-time statistics (Registration, F6)

```sql
SELECT s.name AS session_name,
       COUNT(*) FILTER (WHERE q.status = 'waiting')          AS now_waiting,
       round(avg(q.called_at - q.joined_at)   FILTER (WHERE q.called_at IS NOT NULL), 'seconds')  AS avg_wait_to_call,
       round(avg(q.finished_at - q.called_at) FILTER (WHERE q.finished_at IS NOT NULL), 'seconds') AS avg_service_time
FROM queue_entries q
JOIN registration_sessions s ON s.id = q.session_id
GROUP BY s.id, s.name;
```

#### 4.2.8 Daily active users (Admin usage view, F9)

```sql
SELECT (s.created_at AT TIME ZONE 'Asia/Manila')::date AS day,
       COUNT(DISTINCT s.user_id)                       AS active_users,
       COUNT(*)                                        AS logins
FROM sessions s
WHERE s.created_at >= now() - interval '14 days'
GROUP BY day ORDER BY day;
```

#### 4.2.9 Reviewer popularity (bookmarks as demand signal, F4)

```sql
SELECT r.title,
       COUNT(b.user_id) AS saves,
       r.visibility, r.index_status
FROM reviewers r
LEFT JOIN reviewer_bookmarks b ON b.reviewer_id = r.id
GROUP BY r.id, r.title, r.visibility, r.index_status
ORDER BY saves DESC
LIMIT 20;
```

#### 4.2.10 Reviewer keyword search (GIN vector + relational filters, F4)

```sql
SELECT r.id, r.title,
       ts_headline('simple', r.search_vector, websearch_to_tsquery('simple', :query)) AS snippet,
       ts_rank(r.search_vector, websearch_to_tsquery('simple', :query))               AS rank
FROM reviewers r
WHERE r.visibility = 'visible'
  AND r.search_vector @@ websearch_to_tsquery('simple', :query)
  AND EXISTS (SELECT 1 FROM reviewer_courses rc JOIN courses c ON c.id = rc.course_id
              WHERE rc.reviewer_id = r.id AND c.code = :course_code)                 -- optional chip filter
ORDER BY rank DESC
LIMIT 24;
```

#### 4.2.11 Notification engagement (F7)

```sql
SELECT n.service,
       COUNT(*)                                                      AS delivered,
       COUNT(*) FILTER (WHERE nr.read_at IS NOT NULL)                AS read,
       COUNT(*) FILTER (WHERE nr.pushed_at IS NOT NULL)              AS push_attempted,
       round(100.0 * COUNT(*) FILTER (WHERE nr.read_at IS NOT NULL) / COUNT(*), 1) AS read_pct
FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
WHERE nr.deleted_at IS NULL
GROUP BY n.service;
```

---

## 5. Sample Data for Testing and Demonstration

> **Demo data — never run against a production database.** The block below matches the **applied foundation tables** and can be run today with `DATABASE_URL_MIGRATE` pointing at the dev project (e.g. save as `scripts/seed-demo.sql` and run through `psql` or a migration-style script). Sample rows for the planned service tables follow it and apply once their migrations land. Re-running is safe for foundation tables (idempotent `ON CONFLICT DO NOTHING` + fixed UUIDs).

### 5.1 Foundation tables (runnable today)

```sql
-- Users: 1 admin, 2 volunteers, 3 students -------------------------------------------------
INSERT INTO users (id, email, username, google_sub, first_name, middle_initial, last_name,
                   student_number, phone_number, college, degree_program, is_admin)
VALUES
 ('11111111-1111-4111-8111-111111111111','admin@up.edu.ph',      'admin.upd',    'gsub-admin',
  'Maria','D','Santos','2023-00001','09170000001','College of Engineering','BS Mechanical Engineering', true),
 ('22222222-2222-4222-8222-222222222222','juan.vol@up.edu.ph',   'juan.v',       'gsub-juan',
  'Juan','C','Dela Cruz','2022-00123','09170000002','College of Engineering','BS Mechanical Engineering', false),
 ('33333333-3333-4333-8333-333333333333','ana.vol@up.edu.ph',    'ana.r',        'gsub-ana',
  'Ana','B','Reyes','2023-00456','09170000003','College of Engineering','BS Mechanical Engineering', false),
 ('44444444-4444-4444-8444-444444444444','pedro@up.edu.ph',      NULL,           'gsub-pedro',
  'Pedro','A','Gomez','2024-00789','09170000004','College of Engineering','BS Mechanical Engineering', false),
 ('55555555-5555-4555-8555-555555555555','liza@up.edu.ph',       NULL,           'gsub-liza',
  'Liza','M','Tan','2024-00234','09170000005','College of Engineering','BS Mechanical Engineering', false),
 ('66666666-6666-4666-8666-666666666666','carlo@up.edu.ph',      NULL,           'gsub-carlo',
  'Carlo','E','Mendoza','2025-00111','09170000006','College of Engineering','BS Mechanical Engineering', false)
ON CONFLICT (id) DO NOTHING;

-- Volunteer roles --------------------------------------------------------------------------
INSERT INTO volunteer_roles (user_id, role, granted_by) VALUES
 ('22222222-2222-4222-8222-222222222222','store_manager',       '11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222','megaral_manager',     '11111111-1111-4111-8111-111111111111'),
 ('33333333-3333-4333-8333-333333333333','kailangan_manager',   '11111111-1111-4111-8111-111111111111'),
 ('33333333-3333-4333-8333-333333333333','medays_manager',      '11111111-1111-4111-8111-111111111111')
ON CONFLICT (user_id, role) DO NOTHING;

-- Sessions (two logins; one expired to demo cleanup) ---------------------------------------
INSERT INTO sessions (id_hash, user_id, expires_at, user_agent) VALUES
 (sha256('demo-token-pedro'), '44444444-4444-4444-8444-444444444444', now() + interval '30 days', 'Mozilla/5.0 Chrome'),
 (sha256('demo-token-expired'), '55555555-5555-4555-8555-555555555555', now() - interval '1 hour', 'Mozilla/5.0 Firefox')
ON CONFLICT (id_hash) DO NOTHING;

-- Auth throttle (one locked-out IP, one clean counter) -------------------------------------
INSERT INTO auth_throttle (key, failures, window_started_at, locked_until) VALUES
 ('password_login:ip:10.0.0.15', 5, now() - interval '5 minutes', now() + interval '10 minutes'),
 ('password_login:user:44444444-4444-4444-8444-444444444444', 2, now() - interval '3 minutes', NULL)
ON CONFLICT (key) DO NOTHING;
```

### 5.2 Service tables (apply after their migrations land)

```sql
-- Store ------------------------------------------------------------------------------------
INSERT INTO product_categories (id, name) VALUES
 ('a0000000-0000-4000-8000-000000000001','Chips'),
 ('a0000000-0000-4000-8000-000000000002','Coffee'),
 ('a0000000-0000-4000-8000-000000000003','Stationery') ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, category_id, unit_cost, unit_price, stock_quantity) VALUES
 ('b0000000-0000-4000-8000-000000000001','Piattos Cheese 40g', 'a0000000-0000-4000-8000-000000000001', 18.00, 25.00, 40),
 ('b0000000-0000-4000-8000-000000000002','Great Taste White 3-in-1', 'a0000000-0000-4000-8000-000000000002', 7.50, 12.00, 8),
 ('b0000000-0000-4000-8000-000000000003','Mechanical Pencil 0.5', 'a0000000-0000-4000-8000-000000000003', 22.00, 35.00, 15),
 ('b0000000-0000-4000-8000-000000000004','Pad Paper (80 leaves)', 'a0000000-0000-4000-8000-000000000003', 28.00, 40.00, 3)
ON CONFLICT (id) DO NOTHING;

-- Purchases with price/cost snapshots (demo of 4.1.1 output)
INSERT INTO purchases (id, buyer_id, total) VALUES
 ('c0000000-0000-4000-8000-000000000001','44444444-4444-4444-8444-444444444444', 50.00),
 ('c0000000-0000-4000-8000-000000000002','55555555-5555-4555-8555-555555555555', 70.00),
 ('c0000000-0000-4000-8000-000000000003','66666666-6666-4666-8666-666666666666', 25.00) ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_price, unit_cost) VALUES
 ('d0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001', 2, 25.00, 18.00),
 ('d0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000003', 2, 35.00, 22.00),
 ('d0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000002', 1, 12.00, 7.50) ON CONFLICT (id) DO NOTHING;

-- ME-kailangan -----------------------------------------------------------------------------
INSERT INTO borrowable_categories (id, name) VALUES
 ('e0000000-0000-4000-8000-000000000001','School supplies'),
 ('e0000000-0000-4000-8000-000000000002','Utilities') ON CONFLICT (id) DO NOTHING;

INSERT INTO borrowables (id, name, category_id, description, components) VALUES
 ('f0000000-0000-4000-8000-000000000001','Scientific Calculator (Casio fx-991ES)', 'e0000000-0000-4000-8000-000000000001', 'For exams; honesty system', '["Calculator","Case"]'::jsonb),
 ('f0000000-0000-4000-8000-000000000002','Extension Cord (3m)', 'e0000000-0000-4000-8000-000000000002', 'For project work in the tambayan', '["Cord","3 outlets"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO borrowable_units (id, borrowable_id, label, qr_code, status) VALUES
 ('0a000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','Calculator #1','UNIT-CALC-1','borrowed'),
 ('0a000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001','Calculator #2','UNIT-CALC-2','available'),
 ('0a000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001','Calculator #3','UNIT-CALC-3','available'),
 ('0a000000-0000-4000-8000-000000000004','f0000000-0000-4000-8000-000000000002','Ext Cord #1','UNIT-EXT-1','available')
ON CONFLICT (id) DO NOTHING;

INSERT INTO borrow_records (id, unit_id, borrower_id, borrowed_at, due_at) VALUES
 ('0b000000-0000-4000-8000-000000000001','0a000000-0000-4000-8000-000000000001','44444444-4444-4444-8444-444444444444',
  now() - interval '6 days', now() + interval '1 day')   -- due soon
ON CONFLICT (id) DO NOTHING;

-- ME Days ----------------------------------------------------------------------------------
INSERT INTO event_categories (id, name) VALUES ('0c000000-0000-4000-8000-000000000001','Academic') ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, name, category_id, location, starts_at, capacity,
                    registration_opens_at, registration_closes_at, participation_constraints) VALUES
 ('0d000000-0000-4000-8000-000000000001','ME Week Quiz Bee','0c000000-0000-4000-8000-000000000001','IE-ME Building 110',
  now() + interval '7 days', 30, now() - interval '1 day', now() + interval '5 days',
  '{"current_year_standing":[1,2,3,4]}'::jsonb) ON CONFLICT (id) DO NOTHING;

INSERT INTO event_prompts (id, event_id, position, prompt, required) VALUES
 ('0e000000-0000-4000-8000-000000000001','0d000000-0000-4000-8000-000000000001',1,'Current year standing',true),
 ('0e000000-0000-4000-8000-000000000002','0d000000-0000-4000-8000-000000000001',2,'Team members (if any)',false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO event_registrations (id, event_id, user_id) VALUES
 ('0f000000-0000-4000-8000-000000000001','0d000000-0000-4000-8000-000000000001','44444444-4444-4444-8444-444444444444'),
 ('0f000000-0000-4000-8000-000000000002','0d000000-0000-4000-8000-000000000001','55555555-5555-4555-8555-555555555555')
ON CONFLICT (id) DO NOTHING;

INSERT INTO event_registration_answers (registration_id, prompt_id, answer) VALUES
 ('0f000000-0000-4000-8000-000000000001','0e000000-0000-4000-8000-000000000001','2'),
 ('0f000000-0000-4000-8000-000000000002','0e000000-0000-4000-8000-000000000001','3')
ON CONFLICT (registration_id, prompt_id) DO NOTHING;

-- Registration queue ----------------------------------------------------------------------
INSERT INTO registration_sessions (id, name, status, last_ticket, location) VALUES
 ('10000000-0000-4000-8000-000000000001','AY 2026-2027 Sem 2 Enrollment','open', 4, 'IE-ME Building 105')
ON CONFLICT (id) DO NOTHING;

INSERT INTO advisers (id, name, field, status, desk) VALUES
 ('11000000-0000-4000-8000-000000000001','Engr. Ramos','Statics','available','Desk 1'),
 ('11000000-0000-4000-8000-000000000002','Engr. Villanueva','Dynamics','busy','Desk 2') ON CONFLICT (id) DO NOTHING;

INSERT INTO queue_entries (id, session_id, user_id, queue_number, status, adviser_id, joined_at, called_at) VALUES
 ('12000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','44444444-4444-4444-8444-444444444444',1,'completed','11000000-0000-4000-8000-000000000001', now() - interval '40 minutes', now() - interval '30 minutes'),
 ('12000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','55555555-5555-4555-8555-555555555555',2,'called','11000000-0000-4000-8000-000000000002', now() - interval '25 minutes', now() - interval '5 minutes'),
 ('12000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666',3,'waiting',NULL, now() - interval '10 minutes', NULL)
ON CONFLICT (id) DO NOTHING;

-- Notifications ----------------------------------------------------------------------------
INSERT INTO notifications (id, service, subject, body, link) VALUES
 ('13000000-0000-4000-8000-000000000001','kailangan','Borrow due tomorrow','Calculator #1 (Casio fx-991ES) is due in 1 day.','/borrow'),
 ('13000000-0000-4000-8000-000000000002','store','Restock alert','Pad Paper (80 leaves) stock is at 3.','/store')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification_recipients (notification_id, user_id, read_at, pushed_at) VALUES
 ('13000000-0000-4000-8000-000000000001','44444444-4444-4444-8444-444444444444', NULL, now()),
 ('13000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222', now(), now())
ON CONFLICT (notification_id, user_id) DO NOTHING;

-- Background jobs ----------------------------------------------------------------------------
INSERT INTO jobs (id, queue, name, payload, status) VALUES
 ('14000000-0000-4000-8000-000000000001','kailangan','borrow.reminders','{}'::jsonb,'queued'),
 ('14000000-0000-4000-8000-000000000002','push','push.fanout','{"notification_id":"13000000-0000-4000-8000-000000000001"}'::jsonb,'succeeded')
ON CONFLICT (id) DO NOTHING;
```

### 5.3 What the sample data demonstrates

| Demo goal | Rows provided | Pairs with |
|---|---|---|
| Role-based access (admin, volunteers, students) | 6 users, 4 role grants | §4.1.6 |
| Session lifecycle + cleanup | 2 sessions (1 expired) | §4.1.7 |
| Durable throttling | 2 throttle keys (1 locked) | §4.1.8 |
| Store sales/profit analytics | 3 purchases, 3 items with snapshots | §4.2.1–4.2.3 |
| Borrow utilization + due-soon | 4 units (1 borrowed), 1 open loan due in 1 day | §4.2.4–4.2.5 |
| Event capacity + custom questions | 1 event (capacity 30), 2 prompts, 2 registrations with answers | §4.1.4, §4.2.6 |
| Queue positions + wait times | 1 open session, 2 advisers, 3 entries (completed/called/waiting) | §4.1.5, §4.2.7 |
| Notification engagement | 2 notifications, 2 recipients (1 unread) | §4.2.11 |
| Job queue states | 1 queued, 1 succeeded job | F11 |
