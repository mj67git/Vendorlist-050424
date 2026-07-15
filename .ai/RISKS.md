# Technical & Business Risks

## 1. Concurrency Conflicts in JSON storage
- **Probability**: Medium
- **Impact**: High
- **Description**: Multiple evaluators submitting scores concurrently might overwrite database updates when working with disk-based `vendors.json`.
- **Mitigation**: Move immediately to the Prisma SQL transaction model where rows are locked or updated safely on the database server.

## 2. File Corruptions on Server Restart
- **Probability**: Low
- **Impact**: High
- **Description**: Power disruptions or server crashes during a write to `vendors.json` could cause corruption.
- **Mitigation**: Server-side write-ahead temp file strategy (`fs.writeFileSync` to a temporary file, then rename/overwrite atomically).

## 3. JWT Session Exposure
- **Probability**: Low
- **Impact**: Medium
- **Description**: Standard authentication token stored in localStorage could be vulnerable to XSS.
- **Mitigation**: Implement httpOnly cookies for session storage and configure strict CORS policies on the Express application.
