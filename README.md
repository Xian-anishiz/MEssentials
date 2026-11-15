# MEssentials
This is a course requirement for CS 191/192 Software Engineering Courses of the Department of Computer Science, College of Engineering, University of the Philippines, Diliman under the guidance of Dr. Ligaya Leah Lara-Figueroa for A.Y. 2026-2027.
 
- Celestino, Lily Anne
- Nario, Christian Kent
- Sandig, Prince Sydric

## Project Deployment: Version Details

This currently contains the Mock web design UI that currently only contains the user-student side dashboard. Future developments will include more complicated features. Some of the details are under revisions. This is not the final product.

### v1.0

- [x] Navigation (Desktop NavRail + Mobile Header + Hamburger Drawer; bottom nav removed)
- [x] Pages: Store, Borrow, Reviewer, Registration, Events, Notifications, Profile, Login/Signup
- [x] Mock data and reactiveness
- [x] Interactive UI design

### v1.1

- [x] Admin Dashboard implementation (AdminNavRail, AdminTable, Pagination, RoleBadge components)
- [x] Admin Pages - Usage Logs, Students, Volunteers, Admins (with mock data)
- [x] Admin filter bars standardized (filters left, search + Reset right via ml-auto) and sentinel filters fixed
- [x] AdminNavRail Dashboard active-state fixed (exact match for /admin)
- [x] Select dropdowns auto-apply filters (Select onchange prop)
- [x] Volunteers Grant Role modal working (student picker, role checkboxes, merge/add volunteer, per-role revoke)
- [x] Column sorting on all admin tables (SortableTh component)

# Main Features
## 1. Student

Every account is a student account. A student may also hold one or more volunteer roles or Administrator status.

---

## 2. Volunteer (Service Manager)

A Volunteer is a student with one or more service-manager roles. Volunteers keep the normal student dashboard and gain extra management links for their assigned roles. Management links open separate editing workspaces; they do not replace the student-facing service pages.

---

## 3. Administrator

Administrators have system-level permissions, including the powers of all service-manager roles. However, their navigation is a separate Admin dashboard. They do not use the normal Store, Events, Borrow, Reviewer, or Register dashboard as their Admin home.

---

## 4. Navigation summary

| Actor | Main navigation | Additional navigation |
|---|---|---|
| Student | Store, Events, Borrow, Reviewer, Register | None |
| Volunteer | Store, Events, Borrow, Reviewer, Register | Management links for assigned roles |
| Administrator | Usage Logs, Students, Volunteers, Admins | No normal student-service navigation |

The role controls which links appear, but it does not replace server-side authorization. Every management route and API must check the user's role. For more information see [user_roles.md](docs/user_roles.md)

# Acknowledgements

## AI Assistance Acknowledgment

AI-assisted development tools, including Cline and free AI models were used during the development of the MEssentials frontend prototype.

These tools assisted with code generation, component development, debugging, and UI implementation.

The project concept, objectives, requirements, and system design decisions were developed by the project team. All AI-assisted outputs were reviewed, tested, and revised by the team.

The [docs](docs/) folder `*.md` files are made with the help of AI to make sure that the development information from the [main references](docs/reference/) are clear to the AI tools and doesn't stray from the original plans and decision made by the team.