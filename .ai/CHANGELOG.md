# System Changelog

## [2026-07-21] - Audit Log Live Feed Repositioning & Full-Width List Layout
### Changed
- Repositioned the **Recent Events / Live Feed (رویدادهای اخیر)** timeline from the sidebar column to underneath the main changes table inside the **Audit & Activity Center** (`AuditActivityCenter.tsx`).
- Upgraded the audit change logs table to take up **100% of the screen width** (removing the previous `lg:col-span-3` restriction), resolving spacing limitations and making log detail columns clearly visible on all viewports.
- Redesigned the Live Feed from a squished multi-column grid into a sleek **vertical list of full-width horizontal rows**. Each event now displays its timestamp, operation badge, main description text, and user/IP metadata aligned side-by-side in a responsive row layout, making optimal use of widescreen layouts and preventing layout empty space.

## [2026-07-21] - Redundant Global Activity Logs Clean Up
### Removed
- Completely removed the redundant "Global Audit Activity Logs" (تاریخچه و لاگ سراسری سیستم) section from the **Archive View** (`ArchiveView.tsx`). All audit monitoring is now unified and securely managed within the dedicated, full-featured **Audit & Activity Center** module.
- Cleaned up unused `Activity` icon imports and code residues to maintain codebase optimization.

## [2026-07-21] - Material Master Table Column Alignment Fix
### Changed
- Resolved column alignment discrepancies in the **Material Master Table** (`MaterialMasterView.tsx`) where header labels and row data cells were misaligned due to contrasting Flexbox direction alignments under RTL mode.
- Fixed header sorting divs to use standard RTL right-aligned `justify-start` flex states instead of conflicting left-aligned `justify-end` settings.
- Standardized the sub-element hierarchy inside the standard title `h4` cell, ensuring Persian names stay cleanly right-aligned and the metadata "Source count" badge floats organically on its left.
- Hardcoded matching column widths (`table-fixed`, `w-36`, `w-32`, `w-44`) on both `th` and corresponding `td` elements, ensuring pixel-perfect column alignment under all screen sizes.

## [2026-07-21] - Sidebar Management Labels Standardization
### Changed
- Standardized buttons under the **MANAGEMENT** section of the sidebar to perfectly match the bilingual design of the **CATEGORIES** section.
- Added localized Persian labels paired with secondary English sub-labels for all management items:
  - **آرشیو کامل** / `COMPLETE ARCHIVE`
  - **مرکز ممیزی و فعالیت‌ها** / `AUDIT & ACTIVITY CENTER`
  - **بررسی یکپارچه تامین‌کننده** / `INTEGRATED SUPPLIER AUDIT`
  - **بانک مواد اولیه** / `MATERIAL MASTER BANK`

## [2026-07-21] - Chronological Log Sorting Fix (Newest First)
### Changed
- Resolved a critical Persian digit sorting bug inside `AuditActivityCenter` and `ArchiveView` where filtering of non-numeric characters stripped localized Persian characters, causing sorted states to default to insertion order (oldest first).
- Implemented `toEnglishDigits` helper function to normalize dates (Persian or Arabic characters) into English digits before extracting numeric strings.
- Applied consistent 14-character zero-padding (`padEnd(14, '0')`) to ensure short timestamps compare flawlessly with fully qualified ones.
- Synchronized chronological descending sorting (Newest First) across the main Audit Trail table, the visual Event Timeline, the Recent Activities panel, and the Excel export.

## [2026-07-21] - Audit Trail Excel Styling Upgrade
### Changed
- Upgraded the Excel export styling in the `AuditActivityCenter` to match the clean, professional, and visually high-contrast layout of the `Archive` Excel exporter.
- Styled header cells with corporate navy backgrounds (`#1E3A8A`), high-contrast white text, and structured grid borders.
- Formatted data cells with deep navy text colors (`#1E293B`), Segoe UI font pairings, and elegant slate-100 alternating backgrounds (`#F1F5F9`).
- Configured Persian-friendly, right-aligned formatting for long text, usernames, substances, and description columns.
- Standardized the output file name to use localized Persian filenames, producing readable reports such as `گزارش_لاگ_سیستم_۱۴۰۵-۰۴-۳۱.xlsx`.

## [2026-07-21] - Production Data Reset & Empty States (Clean System)
### Added
- Implemented robust, highly polished "Empty States" across major data views (`MaterialMasterView`, `CategoryView`, `SupplierAuditView`, and `HomeView`) to provide professional user feedback when the system is clean.
- Added explicit visual feedback instructing users how to onboard new material definitions when the registry is empty.

### Removed
- Executed a strict Data Reset to wipe out all synthetic, operational, and mock data from `database/vendors.json` while meticulously preserving the relational JSON schema (`_relational_v2: true`, `vendors:{}`, etc.).
- Deleted the now-obsolete synthetic seed file `database/synthetic_vendors_dump.json`.
- Cleared the `INITIAL_VENDORS_DB` fallback seed array inside `src/db_foreign_only.ts` to guarantee zero trace of mock data inside the bundle.

### Changed
- Prepared the application for real production use, ensuring users, roles, password hashes, structural constraints, schemas, business logic, workflows, and UI templates remain 100% operational.


## [2026-07-17] - Interactive Sample Status Control & Confirmation
### Added
- Integrated the "نمونه تستی (Sample)" status control checkbox and "وضعیت نمونه (Sample Status)" dropdown inside the edit source page for existing vendors (previously only available on initial creation).
- Implemented a custom state-driven React confirmation modal dialog with native Persian language prompts to ask the user for confirmation before altering sample statuses, preventing accidental transitions.
- Enhanced `handleSubmit` form processing logic to properly map the edited `isSample` state and dynamic `sampleStatus` to the vendor context on save, including reset mechanisms for category and grade transitions.

## [2026-07-15] - System Compliance, Data Anonymization, & Hardening
### Added
- Developed robust deterministically-seeded data anonymization engine `anonymize.cjs`.
- Generated 100% compliant flat synthetic dataset at `database/synthetic_vendors_dump.json` with 217 records, maintaining referential integrity across 189 fake vendors and 79 chemicals.
- Hydrated local offline fallback database `database/vendors.json` with the new synthetic relational structure to enable live high-fidelity preview out of the box.
- Configured git ignore parameters to isolate development JSON databases and SQL script artifacts from version control.

### Changed
- Relocated original, non-anonymized databases (`vendors_db_dump.json` and `vendors_db_dump.sql`) to secure out-of-workspace storage.
- Documented complete git history purification protocol via `git filter-repo`.
- Created `AGENTS.md` at project root to define Project Operating System (Harness Engineering) prompt.
- Populated complete `.ai/` documentation folder containing `PROJECT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `UI_GUIDE.md`, `DESIGN_SYSTEM.md`, `FEATURES.md`, `ROADMAP.md`, `TASKS.md`, `PROGRESS.md`, `RISKS.md`, `TEST_PLAN.md`, `PROMPTS.md`, `DECISIONS.md`, and `KNOWN_ISSUES.md`.
- Integrated `AuditActivityCenter` into primary App layout, enabling full compliance log tracking.
- Resolved styling issue and import syntax for `AuditActivityCenter` with the core `Material` entity.

### Removed
- Real proprietary company registry identifiers, Iranian Regulatory Codes (IRC), and supplier contact details from version-controlled directory.

---

## [2026-07-10] - Analytical Data & Scorecard Integrations
### Added
- Integrated laboratory test analytical records inside sliding dossier drawers.
- Developed multi-department weighted scorecard calculation logic.
- Configured Excel file export layout using `xlsx-js-style`.
