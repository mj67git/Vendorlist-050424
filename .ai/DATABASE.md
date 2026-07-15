# Database Schema & Relational Models

## 1. Relational Entities
This system models an enterprise-level, non-duplicative, normalized structure:

### `vendors` (Vendors Table)
- `id` (VARCHAR(50), Primary Key)
- `name` (VARCHAR, Persian display name)
- `name_en` (VARCHAR, English IUPAC or trade name)
- `country` (VARCHAR, Origin country)
- `contact_info` (TEXT, JSON-serialized contact records)
- `registration_date` (VARCHAR, Date of record initiation)
- `status` (VARCHAR, "new" | "approved" | "conditional" | "rejected")
- `grade` (VARCHAR, "A" | "B" | "C" | "black list" | null)
- `risk_assessment` (TEXT, serialized JSON of risk factors)
- `analysis_records` (TEXT, serialized JSON of QA lab assessments)

### `materials` (Materials Registry)
- `id` (VARCHAR(50), Primary Key)
- `name` (VARCHAR, Chemical standard name Persian)
- `name_en` (VARCHAR, English IUPAC standard name)
- `cas` (VARCHAR, CAS Registration Number `XX-XX-X`)
- `irc` (VARCHAR, Iran Regulatory Code Registration)

### `vendor_materials` (Junction Table)
- `id` (VARCHAR(50), Primary Key)
- `vendor_id` (Foreign Key -> vendors.id, onDelete: CASCADE)
- `material_id` (Foreign Key -> materials.id, onDelete: CASCADE)
- `is_sample` (BOOLEAN, indicates if material is in testing/sample grade)
- `category` (VARCHAR, Active pharmaceutical ingredient, solvent, catalyst, excipient, reagent)

### `evaluations` (Multi-disciplinary scores)
- `id` (VARCHAR(50), Primary Key)
- `vendor_id` (Foreign Key -> vendors.id)
- `material_id` (Foreign Key -> materials.id)
- `period` (VARCHAR, e.g., "1402 - Midterm", "2024 - Annual")
- `commercial_score` (FLOAT, default: 0)
- `qa_score` (FLOAT, default: 0)
- `planning_score` (FLOAT, default: 0)
- `finance_score` (FLOAT, default: 0)
- `total_score` (FLOAT, calculated weighted overall score)
- `grade` (VARCHAR, derived grade tier)
- `scores` (TEXT, JSON string)
- `raw_scores` (TEXT, JSON string of individual indicators)

### `audit_logs` (Tamper-evident operations journal)
- `id` (VARCHAR(50), Primary Key)
- `vendor_id` (Foreign Key -> vendors.id, Nullable, onDelete: SET NULL)
- `user` (VARCHAR, Active operator email/role)
- `action` (VARCHAR, short description of change)
- `details` (TEXT, structured original vs modified delta logs)
- `created_at` (TIMESTAMP, defaults to current time)

## 2. Integrity Constraints & Cascades
- **Cascade Delete**: Deleting a Vendor automatically cascades and deletes related entries in `vendor_materials` and `evaluations` to maintain perfect referential integrity.
- **Set Null Log Integrity**: Deleting a Vendor keeps its related Audit Log entries, setting `vendor_id` to `NULL` to preserve complete chronological regulatory history.
