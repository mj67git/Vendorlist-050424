# Features & Functional Modules

## 1. Unified Dashboard
- **Purpose**: Provides high-level statistics of vendors (total, approved, conditional, rejected, active samples) and critical risk alerts.
- **Dependencies**: React, Recharts (for analytics visualization).
- **Current Status**: Fully functional with responsive charts and real-time statistic aggregation.
- **Completion Percentage**: 100%
- **Owner**: Frontend Engineer / Solution Architect
- **Priority**: High

---

## 2. Vendor Management Drawer & Dossier
- **Purpose**: Offers a comprehensive drawer displaying supplier contact info, assigned substances, laboratory test records, risk assessment logs, and previous evaluation scores.
- **Dependencies**: Lucide Icons, validation utilities, state container.
- **Current Status**: Complete. Offers smooth sliding entry, collapsible panels, and detailed historical data.
- **Completion Percentage**: 100%
- **Owner**: Frontend Lead
- **Priority**: High

---

## 3. Material Master Registry (بانک مواد اولیه)
- **Purpose**: Manage the repository of chemical substances (active pharmaceutical ingredients, reactants, catalysts, solvents) with CAS/IRC regulatory registration numbers.
- **Dependencies**: Tailwind Grid, MaterialForm.
- **Current Status**: Fully integrated. Supports registering new substances, CAS validation, and cascading deletion logs.
- **Completion Percentage**: 100%
- **Owner**: Technical Lead
- **Priority**: High

---

## 4. Multi-Department Evaluation & Scorecard
- **Purpose**: Facilitates department heads entering quantitative scores (Commercial, QA, Planning, Finance) and calculates weighted ratings with custom grade tiers.
- **Dependencies**: Weighted average calculation engine in backend, validation schemas.
- **Current Status**: Operational. Automatically updates and saves evaluations, updates overall vendor status.
- **Completion Percentage**: 100%
- **Owner**: Backend Developer
- **Priority**: High

---

## 5. Audit & Activity Center
- **Purpose**: Displays full tamper-evident operation logs with visual color coding, advanced filters, user tracking, and exportable excel sheets.
- **Dependencies**: xlsx-js-style, Lucide Icons, Prisma model layout.
- **Current Status**: Implemented with complete search, pagination, category filtering, and customized excel export format.
- **Completion Percentage**: 100%
- **Owner**: Fullstack QA Lead
- **Priority**: Medium
