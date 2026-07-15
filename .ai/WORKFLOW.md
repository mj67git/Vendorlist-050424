# Engineering Workflow (WORKFLOW.md)

This document outlines the systematic, end-to-end software engineering workflow required for implementing any new feature, bug fix, or refactoring request on the QMS platform.

---

## 1. The Workflow Pipeline

```
  +--------------------------------------------------------+
  |                   1. UNDERSTAND                        |
  |  Analyze user intent. Read file contents & schemas.    |
  +--------------------------------------------------------+
                             ||
                             \/
  +--------------------------------------------------------+
  |                      2. PLAN                           |
  | Formulate a concise, logical 3-step action layout.      |
  +--------------------------------------------------------+
                             ||
                             \/
  +--------------------------------------------------------+
  |                   3. IMPLEMENT                         |
  | Write robust, modular TypeScript following style rules.|
  +--------------------------------------------------------+
                             ||
                             \/
  +--------------------------------------------------------+
  |                      4. TEST                           |
  | Execute core workflows and check for edge regressions.  |
  +--------------------------------------------------------+
                             ||
                             \/
  +--------------------------------------------------------+
  |                    5. VALIDATE                         |
  | Run linter and compiler checks to guarantee zero errors|
  +--------------------------------------------------------+
                             ||
                             \/
  +--------------------------------------------------------+
  |                    6. DOCUMENT                         |
  |  Record modifications clearly inside the active log.  |
  +--------------------------------------------------------+
                             ||
                             \/
  +--------------------------------------------------------+
  |                 7. UPDATE HARNESS                      |
  | Sync modified features & logs in the /.ai/ folder.     |
  +--------------------------------------------------------+
                             ||
                             \/
  +--------------------------------------------------------+
  |              8. RECOMMEND NEXT TASK                    |
  | Suggest upcoming logical actions from TASKS catalog.   |
  +--------------------------------------------------------+
```

---

## 2. Phase-by-Phase Instructions

### Phase 1: Understand
- Review the request scope. If terms like "my account", "my files", or "my database" are mentioned, assume the user desires genuine external integrations and secure connections (never dummy placeholders).
- Do not make changes immediately. Inspect existing files using dedicated tools first.

### Phase 2: Plan
- Propose an implementation plan summarizing the structural choices, file additions, and validation checkpoints before coding (if requested, or perform this check silently).

### Phase 3: Implement
- Write highly clean, type-safe functional React components or Express controllers.
- Align typography with "Vazirmatn" and "Inter" sans-serif pairings, and follow RTL layout specifications in `/.ai/UI_GUIDE.md`.

### Phase 4: Test
- Confirm calculations (such as weighted scores and grading boundaries) are accurate under multiple inputs. Ensure cascade delete rules operate cleanly.

### Phase 5: Validate
- Run the system compiler (`compile_applet`) and verify standard linter output (`lint_applet`). Fix any code issues immediately.

### Phase 6 & 7: Document & Update Harness
- Write comprehensive changelogs.
- Synchronize affected `.ai/` documentation (such as `SESSION.md`, `PROGRESS.md`, `CHANGELOG.md`, `FEATURES.md`, and `TASKS.md`).

### Phase 8: Recommend Next Task
- Outline what the next logical engineering increment should be, matching outstanding sprint tasks in `TASKS.md`.

---

## Related Documents
- `/.ai/BOOTSTRAP.md` (Startup sequence protocol)
- `/.ai/AI_RULES.md` (AI behavioral constraints)
- `/.ai/SESSION.md` (Active session journal)
- `/.ai/TEST_PLAN.md` (System testing models)
