# Zuvio - API Contract Foundation

## 1. Global Conventions
* **Base URL:** `/api/v1`
* **Content-Type:** `application/json` for request and response bodies.
* **Authentication:** `Authorization: Bearer <JWT_ACCESS_TOKEN>` for protected routes.
* **Pagination:** Uses `skip` and `limit` query parameters for list endpoints.
* **Standard Error Response:**
  ```json
  {
    "error": {
      "code": "ERROR_CODE_STRING",
      "message": "Human readable description."
    }
  }
  ```

## 2. Authentication Endpoints

### `POST /auth/register`
* **Req:** `{ "email", "password", "full_name" }`
* **Res (201):** `{ "user": { ... }, "access_token", "refresh_token" }`

### `POST /auth/login`
* **Req:** `{ "email", "password" }`
* **Res (200):** `{ "access_token", "refresh_token" }`

### `GET /auth/me`
* **Res (200):** Details of the currently authenticated user.

## 3. Files Endpoints

### `POST /files/init-upload`
* **Req:** `{ "folder_id" (opt), "original_filename", "mime_type", "file_size" }`
* **Res (200):** `{ "upload_url" (signed), "upload_id", "storage_key" }`

### `POST /files/complete-upload`
* **Req:** `{ "upload_id" }`
* **Res (200):** `{ "file": { "id", "name", ... } }`

### `GET /files/{id}`
* **Res (200):** Returns metadata. If query param `?download=true`, returns signed download URL.

### `DELETE /files/{id}`
* Moves file to trash (sets `deleted_at`).

## 4. Folders Endpoints

### `POST /folders`
* **Req:** `{ "name", "parent_id" (opt) }`
* **Res (201):** Folder metadata.

### `GET /folders/{id}`
* **Res (200):** Folder metadata plus list of immediate child folders and files.

## 5. Other Resources (Planned)
* `POST /share/internal` - Create an internal share.
* `POST /share/link` - Create a public link.
* `POST /stars/{type}/{id}` - Toggle star status.
* `GET /search` - Search by name/type.
