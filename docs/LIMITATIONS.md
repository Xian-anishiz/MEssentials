# MEssentials — Service Limitations & Free Tier Impact

**Version:** 1.0  
**Date:** 2026-11-25  
**Audience:** Project Managers (non-technical)  
**Purpose:** Explain what each service can/cannot do today, and what happens if we stay on Supabase Free tier in production.

---

## How to Read This Document

| Symbol | Meaning |
|--------|---------|
| ✅ | Works fully |
| ⚠️ | Works with limitations |
| ❌ | Does not work / not implemented |
| 💰 | Cost implication |
| 🔴 | **Production blocker** |

---

## Executive Summary

| Tier | Monthly Cost | Can Run Production? |
|------|--------------|---------------------|
| **Free** | $0 | ❌ **No** — auto-pauses, 500 MB limit, no support |
| **Pro (recommended)** | ~$25/mo | ✅ **Yes** — no auto-pause, 8 GB, email support |

**Bottom line:** For a university production system serving students daily, **Free tier is not viable**. Pro plan (~$25/mo) removes all critical blockers.

---

## 1. Database & Infrastructure (Supabase)

### Current Implementation
| Component | Status | Notes |
|-----------|--------|-------|
| PostgreSQL database | ✅ | 4 tables: users, sessions, volunteer_roles, auth_throttle |
| Connection pooling | ✅ | Transaction pooler (web), session pooler (migrations), direct (worker) |
| Migrations (schema changes) | ✅ | Via Drizzle ORM |
| Backups | ⚠️ | Supabase handles; 7-day retention on Free |

### Free Tier Limits → Production Impact

| Limit | Free Tier | Production Consequence |
|-------|-----------|------------------------|
| **Auto-pause** | After 1 week of no activity | 🔴 **Site goes offline** during exam breaks, holidays. Manual restart needed. |
| **Database size** | 500 MB | 🔴 **Writes fail** when full. ~2 years of data may hit this. |
| **Direct connections** | 60 | Worker uses 5. OK for now. |
| **Pooled connections** | 200 | Vercel scales automatically. Registration day spikes may exceed. |
| **Egress (data out)** | 5 GB/month | PDF downloads (reviewers) + images. One event = 5 GB. |
| **Monthly active users** | 50,000 | DME has ~5,000 students. OK for now. |
| **Backup retention** | 7 days | Only 1 week of recovery points. |
| **Log retention** | 7 days | Debugging limited to 1 week. |
| **Support** | Community only | No guaranteed response time for outages. |
| **SLA (uptime guarantee)** | None | No compensation for downtime. |

### Pro Plan Fixes ($25/mo)
- ✅ No auto-pause ever
- ✅ 8 GB database (16× more)
- ✅ 250 GB egress (50× more)
- ✅ Email support
- ✅ 14-day backups, 28-day logs
---

## 2. Authentication & User Accounts

### Current Implementation
| Feature | Status | Notes |
|---------|--------|-------|
| Google UP Mail OAuth | ✅ | Primary login, verified domain only |
| RFID card linking | ✅ | Tap to link, tap to login |
| Local password (optional) | ✅ | Set after Google login |
| Session management | ✅ | Cookie-based, secure |
| Login throttling | ✅ | Postgres-based, survives restarts |

### Free Tier Limits → Production Impact
| Limit | Impact |
|-------|--------|
| **Auth users counted in MAU** | 50,000 MAU limit includes all students + volunteers + admins |
| **No email fallback** | If Google OAuth fails, no recovery email (by design) |
| **No SMS/phone backup** | Not in scope |

### Future Considerations
| Feature | Status | Effort |
|---------|--------|--------|
| Account recovery (lost RFID + forgotten password) | ❌ Not in v1 | Requires Google re-auth flow (already designed) |
| Staff account verification | ❌ Excluded | By design — all accounts self-serve via Google |

---

## 3. HonestME Store

### Current Implementation (Mockup v1.3)
| Feature | Status | Data Source |
|---------|--------|-------------|
| Product catalog | ✅ | Browser localStorage (mock) |
| Search & filters | ✅ | Client-side |
| Cart & checkout | ✅ | Browser localStorage (mock) |
| Stock tracking | ✅ | Browser localStorage (mock) |
| Manager: add/edit products | ✅ | Browser localStorage (mock) |
| Manager: restock | ✅ | Browser localStorage (mock) |
| Purchase logging | ❌ **Not connected to database** | Mock only |
| Sales metrics | ❌ **Not connected to database** | Mock only |

### Free Tier Limits → Production Impact
| Limitation | Consequence |
|------------|-------------|
| **No real persistence** | Page refresh loses cart. Manager adds lost on refresh. |
| **No real inventory** | Stock doesn't decrement on actual purchase. |
| **No sales records** | Cannot audit, report, or analyze sales. |
| **500 MB DB limit** | Product images + purchase logs eat space. |

### To Make Production-Ready (Requires Pro)
| Task | Effort |
|------|--------|
| Connect to real `products` + `purchases` tables | Medium |
| Move cart to server session (or keep client + validate on checkout) | Low |
| Image uploads to R2 (product images) | Low |
---

## 4. ME-kailangan (Borrowing)

### Current Implementation (Mockup v1.3)
| Feature | Status | Data Source |
|---------|--------|-------------|
| Browse borrowable items | ✅ | Browser localStorage (mock) |
| Unit-level tracking | ✅ | Browser localStorage (mock) |
| Borrow/return flow | ✅ | Browser localStorage (mock) |
| Due dates & reminders | ⚠️ UI only | No background job |
| Manager: add/edit borrowables | ✅ | Browser localStorage (mock) |
| Manager: add/remove units | ✅ | Browser localStorage (mock) |
| RFID scan during borrow/return | ❌ Excluded by design | Uses authenticated session |

### Free Tier Limits → Production Impact
| Limitation | Consequence |
|------------|-------------|
| **No real persistence** | Borrowed items reappear after refresh. |
| **No due reminders** | Background worker not running → no hourly sweep. |
| **No overdue tracking** | Cannot generate overdue notices. |
| **500 MB DB** | Loan records + unit data accumulate. |

### To Make Production-Ready (Requires Pro + Worker)
| Task | Effort |
|------|--------|
| Connect to real `borrowables`, `borrowable_units`, `borrow_records` tables | Medium |
| Deploy background worker (hourly reminder sweep) | Medium |
| Push notifications for due/overdue | Medium |
| RFID reader integration (HID keyboard emulation) | Low (hardware) |

---

## 5. MEg-aral (Reviewers)

### Current Implementation (Mockup v1.3)
| Feature | Status | Data Source |
|---------|--------|-------------|
| Search & filter reviewers | ✅ | Browser localStorage (mock) |
| PDF preview (iframe) | ✅ | Mock PDF URLs |
| Bookmark/favorites | ✅ | Browser localStorage (mock) |
| Download | ⚠️ Mock | No real signed URLs |
| Manager: upload PDF | ⚠️ Mock | No R2 upload |
| Manager: edit metadata | ✅ | Browser localStorage (mock) |
| Scanned PDF fallback (manual tags/summary) | ✅ UI only | No text extraction job |

### Free Tier Limits → Production Impact
| Limitation | Consequence |
|------------|-------------|
| **No real file storage** | PDFs not actually uploaded. |
| **No text extraction** | `pdftotext` worker not deployed. |
| **No search index** | GIN vector search not built. |
| **5 GB egress** | PDF downloads (50 MB each) eat budget fast. |
| **500 MB DB** | Reviewer metadata + extracted text. |

### To Make Production-Ready (Requires Pro + Worker + R2)
| Task | Effort |
|------|--------|
| R2 bucket setup + CORS + signed URLs | Medium |
| Direct-to-R2 upload flow (presign → PUT → complete) | Medium |
| Background worker: `reviewer.index` job (pdftotext) | High |
| Search vector generation + GIN index | Medium |
| Scanned PDF detection + manual fallback UI | Low (UI done) |

---

## 6. ME Days (Events)

### Current Implementation (Mockup v1.3)
| Feature | Status | Data Source |
|---------|--------|-------------|
| Browse events | ✅ | Browser localStorage (mock) |
| Register/unregister | ✅ | Browser localStorage (mock) |
| Custom form builder | ✅ | Browser localStorage (mock) |
| Capacity limits | ✅ | Browser localStorage (mock) |
| Participation constraints (year standing) | ✅ UI only | Form validation only |
| Manager: create/edit events | ✅ | Browser localStorage (mock) |
| Manager: view registrants | ✅ | Browser localStorage (mock) |

### Free Tier Limits → Production Impact
| Limitation | Consequence |
|------------|-------------|
| **No real persistence** | Registrations lost on refresh. |
| **No confirmation notifications** | Worker not running. |
| **No waitlist** | Not in v1 scope. |
| **500 MB DB** | Event data + registrations + form answers. |

### To Make Production-Ready (Requires Pro)
| Task | Effort |
|------|--------|
| Connect to real `events`, `event_prompts`, `event_registrations` tables | Medium |
| Registration confirmation notifications | Low (worker) |
| Capacity enforcement with row locks | Low |
---

## 7. Registration Queue

### Current Implementation (Mockup v1.3)
| Feature | Status | Data Source |
|---------|--------|-------------|
| Join queue | ✅ | Browser localStorage (mock) |
| Position tracking | ✅ | Browser localStorage (mock) |
| 10-second polling | ✅ | Client-side timer |
| "You're next" alert | ✅ UI only | No real push |
| Leave queue | ✅ | Browser localStorage (mock) |
| Manager: open/close session | ✅ | Browser localStorage (mock) |
| Manager: call next, transfer | ✅ | Browser localStorage (mock) |
| Adviser management | ✅ | Browser localStorage (mock) |

### Free Tier Limits → Production Impact
| Limitation | Consequence |
|------------|-------------|
| **No real persistence** | Queue resets on refresh. |
| **No "you're next" push** | Worker not running. |
| **No session persistence** | Manager closes browser → session lost. |
| **Concurrency not tested** | 1000+ students joining simultaneously untested. |

### To Make Production-Ready (Requires Pro + Worker)
| Task | Effort |
|------|--------|
| Connect to real `registration_sessions`, `queue_entries`, `advisers` tables | Medium |
| Row-locked queue number assignment (`FOR UPDATE SKIP LOCKED`) | Low |
| "You're next" alerts in same transaction as advance | Low |
| ETag polling optimization | Low |

---

## 8. Notifications & Web Push

### Current Implementation (Mockup v1.3)
| Feature | Status | Data Source |
|---------|--------|-------------|
| In-app notification tab | ✅ | Browser localStorage (mock) |
| Unread count badge | ✅ | Browser localStorage (mock) |
| Mark as read / delete | ✅ | Browser localStorage (mock) |
| Push opt-in UI | ✅ UI only | No VAPID keys |
| Service worker | ❌ Not implemented | Required for push |

### Free Tier Limits → Production Impact
| Limitation | Consequence |
|------------|-------------|
| **No real notifications** | All mock. |
| **No Web Push** | VAPID keys + service worker + worker process needed. |
| **5 GB egress** | Push payloads tiny, but notification fetches count. |

### To Make Production-Ready (Requires Pro + Worker + VAPID)
| Task | Effort |
|------|--------|
| Generate VAPID keys (`pnpm vapid:generate`) | Low |
| Service worker (`src/service-worker.ts`) | Medium |
| Background worker: `push.fanout` job | Medium |
| iOS "Add to Home Screen" instructions | Low |

---

## 9. Admin Dashboard

### Current Implementation (Mockup v1.3)
| Feature | Status | Data Source |
|---------|--------|-------------|
| Usage Logs page | ✅ | Mock data |
| Students page | ✅ | Mock data |
| Volunteers page (grant/revoke roles) | ✅ | Mock data |
| Admins page | ✅ | Mock data |
| Column sorting (all pages) | ✅ | Client-side |
| Filters (all pages) | ✅ | Client-side |
| Pagination (all pages) | ✅ | Client-side |

### Free Tier Limits → Production Impact
| Limitation | Consequence |
|------------|-------------|
| **No real data** | All mock. Cannot manage real users. |
| **No audit log** | `audit_logs` table exists but not written. |
| **No session revocation** | Role removal doesn't log out user. |

### To Make Production-Ready (Requires Pro)
| Task | Effort |
|------|--------|
| Connect all 4 pages to real tables | Medium |
| Server-side filtering/sorting/pagination | Medium |
| Audit log on privilege changes | Low |
| Session revocation on role removal | Low |
---

## 10. File Storage (Cloudflare R2)

### Current Implementation
| Feature | Status |
|---------|--------|
| R2 configuration | ❌ Not connected |
| Presigned uploads | ❌ Not implemented |
| Signed download URLs | ❌ Not implemented |
| Upload validation (magic bytes, size) | ❌ Not implemented |

### Free Tier Limits (R2)
| Limit | Free Tier | Production Impact |
|-------|-----------|-------------------|
| **Storage** | 10 GB/month free | ✅ Plenty for images/PDFs |
| **Class A operations** | 1M/month free | ✅ Uploads |
| **Class B operations** | 10M/month free | ✅ Downloads |
| **Egress** | Free (unmetered) | ✅ **Major advantage vs Supabase** |

### To Make Production-Ready
| Task | Effort |
|------|--------|
| Create R2 bucket + API token | Low |
| Configure CORS for `PUBLIC_APP_URL` | Low |
| Implement presign → PUT → complete flow | Medium |
| Upload cleanup job (hourly) | Low |

---

## 11. Background Worker

### Current Implementation
| Feature | Status |
|---------|--------|
| Job queue table (`jobs`) | ✅ Schema exists |
| Worker client (`workerDb`) | ✅ Code ready |
| Job handlers | ❌ Not implemented |
| Scheduler (recurring jobs) | ❌ Not implemented |
| Deployment target | ❌ Not chosen |

### Free Tier Limits → Production Impact
| Limitation | Consequence |
|------------|-------------|
| **Worker not deployed** | No reminders, no push, no indexing, no cleanup. |
| **No always-on host** | Free tier has no compute for long-running process. |
| **`pdftotext` binary** | Needs host with poppler-utils installed. |

### Deployment Options (All Cost Money)
| Option | Est. Cost | Notes |
|--------|-----------|-------|
| **Fly.io / Railway / Render** | $5-10/mo | Small VM, always-on |
| **Supabase Edge Functions** | Not suitable | Short timeout, no `pdftotext` |
| **Vercel Cron + Serverless** | Not suitable | Max 60s, no persistent connections |
| **Self-hosted (UP server)** | $0 (if available) | Needs IT approval, IPv6 |

### Recommended: **Fly.io Micro VM (~$5/mo)**
- Persistent connection to Supabase direct
- Can install `pdftotext`
- Runs worker loop 24/7

---

## 12. Summary: Free Tier vs Production Reality

### What Works on Free Tier (Development Only)
| Service | Works? |
|---------|--------|
| Local development (your laptop) | ✅ Yes |
| Preview deployments (Vercel) | ✅ Yes |
| Database schema + migrations | ✅ Yes |
| All mockup UI flows | ✅ Yes |
| Type checking + builds | ✅ Yes |

### What **Fails** in Production on Free Tier
| Blocker | Severity |
|---------|----------|
| Auto-pause after 1 week inactivity | 🔴 **Site offline** |
| 500 MB database limit | 🔴 **Writes fail** |
| No background worker | 🔴 **No reminders, push, indexing** |
| No file storage (R2 not connected) | 🔴 **No PDFs, no images** |
| No real persistence (all mock) | 🔴 **Data lost on refresh** |
| No email support / SLA | 🟠 **Risk** |
| 5 GB egress limit | 🟠 **PDF downloads exceed** |

---

## 13. Minimum Production Budget

| Item | Monthly Cost | Required? |
|------|--------------|-----------|
| Supabase Pro plan | $25 | **Yes** |
| Worker host (Fly.io Micro) | ~$5 | **Yes** |
| Cloudflare R2 | $0 (free tier sufficient) | **Yes** |
| Vercel (web hosting) | $0 (hobby free) | **Yes** |
| **Total** | **~$30/mo** | |

> **Note:** First Supabase project on Pro includes $10 compute credits → effective **$25/mo** for database + **$5/mo** for worker = **~$30/mo total**.

---

## 14. Decision Checklist for Project Managers

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Database plan** | Free vs Pro | **Pro ($25/mo)** — non-negotiable for production |
| **Worker hosting** | Fly.io / Railway / UP server | **Fly.io ($5/mo)** — easiest setup |
| **File storage** | R2 (configure) | **R2** — free tier generous, no egress fees |
| **Web hosting** | Vercel (free) | **Vercel** — already configured |
| **Monitoring/alerts** | Supabase logs + external | Add later (UptimeRobot free) |

---

## 15. Timeline to Production-Ready

| Phase | Tasks | Est. Effort |
|-------|-------|-------------|
| **1. Database & Auth** | Connect all services to real tables, enable worker client | 2-3 weeks |
| **2. File Storage** | R2 setup + upload/download flows | 1-2 weeks |
| **3. Background Worker** | Deploy worker + implement 5 job handlers | 2-3 weeks |
| **4. Push Notifications** | VAPID + service worker + push fanout | 1 week |
| **5. Admin & Polish** | Server-side admin, audit logs, load test | 1-2 weeks |
| **Total** | | **7-11 weeks** |

---

## Appendix: Glossary

| Term | Meaning |
|------|---------|
| **MAU** | Monthly Active Users — unique users who log in each month |
| **Egress** | Data leaving the platform (downloads, API responses) |
| **Pooled connection** | Shared database connection via PgBouncer (efficient for many short requests) |
| **Direct connection** | Dedicated database connection (needed for long-running processes) |
| **Worker** | Background server process that runs scheduled jobs (reminders, push, indexing) |
| **R2** | Cloudflare object storage (like AWS S3, but no egress fees) |
| **VAPID** | Web Push encryption keys (required for browser push notifications) |
| **SLA** | Service Level Agreement — uptime guarantee with compensation |
| **Auto-pause** | Supabase Free feature: stops database after 1 week of no queries |

---

*Document maintained by the MEssentials team. Update when tier decisions change.*
| Restock notifications (push) | Medium |