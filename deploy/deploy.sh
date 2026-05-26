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

# Install dependencies (all deps needed — tailwindcss/typescript are required for build)
cd "$APP_DIR"
npm install

# Build with webpack (Turbopack has filesystem bugs in CI/VPS environments)
node_modules/.bin/next build --webpack

echo "✓ Build complete"
REMOTE_SCRIPT

# 3. Copy .env.local (contains secrets — never in git)
echo "▶ Uploading .env.local..."
scp -o StrictHostKeyChecking=no .env.local "$REMOTE:$APP_DIR/.env.local"

# 4. Restart via PM2 (process manager already configured with ecosystem.config.js)
echo "▶ Restarting Gabriel via PM2..."
$SSH bash -s << 'PM2RESTART'
cd /var/www/gabriel
if pm2 list | grep -q gabriel; then
  pm2 restart gabriel --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save
echo "▶ PM2 status:"
pm2 show gabriel | head -20
PM2RESTART

# 5. Update Nginx port in existing canonical config
echo "▶ Configuring Nginx..."
$SSH bash -s << 'NGINX'
CONF="/etc/nginx/sites-enabled/gabriel.hirableaiagents.com.conf"
DOMAIN="gabriel.hirableaiagents.com"

# Ensure canonical config points to port 3900
if [ -f "$CONF" ]; then
  sed -i 's|proxy_pass http://127.0.0.1:[0-9]*;|proxy_pass http://127.0.0.1:3900;|g' "$CONF"
fi

# Remove any conflicting gabriel symlink from previous deploys
rm -f /etc/nginx/sites-enabled/gabriel

# Get SSL cert if not already present
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "▶ Getting SSL certificate..."
  certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos -m marlonmfa@gmail.com
fi

nginx -t && systemctl reload nginx
echo "✓ Nginx configured"
NGINX

echo ""
echo "✅ Deploy complete! Site live at https://$DOMAIN"
echo "   Health check: curl -s https://$DOMAIN | head -5"
