#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/infrastructure/terraform"

echo "Validating Terraform formatting..."
terraform fmt -check -recursive

echo "Initializing Terraform (local backend)..."
terraform init -backend=false

echo "Validating Terraform configuration..."
terraform validate

echo "Infrastructure validation passed."
