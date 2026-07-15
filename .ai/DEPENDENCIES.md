# System Dependency Map (DEPENDENCIES.md)

This document maps the technological footprint, third-party libraries, framework components, and their cross-connection pathways within the QMS platform.

---

## 1. System Dependency Overview

```
                        +----------------------------+
                        |       React Frontend       |
                        |   (React 19 + Vite 6)      |
                        +----------------------------+
                           /         |            \
                          /          |             \
                         v           v              v
               +------------+  +-----------+  +-------------+
               |  Recharts  |  |  Motion   |  |   XLSX JS   |
               | (Analytics)|  | (Animate) |  |   (Export)  |
               +------------+  +-----------+  +-------------+
                                     |
                                     | REST API (JSON)
                                     v
                        +----------------------------+
                        |    Express 5 Backend       |
                        |      (tsx / CJS)           |
                        +----------------------------+
                           /         |            \
                          /          |             \
                         v           v              v
               +------------+  +-----------+  +-------------+
               |   Prisma   |  | disk-IO   |  |   Firebase  |
               | (Postgres) |  | (JSON Db) |  |   (Optional)|
               +------------+  +-----------+  +-------------+
```

---

## 2. Dependency Matrix & Classifications

### Frontend UI Framework & Tooling
- **React (v19.0.1)**: Application core runtime, leveraging functional components and hooks.
- **Vite (v6.2.3)**: Dev server and building compiler with Hot Module Replacement controls.
- **Tailwind CSS (v4.1.14)**: Styles layout grids, RTL padding, colors, and border scales directly in markup utility classes.
- **Motion (v12.23.24)**: Runs high-performance component state entrance animations and drawer slide-out effects.
- **Vazirmatn (v33.0.3)**: Primary typography package for modern, legible, and balanced Persian display fonts.

### Visual & Interactive Core Components
- **Lucide React (v0.546.0)**: Clean, high-contrast, scalable vector icons used across sidebars and stats grids.
- **Recharts (v3.8.1)**: Renders vector charting (such as supplier grades and risk level maps).
- **XLSX & xlsx-js-style (v1.2.0)**: Standard library for producing multi-worksheet formatted Excel spreadsheet files.

### Server & Persistent Engine
- **Express (v5.2.1)**: Lightweight REST controller providing system endpoints, caching pipelines, and static file routers.
- **Prisma Client (v5.22.0) & pg (v8.21.0)**: Object-Relational Mapping (ORM) and low-level drivers linking controllers to a PostgreSQL database.
- **Firebase Core & Admin (v12/v14)**: Ready-to-use optional modules for remote file storing or secure user identity authentication.

### Core Utilities & Safety
- **Zod (v4.4.3)**: Input schema validation, sanitizing incoming request bodies before database ingestion.
- **Jsonwebtoken (v9.0.3)**: Signs and decodes session identifiers to authenticate and authorize admin, compliance, or evaluator roles.
- **Jalaali-JS (v1.2.8)**: Handles calculations, comparisons, and representation conversions between Gregorian and Persian calendars.

---

## 3. Dependency Connection Flows

1. **Vite Ingress**: Static resources (JS, CSS, Vazirmatn fonts) are packaged by Vite and injected through `index.html`.
2. **API Requests**: React components make async REST requests (using `window.fetch`) with Bearer tokens to the Express API on port `3000`.
3. **Storage Fallback**:
   - In development/sandbox environments, Express reads/writes to `database/vendors.json` synchronously to support persistent offline execution.
   - In production environments, Express executes Prisma database transactions against the PostgreSQL instance.
4. **Excel Export**: Triggered client-side, compiling states into cell arrays, styles them with `xlsx-js-style`, and triggers native browser spreadsheet downloads.

---

## Related Documents
- `/.ai/ARCHITECTURE.md` (Physical component layout)
- `/.ai/DATABASE.md` (Database mapping schema)
- `/.ai/API.md` (End-point interfaces)
