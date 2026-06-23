#!/usr/bin/env bash
# Build TokenTracker for macOS (arm64 or x64)
set -e

export PATH="$HOME/.cargo/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/token-tracker"

TARGET="${1:-aarch64-apple-darwin}"

echo "==> Building TokenTracker for $TARGET ..."
cd "$APP_DIR"

npm ci --silent

npm run tauri build -- --target "$TARGET"

echo ""
echo "==> Build complete!"
find "$APP_DIR/src-tauri/target/$TARGET/release/bundle" \
  \( -name "*.dmg" -o -name "*.app" \) \
  -maxdepth 3 2>/dev/null | while read -r f; do
  size=$(du -sh "$f" | cut -f1)
  echo "    [$size]  $f"
done
