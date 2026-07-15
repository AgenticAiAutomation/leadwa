# Leadwa — CLAUDE.md

## What this is
Leadwa: WhatsApp lead-capture for Indian SMEs. Links/QR on leadwa.link, brand+dashboard on leadwa.co.
Positioning: "No lead ever dies on your WhatsApp." NOT a bulk sender. NOT an API BSP. No cold messaging features, ever.

## Monorepo layout
- `worker/`  — Cloudflare Worker (TypeScript). Redirects + click beacon. The ONLY hot path.
- `api/`     — FastAPI (Python 3.12). Auth, links CRUD, analytics reads, KV sync. Port 5002.
- `web/`     — Next.js 14, App Router. Landing = SSG (SEO-critical), dashboard = client.
- `infra/`   — nginx conf, systemd units, deploy scripts.
- `tickets/` — one file per ticket. Work ONE ticket per session.

## Stack rules (do not deviate without asking)
- Postgres 16, database `leadwa`, migrations via raw SQL files in `api/migrations/` (numbered). No ORM migrations magic; SQLAlchemy core for queries is fine.
- Redis only when a ticket says so. Don't add caching speculatively.
- Worker reads Cloudflare KV (`LINKS` namespace). API is the writer; Worker never writes KV.
- Click events: Worker fires `ctx.waitUntil(fetch(API/events/click))`, fire-and-forget. Never block a redirect on analytics.
- Auth: email+password, JWT (httpOnly cookie). No OAuth, no OTP in week 1.
- All money-facing copy in INR. UI strings in `web/lib/strings.ts` (en only for now; structure for locales later).

## Coding style (Ponytail rules apply)
- YAGNI hard. No abstractions for one caller. No config for things with one value.
- Small diffs. If a ticket seems to need >300 changed lines, stop and split it.
- No new dependencies without listing them at the top of your response with one-line justification.
- Every endpoint: happy path + one guard clause. No speculative error taxonomies.

## Deploy (VPS: Hostinger, Ubuntu 24.04)
- API: `cd /var/www/leadwa && git pull origin main && systemctl restart leadwa-api`
- Web: built on Cloudflare Pages from repo (`web/` root), auto on push to main.
- Worker: `cd worker && npx wrangler deploy`
- Existing services on this VPS: agenticai (port 5001), cockroach-social. DO NOT touch their nginx blocks or ports.

## Domains
- leadwa.co       → web (Cloudflare Pages)
- leadwa.co/api/* → nginx → 127.0.0.1:5002 (via Cloudflare orange-cloud DNS to VPS on api.leadwa.co; see infra/)
- leadwa.link/*   → Worker route (redirect hot path)
- leadwa.co.in    → 301 to leadwa.co

## Definition of done (every ticket)
1. Code committed with the ticket ID in the message (e.g. `W1-04: links CRUD`).
2. Acceptance criteria in the ticket demonstrably pass (curl commands or screenshot).
3. No unrelated files touched.
