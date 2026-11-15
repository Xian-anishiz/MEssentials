#!/usr/bin/env bash
set -Eeuo pipefail

# Run from anywhere; all project operations happen at the repository root.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

fail() { printf 'ERROR: %s\n' "$1" >&2; exit 1; }
info() { printf '\n==> %s\n' "$1"; }

[[ -f package.json ]] || fail "package.json not found. Run this script from inside the MEssentials repository."
[[ -f pnpm-lock.yaml ]] || fail "pnpm-lock.yaml not found. Ask the maintainer to commit the lockfile before setup."

command -v node >/dev/null 2>&1 || fail "Node.js is not installed. Install Node.js 22 or newer, then rerun this script."

NODE_VERSION="$(node --version 2>/dev/null || true)"
if [[ ! "$NODE_VERSION" =~ ^v([0-9]+)\. ]]; then
  fail "The 'node' command exists but is not working (output: '$NODE_VERSION'). A broken shim may be shadowing Node.js - for example a leftover 'npm install node' shim in the npm global bin directory, or Windows shims visible to WSL/Git Bash. Run 'node --version' manually to see the error, fix the PATH/shim, then rerun this script."
fi
NODE_MAJOR="${BASH_REMATCH[1]}"
(( NODE_MAJOR >= 22 )) || fail "Node.js 22 or newer is required. Current version: $NODE_VERSION"

command -v corepack >/dev/null 2>&1 || fail "Corepack is not available. Install a supported Node.js distribution with Corepack, then rerun."

COREPACK_OK="$(corepack --version 2>/dev/null || true)"
if [[ ! "$COREPACK_OK" =~ ^[0-9]+\.[0-9]+ ]]; then
  fail "Corepack is installed but not working. A broken npm shim may be shadowing Node.js - for example leftover 'npm install node' shims in the npm global bin directory (%APPDATA%\\npm on Windows) - or the Node.js build bundles Corepack older than 0.34.5, which cannot start pnpm 12 (run 'npm install --global corepack@0.36.0' and delete the stale cache under %LOCALAPPDATA%\\node\\corepack or ~/.cache/node/corepack). Run 'corepack --version' manually to see the error, fix it, then rerun this script."
fi

# Check .nvmrc matches the running Node.js version
if [[ -f .nvmrc ]]; then
  NVM_VERSION="$(cat .nvmrc | tr -d '[:space:]')"
  if [[ "$NODE_MAJOR" != "$NVM_VERSION" ]]; then
    info "Node.js major version mismatch: .nvmrc pins $NVM_VERSION, but running $(node --version). Run 'nvm use $NVM_VERSION' (or 'fnm use $NVM_VERSION') before continuing."
  else
    info "Node.js version matches .nvmrc ($NVM_VERSION)"
  fi
else
  info "No .nvmrc found. Consider adding one to pin the Node.js version for all developers."
fi

# Ensure .npmrc exists with engine-strict
if [[ ! -f .npmrc ]]; then
  info "No .npmrc found. Creating one with engine-strict=true."
  echo 'engine-strict=true' > .npmrc
else
  info ".npmrc already exists; leaving it unchanged."
fi

PACKAGE_MANAGER="$(node -e 'const p=require("./package.json"); process.stdout.write(p.packageManager || "")')"
[[ -n "$PACKAGE_MANAGER" ]] || fail "package.json has no packageManager field. Maintainer must pin pnpm 12.x before setup."
[[ "$PACKAGE_MANAGER" == pnpm@12.* ]] || fail "Expected a pinned pnpm 12.x packageManager field; found: $PACKAGE_MANAGER"

info "Checking pinned package manager"
corepack pnpm --version

info "Installing locked dependencies"
corepack pnpm install --frozen-lockfile

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    info "Created .env from .env.example. Fill in local credentials before using integrations."
  else
    info "No .env.example found; skipping .env creation. Ask the maintainer for the current environment template."
  fi
else
  info "Existing .env found; leaving it unchanged."
fi

run_if_present() {
  local script="$1"
  if node -e 'const p=require("./package.json"); process.exit(p.scripts && p.scripts[process.argv[1]] ? 0 : 1)' "$script"; then
    info "Running pnpm run $script"
    corepack pnpm run "$script"
  else
    info "Skipping missing package script: $script (tell the maintainer if it is expected)"
  fi
}

run_if_present check
run_if_present build

info "Setup finished"
printf '%s\n' "- Node: $(node --version)" "- pnpm: $(corepack pnpm --version)" "- .env: $([[ -f .env ]] && echo present || echo absent)" "- Database: not migrated or tested by this script" "- Next: fill local .env values, then follow DEVELOPER_SETUP.md for database setup when Drizzle migrations are ready."
