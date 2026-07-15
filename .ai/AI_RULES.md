# Universal AI Operating Rules (AI_RULES.md)

This document contains the universal, non-negotiable guardrails, boundaries, and directives that must govern any AI agent (Gemini, Claude, Codex, Cursor, Windsurf, OpenHands, Hermes, etc.) participating in development cycles for the QMS project.

---

## 1. Absolute Directives

- **Preserve Existing Capabilities**: Never delete, comment out, or rewrite working modules, UI views, or backend controllers without a clear, explicit business instruction.
- **Never Rely Solely on Chat Memory**: Conversation history in browser frames is transient. Always check the contents of `/src` and load state data directly from files before forming an action.
- **Treat `.ai/` as Single Source of Truth**: The Harness files in the `.ai/` folder are the actual system memory. Every development sprint, turn, or task completed must automatically synchronize with affected documentation.
- **Always Validate Code Compilation**: Before terminating your development turn or presenting outcomes to the user, verify that there are zero TypeScript compilation errors.
- **Strictly No Simulated "AI Slop"**: Do not decorate dashboard displays, borders, footer rails, or header frames with artificial terminal logs, "larping" system status dots, port numbers, or non-functional telemetry codes. All copy and labels must remain simple, descriptive, and human.

---

## 2. Code Modularity Guardrails

- **Single View Limits**: For simple, singular requests, do not expand the application into navigation sidebars, complex drawers, or multi-screen routing networks. Stick to clean, single-screen cards.
- **Extract Complex Operations**: When building a rich feature, extract subsidiary modules (forms, drawers, specific tables) into `/src/components/*`. Do not let a single React file grow excessively.
- **API Key Guard**: Never write input fields, settings dialogs, or onboarding modals prompting the user to paste their API keys. Manage secret variables strictly through `.env` environment templates and lazy-initialize server-side clients to prevent crashes.

---

## 3. Compliance & Audit Logging

- **Traceable Code Updates**: Every database mutation (inserts, updates, deletions) must trigger a corresponding transaction entry into the system's chronological audit trail.
- **State Recalculations**: Score updates must automatically trigger weighted average recalculated outputs, update the related vendor's status/grade tiers, and register descriptive log entries.

---

## Related Documents
- `/.ai/BOOT.md` (Agent initialization)
- `/.ai/BOOTSTRAP.md` (Execution protocols)
- `/.ai/WORKFLOW.md` (Detailed engineering workflow)
