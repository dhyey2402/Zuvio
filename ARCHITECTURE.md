# Zuvio - Architecture Document

## 1. High-Level Architecture
Zuvio operates on a modernized cloud-native stack tailored for high performance and secure data isolation:
* **Frontend:** React (Phase 2 implementation)
* **Backend:** FastAPI (Python) for asynchronous, high-throughput REST API serving.
* **Database:** PostgreSQL for robust ACID compliance, metadata relationships, and complex queries.
* **Storage:** Object Storage (AWS S3 / Supabase Storage) for scalable binary data storage.

## 2. Storage Architecture
Actual file binaries are **never** stored in PostgreSQL. The backend manages only metadata and access control. 

**Upload Flow (Direct-to-Cloud):**
1. **Init:** Client requests an upload via `POST /files/init-upload`.
2. **Validate:** Backend validates permissions, file size limits, and allowed types.
3. **Sign:** Backend generates a secure, time-bound presigned URL (or equivalent token) for direct upload.
4. **Upload:** Client uploads the binary payload directly to Object Storage, bypassing the FastAPI server to save bandwidth and compute.
5. **Complete:** Client calls `POST /files/complete-upload` to notify the backend.
6. **Persist:** Backend validates the upload against Object Storage and persists the metadata to PostgreSQL.

**Download Flow:**
1. Client requests access to a file.
2. Backend verifies permissions (owner, shared, public link).
3. Backend generates a short-lived signed URL for download and returns it to the client.
4. Client fetches the file directly from Object Storage.

## 3. Backend Structure
The FastAPI backend follows a domain-driven, layered architecture:
* **`app/main.py`:** Application entry point and middleware configuration.
* **`app/core/`:** Configuration, security, and authentication utilities.
* **`app/models/`:** SQLAlchemy ORM definitions mapping to PostgreSQL tables.
* **`app/schemas/`:** Pydantic models for request/response validation (API contracts).
* **`app/routes/`:** API endpoints grouped by domain (e.g., auth, files, folders).
* **`app/services/`:** Core business logic separated from route handlers.
* **`app/utils/`:** Reusable helpers.
* **`alembic/`:** Database migration scripts.

## 4. Phase 2 Readiness
* **Versioning:** A `file_versions` table schema is pre-planned to seamlessly integrate multiple storage keys per logical file ID.
* **Activity Tracking:** An `activities` table is architected to be an append-only log of events for future analytics or auditing.
