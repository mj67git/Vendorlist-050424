# System Changelog

## [2026-07-15] - System Compliance & Document Framework
### Added
- Created `AGENTS.md` at project root to define Project Operating System (Harness Engineering) prompt.
- Populated complete `.ai/` documentation folder containing `PROJECT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `UI_GUIDE.md`, `DESIGN_SYSTEM.md`, `FEATURES.md`, `ROADMAP.md`, `TASKS.md`, `PROGRESS.md`, `RISKS.md`, `TEST_PLAN.md`, `PROMPTS.md`, `DECISIONS.md`, and `KNOWN_ISSUES.md`.
- Integrated `AuditActivityCenter` into primary App layout, enabling full compliance log tracking.
- Resolved styling issue and import syntax for `AuditActivityCenter` with the core `Material` entity.

### Changed
- Refactored `App.tsx` sidebar navigation button structures to include the compliance log tab cleanly.
- Restructured `ArchiveView` logs with distinct action emojis based on change log text triggers.

---

## [2026-07-10] - Analytical Data & Scorecard Integrations
### Added
- Integrated laboratory test analytical records inside sliding dossier drawers.
- Developed multi-department weighted scorecard calculation logic.
- Configured Excel file export layout using `xlsx-js-style`.
