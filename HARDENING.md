# Smartmorphic — Card-loading Hardening Plan

Before any new cards or style work lands, the loading pipeline gets bulletproofed. The pattern — `git pull` → refresh → spinners or stale description — happens on every iteration and burns time.

## Status

- [x] **Phase 1 — Cache-bust on every commit.** `www/smartmorphic-loader.js` is the only `extra_module_url` entry; `scripts/stamp-version.sh` rewrites a `<sha>-<timestamp>` VERSION on every commit and stages the file. Loader dynamically imports each card with `?v=<version>`, so every commit shifts the URL and the browser cache can't lie. CLAUDE.md now requires running the stamp script before every commit that touches `www/`.
- [ ] Phase 2 — Diagnostics card
- [ ] Phase 3 — MutationObserver-based registry recovery
- [ ] Phase 4 — Stub-path audit
- [ ] Phase 5 — Mobile refresh button

## Recurring failure modes

1. **Stale JS from browser cache.** HA's `extra_module_url` files are immutable URLs. Bumping the `console.info` banner doesn't change the URL, so the browser keeps serving cached bytes. iOS Safari and the HA Companion webview are the worst.
2. **Polyfill registry swap.** Mushroom's `scoped-custom-element-registry` replaces `window.customElements` *after* our cards register. Our pre-existing definitions are orphaned. The polling helper in each card was supposed to handle this, but cards still spin in the picker when the swap happens after the poll window expires.
3. **No load visibility.** "Did v0.6.0 actually load?" is answered only by digging into the dev console. Painful on mobile.
4. **No verification step.** `git pull` succeeds but whether the frontend picked up the new code is an open question every single time.
5. **Race conditions across `extra_module_url` entries.** Each card file is loaded independently with no defined order. Helper duplicated in every file.

## Goal

After hardening:

- A `git pull` + force-quit of the HA Companion app **always** loads the latest code.
- A diagnostic card on the dashboard shows, in plain text, which card versions are live and whether the registry is healthy.
- The polyfill swap stops mattering — registration recovers under any timing.
- Cache-busting is automatic on every commit; no manual `?v=` bumps.

## Phases (in order — Phase 1 first)

### Phase 1 — Cache-bust on every commit

**Fix:** introduce `www/smartmorphic-loader.js` as the **only** entry in `frontend.extra_module_url`. The loader dynamically imports every card file with a `?v=<git-short-sha>` query string baked into the loader at commit time.

- New `scripts/stamp-version.sh` reads `git rev-parse --short HEAD` and writes it into `smartmorphic-loader.js` as `const VERSION = '...';`.
- Run the script as part of the commit workflow (or wire it as a `pre-commit` git hook later).
- User's `configuration.yaml` collapses to:
  ```yaml
  frontend:
    extra_module_url:
      - /local/smartmorphic-loader.js
  ```
- Loader file itself is short (~30 lines), changes on every commit, so HA's resource manager always re-downloads it. The loader then imports every child file with a per-commit query string. Children get fresh bytes too.

**Result:** every commit invalidates the cache automatically. No more "did Safari pick it up?"

### Phase 2 — Diagnostics card

**Fix:** a `smartmorphic-diagnostics-card` that prints on the dashboard:

```
Loader v=ab12cd3 (loaded 5m ago)
Cards:
  ✓ smartmorphic-light-card   v0.6.0
  ✓ smartmorphic-room-card    v0.4.3
  ✗ smartmorphic-climate-tile (NOT REGISTERED)
  ...
Registry: polyfilled (scoped-custom-element-registry detected)
```

Each card publishes its version into `window.smartmorphic.versions[tag]` instead of (or alongside) the console banner. The diagnostics card reads that map plus `customElements.get(tag)` health for each registered tag. Green when all healthy, red when not.

Drop one of these on the home dashboard. "Did the new code load?" becomes a glance.

### Phase 3 — Polyfill-proof registration

**Fix:** replace the 30-second poll in `smartmorphicDefineCard` with a `MutationObserver` that watches for any `<smartmorphic-*>` element that fails to upgrade. When one appears, the helper re-defines the missing class in whatever `customElements` is current and forces upgrade. Keep a 5-second poll as belt-and-braces.

Why MO beats polling: polling stops after 30s, but the picker can be opened minutes after page load, well after Mushroom's polyfill swap. MO sits at zero CPU until an unupgraded `<smartmorphic-*>` shows up — then fires instantly.

Also move the helper into the loader so there's one canonical copy, not one inlined into every card.

### Phase 4 — Stub-path audit

**Fix:** sweep every card and verify:

- `static getStubConfig(hass)` returns a self-consistent config (entity = `""` is OK), never undefined, never throws.
- `setConfig(config)` accepts the stub output without throwing. Missing optional fields are treated as defaults, not errors. `config.entity === ""` is a valid state, not an error.
- First render with an empty entity shows a "no entity selected" placeholder, not a thrown error or infinite spinner.

Add `scripts/audit-stub-paths.sh` that greps for `throw new Error` inside `setConfig` and flags ones without an empty-entity guard.

### Phase 5 — Mobile refresh button (optional polish)

**Fix:** a Lovelace button calling a Python-script service that:
1. Touches a sentinel file under `/config/www/`.
2. Bumps the version query in `configuration.yaml`'s `extra_module_url` (or re-runs `stamp-version.sh` if the script is on the Pi).
3. Calls `frontend.reload_themes` and sends a notification.

If Phase 1 lands cleanly, this is mostly redundant — leaving as a nice-to-have.

## Order of operations

1. Phase 1 — biggest single win. ~1–2 hours.
2. Phase 2 — depends on Phase 1's `window.smartmorphic` namespace. ~1 hour.
3. Phase 3 — replace helper. ~30 min.
4. Phase 4 — sweep + script. ~30 min.
5. Phase 5 — optional.

## Out of scope (intentionally)

- Service workers (HA doesn't ship one for frontend assets).
- HACS packaging — separate concern on the existing TODO.
- Card-by-card style fixes (the original task) — resumes after Phase 2 lands at minimum.
