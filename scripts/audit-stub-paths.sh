#!/usr/bin/env bash
# =============================================================================
# audit-stub-paths.sh — flag any card whose setConfig() throws.
#
# Per CLAUDE.md / HARDENING.md Phase 4: setConfig must never throw on the
# output of getStubConfig(). Throws break the card-picker preview
# (eternal spinner), and any throw in setConfig is a stricter-than-needed
# validation that should be a defensive default instead.
#
# Exits 1 on any violation. Run before commits that touch setConfig, or
# wire into a pre-commit hook alongside stamp-version.sh.
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

violations=()

for f in www/smartmorphic-*.js; do
  base="$(basename "$f")"
  case "$base" in
    smartmorphic-fonts*.js|smartmorphic-loader.js) continue ;;
  esac

  # Walk the setConfig body brace-by-brace; flag if a 'throw' appears
  # inside it. Heuristic but matches our card style (2-space indent,
  # signature on its own line).
  if awk '
    /^  setConfig\(/ { in_set = 1; depth = 0 }
    in_set {
      # Strip comments from the line before scanning for throws.
      stripped = $0
      sub(/[[:space:]]*\/\/.*/, "", stripped)
      for (i = 1; i <= length($0); i++) {
        c = substr($0, i, 1)
        if (c == "{") depth++
        else if (c == "}") { depth--; if (depth == 0 && in_set) { in_set = 0; exit found ? 0 : 1 } }
      }
      if (stripped ~ /throw[[:space:]]+new[[:space:]]+Error/) found = 1
    }
    END { exit found ? 0 : 1 }
  ' "$f"; then
    violations+=("$base")
  fi
done

if [ ${#violations[@]} -gt 0 ]; then
  echo "audit-stub-paths: setConfig() THROWS detected:" >&2
  for v in "${violations[@]}"; do
    echo "  - $v" >&2
  done
  echo "Picker previews for these cards will hang. Replace throws with defaults." >&2
  exit 1
fi

echo "audit-stub-paths: clean — no setConfig() throws"
