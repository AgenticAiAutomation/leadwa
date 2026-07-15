# Leadwa

**No lead ever dies on your WhatsApp.**

WhatsApp lead-capture for Indian SMEs. Short links + QR codes that redirect to WhatsApp with prefilled messages. Simple dashboard to track every lead.

- **Links**: leadwa.link/your-slug → WhatsApp chat
- **Dashboard**: leadwa.co (landing + auth + analytics)
- **API**: api.leadwa.co (FastAPI backend)

## What this is NOT
- NOT a bulk sender
- NOT a cold messaging tool
- NOT an API BSP

## Tech Stack
- **Worker**: Cloudflare Worker (TypeScript) — redirect hot path
- **API**: FastAPI (Python 3.12) + PostgreSQL 16
- **Web**: Next.js 14 App Router + Tailwind
- **Hosting**: Cloudflare (Pages + Workers + KV), Hostinger VPS (API + DB)

## Repository Structure
```
leadwa/
├── worker/          # Cloudflare Worker (redirect + click beacon)
├── api/             # FastAPI backend (auth, links CRUD, analytics)
├── web/             # Next.js frontend (landing + dashboard)
├── infra/           # Deployment scripts, nginx, systemd
└── TICKETS-WEEK1.md # Development tickets (one session = one ticket)
```

## Development Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16
- Cloudflare account (for Worker + KV development)

### 1. API Setup
```bash
cd api
python3.12 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Create database
createdb leadwa
psql leadwa -c "CREATE EXTENSION citext;"

# Create .env
cp .env.example .env
# Edit .env with your DB credentials and secrets

# Run migrations
python migrate.py

# Start API
uvicorn main:app --reload --port 5002
```

### 2. Worker Setup
```bash
cd worker
npm install

# Create KV namespace (one-time)
npx wrangler kv:namespace create LINKS
# Update wrangler.toml with the namespace ID

# Update wrangler.toml with your KV namespace ID
# Set secrets locally:
# npx wrangler secret put BEACON_SECRET
# npx wrangler secret put API_BASE_URL

# Start dev server
npx wrangler dev
```

### 3. Web Setup
```bash
cd web
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5002" > .env.local

# Start dev server
npm run dev
```

### 4. Full Flow Test
1. API running on http://localhost:5002
2. Web running on http://localhost:3000
3. Worker on http://localhost:8787 (wrangler dev)
4. Sign up → create link → test redirect → verify click count

## Deployment

See [infra/CHECKLIST.md](./infra/CHECKLIST.md) for step-by-step production deployment.

Quick summary:
1. VPS setup (DB, API, nginx, SSL)
2. Cloudflare (Worker, Pages, DNS)
3. Smoke test from mobile
4. Commit: `W1-10: Ship it`

## Architecture

```
┌─────────────────┐
│  User clicks    │
│ leadwa.link/xyz │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Cloudflare Worker          │
│  - KV lookup (slug → data)  │
│  - 302 → wa.me/...          │
│  - Fire-and-forget beacon   │
└─────────┬───────────────────┘
          │
          ├─► WhatsApp (302 redirect)
          │
          └─► api.leadwa.co/events/click (async)
                      │
                      ▼
              ┌────────────────┐
              │ FastAPI + PG   │
              │ - Store click  │
              │ - Serve stats  │
              └────────────────┘
                      ▲
                      │
              ┌───────┴────────┐
              │  Next.js       │
              │  Dashboard     │
              │  (Pages SSG)   │
              └────────────────┘
```

## Development Workflow

One ticket = one session = one commit.

Work tickets in order (each assumes previous is merged):
- W1-01 through W1-09: ✅ DONE
- W1-10: Ship it 🚀 (this ticket)

See [TICKETS-WEEK1.md](./TICKETS-WEEK1.md) for full ticket list.

## Week 2 Preview
- Missed-lead alert MVP
- Source-tag analytics page
- Hindi/vernacular string structure

## Contributing

Internal project. For questions: jai.prajapati91@gmail.com

## License

Proprietary. © 2026 Agentic AI Automation.
