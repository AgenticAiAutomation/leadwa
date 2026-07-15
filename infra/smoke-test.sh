#!/bin/bash
# Leadwa Production Smoke Test
# Run this AFTER deployment to verify everything works

set -e

echo "=== Leadwa Production Smoke Test ==="
echo ""

# Test API
echo "1. Testing API healthz..."
API_HEALTH=$(curl -s https://api.leadwa.co/healthz)
if echo "$API_HEALTH" | grep -q '"ok"'; then
    echo "   ✓ API is healthy"
else
    echo "   ✗ API health check failed"
    exit 1
fi

# Test landing page
echo "2. Testing landing page..."
LANDING=$(curl -s https://leadwa.co)
if echo "$LANDING" | grep -q "stop dying"; then
    echo "   ✓ Landing page loads with correct copy"
else
    echo "   ✗ Landing page missing expected content"
    exit 1
fi

# Test worker 404 (no link exists yet)
echo "3. Testing Worker (expecting 404 for non-existent link)..."
WORKER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://leadwa.link/nonexistent123)
if [ "$WORKER_STATUS" = "404" ]; then
    echo "   ✓ Worker returns 404 for non-existent link"
else
    echo "   ✗ Worker unexpected status: $WORKER_STATUS"
    exit 1
fi

# Test redirect domain
echo "4. Testing leadwa.co.in redirect..."
REDIRECT=$(curl -s -I https://leadwa.co.in | grep -i location)
if echo "$REDIRECT" | grep -q "leadwa.co"; then
    echo "   ✓ leadwa.co.in redirects to leadwa.co"
else
    echo "   ⚠ leadwa.co.in redirect not working (check Cloudflare Page Rules)"
fi

echo ""
echo "=== Automated tests passed ==="
echo ""
echo "Manual tests (do these from your phone on mobile data):"
echo "1. Go to https://leadwa.co and sign up"
echo "2. Create a test link with your WhatsApp number"
echo "3. Click the short URL — should open WhatsApp"
echo "4. Download QR code and scan it — should open WhatsApp"
echo "5. Check dashboard — click count should increment"
echo ""
echo "After manual tests pass, run:"
echo "  git add -A"
echo "  git commit -m 'W1-10: Ship it'"
echo "  git push origin main"
