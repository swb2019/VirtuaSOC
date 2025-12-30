#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y ca-certificates curl git

# Install k3s (disable traefik; we use ingress-nginx)
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -

# Make kubeconfig readable (handy for non-root helm/kubectl)
chmod 644 /etc/rancher/k3s/k3s.yaml

# Install helm
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# kubectl is provided by k3s
ln -sf /usr/local/bin/k3s /usr/local/bin/kubectl

echo "k3s + helm installed"


