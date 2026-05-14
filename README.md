# Smartmorphic for Home Assistant

A neumorphic theme for Home Assistant. Single-surface design, paired
light/dark shadows for depth, ember accent (`#e8653a`) reserved for active
states, Lucide-style stroke icons inside neumorphic wells.

Ships:

- `themes/smartmorphic.yaml` — full HA theme (light + dark) with card-mod
  CSS injection for card internals.
- `www/smartmorphic-fonts.js` — runtime loader for DM Sans, Outfit, and
  JetBrains Mono.
- `dashboards/smartmorphic-starter.yaml` — template Lovelace dashboard
  using Mushroom cards.

## Prerequisites

Install via HACS first:

- **Mushroom** (`piitaya/lovelace-mushroom`)
- **card-mod** (`thomasloven/lovelace-card-mod`)

The theme's card internals styling depends on card-mod. Mushroom is what
the starter dashboard is built on.

## Install

Clone into your HA config dir and symlink the two assets into the places
HA expects them:

```bash
cd /config
git clone https://github.com/robotpants/smartmorphic-ha
ln -sf /config/smartmorphic-ha/themes/smartmorphic.yaml /config/themes/smartmorphic.yaml
ln -sf /config/smartmorphic-ha/www/smartmorphic-fonts.js /config/www/smartmorphic-fonts.js
```

This is the recommended path — `git pull` is then the only update step.

Add to `configuration.yaml`:

```yaml
frontend:
  themes: !include_dir_merge_named themes
  extra_module_url:
    - /local/smartmorphic-fonts.js
```

Restart Home Assistant (Developer Tools → YAML → Restart, or full reboot).

## Activate

1. Profile (bottom-left avatar) → **Themes** → select **Smartmorphic**.
2. Set theme mode to **Auto** so it follows your system light/dark.

## Update

```bash
cd /config/smartmorphic-ha && git pull
```

Then Developer Tools → YAML → **Reload Themes** (no restart needed for
theme-only changes; restart if `smartmorphic-fonts.js` changed).

## Troubleshooting

- **Theme doesn't appear in the picker.** Confirm
  `/config/themes/smartmorphic.yaml` resolves (`ls -lL /config/themes/`).
  Reload themes from Developer Tools → YAML.
- **Fonts fall back to system default.** Hard-refresh the browser
  (Cmd-Shift-R / Ctrl-Shift-R). Check the network tab for the Google
  Fonts CSS request. If you're offline or block Google Fonts, see
  *Self-hosted fonts* below.
- **Card internals look unstyled (no rounded wells, no shadows on tile
  icons).** card-mod isn't loaded. Verify it's installed via HACS and
  appears in `extra_module_url` (HACS adds this automatically, but check
  if you customized).
- **Mushroom cards look stale after a theme update.** Mushroom caches its
  CSS variables. Reload the dashboard tab; if that fails, restart HA.

### Self-hosted fonts

The repo bundles variable-font TTFs for DM Sans and JetBrains Mono in
`www/fonts/`, plus a drop-in loader (`smartmorphic-fonts-local.js`) that
serves them from `/local/fonts/` instead of the Google CDN. Use it when
you want to avoid third-party requests or run HA offline.

Swap the symlinks:

```bash
ln -sf /config/smartmorphic-ha/www/fonts /config/www/fonts
ln -sfn /config/smartmorphic-ha/www/smartmorphic-fonts-local.js /config/www/smartmorphic-fonts.js
```

The `configuration.yaml` `extra_module_url` entry stays the same. Restart
HA after the swap.

Outfit (display font) isn't bundled. If you use it, either stick with the
Google CDN loader or add Outfit TTFs to `www/fonts/` and extend the
`@font-face` block in `smartmorphic-fonts-local.js`.

## File layout

```
smartmorphic-ha/
├── CLAUDE.md
├── README.md
├── TODO.md
├── themes/
│   └── smartmorphic.yaml
├── www/
│   ├── smartmorphic-fonts.js
│   ├── smartmorphic-fonts-local.js
│   └── fonts/
│       ├── DMSans-VariableFont_opsz_wght.ttf
│       ├── DMSans-Italic-VariableFont_opsz_wght.ttf
│       ├── JetBrainsMono-VariableFont_wght.ttf
│       └── JetBrainsMono-Italic-VariableFont_wght.ttf
└── dashboards/
    └── smartmorphic-starter.yaml
```

## Phase 2

Custom Lovelace cards (Lit web components) for room card, light card,
scene chip, status pill, plus a redesigned more-info dialog and Energy
dashboard restyle. They'll consume the `--smartmorphic-*` CSS variables
already exposed by the theme. See `TODO.md`.
