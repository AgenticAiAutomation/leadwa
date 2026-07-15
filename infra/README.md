# Leadwa Infrastructure

Deployment scripts and configuration for production.

## Quick Start

**First deployment?** Start here: [CHECKLIST.md](./CHECKLIST.md)

## Files

### Configuration
- `nginx-leadwa.conf` — nginx reverse proxy config for api.leadwa.co
- `leadwa-api.service` — systemd service definition
- `db-setup.sql` — PostgreSQL database initialization

### Scripts
- `vps-setup.sh` — Automated VPS deployment (run on server)
- `smoke-test.sh` — End-to-end verification tests
- `generate-secrets.sh` — Helper to generate JWT and beacon secrets

### Documentation
- `DEPLOY.md` — Comprehensive deployment guide with all steps
- `CHECKLIST.md` — Step-by-step checklist format (recommended for first deploy)

## Architecture

```
User Request Flow:
  leadwa.link/abc123
    ↓
  Cloudflare Worker (KV lookup)
    ↓
  302 → wa.me/919876543210?text=...
    +
  Fire-and-forget beacon → api.leadwa.co/events/click

Dashboard Flow:
  leadwa.co (Cloudflare Pages, Next.js SSG)
    ↓
  api.leadwa.co (VPS, FastAPI on port 5002)
    ↓
  PostgreSQL 16 (VPS, localhost)
```

## Deployment Checklist Summary

1. **VPS**: Clone repo → Setup DB → Create .env → Run migrations → Start service → Setup nginx → Certbot
2. **Cloudflare**: Create KV → Deploy Worker → Setup Pages → Configure DNS
3. **Test**: Automated smoke tests + manual phone test
4. **Commit**: `W1-10: Ship it`

## Support

- API logs: `sudo journalctl -u leadwa-api -f`
- Service status: `systemctl status leadwa-api`
- Nginx logs: `/var/log/nginx/access.log` and `error.log`
- Worker logs: Cloudflare dashboard → Workers → leadwa-redirect → Logs

## Rollback

See [DEPLOY.md](./DEPLOY.md#rollback-plan-if-anything-breaks) for rollback steps.
