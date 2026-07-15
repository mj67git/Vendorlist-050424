# AI Project Startup Protocol (BOOTSTRAP.md)

This document outlines the standard operational protocol that must be followed sequentially during every new AI development session or task execution loop. No step may be skipped.

---

## 1. The Operational Protocol Loop

```
  +--------------------------------------------+
  |             1. UNDERSTAND PROJECT          |
  |  Read /.ai/BOOT.md and check active scope.  |
  +--------------------------------------------+
                        ||
                        \/
  +--------------------------------------------+
  |              2. READ CONTEXT               |
  |  Load relevant files and verify schemas.   |
  +--------------------------------------------+
                        ||
                        \/
  +--------------------------------------------+
  |           3. ANALYZE DEPENDENCIES          |
  | Inspect package.json and /.ai/DEPENDENCIES |
  +--------------------------------------------+
                        ||
                        \/
  +--------------------------------------------+
  |               4. CREATE PLAN               |
  | Propose a concise 3-step implementation map |
  +--------------------------------------------+
                        ||
                        \/
  +--------------------------------------------+
  |               5. IMPLEMENT                 |
  |   Write elegant, well-commented modules.   |
  +--------------------------------------------+
                        ||
                        \/
  +--------------------------------------------+
  |                6. VALIDATE                 |
  | Compile the application & run the linter.  |
  +--------------------------------------------+
                        ||
                        \/
  +--------------------------------------------+
  |          7. UPDATE DOCUMENTATION           |
  | Auto-sync altered files in the /.ai/ folder|
  +--------------------------------------------+
                        ||
                        \/
  +--------------------------------------------+
  |         8. RECOMMEND NEXT STEP             |
  | Suggest upcoming logical tasks from TASKS  |
  +--------------------------------------------+
```

---

## 2. Execution Guidelines
- **Step 1 & 2 (Audit)**: Verify existing files in `/src/` and check for any syntax errors or uncommitted artifacts before modifying code.
- **Step 3 (Dependencies Check)**: Ensure required npm modules exist before writing code imports. Refer to `/.ai/DEPENDENCIES.md`.
- **Step 4 (Plan Proposal)**: Share plans with the user when requested, or formulate them internally to prevent aimless code adjustments.
- **Step 5 (Implementation)**: Adhere to the design philosophy outlined in `/.ai/UI_GUIDE.md` and standard coding guidelines in `/.ai/CODE_STYLE.md`.
- **Step 6 (Verification)**: Always run `compile_applet` or `lint_applet` to confirm zero regressions.
- **Step 7 (Documentation Sync)**: Update `SESSION.md`, `CHANGELOG.md`, `PROGRESS.md`, and any other appropriate files.

---

## Related Documents
- `/.ai/BOOT.md` (Agent startup sequence)
- `/.ai/WORKFLOW.md` (Engineering workflow details)
- `/.ai/SESSION.md` (Active session logs)
