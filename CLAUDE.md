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
- **Every new custom card MUST ship with a functional visual editor.** Implement `static getConfigElement()` returning a custom element. The editor must cover every config field the card actually supports — wrap `<ha-form>` with a schema for the simple parts, build inline DOM widgets for anything `<ha-form>` can't express (variable-key dicts, repeating rows, conditional sections). Falling back to "edit YAML for this part" doesn't count as supported.

## Visual style direction

The dashboard mockups (climate, automations, mobile companion) are being refined in Claude Design. The shipped theme + cards are close in structure but **still off in color, type weight, and proportion vs. the reference**. When the user provides exported example files (CSS, design tokens, screenshots), align the theme + custom cards to match. Until then, do not invent new colors — stick to the tokens defined in `themes/smartmorphic.yaml`.

## Style guide branch

The `style-guide` branch holds the Claude Design export (`design_handoff_smartmorphic_theme/` directory: tokens, components, starter theme, prototype HTML/JSX, screenshots). It is the **source of truth** for visual style going forward.

Rules:

- **Never merge `style-guide` into `main`.** It is reference material, not buildable code.
- **Treat the branch as read-only** unless the user explicitly asks you to update it.
- **Pull values FROM it INTO main** only during a style-alignment pass that the user has approved (e.g., "do the alignment", "apply the design export"). Read the relevant file(s) from `origin/style-guide` via `git show` or `git ls-tree`; do not check out the branch into the working tree.
- During an alignment pass, the export's `tokens.md` and `starter-theme.yaml` outrank anything currently in `themes/smartmorphic.yaml` — when values diverge, the export wins.
