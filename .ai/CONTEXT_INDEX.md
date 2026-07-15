# Project Context Index (CONTEXT_INDEX.md)

This document serves as the high-level map of the entire project's knowledge base. It registers all documents, their target scope, inter-dependencies, and update priorities.

---

## The Knowledge Graph Index

| Document Path | Purpose | Dependencies | Related Files | Update Frequency | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/.ai/BOOT.md` | Initializes AI agent reading sequence. | None | `BOOTSTRAP.md`, `CONTEXT_INDEX.md` | Rarely | Critical |
| `/.ai/BOOTSTRAP.md` | Specifies session startup protocol. | `BOOT.md` | `WORKFLOW.md`, `SESSION.md` | Rarely | Critical |
| `/.ai/CONTEXT_INDEX.md` | Serves as the navigation map for AI agents. | None | All `.ai/*` files | On document creation | High |
| `/.ai/PROJECT.md` | Outlines business objectives and workflows. | None | `FEATURES.md`, `ROADMAP.md` | Milestones | High |
| `/.ai/AGENTS.md` | Defines system vision, engineering, and roles. | None | `PROJECT.md`, `AI_RULES.md` | Milestones | High |
| `/.ai/ARCHITECTURE.md` | Documents system architecture and file map. | `DEPENDENCIES.md` | `DATABASE.md`, `API.md` | Schema changes | Critical |
| `/.ai/DEPENDENCIES.md` | Tracks modules, npm packages, and connectors. | `package.json` | `ARCHITECTURE.md` | Package updates | High |
| `/.ai/DATABASE.md` | Models relational schema, tables, and constraints. | `schema.prisma` | `MIGRATION_HISTORY.md`, `API.md` | Database adjustments | Critical |
| `/.ai/MIGRATION_HISTORY.md`| Logs schema migrations and rollback actions. | `schema.prisma` | `DATABASE.md` | On migration run | High |
| `/.ai/API.md` | Registers Express REST endpoints and contracts. | `server.ts` | `DATABASE.md`, `CODE_STYLE.md` | Endpoint adjustments | High |
| `/.ai/CODE_STYLE.md` | Outlines styling conventions and requirements. | `tsconfig.json` | `UI_GUIDE.md`, `DESIGN_SYSTEM.md` | Rarely | High |
| `/.ai/UI_GUIDE.md` | Focuses on Persian RTL and Apple design specs. | None | `DESIGN_SYSTEM.md` | Rarely | High |
| `/.ai/DESIGN_SYSTEM.md` | Lists brand color palettes, fonts, and shadows. | `src/index.css` | `UI_GUIDE.md` | Rarely | Medium |
| `/.ai/FEATURES.md` | Tracks the status of all application modules. | `TASKS.md` | `ROADMAP.md`, `PROGRESS.md` | On feature completion| High |
| `/.ai/ROADMAP.md` | Contains project phases and product milestones. | `PROJECT.md` | `FEATURES.md`, `TASKS.md` | Phase changes | Medium |
| `/.ai/TASKS.md` | Registers current sprint items and checklists. | `FEATURES.md` | `PROGRESS.md`, `SESSION.md` | Every turn | Critical |
| `/.ai/PROGRESS.md` | Compiles short-term sprint accomplishments. | `SESSION.md` | `CHANGELOG.md`, `TASKS.md` | End of session | High |
| `/.ai/CHANGELOG.md` | Tracks chronological project changes. | None | All files | On code release | High |
| `/.ai/SESSION.md` | Stores active developer session memory. | `PROGRESS.md` | `CHANGELOG.md`, `TASKS.md` | Every turn | Critical |
| `/.ai/AI_RULES.md` | Defines guardrails for AI coding assistants. | None | `BOOT.md`, `WORKFLOW.md` | Rarely | Critical |
| `/.ai/WORKFLOW.md` | Detailed explanation of developer execution cycle. | `BOOTSTRAP.md` | `AI_RULES.md`, `TEST_PLAN.md` | Rarely | High |
| `/.ai/RISKS.md` | Lists technical risks and mitigation solutions. | None | `TEST_PLAN.md` | Phase changes | Medium |
| `/.ai/TEST_PLAN.md` | Documents verification formulas and unit cases. | `CODE_STYLE.md` | `RISKS.md` | Feature changes | Medium |
| `/.ai/KNOWN_ISSUES.md` | Tracks technical debt and layout bugs. | None | `RISKS.md`, `SESSION.md` | On bug discovery | Medium |
| `/.ai/PROMPTS.md` | Reusable queries for common workspace tasks. | None | `CODE_STYLE.md` | Rarely | Low |

---

## Navigation Graph
```
                    [BOOT.md]
                       ||
                       \/
               [CONTEXT_INDEX.md]
                 ||          ||
                 \/          \/
         [PROJECT.md] <===> [ARCHITECTURE.md]
          (Business)         (Technical)
```

---

## Related Documents
- `/.ai/BOOT.md` (Read ordering)
- `/.ai/BOOTSTRAP.md` (Operational protocol)
