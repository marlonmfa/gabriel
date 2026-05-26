#!/usr/bin/env bash
# Usage: ./deploy/deploy.sh
# Run from LOCAL machine. Requires SSH access to $VPS_HOST.
set -euo pipefail

# ── Config ──────────────────────────────────────────────
VPS_HOST="${HOST_VPS:-91.108.125.60}"
VPS_USER="${HOST_USER:-root}"
APP_DIR="/var/www/gabriel"
DOMAIN="gabriel.hirableaiagents.com"
# ────────────────────────────────────────────────────────

SSH="ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST}"
REMOTE="$VPS_USER@$VPS_HOST"

echo "▶ Deploying Gabriel to $DOMAIN ($VPS_HOST)..."

# 1. Push latest code to GitHub first
git push origin main

# 2. Run setup on VPS
$SSH bash -s << 'REMOTE_SCRIPT'
set -euo pipefail

APP_DIR="/var/www/gabriel"

# Install Node 20 if not present
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Install nginx if not present
if ! command -v nginx &>/dev/null; then
  echo "Installing Nginx..."
  apt-get update && apt-get install -y nginx
fi

# Install certbot if not present
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi

# Clone or pull repo
if [ -d "$APP_DIR/.git" ]; then
  echo "Pulling latest..."
  git -C "$APP_DIR" pull origin main
else
  echo "Cloning repo..."
  mkdir -p "$(dirname $APP_DIR)"
  git clone https://github.com/marlonmfa/gabriel.git "$APP_DIR"
fi

# Install dependencies
cd "$APP_DIR"
npm ci --omit=dev

# Build
npm run build

echo "✓ Build complete"
REMOTE_SCRIPT

# 3. Copy .env.local (contains secrets — never in git)
echo "▶ Uploading .env.local..."
scp -o StrictHostKeyChecking=no .env.local "$REMOTE:$APP_DIR/.env.local"

# 4. Install systemd service
echo "▶ Installing systemd service..."
scp -o StrictHostKeyChecking=no deploy/gabriel.service "$REMOTE:/etc/systemd/system/gabriel.service"
$SSH bash -s << 'SYSTEMD'
systemctl daemon-reload
systemctl enable gabriel
systemctl restart gabriel
echo "▶ Service status:"
systemctl status gabriel --no-pager | head -15
SYSTEMD

# 5. Install Nginx config
echo "▶ Configuring Nginx..."
scp -o StrictHostKeyChecking=no deploy/nginx.conf "$REMOTE:/etc/nginx/sites-available/gabriel"
$SSH bash -s << NGINX
DOMAIN="gabriel.hirableaiagents.com"
ln -sf /etc/nginx/sites-available/gabriel /etc/nginx/sites-enabled/gabriel
rm -f /etc/nginx/sites-enabled/default

# Get SSL cert if not already present
if [ ! -d "/etc/letsencrypt/live/\$DOMAIN" ]; then
  echo "▶ Getting SSL certificate..."
  certbot certonly --nginx -d "\$DOMAIN" --non-interactive --agree-tos -m marlonmfa@gmail.com
fi

nginx -t && systemctl reload nginx
echo "✓ Nginx configured"
NGINX

echo ""
echo "✅ Deploy complete! Site live at https://$DOMAIN"
echo "   Health check: curl -s https://$DOMAIN | head -5"
