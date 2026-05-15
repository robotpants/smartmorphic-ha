#!/usr/bin/env bash
# =============================================================================
# stamp-version.sh — write the current git short SHA + UTC timestamp
# into www/smartmorphic-loader.js as VERSION, then stage the file.
#
# Run BEFORE every commit so the loader URL changes on every push and
# browsers cache-bust automatically:
#
#   bash scripts/stamp-version.sh && git commit -m "..."
#
# Or wire as a pre-commit hook:
#
#   ln -sf ../../scripts/stamp-version.sh .git/hooks/pre-commit
#
# See HARDENING.md (Phase 1) for the rationale.
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOADER="$ROOT/www/smartmorphic-loader.js"

if [ ! -f "$LOADER" ]; then
  echo "stamp-version: $LOADER not found" >&2
  exit 1
fi

SHA="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo nogit)"
TS="$(date -u +%Y%m%d%H%M%S)"
VERSION="${SHA}-${TS}"

# Replace the VERSION constant. awk is portable across BSD/GNU.
awk -v ver="$VERSION" '
  /^const VERSION = / { print "const VERSION = \"" ver "\";"; next }
  { print }
' "$LOADER" > "${LOADER}.tmp" && mv "${LOADER}.tmp" "$LOADER"

# Stage the change so the stamped value lands in this commit.
git -C "$ROOT" add "$LOADER" 2>/dev/null || true

echo "stamped $LOADER with VERSION=$VERSION"
