#!/usr/bin/env bash
# =============================================================================
# sync-www.sh — copy every www/*.js into /config/www/ as a plain file.
#
# HA OS's /local/ mount does not reliably serve symlinks for resources
# created after the supervisor's initial scan (see HARDENING.md Phase 1
# postmortem). We use plain file copies instead.
#
# Run manually after `git pull`, or wire as a git post-merge hook so it
# runs automatically (see README install section):
#
#   git config core.hooksPath .githooks
#
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/www"
DST="/config/www"

if [ ! -d "$DST" ]; then
  echo "sync-www: $DST not found (are you on a Home Assistant host?)" >&2
  exit 1
fi

count=0
for f in "$SRC"/*.js; do
  cp -f "$f" "$DST/$(basename "$f")"
  count=$((count + 1))
done

echo "sync-www: copied $count JS files into $DST"
