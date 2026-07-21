#!/usr/bin/env bash
# One-time server bootstrap. Run as root or with sudo on a fresh VPS.
# After this, only infra/ lives on the server — no application source code.
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/chid/infra}"

echo "==> Installing Docker (if missing)..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin not found" >&2
  exit 1
fi

echo "==> Creating deploy user: ${DEPLOY_USER}"
if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "${DEPLOY_USER}"
  usermod -aG docker "${DEPLOY_USER}"
fi

echo "==> Creating infra directory: ${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}/nginx" "${DEPLOY_DIR}/certs" "${DEPLOY_DIR}/scripts"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$(dirname "${DEPLOY_DIR}")"

cat <<EOF

Bootstrap complete.

Next steps (as ${DEPLOY_USER}):
  1. Copy infra/ contents to ${DEPLOY_DIR} (CI does this automatically on deploy)
  2. cp ${DEPLOY_DIR}/.env.example ${DEPLOY_DIR}/.env  && edit secrets
  3. Put TLS certs in ${DEPLOY_DIR}/certs/ (fullchain.pem, privkey.pem)
  4. Add GitHub Actions secrets: DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_PATH=${DEPLOY_DIR}
  5. Add GHCR_USER + GHCR_TOKEN (PAT with read:packages) for docker pull on server
  6. First deploy: IMAGE_TAG=latest ./scripts/deploy.sh  (or push to main with AUTO_DEPLOY=true)

Server will only need:
  ${DEPLOY_DIR}/
  ├── docker-compose.prod.yml
  ├── nginx/
  ├── certs/
  ├── scripts/
  └── .env          ← secrets, never in git

EOF
