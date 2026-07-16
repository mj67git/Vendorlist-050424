# System Changelog

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
