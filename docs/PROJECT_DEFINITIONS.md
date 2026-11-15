# MEssentials Project Definitions

**Status:** Current draft source of truth for changeable project definitions  
**Date:** 2026-11-09

This file centralizes operational values that may change without changing the product architecture or user-facing workflows. Implementation configuration should import or map these definitions rather than duplicating literals across application code, forms, migrations, and documentation.

Values marked **TBD** are deliberately unresolved. Do not invent a final value until the project confirms it.

## Confirmed platform definitions

| Definition | Value | Notes |
|---|---|---|
| Web application hosting | Vercel | Confirmed for the web application. |
| Worker deployment model | TBD | The worker is required, but its final deployment model is not selected. |
| Allowed sign-up domain | `up.edu.ph` only | Account creation requires a verified Google identity from this exact domain. |
| Academic-year calculation | None | Do not calculate year standing from entry year. |

## Changeable operational definitions

| Definition | Current status | Used by |
|---|---|---|
| Maximum PDF upload size | 50 MB | Reviewer uploads |
| Maximum image upload size | TBD | Product, event, borrowable, and avatar images |
| Maximum active loans | TBD | Borrowing rules and forms |
| Loan duration | TBD | Borrowing forms and due-date rules |
| Borrow reminder lead time | TBD | Reminder scheduling |
| Registration alert position | TBD | Queue alerts |
| API rate limits | TBD | Abuse prevention |
| Idempotency-key retention | TBD | Repeat-submission protection |
| VAPID subject/contact | TBD | Web Push configuration |
| Turnstile account/site configuration | TBD | Sign-up and login protection |

## Form-driven current year standing

If an event, registration workflow, or other feature needs a student's current year standing, add a `current year standing` field to the relevant form and validate that submitted value for that workflow. Do not derive it from entry year or an academic-year calendar calculation.

## Product-only ticketing decision

The final product is intended to replace direct student-to-volunteer messaging with a ticketing system. Ticketing is intentionally excluded from the current draft scope and must not be implemented from this document as a v1 draft feature. When final-product planning begins, define the ticket fields, assignment rules, statuses, replies, permissions, notifications, retention, and audit requirements here before implementation.

## Web mockup v1.0 definitions

| Definition | Value | Notes |
|---|---|---|
| Mockup persistence | Versioned browser storage | Frontend-only state for mockup products; it survives reloads but is not production persistence. |
| Mockup product namespace | `messentials.mockup.v1.store.products` | Use for adding and modifying Store products without a database connection. |
| iOS instruction page | Omitted from mockup v1.0 | Account settings still shows the link to the future instruction page. |
| Queue interaction depth | General visual treatment | Detailed adviser routing is deferred for the first mockup. |
