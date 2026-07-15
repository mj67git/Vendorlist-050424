# Known Issues & Technical Debt

## 1. Technical Debt

### Local File Sync Delay
- **Description**: Writes to `vendors.json` run asynchronously in the background. If a rapid sequence of network updates is issued, some edits may be overwritten.
- **Remediation**: Implement a write queue or transition directly to the live PostgreSQL Prisma client for thread-safe production operations.

### Persian Date Conversions
- **Description**: Audit timestamps utilize standard JavaScript date-time structures, which represent Western dates in logs. Some sections display Persian calendar formatting.
- **Remediation**: Standardize all timestamp conversions using a single unified utility helper that maps dates consistently to Jalali formats.

---

## 2. Minor UI Glitches
- **Horizontal Scroll**: Extremely small screen sizes (<320px) may experience slight horizontal scrolling on complex scorecards due to minimum column widths.
- **Modal Drawer Backdrop**: Repeated clicking on modal drawer backdrops during fast animation sequences might occasionally cause screen freeze in development.
