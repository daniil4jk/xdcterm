#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(realpath "$(dirname "$0")")"
REPO_DIR="$SCRIPT_DIR"

echo "=== Frontend: npm install + build ==="
cd "$REPO_DIR/frontend"
npm install
npm run build

echo "=== Backend: uv sync ==="
cd "$REPO_DIR/backend"
uv sync

echo "=== Done ==="
