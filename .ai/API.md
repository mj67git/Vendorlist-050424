# API Documentation (REST Interface)

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates a user and issues a JSON Web Token (JWT).
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "1",
      "email": "admin@qms.com",
      "role": "admin",
      "name": "مدیر سیستم"
    }
  }
  ```

---

## 2. Vendor Management Endpoints

### `GET /api/vendors`
Retrieves all registered vendors.
- **Response (200 OK)**:
  - Returns a key-value object of all registered vendors mapped by ID, containing full profile fields, grades, statuses, associated materials, and scoring histories.

### `POST /api/vendors`
Registers a new raw material vendor.
- **Request Body**:
  ```json
  {
    "name": "شرکت داروسازی البرز",
    "nameEn": "Alborz Pharma Co.",
    "country": "Iran",
    "status": "new",
    "isSample": false,
    "materialIds": ["mat-01"],
    "categories": {
      "mat-01": "api"
    }
  }
  ```
- **Response (201 Created)**: Returns the newly instantiated vendor profile.

### `PUT /api/vendors/:id`
Updates vendor contact information or profile registration data.

### `DELETE /api/vendors/:id`
Permanently deletes a vendor record and cascading material assignments.

---

## 3. Materials Registry Endpoints

### `GET /api/materials`
Retrieves the complete Material Master Registry (chemicals, CAS codes, and IRC records).

### `POST /api/materials`
Registers a new chemical substance or active pharmaceutical ingredient.
- **Request Body**:
  ```json
  {
    "name": "استامینوفن",
    "nameEn": "Acetaminophen",
    "cas": "103-90-2",
    "irc": "IRC-7893248"
  }
  ```

---

## 4. Analytical & Risk Endpoints

### `PUT /api/vendors/:id/risk`
Saves detailed raw material risk assessment factors (e.g., transport risk, synthesis complexity, quality criteria).

### `PUT /api/vendors/:id/analysis`
Appends an analytical test or quality control lab record to the vendor's profile.
- **Request Body**:
  ```json
  {
    "batchNumber": "B-902",
    "parameter": "Assay",
    "standard": "98.0% - 101.0%",
    "result": "99.4%",
    "status": "passed",
    "date": "1403/04/20"
  }
  ```

---

## 5. Audit Trail Endpoints

### `GET /api/audit-logs`
Returns the chronological operation history for system verification and compliance audits.
- **Query Params**: `limit`, `offset`.
