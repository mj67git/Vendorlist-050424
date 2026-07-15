# Project Operating System & Agent Roles

## 1. Project Vision & Mission
The Vendor QMS (Quality Management System) is an enterprise-grade platform designed for pharmaceutical and industrial raw material qualification. It streamlines vendor registration, raw material master registry, multi-disciplinary evaluations, risk assessment, analytical test records, and comprehensive compliance auditing.

## 2. Engineering Philosophy
- **Zero Slack**: High-quality structural layouts with generous padding, strict semantic color schemes, and zero unsolicited technical clutter (no container port logs, system status dots, or "larping" lines).
- **Type Safety**: Strictly enforced TypeScript compilation without `any` where avoidable. All domain entities must align with `src/types.ts`.
- **Modularity**: Small, cohesive component files. App.tsx acts as the primary layout coordinator, offloading complex views to dedicated components inside `/src/components`.

## 3. Folders & Coding Conventions
- `/src/components/*`: Specialized presentation and interactive modules (e.g., `AuditActivityCenter`, `MaterialMasterView`).
- `/src/utils/*`: Utility scripts, validations, and export functions.
- `/prisma/*`: Prisma database schema definition and migration tracking.
- `/database/*`: Permanent JSON disk-backed data store acting as the primary transactional interface for server-side persistence.

## 4. Documentation Rules
Every development turn that makes modifications to schema, UI features, or business rules MUST keep the documents in `.ai/` synchronous.
- **FEATURES.md**: Updates completion percentages.
- **PROGRESS.md**: Summarizes completed sprint and next milestones.
- **CHANGELOG.md**: Documents incremental edits.
- **TASKS.md**: Moves task status from TODO to DONE.
