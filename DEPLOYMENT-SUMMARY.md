# W1-10: Ship It — Deployment Summary

This ticket adds complete production deployment infrastructure for Leadwa.

## What was added

### Documentation
1. **infra/CHECKLIST.md** — Step-by-step deployment checklist (start here)
2. **infra/DEPLOY.md** — Comprehensive deployment guide with all details
3. **infra/README.md** — Infrastructure overview
4. **README.md** (root) — Project overview and quick start

### Configuration Files
1. **api/.env.example** — Template for API environment variables
2. **web/.env.production.example** — Template for Cloudflare Pages env vars
3. **infra/db-setup.sql** — PostgreSQL database initialization script

### Deployment Scripts
1. **infra/vps-setup.sh** — Automated VPS setup (run on server)
2. **infra/generate-secrets.sh** — Generate JWT and beacon secrets
3. **infra/smoke-test.sh** — Automated end-to-end verification

### Fixes
1. **infra/leadwa-api.service** — Updated to use venv Python path

## How to use

### For first-time deployment:
```bash
# Read the checklist
cat infra/CHECKLIST.md

# Follow steps in order:
# 1. VPS database setup
# 2. Cloudflare KV + Worker
# 3. VPS application setup
# 4. Cloudflare Pages
# 5. DNS & redirects
# 6. Smoke tests
# 7. Commit
```

### Key deployment steps:

**On VPS:**
```bash
cd /var/www/leadwa/infra
bash vps-setup.sh
sudo certbot --nginx -d api.leadwa.co
```

**Locally (Worker):**
```bash
cd worker
npx wrangler kv:namespace create LINKS
npx wrangler deploy
npx wrangler secret put BEACON_SECRET
npx wrangler secret put API_BASE_URL
```

**Cloudflare Pages:**
- Connect to Git → Select repo
- Root: `web/`
- Build: `npm run build`
- Output: `.next`
- Env: `NEXT_PUBLIC_API_URL=https://api.leadwa.co`

**Verification:**
```bash
# From your machine
bash infra/smoke-test.sh

# From your phone (mobile data)
# 1. Open leadwa.co
# 2. Sign up
# 3. Create link
# 4. Test redirect
# 5. Verify click count
```

## Acceptance Criteria

All items from the ticket:

- [x] VPS setup scripts created
- [x] nginx configuration ready
- [x] systemd service unit ready
- [x] Database setup scripts ready
- [x] Cloudflare deployment documentation
- [x] Worker secrets documented
- [x] Pages environment variables documented
- [x] DNS configuration checklist
- [x] Smoke test script created
- [x] End-to-end flow documented
- [x] Rollback plan documented

**To be done manually (you must do these):**
- [ ] Clone repo to /var/www/leadwa on VPS
- [ ] Run database setup
- [ ] Create .env files with real credentials
- [ ] Run migrations
- [ ] Start systemd service
- [ ] Setup nginx + certbot
- [ ] Deploy Worker to Cloudflare
- [ ] Deploy Pages to Cloudflare
- [ ] Configure DNS
- [ ] Run smoke test from phone
- [ ] Verify agenticai (port 5001) is untouched

## Next Steps

1. **Review** the [infra/CHECKLIST.md](infra/CHECKLIST.md)
2. **Execute** each phase (will take ~30-40 minutes total)
3. **Test** from your phone on mobile data
4. **Commit** this ticket with: `git commit -m "W1-10: Ship it"`

## Important Notes

- Worker uses `BEACON_SECRET` (not `CLICK_BEACON_SECRET`)
- Pages root directory is `web/` (not repo root)
- agenticai on port 5001 must remain untouched
- SSL cert is automatic via certbot
- leadwa.co.in → leadwa.co redirect via Cloudflare Page Rule

## Support

If anything fails during deployment:
1. Check the service logs: `sudo journalctl -u leadwa-api -f`
2. Check nginx logs: `/var/log/nginx/error.log`
3. Check Worker logs: Cloudflare dashboard → Workers → Logs
4. Rollback steps are in DEPLOY.md

---

**Status**: Ready to deploy 🚀

All code and infrastructure files are ready. Manual deployment execution required.
