# MEssentials — Revision 6

This archive contains the revised project specification, M3 UI design, role
responsibilities, change log, scope references, original planning references,
and supplied UI screenshots.

## Revised documents
- SPEC.md — system requirements, role-based navigation, authentication/RFID,
  admin data contracts, and API routes.
- UI_DESIGN.md — Material Design 3 layouts, student/volunteer navigation,
  management workspaces, and the separate Admin dashboard.
- Changes.md — revision history and decisions.
- messentials_user_roles_responsibilities.md — student, volunteer, and Admin
  capabilities and duties.
- messentials_scope_refinements.md — confirmed scope constraints.
- PROJECT_DEFINITIONS.md — changeable operational values and unresolved
  definitions for easier future updates.

Current decisions include Vercel for web application hosting, `up.edu.ph` as
the only allowed sign-up domain, and no academic-year calculation. A workflow
that needs year standing adds a current year standing field to its form.

Direct messaging is excluded from the current draft. The final product is
intended to replace it with a ticketing system, but ticketing is not specified
or implemented in these draft documents.

## Navigation in Revision 6
- Students: Store, Events, Borrow, Reviewer, Register.
- Volunteers: the same five service pages plus management links for assigned
  roles. Management pages are separate from student-facing service pages.
- Administrators: Usage Logs, Students, Volunteers, Admins. Admins do not see
  the normal student-service navigation. There is no Services directory page.

## Admin tables
Usage Logs includes Usage Log ID, Service ID, Service Type, Student Number,
Admin ID, Date Time Start, Date Time End, and Location. Students, Volunteers,
and Admins show ordinary operational data only, not authentication or security
fields. All displayed columns support ascending/descending sorting, shown by
up/down arrows beside the column labels.

## Reference materials
- Original KLP.pdf and revised KLP-1.pdf
- Material Design 3 reference PDF
- Supplied student registration and Admin dashboard screenshots, including
  the sortable column header example

This archive contains documentation and reference materials. It does not
contain an implemented application or applied database migrations.
