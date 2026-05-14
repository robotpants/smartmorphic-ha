## Workflow

- Commit directly to `main`. Do not create feature branches or pull requests.
- Push straight to `origin main` after each commit.

## What this repo is

Smartmorphic design system applied to Home Assistant. Three deliverables:

1. `themes/smartmorphic.yaml` — HA theme YAML (light + dark) with full token coverage plus card-mod CSS injection for card internals.
2. `www/smartmorphic-fonts.js` — runtime font loader (DM Sans / Outfit / JetBrains Mono via Google Fonts), referenced by HA's `extra_module_url`.
3. `dashboards/smartmorphic-starter.yaml` — template Lovelace dashboard showcasing the theme via Mushroom cards.

User runs HA OS on a Raspberry Pi. The repo is cloned to `/config/smartmorphic-ha` and the two assets are symlinked into `/config/themes/` and `/config/www/` so `git pull` is the only update step.

## Phase 2 plan

Custom Lovelace cards (Lit web components) for room card, light card, scene chip, status pill. They'll consume the `--smartmorphic-*` CSS variables defined in the theme.

## Custom card rules

When building or editing custom Lovelace cards in `www/`:

- **`setConfig` must never throw on the output of `getStubConfig()`.** The Lovelace card picker calls `getStubConfig()` then immediately instantiates the card with that config; an exception leaves the picker spinning forever. Stubs should be self-consistent and `setConfig` should treat missing optional fields as empty/defaults, not errors.
- **CSS fallbacks must survive the editor preview's missing theme.** The card-picker modal does not inherit the dashboard theme, so any `var(--smartmorphic-*, fallback)` fallback gets used as-is. Pick fallback shadow/color values that look acceptable on both light and dark backgrounds (mostly: low-opacity blacks + very low-opacity whites, not the high-opacity whites the theme actually uses in light mode).
- **Bump the `console.info` version banner on every functional change** so it's obvious when a browser is serving a stale cached copy.
