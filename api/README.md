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

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/leadwa`)
- `SECRET_KEY` - JWT signing secret (default: `dev-secret-change-in-production` - **must change in production**)
- `CF_ACCOUNT_ID` - Cloudflare account ID (required for KV sync)
- `CF_KV_NAMESPACE_ID` - Cloudflare KV namespace ID for `LINKS` (required for KV sync)
- `CF_API_TOKEN` - Cloudflare API token with KV write permissions (required for KV sync)
- `BEACON_SECRET` - Shared secret for worker click beacon authentication (default: `dev-beacon-secret`)

## API Endpoints

### Health
- `GET /healthz` - Health check endpoint

### Auth
- `POST /auth/signup` - Create new user account (returns JWT in httpOnly cookie)
- `POST /auth/login` - Login with email/password (returns JWT in httpOnly cookie)
- `POST /auth/logout` - Clear auth cookie
- `GET /auth/me` - Get current user info (requires auth cookie)

### Links (all require authentication)
- `POST /links` - Create a new link (auto-generates 6-char base58 slug or accepts custom slug)
- `GET /links` - List all links for authenticated user
- `PATCH /links/{id}` - Update a link (title, dest_number, prefill_text, source_tag)
- `DELETE /links/{id}` - Soft delete a link (sets active=false)

All link create/update/delete operations automatically sync to Cloudflare KV with key=slug, value=JSON.

### Events (beacon only, shared secret auth)
- `POST /events/click` - Ingest click event from worker (requires `x-beacon-secret` header)

### Stats (require authentication)
- `GET /links/{id}/stats` - Get link statistics (total clicks, last 7 days per day, top country, mobile/desktop split)
