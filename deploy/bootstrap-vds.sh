#!/bin/bash
# Первичная настройка VDS (запуск на сервере от root):
#   curl -fsSL ... | bash
# или: scp deploy/bootstrap-vds.sh root@81.163.31.249:/tmp/ && ssh root@81.163.31.249 bash /tmp/bootstrap-vds.sh
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/var/www/task-planner}"
CI_PUB_KEY_FILE="${1:-}"

echo "==> Пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq git nginx ufw build-essential curl

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 80/tcp
echo "y" | ufw enable || true

echo "==> Node.js 22"
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node -v
npm -v
npm install -g pm2

echo "==> Пользователь $DEPLOY_USER"
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
fi

mkdir -p "/home/$DEPLOY_USER/.ssh"
chmod 700 "/home/$DEPLOY_USER/.ssh"
touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

if [[ -n "$CI_PUB_KEY_FILE" && -f "$CI_PUB_KEY_FILE" ]]; then
  grep -qF "$(cat "$CI_PUB_KEY_FILE")" "/home/$DEPLOY_USER/.ssh/authorized_keys" 2>/dev/null \
    || cat "$CI_PUB_KEY_FILE" >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
  echo "==> CI public key добавлен"
fi

chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"

echo "==> Каталог приложения"
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

echo "==> nginx"
if [[ -f "$APP_DIR/deploy/nginx-task-planner.conf" ]]; then
  cp "$APP_DIR/deploy/nginx-task-planner.conf" /etc/nginx/sites-available/task-planner
else
  cat > /etc/nginx/sites-available/task-planner <<'NGINX'
server {
    listen 80;
    server_name 81.163.31.249;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
fi
ln -sf /etc/nginx/sites-available/task-planner /etc/nginx/sites-enabled/task-planner
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "==> Готово. Дальше от пользователя $DEPLOY_USER:"
echo "    git clone <repo> $APP_DIR"
echo "    создать $APP_DIR/.env"
echo "    cd $APP_DIR && npm ci && npm run build && pm2 start ecosystem.config.cjs && pm2 save && pm2 startup"
