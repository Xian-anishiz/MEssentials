# MEssentials: Scope Refinements & Implementation Considerations

**Document Version:** 1.0

**Date:** 2026-11-08

**Status:** Active Guidance

This document formalizes project scope adjustments, technical deferrals, and expanded operational workflows for the MEssentials platform without altering the archived baseline documents. Current draft decisions are aligned with `SPEC.md`, `UI_DESIGN.md`, and `Changes.md`.

Changeable operational values belong in `PROJECT_DEFINITIONS.md` rather than being duplicated here.

## 1. Kiosk & Station Operations (Simplified Physical Model)

### 1.1 Operating Scope

Physical station security, device auto-lockouts, and dedicated hardware session isolation are **out of scope for system automation**. Physical devices (e.g., HonestME store or ME-kailangan stations) are managed entirely by human operational protocol.

### 1.2 System Session Behavior

* **Standard Web Auth:** The system treats station devices as standard web client sessions running inside a browser.

* **User Flow:** A student logs into their account on the station browser, completes their store checkout or borrowing confirmation, and manually logs out (or completes the transaction).

* **No Kiosk State Engine:** The application does not maintain special "kiosk mode" system states, timeouts, or restricted station API tokens for v1.

## 2. QR Code Engine (Deferred)

### 2.1 Deferred Features

* Dynamic QR code generation for borrowable units (SVG/PNG creation endpoints).

* Client-side HTML5 camera stream QR scanning.

### 2.2 Baseline Implementation Mode

* Borrowable units are uniquely identified by a plaintext label and a stored `qr_code` string in PostgreSQL.

* Physical scanning relies exclusively on **ID card / barcode scanner hardware** operating in USB HID keyboard-emulation mode (which types card string data directly into focused input fields followed by an `Enter` key signal).

* QR code features will be scheduled for implementation only after core database, borrowing, and queueing flows demonstrate production stability.

## 3. UI/UX Design Guidelines for Expanded Screens

### 3.1 Design Freedom & M3 Compliance

The development team has full authority to design and implement missing screens, provided they strictly follow the **Material Design 3 (M3)** specification and mirror the aesthetic tokens defined in `UI_DESIGN.md`.

### 3.2 Required Extensions & Specifications

| Screen / Flow | Required M3 Tokens & Components | Layout Requirements | 
| ----- | ----- | ----- | 
| **Account Setup** | `surface`, `primary` buttons, M3 text fields, Turnstile container | Google-verified `@up.edu.ph` account creation with optional local password setup. Recovery codes, unverified accounts, and staff account verification are not part of the current draft. |
| **Staff & Admin Dashboards** | `surface` tables, M3 chips, toggle switches, `error` badges | Manager/Admin tables (`/staff/accounts`, `/admin/users`) matching padding and typography from `UI_DESIGN.md`. | 
| **Mobile Responsiveness** | Bottom Navigation Bar (M3 standard), collapsible filter drawer | On viewports `< 768px`, transform the 80px left Navigation Rail into a bottom navigation bar and collapse the 360px right Filter Panel into an overlay modal drawer. | 

## 4. Financial Reporting & Analytics (Deferred)

### 4.1 Baseline Scope (v1)

* Baseline store operations execute unit stock deduction and record basic per-purchase snapshots (`unit_price`, `unit_cost`, `total`).

* Metrics are restricted to instantaneous queries via `/store/products/:id/metrics` and simple store aggregate metrics.

### 4.2 Deferred Features

* Historical sales trend graphs and visual revenue charts.

* Arbitrary date-range filtering (e.g., custom semester-by-semester financial performance breakdowns).

* CSV/Excel transaction reporting exports.

* Advanced financial reporting modules will be integrated in a post-launch phase after baseline inventory logging is verified.

## 5. Web Push Strategy & iOS Onboarding Documentation

### 5.1 Fallback Channels Out of Scope

External messaging fallbacks (SMS gateways, third-party email services, Telegram/Discord bots) are explicitly **out of scope**. Direct student-to-volunteer messaging is also excluded from this draft. The final product is intended to replace direct messaging with a ticketing system, which must be specified separately during final-product planning. Draft system communications rely entirely on:

1. In-App Notification Tab (`/notifications` - primary source of truth).

2. Web Push Notifications via standard VAPID Service Worker.

### 5.2 Student Onboarding Requirements for iOS (Safari)

Because iOS (version 16.4+) strictly enforces Web Push restrictions, the platform must provide clear user-facing instructions:

* **In-App Onboarding Banner:** Display an informational prompt on the `/notifications` and `/profile` screens when an iOS user-agent is detected without an active PWA standalone mode.

* **Step-by-Step Instructions:**

  1. Open the share menu in Safari (`Share` icon).

  2. Tap **"Add to Home Screen"**.

  3. Open **MEssentials** from the Home Screen icon.

  4. Navigate to Notifications or Profile and toggle **"Turn on alerts on this device"**.

## 6. Scanned PDF Handling & Manual Indexing Fallback

### 6.1 The Scanned PDF Challenge

Image-based scanned PDFs (which lack an embedded text layer) return empty or whitespace-only strings when processed by `pdftotext` during the background `reviewer.index` job.

### 6.2 Detection & Database State Engine

1. **Extraction Validation:** When `pdftotext` finishes, the worker inspects the extracted text length.

2. **Threshold Check:** If extracted text contains fewer than **50 meaningful characters** (excluding whitespace):

   * Set `index_status = 'ready'`.

   * Store `reviewer_texts.content = ''`.

   * Flag a metadata marker in `reviewers` indicating no selectable text was found.

```
┌─────────────────────────┐
│ PDF Uploaded to R2      │
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐     Text Length < 50 chars     ┌─────────────────────────────────────┐
│ Background Index Job    │ ────────────────────────────>  │ Mark 'ready' with Empty Text        │
│ (`pdftotext` Execution) │                                │ Set UI Flag: "Scanned / Image PDF"  │
└─────────────────────────┘                                └─────────────────────────────────────┘
             │                                                               │
             │ Text Length >= 50 chars                                       │
             ▼                                                               ▼
┌─────────────────────────┐                                ┌─────────────────────────────────────┐
│ Standard Full-Text GIN  │                                │ Manager Fallback Workflow           │
│ Search Indexing         │                                │ (Manual Tags & Text Summary Input)  │
└─────────────────────────┘                                └─────────────────────────────────────┘

```

### 6.3 Volunteer/Manager Fallback Workflow

* **UI Indicator:** In the MEg-aral management view (`/manage/reviewer`), display a visual badge: `"Scanned PDF (No selectable text detected)"`.

* **Manager Enhancement Form:** Allow a `megaral_manager` or Admin to edit the reviewer metadata and manually populate:

  1. **Supplementary Tags / Course Codes:** Expanded keyword tags to aid categorizing.

  2. **Manual Summary / Transcription:** A manual text outline or summary box (up to 10,000 characters).

### 6.4 Search Vector Weight Re-Calculation

When manual summary or supplementary tags are saved by a manager, the database `search_vector` updates dynamically to include the manual inputs:

$$
\text{search\_vector} = \text{setweight}(A, \text{title}) + \text{setweight}(B, \text{tags}) + \text{setweight}(B, \text{manual\_summary}) + \text{setweight}(C, \text{extracted\_text})
$$

This ensures scanned PDFs remain fully discoverable via title, course chips, topic tags, and volunteer-entered summaries.

## 7. Point of Revision: Schedule & Effort Calibration

### 7.1 Revision Tracking Note

The original project baseline documents (`KLP-1.pdf`) estimated system scale at **114 Function Points (FP)** with a 28-day timeline.

### 7.2 Formally Noted Modifications

The following additions and scope adjustments are documented as formal points of revision to be reconciled during technical debt sweeps:

* Addition of self-managed PostgreSQL background task queues (`jobs` table with `FOR UPDATE SKIP LOCKED` concurrency).

* Addition of native Web Push infrastructure (VAPID payload handling, subscription management, Service Worker events).

* Addition of Cloudflare Turnstile bot protection and Argon2id secure password hashing.

* Addition of optional local-password support after Google UP Mail sign-in; recovery codes and staff-issued temporary passwords are not part of the current draft.

* Deferral of dynamic QR code generation, camera scanning engines, and advanced financial analytics to post-v1 phases.

## 8. Current platform decisions

* The web application will be hosted on Vercel.
* The final deployment model for the separate worker is not yet selected.
* Account creation is restricted to Google-verified `@up.edu.ph` identities.
* No academic-year calculation is used. Workflows that need year standing should add a current year standing field to their forms.
* Final image limits, loan duration, active-loan limits, reminder timing, rate limits, and similar values are maintained in `PROJECT_DEFINITIONS.md`.