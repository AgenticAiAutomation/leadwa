# W1-10 Deployment Checklist

## Before you start
- [ ] You are on a secure network
- [ ] You have VPS SSH credentials (Hostinger Ubuntu 24.04)
- [ ] You have Cloudflare account access
- [ ] Your git repo is accessible from the VPS

## Phase 1: VPS Database Setup (5 min)
SSH into VPS, then:

```bash
cd /var/www/leadwa/infra
bash generate-secrets.sh > secrets.txt
cat secrets.txt  # Save these secrets
```

Edit and run database setup:
```bash
nano db-setup.sql  # Change the password
sudo -u postgres psql -f db-setup.sql
```

Create `.env` file:
```bash
sudo nano /var/www/leadwa/api/.env
```

Paste:
```
DATABASE_URL=postgresql://leadwa_user:YOUR_PASSWORD@localhost/leadwa
JWT_SECRET=<from secrets.txt>
CLICK_BEACON_SECRET=<from secrets.txt>
CF_ACCOUNT_ID=<get from Cloudflare>
CF_KV_NAMESPACE_ID=<create in next phase>
CF_API_TOKEN=<create in next phase>
```

**STOP HERE** — we need Cloudflare KV namespace ID first.

## Phase 2: Cloudflare KV + Worker Setup (5 min)

From your local machine in `worker/` directory:

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv:namespace create LINKS
```

Copy the namespace ID shown. Update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "LINKS"
id = "YOUR_NAMESPACE_ID_HERE"
```

Deploy worker:
```bash
npx wrangler deploy
```

Set worker secrets:
```bash
npx wrangler secret put API_BASE_URL
# Enter: https://api.leadwa.co

npx wrangler secret put BEACON_SECRET
# Enter: (same CLICK_BEACON_SECRET value as in API .env)
```

Get Cloudflare API token:
1. Cloudflare Dashboard → My Profile → API Tokens → Create Token
2. Use "Edit Cloudflare Workers" template
3. Add permission: Account → Workers KV Storage → Edit
4. Copy the token

**NOW** go back to VPS and update `.env` with:
- `CF_KV_NAMESPACE_ID=<the ID from wrangler command>`
- `CF_API_TOKEN=<the token you just created>`

## Phase 3: VPS Application Setup (5 min)

On VPS:
```bash
cd /var/www/leadwa/infra
bash vps-setup.sh
```

If successful, setup SSL:
```bash
sudo certbot --nginx -d api.leadwa.co
```

Test:
```bash
curl https://api.leadwa.co/healthz
# Should return: {"ok":true}
```

Verify agenticai is untouched:
```bash
systemctl status agenticai
curl http://localhost:5001/healthz
```

## Phase 4: Cloudflare Pages Setup (5 min)

1. Go to Cloudflare Dashboard → Workers & Pages → Create
2. Click "Pages" tab → "Connect to Git"
3. Authorize GitHub/GitLab and select `leadwa` repo
4. Build settings:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Root directory:** `web`
5. Environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://api.leadwa.co`
   - `NODE_VERSION` = `20.x`
6. Click "Save and Deploy"
7. Wait for build to complete (~3 minutes)

After deployment:
8. Go to custom domains and add `leadwa.co`
9. Cloudflare will auto-configure DNS

## Phase 5: DNS & Redirects (5 min)

In Cloudflare DNS for `leadwa.co`:
- [ ] `leadwa.co` → CNAME to Pages project (auto-added in Phase 4)
- [ ] `api.leadwa.co` → A record to VPS IP, orange cloud ON
- [ ] `leadwa.link` → Worker route (check Workers → Routes)

For `leadwa.co.in` redirect:
1. Cloudflare Dashboard → Rules → Page Rules → Create Page Rule
2. URL: `leadwa.co.in/*`
3. Setting: Forwarding URL, 301 Permanent Redirect
4. Destination: `https://leadwa.co/$1`
5. Save

## Phase 6: Smoke Test (10 min)

From your local machine:
```bash
cd /var/www/leadwa/infra
bash smoke-test.sh
```

All automated tests should pass.

**Manual tests (from your phone on mobile data):**
1. [ ] Open https://leadwa.co → see landing page
2. [ ] Sign up with test email
3. [ ] Create a link with your real WhatsApp number
4. [ ] Copy the short URL (e.g., leadwa.link/abc123)
5. [ ] Click the short URL → opens WhatsApp with prefilled text
6. [ ] Go back to dashboard → click count shows 1
7. [ ] Click QR code icon → download PNG
8. [ ] Scan QR from another phone → opens WhatsApp
9. [ ] Refresh dashboard → click count shows 2

## Phase 7: Final Verification (2 min)

On VPS:
```bash
systemctl status leadwa-api
# Should show: active (running)

systemctl status agenticai
# Should show: active (running) - UNTOUCHED

curl http://localhost:5002/healthz
# leadwa API works locally

curl http://localhost:5001/healthz
# agenticai works locally
```

## Phase 8: Commit

If ALL tests pass:
```bash
git add infra/
git commit -m "W1-10: Ship it"
git push origin main
```

## Rollback (if needed)

```bash
# Stop leadwa
sudo systemctl stop leadwa-api
sudo systemctl disable leadwa-api

# Remove nginx
sudo rm /etc/nginx/sites-enabled/leadwa
sudo nginx -t && sudo systemctl reload nginx

# In Cloudflare:
# - Delete Worker route
# - Delete Pages project
# - Remove DNS records
```

## Success Criteria
- [ ] https://api.leadwa.co/healthz returns `{"ok":true}`
- [ ] https://leadwa.co shows landing page with "stop dying"
- [ ] https://leadwa.link/test returns 404 (branded, not Cloudflare default)
- [ ] Phone test: signup → create link → click → WhatsApp opens → count increments
- [ ] Phone test: QR scan works
- [ ] agenticai (port 5001) is UNTOUCHED and still serving
- [ ] Committed with message "W1-10: Ship it"
