# MEssentials
This is a course requirement for CS 191/192 Software Engineering Courses of the Department of Computer Science, College of Engineering, University of the Philippines, Diliman under the guidance of Dr. Ligaya Leah Lara-Figueroa for A.Y. 2026-2027.
 
- Celestino, Lily Anne
- Nario, Christian Kent
- Sandig, Prince Sydric

## Getting Started

### Prerequisites

| Tool | Required Version | How to Install |
|---|---|---|
| **Node.js** | 22 or newer | Use a version manager: [nvm](https://github.com/nvm-sh/nvm) (Linux/macOS), [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows), or [fnm](https://github.com/Schniz/fnm) |
| **pnpm** | 12.18.0 (pinned) | Runs through **Corepack** |
| **Git** | any recent | [git-scm.com](https://git-scm.com) |

> The exact pnpm version is pinned in `package.json` under `packageManager`. The Node.js version is pinned in `.nvmrc`. Do **not** install a global pnpm — Corepack will use the pinned version automatically.
>
> **Corepack note:** Node.js builds that bundle Corepack older than 0.34.5 cannot start pnpm 12 (error: `Cannot find module .../bin/pnpm.cjs`). If you see that error, run `npm install --global corepack@0.36.0`, delete the stale `%LOCALAPPDATA%\node\corepack\v1\pnpm` cache directory (Windows) or `~/.cache/node/corepack/v1/pnpm` (Linux/macOS), then retry.

### Quick Setup (Recommended)

After cloning the repository, run the setup script from the repository root:

```bash
# 1. Switch to the pinned Node.js version (nvm / fnm)
nvm use 22        # or: fnm use 22

# 2. Enable Corepack and install dependencies
corepack enable
scripts/setup-dev.sh
```

The script will:
- Verify Node.js 22+ and the pinned pnpm 12.x
- Install dependencies from the lockfile (`pnpm install --frozen-lockfile`)
- Create `.env` from `.env.example` (if `.env` does not already exist)
- Run `pnpm run check` and `pnpm run build`

### Manual Setup (Step by Step)

If you prefer to run commands manually, follow these steps:

```bash
# 1. Clone the repository
git clone <REPOSITORY_URL>
cd <REPOSITORY_DIRECTORY>

# 2. Switch to the pinned Node.js version
nvm use 22        # Linux / macOS
# or on Windows: nvm use 22

# 3. Enable Corepack (bundled with Node.js)
corepack enable

# 4. Verify the pinned pnpm version
corepack pnpm --version

# 5. Install dependencies (exact versions from lockfile)
corepack pnpm install --frozen-lockfile

# 6. Create your local environment file
cp .env.example .env

# 7. Verify the app
corepack pnpm run check
corepack pnpm run build

# 8. Start the development server
corepack pnpm dev
```

> **Never run `pnpm install` directly** — always use `corepack pnpm` so the pinned version from `package.json` is used. If `pnpm install --frozen-lockfile` fails, report the error to the maintainer; do **not** delete or regenerate the lockfile.

### Environment Variables

Copy `.env.example` to `.env` and fill in only the values you need. See `docs/DEVELOPER_SETUP.md` §5 for the full variable reference. Do **not** commit `.env` or any secret values.

## Project Deployment: Version Details

This currently contains the Mock web design UI that currently only contains the user-student side dashboard. Future developments will include more complicated features. Some of the details are under revisions. This is not the final product.

### 🛠 Tech Stack

- Frontend: SvelteKit, TypeScript, Tailwind CSS, Material 3 Design Tokens
- Backend & DB: Supabase (PostgreSQL), Drizzle ORM
- Deployment: Vercel (Node.js 22.x runtime)

### 📱 Core Application (v1.x)

- Responsive App Shell: Fully accessible, mobile-optimized layout with adaptive navigation (Desktop NavRail and Mobile Drawer).
- Multi-Role Authentication: Dedicated portals for Students, Volunteers, and Admins supporting Google OAuth, RFID tap, and standard login.

Student Services:
- Store & Borrow: Product catalog with filtering, responsive cart/checkout, and unit-tracked borrowing/returning.
- Reviewer Hub: Academic resource repository with search, preview modals, and persistent bookmarks.
- ME Days & Queuing: Event registration forms and live queue position tracking.
 - Profile: Editable profiles with RFID linking and push notification management.

Admin & Volunteer Portals:
 - Volunteer Dashboards: Role-specific management pages for Store, Borrow, Events, Queue, and Reviewer managers.
- Admin Dashboard: Comprehensive data tables (Usage Logs, Students, Volunteers, Admins) featuring column sorting, reactive filters, and pagination.
- Access Control: UI for granular role assignment, revoking, and user merging.

### 🗄 Backend Foundation (v2.x)
- Database Setup: PostgreSQL connection established via Supabase.
- Schema Configuration: Base tables configured via Drizzle ORM (users, sessions, volunteer_roles, auth_throttle) with defined service-manager enums.
- Migrations: Initial ORM migrations generated and successfully applied.

# Acknowledgements

## AI Assistance Acknowledgment

AI-assisted development tools, including Cline and free AI models were used during the development of the MEssentials frontend prototype.

These tools assisted with code generation, component development, debugging, and UI implementation.

The project concept, objectives, requirements, and system design decisions were developed by the project team. All AI-assisted outputs were reviewed, tested, and revised by the team.

The [docs](docs/) folder `*.md` files are made with the help of AI to make sure that the development information from the [main references](docs/reference/) are clear to the AI tools and doesn't stray from the original plans and decision made by the team.