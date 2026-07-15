# Vendor QMS Project Overview

## 1. Business Goals
- **Standardization**: Ensure raw materials are qualified under strict pharmaceutical and regulatory standards.
- **Traceability**: Implement a tamper-evident audit log that monitors all modifications (creation, edits, analysis, evaluations, deletions).
- **Consolidation**: Combine commercial, QA, planning, and finance assessments into a single weighted score to calculate precise supplier tier classifications (Grade A, B, C, or Black List).

## 2. Key User Roles
- **System Administrator (Admin)**: Full system access, deletion rights, log monitoring, and archive views.
- **QA Reviewer**: Conducts detailed raw material risk assessment and uploads analytical test records.
- **Evaluator**: inputs departmental scores (Commercial, QA, Planning, Finance).

## 3. Workflows & Business Rules
- **Material Onboarding**: Raw materials are cataloged under the Material Master Registry with CAS Number and IRC registration data.
- **Vendor Qualification**: New vendors are assigned active materials and classified as either "Sample" or "Active Commercial Supply".
- **Multi-Departmental Evaluation**:
  - Commercial Score (Weight: 20%)
  - QA Score (Weight: 40%)
  - Planning Score (Weight: 10%)
  - Finance Score (Weight: 30%)
- **Automatic Status Transition**:
  - Total Score >= 80%: Grade A (Approved Status)
  - Total Score >= 60%: Grade B (Approved Status)
  - Total Score >= 40%: Grade C (Conditional Status)
  - Total Score < 40%: Black List (Rejected Status)
- **Log Archival**: System edits are immediately written to the database audit logs and are visualized inside the unified Audit & Activity Center.
