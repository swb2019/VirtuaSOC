#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/VirtuaSOC}"
NAMESPACE="${NAMESPACE:-virtuasoc}"
RELEASE="${RELEASE:-virtuasoc}"
VALUES_FILE="${VALUES_FILE:-infra/gcp/values.k3s.yaml}"

# Expected factory image tag (full git SHA). If set, we'll wait for it and pin the helm deploy to it.
SHA_EXPECTED="${SHA_EXPECTED:-}"

KUBECTL="sudo /usr/local/bin/k3s kubectl"
CRICTL="sudo /usr/local/bin/k3s crictl"

echo "[1/7] Sync repo on VM"
cd "$REPO_DIR"
git pull --ff-only

echo "[2/7] Ensure cert-manager certificate includes factory host (HTTP-01)"
$KUBECTL apply -f infra/k8s/cert-manager/http01/clusterissuer-letsencrypt-http01.yaml >/dev/null 2>&1 || true
$KUBECTL apply -f infra/k8s/cert-manager/http01/certificate-app-virtuasoc.yaml >/dev/null

echo "[3/7] Ensure NextAuth env vars exist in k8s Secret (no values printed)"
NEXTAUTH_URL="https://factory.app.virtuasoc.com"
existing_nextauth_secret="$($KUBECTL -n "$NAMESPACE" get secret virtuasoc-secrets -o jsonpath='{.data.NEXTAUTH_SECRET}' 2>/dev/null || true)"
if [[ -z "$existing_nextauth_secret" ]]; then
  NEXTAUTH_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
  NEXTAUTH_URL_B64="$(printf '%s' "$NEXTAUTH_URL" | base64 -w0)"
  NEXTAUTH_SECRET_B64="$(printf '%s' "$NEXTAUTH_SECRET" | base64 -w0)"
  PATCH="$(printf '{\"data\":{\"NEXTAUTH_URL\":\"%s\",\"NEXTAUTH_SECRET\":\"%s\"}}' "$NEXTAUTH_URL_B64" "$NEXTAUTH_SECRET_B64")"
  $KUBECTL -n "$NAMESPACE" patch secret virtuasoc-secrets --type merge -p "$PATCH" >/dev/null
  echo "  - Added NEXTAUTH_URL + NEXTAUTH_SECRET to virtuasoc-secrets"
else
  echo "  - NEXTAUTH_SECRET already present; leaving as-is"
fi

if [[ -n "$SHA_EXPECTED" ]]; then
  echo "[4/7] Wait for factory image tag to be pullable: $SHA_EXPECTED"
  FACTORY_IMAGE="ghcr.io/swb2019/virtuasoc-factory:${SHA_EXPECTED}"
  for i in $(seq 1 90); do
    if $CRICTL pull "$FACTORY_IMAGE" >/dev/null 2>&1; then
      echo "  - Factory image is pullable"
      break
    fi
    if [[ "$i" -eq 90 ]]; then
      echo "ERROR: Factory image still not pullable after waiting. Check GitHub Actions + GHCR visibility."
      exit 1
    fi
    sleep 10
  done
else
  echo "[4/7] No SHA_EXPECTED provided; skipping image wait/pin"
fi

echo "[5/7] Helm upgrade"
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
HELM_ARGS=(upgrade --install "$RELEASE" infra/k8s/helm/virtuasoc --namespace "$NAMESPACE" -f "$VALUES_FILE")
if [[ -n "$SHA_EXPECTED" ]]; then
  HELM_ARGS+=(--set "image.factory.tag=${SHA_EXPECTED}")
fi
helm "${HELM_ARGS[@]}"

echo "[6/7] Wait for rollouts"
$KUBECTL -n "$NAMESPACE" rollout status deployment/virtuasoc-api --timeout=180s
$KUBECTL -n "$NAMESPACE" rollout status deployment/virtuasoc-web --timeout=180s
$KUBECTL -n "$NAMESPACE" rollout status deployment/virtuasoc-worker --timeout=180s
$KUBECTL -n "$NAMESPACE" rollout status deployment/virtuasoc-factory --timeout=300s

echo "[7/7] Quick health checks"
echo "Ingress:"
$KUBECTL -n "$NAMESPACE" get ingress -o wide
echo "Certificates:"
$KUBECTL -n "$NAMESPACE" get certificate -o wide || true

# Smoke test from the VM (DNS must already resolve).
if command -v curl >/dev/null 2>&1; then
  code="$(curl -s -o /dev/null -w '%{http_code}' https://factory.app.virtuasoc.com/ || true)"
  echo "factory.app.virtuasoc.com => HTTP ${code}"
else
  echo "curl not present; skipping HTTP smoke test"
fi


