# Zuvio - Database Design Document

## 1. Database Technologies
* **RDBMS:** PostgreSQL
* **ORM:** SQLAlchemy (or SQLModel)
* **Migrations:** Alembic
* **Primary Keys:** UUID (v4) for all primary entities to prevent ID enumeration and ensure uniqueness across distributed systems.

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ FOLDERS : "owns"
    USERS ||--o{ FILES : "owns"
    USERS ||--o{ SHARES : "receives"
    USERS ||--o{ STARS : "creates"
    USERS ||--o{ ACTIVITIES : "performs"
    
    FOLDERS |o--o{ FOLDERS : "parent_id"
    FOLDERS ||--o{ FILES : "contains"
    FOLDERS ||--o{ SHARES : "has"
    FOLDERS ||--o{ LINK_SHARES : "has"
    
    FILES ||--o{ FILE_VERSIONS : "has"
    FILES ||--o{ SHARES : "has"
    FILES ||--o{ LINK_SHARES : "has"

    USERS {
        uuid id PK
        string email
        string password_hash
        string full_name
        string avatar_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    FOLDERS {
        uuid id PK
        uuid owner_id FK
        uuid parent_id FK "nullable"
        string name
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }
    
    FILES {
        uuid id PK
        uuid owner_id FK
        uuid folder_id FK "nullable"
        string original_filename
        string storage_key
        string mime_type
        integer file_size
        string extension
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }

    FILE_VERSIONS {
        uuid id PK
        uuid file_id FK
        string version_identifier
        string storage_key
        integer size
        uuid creator_id FK
        timestamp created_at
    }

    SHARES {
        uuid id PK
        uuid resource_id "Polymorphic file/folder ID"
        string resource_type "FILE or FOLDER"
        uuid recipient_id FK
        uuid granted_by FK
        string permission "OWNER, EDITOR, VIEWER"
        timestamp created_at
    }

    LINK_SHARES {
        uuid id PK
        uuid resource_id "Polymorphic file/folder ID"
        string resource_type "FILE or FOLDER"
        string unique_token "Cryptographically secure"
        string password_hash "nullable"
        timestamp expires_at "nullable"
        boolean is_active
        timestamp created_at
    }

    STARS {
        uuid id PK
        uuid user_id FK
        uuid resource_id
        string resource_type
        timestamp created_at
    }

    ACTIVITIES {
        uuid id PK
        uuid user_id FK
        string event_type
        uuid resource_id
        string resource_type
        jsonb metadata
        timestamp created_at
    }
```

## 3. Key Constraints & Policies
* **UUIDs:** Used for all `id` fields.
* **Cascades & Deletions:** 
  * Hard deletions of users cascade to their owned files and folders.
  * Normal file/folder deletion is handled via `deleted_at` (Soft Delete). Queries must default to filtering out `deleted_at IS NOT NULL`.
* **Folder Hierarchy:** `parent_id` references `folders(id)`. Root level items have `parent_id = NULL`. Business logic must detect and prevent circular folder loops.
* **Stars:** A composite unique constraint on `(user_id, resource_id)` prevents duplicate starring.
* **File Storage Keys:** The `storage_key` must be unique to prevent collisions in the object bucket.
