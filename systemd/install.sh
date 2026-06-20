#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(realpath "$(dirname "$0")")"
REPO_DIR="$(realpath "$SCRIPT_DIR/..")"

if ! command -v uv &>/dev/null; then
    echo "Error: uv not found in PATH" >&2
    exit 1
fi
UV_BIN="$(command -v uv)"

SERVICE_NAME="xdcterm.service"
EXAMPLE="$SCRIPT_DIR/$SERVICE_NAME.example"
TARGET="$HOME/.config/systemd/user/$SERVICE_NAME"

if [ ! -f "$EXAMPLE" ]; then
    echo "Error: $EXAMPLE not found" >&2
    exit 1
fi

mkdir -p "$(dirname "$TARGET")"

sed \
    -e "s|__WORKDIR__|$REPO_DIR|g" \
    -e "s|__UV_BIN__|$UV_BIN|g" \
    "$EXAMPLE" > "$TARGET"

sudo loginctl enable-linger "$USER" 2>/dev/null || true

systemctl --user daemon-reload
systemctl --user enable --now xdcterm

echo "Installed systemd user service: $TARGET"
