# MEssentials — Developer Environment Setup

This guide prepares a local development machine for the MEssentials V2.x backend work. It is designed for a fresh clone and can be used on Windows (WSL), macOS, or Linux. Use a supported Node version manager on your operating system; the project itself requires Node.js 22 or newer.

> **Quick start:** If you have a Node version manager installed, run `scripts/setup-dev.sh` after cloning. It will install dependencies, create `.env` from `.env.example`, and run `check` + `build` for you.

## 1. Install the base tools

Install:

- Git
- Node.js 22 or newer
- Corepack (bundled with supported Node distributions)
- pnpm 12.x through the version pinned in this repository
- A code editor

Check the tools:

```bash
git --version
node --version
corepack --version
```

Enable Corepack if it is not enabled:

```bash
corepack enable
```

> The exact pnpm release must come from the repository's `package.json` `packageManager` field. Do not install an arbitrary global pnpm version.
>
> **Corepack version note:** Node.js builds that bundle Corepack older than 0.34.5 cannot start pnpm 12 (error: `Cannot find module .../bin/pnpm.cjs`). If you see that error, upgrade Corepack (`npm install --global corepack@0.36.0`), delete the stale Corepack cache for pnpm (`%LOCALAPPDATA%\node\corepack\v1\pnpm` on Windows, `~/.cache/node/corepack/v1/pnpm` elsewhere), then rerun `corepack pnpm --version`.

## 2. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_DIRECTORY>
```

If the repository is already on your machine:

```bash
cd <PATH_TO_REPOSITORY>
git status --short
```

Do not continue if you have local changes you do not understand. Keep them safe before switching branches or pulling updates.

## 3. Check the project configuration

The project is specified as SvelteKit + Svelte 5 + TypeScript + Tailwind CSS. Confirm that:

- `vite.config.ts` loads `@sveltejs/kit/vite`;
- `svelte.config.js` exists;
- `package.json` contains a pinned `packageManager` entry for pnpm 12.x;
- `pnpm-lock.yaml` exists;
- `.npmrc` enables strict engine checks (`engine-strict=true`);
- `.nvmrc` pins the Node.js version (currently `22`).

Vite is used by SvelteKit for development and builds. A `vite dev` command by itself does not tell you whether the project is plain Vite or SvelteKit.

If these files do not match, stop and ask the maintainer before changing the framework or package setup.

## 4. Install dependencies

From the repository root:

```bash
pnpm install --frozen-lockfile
```

This uses the exact dependency versions recorded in `pnpm-lock.yaml`. If it fails because the lockfile is out of sync, report the error to the maintainer instead of deleting or regenerating the lockfile.

## 5. Create your local environment file

If `.env.example` exists:

```bash
cp .env.example .env
```

If `.env` already exists, do not copy over it. Open it and update only the values you have been given.

At minimum, the database integration stage needs the two Supabase connection strings described below. Other integrations can remain blank until the related feature is implemented.

### Environment variables

| Variable | Purpose | When needed |
|---|---|---|
| `PUBLIC_APP_URL` | Local app URL, usually `http://localhost:5173` | Local app |
| `NODE_ENV` | Runtime mode | Local app |
| `SESSION_SECRET` | Signs or protects session data | Authentication |
| `ALLOWED_EMAIL_DOMAINS` | Allowed Google sign-in domain; `up.edu.ph` | Authentication |
| `DATABASE_URL` | Supabase transaction pooler URL, port 6543 | App and worker database access |
| `DATABASE_URL_MIGRATE` | Supabase session pooler URL, port 5432 | Database migrations only |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials | Google sign-in |
| `PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | Bot protection |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 storage | File and image uploads |
| `R2_PRESIGN_TTL_SECONDS` | Presigned upload/download URL lifetime | R2 integration |
| `PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push credentials | Push notifications |
| `WORKER_POLL_INTERVAL_MS`, `WORKER_CONCURRENCY`, `WORKER_DB_POOL_MAX` | Background worker settings | Worker |
| `MAX_UPLOAD_PDF_BYTES`, `MAX_UPLOAD_IMAGE_BYTES` | Upload limits | Upload features |
| `MAX_ACTIVE_LOANS`, `MAX_LOAN_DAYS`, `BORROW_REMINDER_LEAD_DAYS` | Borrowing rules | Borrow feature |
| `REGISTRATION_ALERT_POSITION` | Queue alert threshold | Queue feature |

The complete blank template is in `.env.example`. Do not send `.env` values in chat, screenshots, commits, or issue reports.

### Supabase connection rules

- Use a development Supabase project for local work.
- `DATABASE_URL` must use the transaction pooler (port `6543`).
- `DATABASE_URL_MIGRATE` must use the session pooler (port `5432` on the pooler host).
- Do not use the direct database host.
- The `postgres` driver must disable prepared statements (`prepare: false`) when using the transaction pooler.
- Keep migration credentials separate from the runtime connection.

## 6. Verify the local app

Run:

```bash
pnpm run check
pnpm run build
```

Start the development server:

```bash
pnpm dev
```

Open the local URL printed by Vite. Stop the server with `Ctrl+C`.

If a command is missing from `package.json`, do not guess the command. Tell the maintainer which script is missing.

## 7. Database setup (when the V2.x database branch is ready)

Do not run this section until the repository has Drizzle configuration, schema files, and migration scripts.

The intended order is:

1. Add the PostgreSQL driver and Drizzle ORM/Drizzle Kit dependencies selected by the project.
2. Add the server-only database client under `src/lib/server/db/`.
3. Configure the runtime client to use `DATABASE_URL` and `prepare: false`.
4. Configure migration tooling to use `DATABASE_URL_MIGRATE`.
5. Add the first schema for users, volunteer roles, sessions, and authentication support.
6. Generate the migration and inspect the SQL.
7. Apply it to the development database using the migration command documented in `package.json`.
8. Verify a server-side query.

The database must never be accessed directly from browser code. Keep queries and domain rules in server-side models. Keep route handlers thin and enforce permissions on the server.

## 8. Create the first Admin (after migrations and seed script exist)

Run:

```bash
pnpm seed:admin
```

The script should prompt for the initial Admin's email, nickname, and password. It must hash the password with Argon2id, create an active Admin, and detect an existing initial Admin rather than creating duplicates. Do not use hard-coded credentials. Only run this against the intended development database unless the deployment owner explicitly approves another target.

Then test:

- sign in at `/admin/login`;
- reach `/admin`;
- confirm server-side Admin authorization;
- restart the app and confirm the account remains available.

## 9. Common daily commands

```bash
pnpm dev                       # development server
pnpm run check                 # Svelte/TypeScript checks
pnpm run build                 # production build
pnpm install --frozen-lockfile # restore exact dependencies
```

Use only scripts that are present in the current `package.json`. The specification also plans worker, migration, seed, test, and VAPID scripts; those commands become usable once the team adds them.

## 10. Before committing

```bash
git status --short
pnpm run check
pnpm run build
```

Commit source and lockfile changes when intentional. Do not commit:

- `.env` or any secret file;
- `node_modules/`;
- `.svelte-kit/`;
- build output;
- local database dumps containing real user data.

## 11. If setup fails

Send the maintainer:

- operating system and shell;
- `node --version` and `pnpm --version`;
- the command that failed;
- the full error text after removing secrets;
- whether the failure happened during install, check, build, or database setup.

Do not send passwords, OAuth secrets, database URLs, R2 keys, or VAPID private keys.
