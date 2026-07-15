# Leadwa Worker

Cloudflare Worker that handles the redirect hot path for `leadwa.link/*` short links.

## What it does

1. **KV lookup**: Reads link data from Cloudflare KV using the slug as the key
2. **Redirect**: If found and active, redirects to WhatsApp with pre-filled message
3. **Click tracking**: Fires a fire-and-forget beacon to the API (never blocks the redirect)
4. **404 page**: Minimal branded 404 for missing/inactive links (<2KB)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create KV namespace:
```bash
wrangler kv namespace create LINKS
```

3. Update `wrangler.toml` with the namespace ID:
```toml
[[kv_namespaces]]
binding = "LINKS"
id = "your-namespace-id-here"
```

4. Set secrets:
```bash
wrangler secret put BEACON_SECRET
wrangler secret put API_BASE_URL
```

## Development

Run locally with wrangler dev:
```bash
wrangler dev --port 8787
```

Seed test data:
```bash
wrangler kv key put --namespace-id=<id> testXYZ \
  '{"n":"919876543210","t":"Hello from Leadwa","a":true,"l":"test-link-id"}'
```

Test redirect:
```bash
curl -I http://localhost:8787/testXYZ
# Should return: Location: https://wa.me/919876543210?text=Hello%20from%20Leadwa
```

## Deploy

```bash
wrangler deploy
```

## Environment Variables

- `BEACON_SECRET` - Shared secret for authenticating click beacon requests to API
- `API_BASE_URL` - Base URL of the Leadwa API (e.g., `https://leadwa.co/api`)

## KV Data Format

Key: `{slug}` (e.g., `abc123`)

Value (JSON):
```json
{
  "n": "919876543210",           // dest_number (WhatsApp number)
  "t": "Hello from Leadwa",      // prefill_text (pre-filled message)
  "a": true,                      // active (link enabled/disabled)
  "l": "uuid-of-link-in-db"      // link_id (for click tracking)
}
```

## Performance

- **Target**: <50ms redirect time locally
- **No blocking**: Click beacon uses `ctx.waitUntil()` - never awaited before redirect
- **Minimal 404**: Inline HTML, no external resources, <2KB
