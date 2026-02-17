#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/azure/update-backend-containerapp.sh [--env-file FILE] [--image-tag TAG]

Description:
  Builds/pushes the backend image to ACR, then updates an existing Azure Container App
  with image + environment values for PrimeCal production.

Required environment variables:
  AZ_RESOURCE_GROUP
  AZ_CONTAINERAPP_NAME
  AZ_ACR_NAME
  FRONTEND_URL
  BACKEND_URL
  DB_HOST
  DB_PORT
  DB_USERNAME
  DB_PASSWORD
  DB_NAME
  JWT_SECRET

Optional environment variables:
  AZ_SUBSCRIPTION_ID
  AZ_ACR_IMAGE_REPO                (default: cal3-backend)
  IMAGE_TAG                        (default: utc timestamp)
  NODE_ENV                         (default: production)
  BACKEND_PORT                     (default: 8081)
  PORT                             (default: BACKEND_PORT)
  FRONTEND_PORT                    (default: 443)
  FRONTEND_HOST_PORT               (default: FRONTEND_PORT)
  BACKEND_HOST_PORT                (default: 443)
  BASE_URL                         (default: BACKEND_URL)
  API_URL                          (default: BACKEND_URL)
  SECURITY_ALLOWED_ORIGINS         (default: FRONTEND_URL)
  DB_SSL                           (default: false)
  DB_SSL_REJECT_UNAUTHORIZED       (default: false)
  DB_CONNECTION_TIMEOUT            (default: 60000)
  DB_IDLE_TIMEOUT                  (default: 60000)
  WAIT_FOR_DB                      (default: true)
  WAIT_FOR_DB_MAX_ATTEMPTS         (default: 60)
  WAIT_FOR_DB_INTERVAL             (default: 2)

Examples:
  ./scripts/azure/update-backend-containerapp.sh --env-file docker/.env.azure.backend
  ./scripts/azure/update-backend-containerapp.sh --env-file docker/.env.azure.backend --image-tag v1.2.10
EOF
}

ENV_FILE=""
IMAGE_TAG_ARG=""

while (($#)); do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --image-tag)
      IMAGE_TAG_ARG="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Environment file not found: $ENV_FILE" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -n "$IMAGE_TAG_ARG" ]]; then
  export IMAGE_TAG="$IMAGE_TAG_ARG"
fi

required_vars=(
  AZ_RESOURCE_GROUP
  AZ_CONTAINERAPP_NAME
  AZ_ACR_NAME
  FRONTEND_URL
  BACKEND_URL
  DB_HOST
  DB_PORT
  DB_USERNAME
  DB_PASSWORD
  DB_NAME
  JWT_SECRET
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required variable: $var_name" >&2
    exit 1
  fi
done

AZ_ACR_IMAGE_REPO="${AZ_ACR_IMAGE_REPO:-cal3-backend}"
IMAGE_TAG="${IMAGE_TAG:-$(date -u +%Y%m%d%H%M%S)}"
NODE_ENV="${NODE_ENV:-production}"
BACKEND_PORT="${BACKEND_PORT:-8081}"
PORT="${PORT:-$BACKEND_PORT}"
FRONTEND_PORT="${FRONTEND_PORT:-443}"
FRONTEND_HOST_PORT="${FRONTEND_HOST_PORT:-$FRONTEND_PORT}"
BACKEND_HOST_PORT="${BACKEND_HOST_PORT:-443}"
BASE_URL="${BASE_URL:-$BACKEND_URL}"
API_URL="${API_URL:-$BACKEND_URL}"
SECURITY_ALLOWED_ORIGINS="${SECURITY_ALLOWED_ORIGINS:-$FRONTEND_URL}"
DB_SSL="${DB_SSL:-false}"
DB_SSL_REJECT_UNAUTHORIZED="${DB_SSL_REJECT_UNAUTHORIZED:-false}"
DB_CONNECTION_TIMEOUT="${DB_CONNECTION_TIMEOUT:-60000}"
DB_IDLE_TIMEOUT="${DB_IDLE_TIMEOUT:-60000}"
WAIT_FOR_DB="${WAIT_FOR_DB:-true}"
WAIT_FOR_DB_MAX_ATTEMPTS="${WAIT_FOR_DB_MAX_ATTEMPTS:-60}"
WAIT_FOR_DB_INTERVAL="${WAIT_FOR_DB_INTERVAL:-2}"

echo "[azure-deploy] Checking Azure CLI login..."
az account show >/dev/null

if [[ -n "${AZ_SUBSCRIPTION_ID:-}" ]]; then
  echo "[azure-deploy] Selecting subscription: ${AZ_SUBSCRIPTION_ID}"
  az account set --subscription "$AZ_SUBSCRIPTION_ID"
fi

echo "[azure-deploy] Ensuring containerapp extension..."
az extension add --name containerapp --upgrade --only-show-errors >/dev/null

echo "[azure-deploy] Building backend image in ACR..."
az acr build \
  --registry "$AZ_ACR_NAME" \
  --image "${AZ_ACR_IMAGE_REPO}:${IMAGE_TAG}" \
  --file docker/backend/Dockerfile \
  . \
  --only-show-errors

ACR_LOGIN_SERVER="$(az acr show --name "$AZ_ACR_NAME" --query loginServer -o tsv)"
IMAGE_REF="${ACR_LOGIN_SERVER}/${AZ_ACR_IMAGE_REPO}:${IMAGE_TAG}"

echo "[azure-deploy] Upserting container app secrets..."
az containerapp secret set \
  --resource-group "$AZ_RESOURCE_GROUP" \
  --name "$AZ_CONTAINERAPP_NAME" \
  --secrets db-password="$DB_PASSWORD" jwt-secret="$JWT_SECRET" \
  --only-show-errors >/dev/null

echo "[azure-deploy] Updating container app image and env..."
az containerapp update \
  --resource-group "$AZ_RESOURCE_GROUP" \
  --name "$AZ_CONTAINERAPP_NAME" \
  --image "$IMAGE_REF" \
  --set-env-vars \
    NODE_ENV="$NODE_ENV" \
    PORT="$PORT" \
    BACKEND_PORT="$BACKEND_PORT" \
    FRONTEND_PORT="$FRONTEND_PORT" \
    FRONTEND_HOST_PORT="$FRONTEND_HOST_PORT" \
    BACKEND_HOST_PORT="$BACKEND_HOST_PORT" \
    BASE_URL="$BASE_URL" \
    FRONTEND_URL="$FRONTEND_URL" \
    BACKEND_URL="$BACKEND_URL" \
    API_URL="$API_URL" \
    SECURITY_ALLOWED_ORIGINS="$SECURITY_ALLOWED_ORIGINS" \
    DB_HOST="$DB_HOST" \
    DB_PORT="$DB_PORT" \
    DB_USERNAME="$DB_USERNAME" \
    DB_PASSWORD="secretref:db-password" \
    DB_NAME="$DB_NAME" \
    DB_SSL="$DB_SSL" \
    DB_SSL_REJECT_UNAUTHORIZED="$DB_SSL_REJECT_UNAUTHORIZED" \
    DB_CONNECTION_TIMEOUT="$DB_CONNECTION_TIMEOUT" \
    DB_IDLE_TIMEOUT="$DB_IDLE_TIMEOUT" \
    WAIT_FOR_DB="$WAIT_FOR_DB" \
    WAIT_FOR_DB_MAX_ATTEMPTS="$WAIT_FOR_DB_MAX_ATTEMPTS" \
    WAIT_FOR_DB_INTERVAL="$WAIT_FOR_DB_INTERVAL" \
    JWT_SECRET="secretref:jwt-secret" \
  --only-show-errors >/dev/null

echo "[azure-deploy] Ensuring external ingress on target port ${BACKEND_PORT}..."
az containerapp ingress enable \
  --resource-group "$AZ_RESOURCE_GROUP" \
  --name "$AZ_CONTAINERAPP_NAME" \
  --type external \
  --target-port "$BACKEND_PORT" \
  --only-show-errors >/dev/null

FQDN="$(az containerapp show --resource-group "$AZ_RESOURCE_GROUP" --name "$AZ_CONTAINERAPP_NAME" --query properties.configuration.ingress.fqdn -o tsv)"
echo "[azure-deploy] Backend deployment complete."
echo "[azure-deploy] Image: ${IMAGE_REF}"
echo "[azure-deploy] Container App FQDN: ${FQDN}"
