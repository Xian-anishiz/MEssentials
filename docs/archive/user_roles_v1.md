# MEssentials: User Roles and Responsibilities

**Document Version:** 1.0
**Date:** 2026-11-08

This document outlines the operational responsibilities, capabilities, and system duties of the three primary actor groups in the MEssentials platform: Students, Volunteers (Service Managers), and Administrators.

---

## 1. Student (Base Actor)
Every account in the system is fundamentally a Student. Students are the primary participants who consume the department services.

### System Capabilities
* **Browsing & Discovery:** View products, borrowable items, reviewers, events, and their queue status.
* **Transactions (Verified Accounts):** Borrow and return items (via ID scan), register for events, and join the registration queue.
* **Communication:** Send messages/tickets (questions, concerns, feedback) to service managers.
* **Account Management:** Update their profile (student number, entry year, name), toggle notification preferences, and manage web push subscriptions on their devices.

### Responsibilities
* **Account Security:** Safely store the 8 generated recovery codes upon sign-up, as there is no email-based password reset.
* **Profile Accuracy:** Maintain an accurate profile (Name, Student Number, Entry Year) to ensure they meet participation constraints for events and registration.
* **Physical Protocol Adherence:** Present a valid physical UP ID to Registration Managers for account verification or password recovery without codes.

---

## 2. Volunteer (Service Manager)
Volunteers are students granted elevated privileges to manage specific modules of the MEssentials platform. A single volunteer can hold multiple managerial roles simultaneously. 

**General Volunteer Responsibilities:** 
* Respond to student tickets/messages concerning their designated department.
* Send direct messages to individual students regarding follow-ups (e.g., overdue items).

### 2.1 HonestME Store Manager (`store_manager`)
* **Inventory Management:** Add new products, edit product attributes (price, cost, image), and process manual stock replenishments.
* **Reporting:** View per-product and overall store metrics (Total Sales, Total Profit, Quantity Bought).
* **Communication:** Trigger mass notifications to all students when a popular item is restocked.

### 2.2 ME-kailangan Manager (`kailangan_manager`)
* **Catalog Management:** Add and edit borrowable items and their specific inventory units.
* **Legacy Imports:** Manually input and assign open loans imported from legacy Google Sheets to students once they create their accounts.
* **Monitoring:** View borrowing details, track who holds which unit, and monitor expected return dates.

### 2.3 MEg-aral Manager (`megaral_manager`)
* **Content Moderation:** Upload new PDF reviewers, assign metadata (tags, courses, authors), and toggle reviewer visibility (Hidden/Visible) after verifying the upload.
* **Search Indexing Fallback:** Manually input supplementary tags and text summaries for scanned/image-based PDFs that fail automatic text extraction (`pdftotext`), ensuring they remain searchable.
* **Troubleshooting:** Re-trigger background indexing jobs for reviewers if the initial processing fails.

### 2.4 ME Days Manager (`medays_manager`)
* **Event Coordination:** Create events, set registration time windows, define capacity limits, and configure participation constraints (e.g., restricting to specific year standings).
* **Form Management:** Create and manage custom registration prompts (questions) required for event sign-ups.
* **Attendee Management:** View the final list of registrants and their prompt answers.

### 2.5 Registration Manager (`registration_manager`)
* **Queue Operations:** Create registration sessions, open/close the queue, and set the physical location/venue.
* **Adviser Routing:** Manage the list of available advisers, update their statuses, and advance the queue by calling the next waiting student to a specific adviser desk.
* **Identity Verification (Crucial):** Visually inspect physical UP IDs presented by students and execute the "Verify Account" action in the system, linking their ID card code to their digital profile.
* **Account Recovery (Crucial):** Generate and issue single-use temporary passwords for verified students who have lost their recovery codes.

---

## 3. Administrator
Administrators are the system overseers. They possess all the privileges of every Volunteer role, plus exclusive system-level capabilities.

### System Capabilities
* **Role Delegation:** Grant or revoke volunteer roles (`store_manager`, `kailangan_manager`, etc.) for any student account.
* **Admin Delegation:** Grant Administrator privileges to other students (Administrators cannot revoke their own privileges).
* **Full Access:** Can execute any management action across all five services in the event a specific volunteer is unavailable.

### Responsibilities
* **Access Control:** Regularly review the list of active volunteers and administrators, ensuring privileges are revoked when a student graduates or leaves a committee.
* **Audit Monitoring:** Review system audit logs (`audit_logs` table) to track sensitive actions like manual account verifications, privilege changes, and temporary password issuances.
* **Initial Setup:** The first administrator is responsible for bootstrapping the system access hierarchy immediately after the initial deployment and database seeding script (`pnpm seed:admin`) is run.