# Architectural Decision Records (ADR)

## ADR-001: Disk-Backed JSON Transaction Store
- **Problem**: Need reliable multi-user data storage during development that is lightweight and zero-dependency, yet conforms to SQL model shapes.
- **Options considered**:
  1. Lowdb / NeDB
  2. Live Postgres (with local Docker Compose)
  3. Custom FS-backed relational JSON model store
- **Decision**: Option 3 (Custom FS-backed relational JSON model store).
- **Reason**: Allows seamless, instantaneous workspace restarts without needing live PostgreSQL services connected during standard frontend preview iterations. It maps exactly to Prisma schema queries, allowing trivial one-line swaps to Postgres in production.
- **Trade-offs**: Concurrent file access could cause race conditions (mitigated by write locks and in-memory caching).

---

## ADR-002: Styling with Pure Tailwind CSS
- **Problem**: Selecting a design framework that is responsive, RTL-compatible, and easy to custom-theme.
- **Options considered**:
  1. Material UI (MUI)
  2. Tailwind CSS
  3. Styled Components
- **Decision**: Option 2 (Tailwind CSS).
- **Reason**: Tailwind allows perfect, lightweight design control, supports native RTL layouts, and completely avoids bloated JavaScript bundles or inline style injection.
- **Trade-offs**: Requires writing custom classes on multiple markup elements.
