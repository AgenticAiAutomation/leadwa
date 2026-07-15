# Leadwa — Week 1 Tickets

Rules: one ticket = one Claude Code session = one commit. Run in order; each assumes the previous is merged.
Paste the ticket body verbatim as the prompt. CLAUDE.md is the standing context.

---

## W1-01 — Scaffold the monorepo
Create the repo structure from CLAUDE.md: `worker/`, `api/`, `web/`, `infra/`, `tickets/`.
- `api/`: FastAPI app factory, `/healthz` returning `{"ok": true}`, uvicorn entry, requirements.txt (fastapi, uvicorn, psycopg[binary], python-jose, passlib[bcrypt], httpx).
- `worker/`: wrangler.toml (name `leadwa-redirect`, route `leadwa.link/*`), `src/index.ts` responding "leadwa" to `/` for now.
- `web/`: Next.js 14 App Router via create-next-app defaults, TypeScript, Tailwind. Landing page placeholder h1.
- `infra/`: `leadwa-api.service` systemd unit (port 5002, user www-data, WorkingDirectory /var/www/leadwa/api), `nginx-leadwa.conf` for api.leadwa.co → 127.0.0.1:5002.
**Accept:** `uvicorn` serves /healthz locally; `wrangler dev` serves /; `npm run build` passes in web/.

## W1-02 — Database schema v1
Create `api/migrations/001_init.sql` and a tiny `migrate.py` (runs unapplied .sql files, records in `schema_migrations`).
Tables (YAGNI — exactly these):
- `users` (id uuid pk, email citext unique, password_hash, business_name, whatsapp_number, created_at)
- `links` (id uuid pk, user_id fk, slug text unique, dest_number text, prefill_text text, title text, source_tag text, active bool default true, created_at, updated_at)
- `clicks` (id bigserial pk, link_id fk, ts timestamptz, country text, device text, referrer text) — partition later, not now
- Indexes: links(slug), links(user_id), clicks(link_id, ts)
**Accept:** `python migrate.py` on a fresh `leadwa` db creates all tables; running twice is a no-op.

## W1-03 — Auth
Email+password signup/login in `api/`. JWT in httpOnly cookie, 30-day expiry. Endpoints: POST /auth/signup, POST /auth/login, POST /auth/logout, GET /auth/me. bcrypt hashing. One guard: reject duplicate email with 409.
**Accept:** curl flow signup→login→me works; wrong password → 401.

## W1-04 — Links CRUD + KV sync
Endpoints (auth required): POST /links, GET /links (own only), PATCH /links/{id}, DELETE /links/{id} (soft: active=false).
- Slug: 6-char base58 auto, or custom slug if provided (validate [a-z0-9-]{3,32}, unique).
- On every create/update/delete: push to Cloudflare KV via REST API (`LINKS` namespace): key=slug, value=JSON {n: dest_number, t: prefill_text, a: active, l: link_id}. Env vars: CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN.
**Accept:** create a link via curl → key visible in KV (wrangler kv key get); patch text → KV updated.

## W1-05 — Worker redirect hot path
`worker/src/index.ts`:
- GET /{slug}: KV lookup. Found & active → 302 to `https://wa.me/{n}?text={urlencode(t)}`. Missing/inactive → minimal branded 404 (inline HTML, <2KB).
- Fire-and-forget click beacon: `ctx.waitUntil(fetch(API/events/click, POST {l, country: cf.country, device: UA mobile/desktop, ref}))` with shared-secret header.
- Never await the beacon before redirecting. Total added latency budget: 0ms over KV read.
**Accept:** `wrangler dev` redirects a seeded slug to wa.me in <50ms locally; killing the API does not break redirects.

## W1-06 — Click ingestion + counts
- POST /events/click (shared-secret header, no user auth): insert into `clicks`. Reject bad secret with 401.
- GET /links/{id}/stats: total clicks, clicks last 7 days (per day), top country, mobile/desktop split. Plain SQL aggregates — no rollup tables yet.
**Accept:** seeded clicks return correct aggregates via curl.

## W1-07 — Dashboard MVP
`web/app/(dash)/`: login/signup pages + dashboard:
- Table of my links: title, short URL (copy button), source tag, clicks-total, clicks-7d sparkline (inline SVG, no chart lib).
- Create/edit modal: title, WhatsApp number, prefill text, custom slug (optional), source tag (select: Instagram, Hoarding, JustDial, IndiaMART, Referral, Other).
- Mobile-first. Owner uses a phone, not a laptop.
**Accept:** full flow in browser: signup → create link → open leadwa.link/slug → click count visible after refresh.

## W1-08 — QR codes
- API: GET /links/{id}/qr?format=png|svg — server-side QR of the short URL (segno lib), PNG 1024px for print, SVG for web. Center-badge "Leadwa" text under code, not over it.
- Dashboard: QR preview + "Download for print" button on each link row.
**Accept:** downloaded PNG scans from a phone camera at 30cm and opens WhatsApp chat.

## W1-09 — Landing page (SEO-critical, SSG)
`web/app/page.tsx`, statically generated, zero client JS above the fold:
- H1 outcome headline: "Your leads stop dying on WhatsApp." Sub: one honest price, no hidden fees.
- The leak story in 3 scroll sections (late replies / no follow-up / no tracking) — text+numbers, no stock photos.
- One CTA: "Create your free link" → signup. Footer: "A product by Agentic AI Automation".
- Full meta/OG/schema.org (SoftwareApplication), sitemap.xml, robots.txt. Server-rendered — view-source must show all copy (the LeadSutra mistake we do not repeat).
**Accept:** `curl leadwa.co | grep "stop dying"` finds the H1; Lighthouse SEO ≥ 95.

## W1-10 — Ship it
- VPS: clone to /var/www/leadwa, run migrations, install systemd unit, nginx block for api.leadwa.co, certbot.
- Cloudflare: Pages project on web/ (leadwa.co), Worker route leadwa.link/*, KV namespace bound, leadwa.co.in 301 rule.
- Smoke test end-to-end from a phone on mobile data: signup → link → QR scan → WhatsApp opens → click counted.
**Accept:** the smoke test passes on production URLs; `systemctl status leadwa-api` active; agenticai (5001) untouched and still serving.

---
Week 2 preview (do not start): missed-lead alert MVP (owner marks lead status; nudge via email first, WhatsApp later), source-tag analytics page, Hindi/vernacular string structure.
