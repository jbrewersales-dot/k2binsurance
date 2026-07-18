#!/usr/bin/env bash
# One-shot setup for a fresh AWS Lightsail Ubuntu instance (22.04 or 24.04).
# Installs Docker, clones the repo, generates secrets, launches the production
# stack (app + Postgres + Caddy HTTPS), and seeds the first agent account.
#
# Usage (SSH'd into the instance):
#   curl -fsSL https://raw.githubusercontent.com/jbrewersales-dot/k2binsurance/main/deploy/lightsail-setup.sh | sudo bash
# or after cloning manually:
#   sudo bash deploy/lightsail-setup.sh
#
# Re-running is safe: it updates the repo and restarts the stack.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/jbrewersales-dot/k2binsurance.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/k2binsurance}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo bash $0" >&2
  exit 1
fi

echo "==> 1/6 Installing prerequisites (Docker, git)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates openssl
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

# Small instances (1–2 GB RAM) need swap for the Next.js build.
if [ ! -f /swapfile ]; then
  echo "==> Adding 2G swap (helps the build on small instances)…"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> 2/6 Fetching the app into ${APP_DIR}…"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" fetch origin "${BRANCH}"
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull origin "${BRANCH}"
else
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi
cd "${APP_DIR}"

echo "==> 3/6 Configuring environment…"
if [ ! -f .env ]; then
  DOMAIN_IN="${DOMAIN:-}"
  if [ -z "${DOMAIN_IN}" ] && [ -t 0 ]; then
    read -rp "Domain to serve (e.g. k2binsurance.com): " DOMAIN_IN
  fi
  DOMAIN_IN="${DOMAIN_IN:-k2binsurance.com}"

  ACME_IN="${ACME_EMAIL:-}"
  if [ -z "${ACME_IN}" ] && [ -t 0 ]; then
    read -rp "Email for HTTPS certificates (Let's Encrypt): " ACME_IN
  fi
  ACME_IN="${ACME_IN:-admin@${DOMAIN_IN}}"

  cat > .env <<EOF
DOMAIN=${DOMAIN_IN}
ACME_EMAIL=${ACME_IN}
POSTGRES_PASSWORD=$(openssl rand -hex 24)
AUTH_SECRET=$(openssl rand -base64 48 | tr -d '\n=/+' | cut -c1-48)
ENCRYPTION_KEY=$(openssl rand -base64 32)
EOF
  chmod 600 .env
  echo "    Wrote ${APP_DIR}/.env (secrets generated)."
else
  echo "    ${APP_DIR}/.env already exists — keeping it."
  # Older installs predate field encryption — add the key if it's missing.
  if ! grep -q '^ENCRYPTION_KEY=' .env; then
    echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
    echo "    Added missing ENCRYPTION_KEY to .env."
  fi
fi

echo "==> 4/6 Building & starting the stack (first build takes a few minutes)…"
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "==> 5/6 Waiting for the app to come up (migrations run automatically)…"
# Probe with node (always present in the app image; wget/curl are not).
HEALTH_CMD='fetch("http://127.0.0.1:3000/api/health").then(r=>{if(!r.ok)throw 0}).catch(()=>process.exit(1))'
for i in $(seq 1 60); do
  if docker compose -f docker-compose.prod.yml exec -T app node -e "${HEALTH_CMD}" >/dev/null 2>&1; then
    echo "    App is healthy."
    break
  fi
  sleep 3
  [ "$i" -eq 60 ] && { echo "App did not become healthy — check: docker compose -f docker-compose.prod.yml logs app" >&2; exit 1; }
done

echo "==> 6/6 Seeding the first agent account…"
SEED_EMAIL="${SEED_AGENT_EMAIL:-}"
SEED_PASS="${SEED_AGENT_PASSWORD:-}"
SEED_NAME="${SEED_AGENT_NAME:-K2B Agent}"
if [ -z "${SEED_EMAIL}" ] && [ -t 0 ]; then
  read -rp "Agent login email [agent@k2binsurance.com]: " SEED_EMAIL
fi
SEED_EMAIL="${SEED_EMAIL:-agent@k2binsurance.com}"
if [ -z "${SEED_PASS}" ] && [ -t 0 ]; then
  read -rsp "Agent password (input hidden): " SEED_PASS; echo
fi
if [ -z "${SEED_PASS}" ]; then
  SEED_PASS="$(openssl rand -base64 12)"
  echo "    Generated agent password: ${SEED_PASS}  ← save this now"
fi
docker compose -f docker-compose.prod.yml exec -T \
  -e SEED_AGENT_EMAIL="${SEED_EMAIL}" \
  -e SEED_AGENT_PASSWORD="${SEED_PASS}" \
  -e SEED_AGENT_NAME="${SEED_NAME}" \
  app node prisma/seed.js

DOMAIN_OUT="$(grep '^DOMAIN=' .env | cut -d= -f2)"
cat <<EOF

✅ Done.

  Site:         https://${DOMAIN_OUT}   (HTTPS auto-provisions once DNS points here)
  Agent portal: https://${DOMAIN_OUT}/portal   → ${SEED_EMAIL}

Useful commands (run from ${APP_DIR}):
  docker compose -f docker-compose.prod.yml logs -f app     # app logs
  docker compose -f docker-compose.prod.yml up -d --build   # redeploy after git pull
  docker compose -f docker-compose.prod.yml exec app node prisma/seed.js   # add/update an agent

Reminder: in the Lightsail console, open ports 80 and 443 (Networking tab)
and point your domain's A records (@ and www) at the instance's static IP.
EOF
