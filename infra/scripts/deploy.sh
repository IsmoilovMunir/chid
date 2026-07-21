#!/usr/bin/env bash
# Run on the server from infra/ directory.
# Pulls GHCR images and restarts the stack. Does not build anything.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${INFRA_DIR}"

PROFILE="${DEPLOY_PROFILE:-tls}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Copy .env.example to .env and fill secrets." >&2
  exit 1
fi

if [[ -z "${IMAGE_TAG:-}" ]]; then
  echo "ERROR: IMAGE_TAG is required (e.g. export IMAGE_TAG=abc123def456)" >&2
  exit 1
fi

# Persist image tag for restarts without re-exporting
if grep -q '^IMAGE_TAG=' "${ENV_FILE}"; then
  sed -i.bak "s/^IMAGE_TAG=.*/IMAGE_TAG=${IMAGE_TAG}/" "${ENV_FILE}" && rm -f "${ENV_FILE}.bak"
else
  echo "IMAGE_TAG=${IMAGE_TAG}" >> "${ENV_FILE}"
fi

export IMAGE_TAG

echo "==> Deploying CHID (profile=${PROFILE}, IMAGE_TAG=${IMAGE_TAG})"

if [[ -n "${GHCR_TOKEN:-}" && -n "${GHCR_USER:-}" ]]; then
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
fi

docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" --profile "${PROFILE}" pull backend frontend crm
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" --profile "${PROFILE}" up -d --remove-orphans

docker image prune -f

echo "==> Done. Running containers:"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" --profile "${PROFILE}" ps
