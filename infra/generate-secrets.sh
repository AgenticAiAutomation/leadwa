#!/bin/bash
# Generate secrets for .env file

echo "=== Leadwa Secrets Generator ==="
echo ""
echo "Copy these into /var/www/leadwa/api/.env:"
echo ""
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "CLICK_BEACON_SECRET=$(openssl rand -hex 32)"
echo ""
echo "Get these from Cloudflare dashboard:"
echo "CF_ACCOUNT_ID=<Cloudflare Account ID>"
echo "CF_KV_NAMESPACE_ID=<KV namespace ID from 'wrangler kv:namespace list'>"
echo "CF_API_TOKEN=<API token with KV:Edit permission>"
