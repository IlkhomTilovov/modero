#!/usr/bin/env bash
# One-time VPS setup for moredo.uz. Run as root on a fresh Ubuntu box:
#   bash vps-bootstrap.sh
set -euo pipefail

APP_DIR="/var/www/modero"
DOMAIN="moredo.uz"
DB_NAME="modero"
DB_USER="modero"
DB_PASS="$(openssl rand -hex 24)"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="$(openssl rand -hex 32)"

echo "== apt update =="
apt-get update -y
apt-get install -y curl git build-essential ufw postgresql nginx rsync unzip certbot python3-certbot-nginx

echo "== Node.js 22 (for PM2) =="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2
pm2 startup systemd -u root --hp /root

echo "== Bun (app runtime) =="
curl -fsSL https://bun.sh/install | bash
ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun
ln -sf "$HOME/.bun/bin/bunx" /usr/local/bin/bunx

echo "== PostgreSQL: create db + user =="
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" || true
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || true

echo "== App directories =="
mkdir -p "${APP_DIR}/dist" "${APP_DIR}/server/dist/server" "${APP_DIR}/server/uploads"
ln -sfn ../../uploads "${APP_DIR}/server/dist/server/uploads"

echo "== server/.env (production) =="
cat > "${APP_DIR}/server/.env" <<EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
PORT=3001
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
ACCESS_TOKEN_TTL_MIN=15
REFRESH_TOKEN_TTL_DAYS=30
PUBLIC_ASSET_BASE_URL="https://${DOMAIN}"
WEB_ORIGIN="https://${DOMAIN}"
NODE_ENV=production
EOF
chmod 600 "${APP_DIR}/server/.env"

echo "== Nginx site =="
cp "$(dirname "$0")/nginx-moredo.conf" /etc/nginx/sites-available/moredo.conf
ln -sf /etc/nginx/sites-available/moredo.conf /etc/nginx/sites-enabled/moredo.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "== Firewall =="
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "=================================================="
echo "Bootstrap complete."
echo "DB password:        ${DB_PASS}"
echo "JWT_SECRET:          ${JWT_SECRET}"
echo "JWT_REFRESH_SECRET:  ${JWT_REFRESH_SECRET}"
echo "(also saved in ${APP_DIR}/server/.env)"
echo ""
echo "Next steps:"
echo "1. Point DNS A record: ${DOMAIN} -> $(curl -s ifconfig.me)"
echo "2. Once DNS resolves, run: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "3. Push to the main branch to trigger the first GitHub Actions deploy."
echo "=================================================="
