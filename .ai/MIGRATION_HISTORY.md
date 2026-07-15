# Database Migration History (MIGRATION_HISTORY.md)

This document tracks the evolution, versions, database schemas, migration logs, and structural rollbacks of the database engine over the project lifespan.

---

## 1. Migration Log

### [Migration: 20260616000000_init]
- **Date**: 2026-06-16
- **Status**: Completed
- **Purpose**: Initialize baseline relational database structures on PostgreSQL and align schemas with Prisma ORM client models.
- **Affected Tables**:
  - `Vendor`
  - `Material`
  - `VendorMaterial`
  - `Evaluation`
  - `AuditLog`
- **Technical Risk**: Low. New setup with zero pre-existing data, preventing migration conflicts or record truncation.
- **Rollback Strategy**:
  - Run standard Prisma reset command: `npx prisma migrate reset`
  - Delete generated database schemas and rebuild migrations.

---

## 2. Core Relational Schema Reference
The migration structures comply with the constraints registered inside `/prisma/schema.prisma`:

```prisma
model Vendor {
  id              String           @id @default(uuid())
  name            String
  nameEn          String
  country         String
  contactInfo     String?
  registrationDate String
  status          String
  grade           String?
  riskAssessment  String?
  analysisRecords String?
  materials       VendorMaterial[]
  evaluations     Evaluation[]
  auditLogs       AuditLog[]
}

model Material {
  id               String           @id @default(uuid())
  name             String
  nameEn           String
  cas              String           @unique
  irc              String
  vendorMaterials  VendorMaterial[]
}

model VendorMaterial {
  id         String   @id @default(uuid())
  vendorId   String
  materialId String
  category   String
  isSample   Boolean  @default(false)
  vendor     Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  material   Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
}

model Evaluation {
  id              String   @id @default(uuid())
  vendorId        String
  materialId      String
  period          String
  commercialScore Float    @default(0)
  qaScore         Float    @default(0)
  planningScore   Float    @default(0)
  financeScore    Float    @default(0)
  totalScore      Float    @default(0)
  grade           String?
  scores          String?
  rawScores       String?
  vendor          Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id        String   @id @default(uuid())
  vendorId  String?
  user      String
  action    String
  details   String?
  createdAt DateTime @default(now())
  vendor    Vendor?  @relation(fields: [vendorId], references: [id], onDelete: SetNull)
}
```

---

## 3. Deployment & Execution Commands
- **Check Migration Status**: `npx prisma migrate status`
- **Generate Local Migration**: `npx prisma migrate dev --name <migration_name>`
- **Deploy to Production PostgreSQL**: `npx prisma migrate deploy`
- **Seed Base Dataset**: `npx prisma db seed`

---

## Related Documents
- `/.ai/DATABASE.md` (Entity relation mapping)
- `/.ai/ARCHITECTURE.md` (System structures)
- `/.ai/TASKS.md` (Future connection tasks)
