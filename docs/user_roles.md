# MEssentials: User Roles and Responsibilities

**Document Version:** 1.1
**Date:** 2026-11-09

This document defines the duties, permissions, and dashboard access for Students, Volunteers, and Administrators.

---

## 1. Student

Every account is a student account. A student may also hold one or more volunteer roles or Administrator status.

### Normal dashboard

Students see these five service destinations:
- **Store** — browse products and check out.
- **Events** — browse events and register or unregister.
- **Borrow** — browse borrowable items and manage loans.
- **Reviewer** — search, preview, bookmark, and download reviewers.
- **Register** — join or leave the registration queue.

### Account and RFID responsibilities

- Create the account through Google UP Mail with a verified `@up.edu.ph` address.
- Keep profile details accurate, including name, student number, phone number, college, and degree program.
- Optionally set a local password after signing in through UP Mail.
- Link their own UP ID RFID card while signed in. They can do this on the initial registration form or later in Profile.
- Tap the card while the **Tap your UP ID to link it** field is focused. The USB HID reader types the card identifier and sends Enter.
- Use RFID login only after the backend confirms that the card has been linked to their account.
- Revoke a lost card and link a replacement after signing in through UP Mail.
- Sign in using any enabled method: Google UP Mail, a registered RFID card, or username/email plus local password.

A card that has not been linked cannot log in. A card already linked to another active account cannot be linked again. The system stores a protected digest of the scanned identifier, not the raw value. RFID-only login is a deliberate convenience trade-off: a lost or copied card identifier may be used by another person. The system must support rate limits, audit logs, and card revocation.

### Aside: RFID

- This is not functional unless you have an RFID reader.

---

## 2. Volunteer (Service Manager)

A Volunteer is a student with one or more service-manager roles. Volunteers keep the normal student dashboard and gain extra management links for their assigned roles. Management links open separate editing workspaces; they do not replace the student-facing service pages.

### General responsibilities

- Manage assigned service operations and keep service information accurate and current.
- **Draft scope note:** Direct student-to-volunteer messaging is excluded from this draft. The final product is intended to replace it with a ticketing system, which is not specified or implemented here.
- Use only the management tools granted by their volunteer roles.
- Keep service information accurate and current.

### 2.1 HonestME Store Manager (`store_manager`)

**Normal page:** Store
**Additional management link:** Manage Store

- Add new products.
- Edit existing product names, descriptions, prices, costs, images, and categories.
- Update or replenish stock.
- View current per-product and aggregate metrics: total sales, total profit, and quantity bought.
- Send a restock notification when needed.

### 2.2 ME-kailangan Manager (`kailangan_manager`)

**Normal page:** Borrow
**Additional management link:** Manage Borrowables

- Add and edit borrowable catalog items.
- Add, edit, and manage individual inventory units.
- Import open loans from legacy records when approved.
- View borrowing details, who holds each unit, and due dates.

### 2.3 MEg-aral Manager (`megaral_manager`)

**Normal page:** Reviewer
**Additional management link:** Manage Reviewers

- Upload PDF reviewers.
- Edit reviewer title and metadata.
- Assign tags, course links, and authors.
- Toggle reviewer visibility between Hidden and Visible.
- Add tags and a manual summary/transcription for scanned PDFs when automatic text extraction finds no selectable text.
- Retry indexing jobs after processing errors.

### 2.4 ME Days Manager (`medays_manager`)

**Normal page:** Events
**Additional management link:** Manage Events

- Create and edit events.
- Set registration windows and capacity limits.
- Set participation constraints.
- Create and manage event registration questions.
- View registrants and their answers.

### 2.5 Registration Manager (`registration_manager`)

**Normal page:** Register
**Additional management link:** Manage Queue

- Create registration sessions.
- Open or close the queue and set the venue.
- Manage advisers and their availability.
- Call the next waiting student to an adviser desk.
- Help students troubleshoot RFID readers. Do not bypass the student's sign-in or link a card to the student's account on their behalf in the normal process.
- Direct a student with a lost card to sign in through UP Mail, revoke the card in Profile, and link a replacement.

---

## 3. Administrator

Administrators have system-level permissions, including the powers of all service-manager roles. However, their navigation is a separate Admin dashboard. They do not use the normal Store, Events, Borrow, Reviewer, or Register dashboard as their Admin home.

### Admin dashboard pages

#### 3.1 Usage Logs

Filter by:
- Service Type
- Date Range Start
- Date Range End

Review these columns:
- Usage Log ID
- Service ID
- Service Type
- Student Number
- Admin ID
- Date Time Start
- Date Time End
- Location

Every column can be sorted in ascending or descending order. The active sort direction is shown by an up/down arrow beside the column label.

#### 3.2 Students

Filter by College, Degree Program, Is Active, Is Enrolled, and minimum/maximum Student Number.

Review:
- Student Number
- First Name
- Middle Initial
- Last Name
- Email
- Phone Number
- College
- Program

#### 3.3 Volunteers

Filter by Volunteer Role, College, Degree Program, and Is Active.

Review:
- Student Number
- First Name
- Middle Initial
- Last Name
- Email
- Volunteer Role(s)
- Is Active

A volunteer with more than one role appears once, with all roles listed in one field.

#### 3.4 Admins

Filter by Is Active.

Review:
- Admin ID
- Nickname
- Is Active

### Administrator responsibilities

- Grant or revoke volunteer roles.
- Grant Administrator status to other students.
- Review active volunteer and Admin accounts.
- Review usage logs and audit logs.
- Remove access when a volunteer or Admin leaves the committee or is no longer eligible.
- Protect student contact and enrollment data.
- Confirm role and active-state changes. An Admin cannot remove their own Admin role.

Admin directory pages show ordinary operational information only. They must not display password hashes, Google subject IDs, session tokens, RFID identifier hashes, or other authentication/security data.

---

## 4. Navigation summary

| Actor | Main navigation | Additional navigation |
|---|---|---|
| Student | Store, Events, Borrow, Reviewer, Register | None |
| Volunteer | Store, Events, Borrow, Reviewer, Register | Management links for assigned roles |
| Administrator | Usage Logs, Students, Volunteers, Admins | No normal student-service navigation |

The role controls which links appear, but it does not replace server-side authorization. Every management route and API must check the user's role.
