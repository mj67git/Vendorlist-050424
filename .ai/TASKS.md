# Tasks Backlog & Sprint Board

## 1. Active Sprint (Sprint 4 - Compliance & Reporting)

### [TASK-301] Integrate Stylized Excel Export (Completed)
- **Priority**: High
- **Status**: Done
- **Complexity**: Medium
- **Acceptance Criteria**: Export all evaluation data, risk levels, and audit logs into a corporate-themed Excel workbook with custom column widths, font styling, and colored headers.

### [TASK-302] Build Unified Audit & Activity Center (Completed)
- **Priority**: High
- **Status**: Done
- **Complexity**: High
- **Acceptance Criteria**: Develop a fully searchable log view with dynamic pagination, filterable categories (creation, editing, lab test logs), and visually distinctive action tags.

### [TASK-303] Enterprise UI/UX Redesign (Completed)
- **Priority**: High
- **Status**: Done
- **Complexity**: High
- **Acceptance Criteria**: Redesign visual layout inspired by Linear, Vercel, Notion, Supabase, and Apple HIG across authentication, app frame, sidebar, topbar header, KPI widgets, and utility stylesheets while strictly enforcing Category B zero-logic modification rules.

### [TASK-304] Unified Light Theme Integration (Completed)
- **Priority**: High
- **Status**: Done
- **Complexity**: Medium
- **Acceptance Criteria**: Transition user login gateway (`LoginView.tsx`) and Supplier Risk Assessment (FMEA) form (`VendorDetail.tsx`) to modern Light Themes. Keep styles consistent with the off-white, light gray, slate-accented presentation language of the overall app. Ensure complete color accessibility and functional integrity.

---

## 2. Product Backlog (Sprint 5 & Beyond)

### [TASK-401] Connect PostgreSQL DB Production Mode (Todo)
- **Priority**: High
- **Status**: Todo
- **Complexity**: High
- **Dependencies**: Database server credentials
- **Description**: Migrate transactional runtime queries from `/database/vendors.json` to the Prisma schema client talking to the live Cloud SQL PostgreSQL database.

### [TASK-402] Automated Expiration Alerts (Todo)
- **Priority**: Medium
- **Status**: Todo
- **Complexity**: Low
- **Description**: Setup daily checks on active materials to flag expired certifications and notify compliance managers in the dashboard.
