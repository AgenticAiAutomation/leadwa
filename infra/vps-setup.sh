#!/bin/bash
# Leadwa VPS Setup Script
# Run this on the Hostinger VPS as root

set -e  # Exit on error

echo "=== Leadwa VPS Deployment ==="
echo ""

# Check we're in the right place
if [ ! -d "/var/www/leadwa" ]; then
    echo "ERROR: /var/www/leadwa does not exist. Clone the repo first."
    exit 1
fi

cd /var/www/leadwa

# Ensure www-data owns everything
echo "Setting ownership to www-data..."
chown -R www-data:www-data /var/www/leadwa

# Setup Python venv
echo "Creating Python venv..."
cd api
if [ ! -d "venv" ]; then
    sudo -u www-data python3.12 -m venv venv
fi

echo "Installing Python dependencies..."
sudo -u www-data venv/bin/pip install -r requirements.txt

# Check for .env
if [ ! -f ".env" ]; then
    echo "ERROR: /var/www/leadwa/api/.env not found."
    echo "Create it with:"
    echo "  DATABASE_URL=postgresql://leadwa_user:PASSWORD@localhost/leadwa"
    echo "  JWT_SECRET=<32-byte-hex>"
    echo "  CLICK_BEACON_SECRET=<32-byte-hex>"
    echo "  CF_ACCOUNT_ID=<your-cf-account>"
    echo "  CF_KV_NAMESPACE_ID=<your-kv-namespace>"
    echo "  CF_API_TOKEN=<your-cf-token>"
    exit 1
fi

# Run migrations
echo "Running database migrations..."
sudo -u www-data venv/bin/python migrate.py

# Install systemd service
echo "Installing systemd service..."
cp /var/www/leadwa/infra/leadwa-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable leadwa-api

# Start or restart service
if systemctl is-active --quiet leadwa-api; then
    echo "Restarting leadwa-api..."
    systemctl restart leadwa-api
else
    echo "Starting leadwa-api..."
    systemctl start leadwa-api
fi

sleep 2
systemctl status leadwa-api --no-pager

# Setup nginx
echo "Setting up nginx..."
cp /var/www/leadwa/infra/nginx-leadwa.conf /etc/nginx/sites-available/leadwa
ln -sf /etc/nginx/sites-available/leadwa /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx

# Test local API
echo ""
echo "Testing API..."
curl -s http://127.0.0.1:5002/healthz || echo "API test failed!"

echo ""
echo "=== VPS setup complete ==="
echo ""
echo "Next steps:"
echo "1. Run: sudo certbot --nginx -d api.leadwa.co"
echo "2. Test: curl https://api.leadwa.co/healthz"
echo "3. Verify agenticai still works: systemctl status agenticai && curl http://localhost:5001/healthz"
echo "4. Deploy Worker and Pages (see DEPLOY.md Part 2)"
