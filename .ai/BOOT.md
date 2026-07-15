# AI Agent Boot Protocol (BOOT.md)

This document defines exactly how any incoming AI agent (Gemini AI Studio, Claude Code, Codex, Cursor, Windsurf, OpenHands, Hermes, etc.) must initialize itself upon entering this project workspace.

---

## 1. Absolute Initialization Order
Before modifying any files or proposing any changes, the AI agent **MUST** read the project's state documentation in the exact order listed below. This prevents drift, overrides, or regression of features.

```
+-------------------------------------------------------------+
|                     1. BOOTSTRAP.md                         |
|             (Bootstrapping & Setup Procedures)              |
+-------------------------------------------------------------+
                              ||
                              \/
+-------------------------------------------------------------+
|                     2. CONTEXT_INDEX.md                     |
|           (Navigation Map & Dependency Directory)           |
+-------------------------------------------------------------+
                              ||
                              \/
+-------------------------------------------------------------+
|              3. PROJECT.md & AGENTS.md                      |
|         (Core Vision, Roles, and Engineering Mandates)       |
+-------------------------------------------------------------+
                              ||
                              \/
+-------------------------------------------------------------+
|            4. ARCHITECTURE.md & DEPENDENCIES.md             |
|       (System Structure, Integrations, and Tech Stack)      |
+-------------------------------------------------------------+
                              ||
                              \/
+-------------------------------------------------------------+
|              5. FEATURES.md & ROADMAP.md                    |
|           (Current Capabilities & Strategic Phases)         |
+-------------------------------------------------------------+
                              ||
                              \/
+-------------------------------------------------------------+
|               6. TASKS.md & PROGRESS.md                     |
|           (Current Backlog & Dev Session History)           |
+-------------------------------------------------------------+
                              ||
                              \/
+-------------------------------------------------------------+
|             7. DATABASE.md & API.md                         |
|         (Tables, Constraints, and API Endpoint Schemes)     |
+-------------------------------------------------------------+
                              ||
                              \/
+-------------------------------------------------------------+
|          8. UI_GUIDE.md & DESIGN_SYSTEM.md                  |
|          (Aesthetics, Spacing, and Persian RTL Rules)       |
+-------------------------------------------------------------+
```

---

## 2. Agent Initialization Rules
1. **Never Assume**: Do not assume the status of any file, API design, or database constraint. Check the local files first.
2. **Context Retention**: Always treat the `.ai/` directory as the single, persistent source of truth. Do not let conversation length or truncation clear your functional memory.
3. **Strict Conformity**: Always respect the rules outlined in `/.ai/AI_RULES.md` and the styles in `/.ai/CODE_STYLE.md`.

---

## Related Documents
- `/.ai/BOOTSTRAP.md` (Execution loop)
- `/.ai/CONTEXT_INDEX.md` (Project knowledge graph index)
- `/.ai/AI_RULES.md` (Agent behavioral constraints)
