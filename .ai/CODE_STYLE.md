# Code Style & Engineering Standards (CODE_STYLE.md)

This document outlines the strict coding style, architectural boundaries, naming conventions, and programming paradigms that must be followed by all development agents contributing to the Vendor QMS project.

---

## 1. Naming Conventions

- **Files & Directories**:
  - Components: PascalCase (e.g., `MaterialMasterView.tsx`, `AuditActivityCenter.tsx`).
  - Hooks: camelCase starting with `use` (e.g., `useVendorData.ts`).
  - Utilities & Helpers: camelCase (e.g., `excelExport.ts`, `validation.ts`).
  - Styles: Flat lowercase (e.g., `index.css`).
- **TypeScript Entities**:
  - Interfaces & Types: PascalCase (e.g., `Vendor`, `AnalysisRecord`).
  - Enums: PascalCase (e.g., `Status`, `Grade`).
  - Variables & Functions: camelCase (e.g., `handleSelectVendor`, `totalScore`).
  - Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_SCORE_WEIGHTS`).

---

## 2. Folder Structure Guidelines

All new codebase files must fit cleanly into the established modular repository structure:
- `/src/components/`: Sub-components, interactive modals, drawers, form elements. Never combine all sub-components into `App.tsx`.
- `/src/utils/`: Generic validation scripts, date transformers, and export generators.
- `/src/types.ts`: Universal single source of truth for all domain model definitions.
- `/database/`: Offline development disk-storage JSON entities.
- `/prisma/`: Live PostgreSQL schema files and migration definitions.

---

## 3. React Component Best Practices

- **Functional Components**: All components must be written as functional components using React hooks. Do not introduce legacy class components.
- **Avoid Over-consolidation**: Do not pack entire views into a single file. If a file exceeds `500` lines, extract logical child components (e.g., tables, forms, filters) into the `/src/components/` directory.
- **Props Definition**: Always declare clear TypeScript types or interfaces for component props. Avoid standard object destructuring without explicit typing (no implicit `any`).
- **Icons Standard**: Every icon used in the UI **MUST** be imported directly from `lucide-react`. Never build custom inline SVGs or introduce external icon libraries unless authorized.

---

## 4. Hook Safety & `useEffect` Guidelines

- **Prevent Infinite Loops**: To avoid infinite re-render cycles, never trigger state adjustments directly in the component body.
- **Dependency Arrays**:
  - Keep arrays flat, using primitive values (strings, numbers, booleans) wherever possible.
  - Avoid putting raw arrays or objects in dependency arrays unless they are stabilized using `useMemo` or declared outside the component scope.
  - Never call `useEffect` with missing dependency array arguments unless a single-run trigger on component mount is explicitly intended.

---

## 5. Security & Error Handling

- **Inputs Sanitization**: Use `zod` schemas or strict regular expression checks on all text inputs (especially CAS numbers, IRC codes, and registration names).
- **Graceful Failures**: Wrap complex processing loops (such as API fetches, JSON parsing, and spreadsheet compilation) in robust `try/catch` statements. Render explicit, user-friendly Persian error cues instead of blank screens or broken loaders.
- **No API Secrets on Client**: Never expose server-side tokens, database strings, or API credentials to the browser workspace. Client files must strictly utilize standard environment variables prefixed with `VITE_`.
- **Safe Init Patterns**: Initialize SDK instances lazily to prevent server crashes on startup when keys are missing.

---

## 6. Performance Rules

- **Rerender Optimization**: Memoize expensive computations (such as aggregate analytics, weighted grade classifications, or list search indexes) using `useMemo`.
- **Transition Performance**: Utilize lightweight layout animations from the `motion` library. Avoid massive animation stacks that trigger excessive paint iterations.
- **Debounced Resize**: When sizing canvas blocks or analytics grids, listen to window adjustments using debounced observers.

---

## 7. Forbidden Patterns (Anti-Patterns)

- ❌ **No `any` Types**: Declaring variables or parameters as `any` is strictly prohibited. If a type is uncertain, utilize `unknown` or write a custom union structure.
- ❌ **No Inline CSS**: Never write custom inline CSS styling (e.g., `style={{ marginRight: 15 }}`). Utilize standard Tailwind CSS utility classes instead (`mr-3.5`).
- ❌ **No Custom SVGs**: Do not write raw custom inline SVG blocks. Utilize corresponding elements from the `lucide-react` library.
- ❌ **No UI API Key Prompts**: Never create input fields or dialog boxes in the UI asking the user to paste secret keys. Keep secret credentials in `.env` files.

---

## Related Documents
- `/.ai/UI_GUIDE.md` (Design guidelines)
- `/.ai/DESIGN_SYSTEM.md` (Colors and spacing tokens)
- `/.ai/TEST_PLAN.md` (Quality assurance tests)
