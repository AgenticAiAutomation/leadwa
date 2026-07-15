# Leadwa API

FastAPI backend for Leadwa.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb leadwa

# Set connection string (or use .env file)
export DATABASE_URL='postgresql://user:pass@localhost:5432/leadwa'

# Run migrations
python migrate.py
```

3. Run the API:
```bash
uvicorn main:app --host 127.0.0.1 --port 5002
```

## Migrations

- Migration files live in `migrations/` as numbered SQL files (e.g., `001_init.sql`)
- Run `python migrate.py` to apply unapplied migrations
- Applied migrations are tracked in the `schema_migrations` table
- Running migrations multiple times is safe (idempotent)

## API Endpoints

- `GET /healthz` - Health check endpoint
