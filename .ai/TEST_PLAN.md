# System Test Plan

## 1. Unit Testing

### Evaluation Formula
- **Objective**: Verify weighted math scores strictly calculate according to rules:
  - `commercial * 0.20 + qa * 0.40 + planning * 0.10 + finance * 0.30`
- **Scenarios**:
  - Scores: { commercial: 80, qa: 90, planning: 70, finance: 85 } -> Calculated: 84.5 (Rounded to 85, Grade A)
  - Scores: { commercial: 0, qa: 0, planning: 0, finance: 0 } -> Calculates: 0, Black List

### CAS Number Verification
- **Objective**: Ensure entered CAS registration matches correct standard format:
  - Regular Expression: `/^\d{2,7}-\d{2}-\d$/`

---

## 2. Integration Testing

### Cascade Deletions
- **Objective**: Test that deleting a Vendor deletes its entries inside `vendor_materials` and `evaluations`.
- **Procedure**:
  - Register vendor "Test Co", add material "Test Mat", score it.
  - Call delete on vendor.
  - Query DB to confirm no orphaned material links or evaluations exist.

### Excel Export Formats
- **Objective**: Confirm that generated `.xlsx` workbook includes all worksheets and matches correct styling standards without runtime crashes.

---

## 3. Security & Access Controls

### Unauthorized Modals
- **Objective**: Ensure standard "Evaluators" are strictly blocked from deleting vendors or viewing raw administrative audit logs.

---

## Related Documents
- `/.ai/RISKS.md` (Security risks)
- `/.ai/CODE_STYLE.md` (Engineering standards)
- `/.ai/WORKFLOW.md` (Testing process requirements)

