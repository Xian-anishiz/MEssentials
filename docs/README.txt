# MEssentials — Revision 5

This package consolidates the revised project documents, scope references, and
source materials.

## Revised documents
- SPEC.md — three login methods (UP Mail, RFID, username/email + password),
  student RFID linking and revocation, and Admin dashboard data requirements.
- UI_DESIGN.md — M3 sign-in/registration screens and M3 Admin dashboard layouts.
- Changes.md — revision history and the Revision 5 decisions.
- messentials_user_roles_responsibilities.md — student, volunteer, and Admin duties.

## Scope reference
- messentials_scope_refinements.md

## Original project references
- KLP.pdf
- KLP-1.pdf
- UI_DESIGN.md for Material Design 3 - Claude.pdf

## Supplied design screenshots
- Student registration/RFID linking
- Admin Usage Logs
- Admin Students
- Admin Services
- Admin Admins

## RFID behavior in this revision
UP Mail is the primary account creation and sign-in method. After signing in,
students can link their UP ID by tapping it on the USB HID RFID reader while the
registration/profile field is focused. The reader types the identifier and sends
Enter. A linked card can later be used for RFID-only login. Username/email plus
local password is the third login method. RFID UID-only login is a deliberate
bearer-credential trade-off; the specification includes rate limiting, protected
identifier storage, audit logging, and card revocation.

The admin screenshots define the fields and filters to include. All admin pages
must still follow Material Design 3 rather than copying the screenshots' styling.

This archive contains project documentation and references. It does not contain
an implemented application or applied database migration.
