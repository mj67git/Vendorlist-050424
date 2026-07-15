# System Architecture & Technical Design

## 1. Stack Components
- **Frontend Engine**: React 18+ with Vite
- **Styling Utility**: Tailwind CSS with custom Persian (RTL) spacing configurations
- **Backend API Server**: Node.js with Express v4
- **Database Layer**: Dual-mode storage:
  1. Primary transactional Engine: Disk-backed JSON relational model (`/database/vendors.json`)
  2. SQL Migration Interface: Prisma ORM mapped to PostgreSQL (schema declared in `/prisma/schema.prisma`)
- **Reporting Engine**: `xlsx-js-style` for stylized, customized corporate spreadsheet generation.

## 2. Component Hierarchy
- `src/main.tsx` (Entrypoint)
  - `src/App.tsx` (Layout and View Coordinator)
    - `src/components/MaterialMasterView.tsx` (Materials Registry & CAS search)
    - `src/components/AuditActivityCenter.tsx` (Unified audit logs and analytics)
    - `src/components/MaterialForm.tsx` (Add/Edit material properties)
    - `src/components/StickyRecordHeader.tsx` (Visual action indicators)
    - `src/components/VendorDetailDrawer.tsx` (Comprehensive dossier viewer)

## 3. Data Flow & Sync Strategy
```
+--------------------+           +------------------------+           +----------------------+
|   React Frontend   | <=======> |   Express API Server   | <=======> |  vendors.json Store  |
| (State Container)  |   REST    | (Validation & Log MoA) |  disk-IO  |  (Single Source/Tx)  |
+--------------------+           +------------------------+           +----------------------+
```
1. Frontend makes standard REST API calls (`/api/vendors`, `/api/materials`, `/api/evaluations`, `/api/audit-logs`).
2. Express validates incoming payloads via `src/utils/validation.ts`.
3. Action executes, updates `/database/vendors.json`, writes to `audit_logs` block, and recalculates grades.
4. Server replies with the updated relational data tree, triggering immediate visual state updates in React.
