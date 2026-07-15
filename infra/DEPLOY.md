# Leadwa — Production Deployment

## Pre-flight checklist
- [ ] All W1-01 through W1-09 commits are on main
- [ ] Local tests pass (API healthz, worker dev, web build)
- [ ] You have VPS SSH access (Hostinger Ubuntu 24.04)
- [ ] You have Cloudflare account access (Pages + Workers + KV + DNS)
- [ ] Database credentials ready (Postgres 16)

## Part 1: VPS Setup (SSH into Hostinger)

### 1.1 Clone and install dependencies
```bash
cd /var/www
sudo git clone <YOUR_REPO_URL> leadwa
sudo chown -R www-data:www-data leadwa
cd leadwa/api

# Create venv and install
sudo -u www-data python3.12 -m venv venv
sudo -u www-data venv/bin/pip install -r requirements.txt
```

### 1.2 Create environment file
```bash
sudo -u www-data nano /var/www/leadwa/api/.env
```

Add:
```
DATABASE_URL=postgresql://leadwa_user:PASSWORD@localhost/leadwa
JWT_SECRET=<GENERATE_WITH_openssl_rand_hex_32>
CLICK_BEACON_SECRET=<GENERATE_WITH_openssl_rand_hex_32>
CF_ACCOUNT_ID=<YOUR_CF_ACCOUNT_ID>
CF_KV_NAMESPACE_ID=<YOUR_KV_NAMESPACE_ID>
CF_API_TOKEN=<YOUR_CF_API_TOKEN>
```

### 1.3 Setup database
```bash
# Create DB user and database
sudo -u postgres psql
```

```sql
CREATE USER leadwa_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE leadwa OWNER leadwa_user;
\c leadwa
CREATE EXTENSION IF NOT EXISTS citext;
\q
```

### 1.4 Run migrations
```bash
cd /var/www/leadwa/api
sudo -u www-data venv/bin/python migrate.py
```

### 1.5 Install systemd service
```bash
sudo cp /var/www/leadwa/infra/leadwa-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable leadwa-api
sudo systemctl start leadwa-api
sudo systemctl status leadwa-api
```

Should show "active (running)". Check logs:
```bash
sudo journalctl -u leadwa-api -f
```

### 1.6 Setup nginx
```bash
sudo cp /var/www/leadwa/infra/nginx-leadwa.conf /etc/nginx/sites-available/leadwa
sudo ln -s /etc/nginx/sites-available/leadwa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 1.7 SSL with certbot
```bash
sudo certbot --nginx -d api.leadwa.co
```

Follow prompts. Certbot will modify the nginx conf to add SSL.

### 1.8 Verify VPS deployment
```bash
curl https://api.leadwa.co/healthz
# Should return: {"ok": true}

# Verify agenticai is untouched
curl http://localhost:5001/healthz
# Should still work
```

## Part 2: Cloudflare Setup

### 2.1 Create KV namespace
1. Go to Cloudflare dashboard → Workers & Pages → KV
2. Create namespace: `LINKS`
3. Copy the namespace ID

### 2.2 Deploy Worker
```bash
cd worker
npm install
npx wrangler login
npx wrangler kv:namespace create LINKS
# Copy the ID to wrangler.toml if not already there
npx wrangler deploy
```

Verify route is set: leadwa.link/*

Set secrets:
```bash
npx wrangler secret put API_BASE_URL
# Enter: https://api.leadwa.co

npx wrangler secret put BEACON_SECRET
# Enter: (same CLICK_BEACON_SECRET value as in API .env)
```

### 2.3 Setup Cloudflare Pages
1. Dashboard → Workers & Pages → Create application → Pages → Connect to Git
2. Select your repo
3. Build settings:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output directory: `web/.next`
   - Root directory: `web`
4. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.leadwa.co
   NODE_VERSION=20.x
   ```
5. Deploy

### 2.4 Setup DNS
In Cloudflare DNS:
- `leadwa.co` → CNAME to Pages project (auto-suggested after Pages setup)
- `api.leadwa.co` → A record to VPS IP (orange cloud ON for DDoS protection)
- `leadwa.link` → Worker route (should auto-configure)
- `leadwa.co.in` → Page Rule: Forwarding URL (301) to `https://leadwa.co`

### 2.5 Verify Cloudflare deployment
```bash
curl -I https://leadwa.co
# Should return 200, HTML with "stop dying"

curl -I https://leadwa.link/test123
# Should return 404 (no link exists yet)
```

## Part 3: End-to-end smoke test (FROM YOUR PHONE on mobile data)

### 3.1 Create test link
1. Open https://leadwa.co on phone
2. Click "Create your free link"
3. Sign up with test email
4. Create a link:
   - Title: "Test Lead"
   - WhatsApp: 919876543210 (use a real number you can verify)
   - Prefill: "Hello from Leadwa test"
   - Source: Instagram
5. Copy the short URL (e.g., https://leadwa.link/abc123)

### 3.2 Test QR code
1. On dashboard, click QR icon for your test link
2. Download PNG
3. Open image on another device or print
4. Scan with phone camera
5. Should open WhatsApp with prefilled message

### 3.3 Verify click tracking
1. Click the short URL from your phone
2. Should redirect to WhatsApp
3. Go back to dashboard
4. Refresh — click count should increment to 1

### 3.4 Final health check
```bash
# API still healthy
curl https://api.leadwa.co/healthz

# agenticai untouched
systemctl status agenticai
curl http://localhost:5001/healthz
```

## Rollback plan (if anything breaks)
```bash
# Stop Leadwa API
sudo systemctl stop leadwa-api

# Remove nginx config
sudo rm /etc/nginx/sites-enabled/leadwa
sudo nginx -t && sudo systemctl reload nginx

# Drop database (if needed)
sudo -u postgres psql -c "DROP DATABASE leadwa;"

# Delete worker route in Cloudflare dashboard
# Delete Pages project in Cloudflare dashboard
```

## Monitoring (post-launch)
- API logs: `sudo journalctl -u leadwa-api -f`
- Nginx logs: `/var/log/nginx/access.log` and `error.log`
- Worker logs: Cloudflare dashboard → Workers & Pages → leadwa-redirect → Logs
- Pages deployment: Cloudflare dashboard → Workers & Pages → leadwa-co → Deployments

## Next session
After smoke test passes, commit with message: `W1-10: Ship it`
