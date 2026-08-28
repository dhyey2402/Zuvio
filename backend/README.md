# Zuvio Backend

This is the backend repository for Zuvio, a modern cloud-based file storage and sharing platform.

## Technology Stack
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (with SQLAlchemy and Alembic)
- **Authentication:** JWT with Access and Refresh tokens
- **Storage:** Object Storage (S3 / Supabase)

## Local Development Setup

1. **Clone and enter the directory:**
   ```bash
   cd backend
   ```

2. **Set up virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Copy `.env.example` to `.env` and configure your local settings.
   ```bash
   cp .env.example .env
   ```

5. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

The API documentation will be available at `http://localhost:8000/docs`.
