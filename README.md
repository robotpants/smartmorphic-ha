# Smartmorphic for Home Assistant

A neumorphic theme for Home Assistant. Single-surface design, paired
light/dark shadows for depth, ember accent (`#e8653a`) reserved for active
states, Lucide-style stroke icons inside neumorphic wells.

Ships:

- `themes/smartmorphic.yaml` — full HA theme (light + dark) with card-mod
  CSS injection for card internals.
- `www/smartmorphic-fonts.js` — runtime loader for DM Sans, Outfit, and
  JetBrains Mono.
- `www/smartmorphic-room-card.js` — custom card: neumorphic room tile.
- `www/smartmorphic-light-card.js` — custom card: light tile, tap toggles,
  hold expands to brightness + color-temp sliders.
- `www/smartmorphic-status-pill.js` — custom card: semantic status chip.
- `dashboards/smartmorphic-starter.yaml` — template Lovelace dashboard
  using the Smartmorphic cards.

## Prerequisites

Install via HACS first:

- **Mushroom** (`piitaya/lovelace-mushroom`)
- **card-mod** (`thomasloven/lovelace-card-mod`)

The theme's card internals styling depends on card-mod. Mushroom is what
the starter dashboard is built on.

## Install

HA OS does not reliably serve symlinks under `/local/` for resources
created after its initial scan, so card JS lives as plain file copies in
`/config/www/`. `scripts/sync-www.sh` does the copy and the bundled
`post-merge` git hook re-runs it after every `git pull`.

```bash
cd /config
git clone https://github.com/robotpants/smartmorphic-ha
ln -sf /config/smartmorphic-ha/themes/smartmorphic.yaml /config/themes/smartmorphic.yaml
ln -sf /config/smartmorphic-ha/www/fonts /config/www/fonts
cd /config/smartmorphic-ha
git config core.hooksPath .githooks   # auto-sync on every git pull
bash scripts/sync-www.sh              # initial copy
```

Add to `configuration.yaml`:

```yaml
frontend:
  themes: !include_dir_merge_named themes
  extra_module_url:
    - /local/smartmorphic-loader.js
```

The loader is the single entry point. It dynamically imports every card
with a `?v=<sha>-<timestamp>` query string baked in by
`scripts/stamp-version.sh` on every commit, so each `git pull` guarantees
fresh bytes — no more browser-cache ghosts of old code. See `HARDENING.md`
for the design.

Restart Home Assistant (Developer Tools → YAML → Restart, or full reboot).

## Activate

1. Profile (bottom-left avatar) → **Themes** → select **Smartmorphic**.
2. Set theme mode to **Auto** so it follows your system light/dark.

## Update

```bash
cd /config/smartmorphic-ha && git pull
```

Then Developer Tools → YAML → **Reload Themes** (no restart needed for
theme-only changes; restart if any `www/*.js` files changed).

## Troubleshooting

- **Theme doesn't appear in the picker.** Confirm
  `/config/themes/smartmorphic.yaml` resolves (`ls -lL /config/themes/`).
  Reload themes from Developer Tools → YAML.
- **Custom cards 404 in browser console, even though the symlinks resolve.**
  HA OS occasionally refuses to serve symlinked files under `/local`.
  Replace the symlinks with copies:

  ```bash
  rm -f /config/www/smartmorphic-*.js
  cp /config/smartmorphic-ha/www/smartmorphic-fonts.js /config/www/
  cp /config/smartmorphic-ha/www/smartmorphic-room-card.js /config/www/
  cp /config/smartmorphic-ha/www/smartmorphic-light-card.js /config/www/
  cp /config/smartmorphic-ha/www/smartmorphic-status-pill.js /config/www/
  ```

  Tradeoff: re-run the `cp` after every `git pull`.
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

Symlink the font directory:

```bash
ln -sf /config/smartmorphic-ha/www/fonts /config/www/fonts
```

Then edit `www/smartmorphic-loader.js` and swap `"smartmorphic-fonts"`
for `"smartmorphic-fonts-local"` in the `FILES` array. Restart HA.

Outfit (display font) isn't bundled. If you use it, either stick with the
Google CDN loader or add Outfit TTFs to `www/fonts/` and extend the
`@font-face` block in `smartmorphic-fonts-local.js`.

## File layout

```
smartmorphic-ha/
├── CLAUDE.md
├── README.md
├── TODO.md
├── HARDENING.md
├── themes/
│   └── smartmorphic.yaml
├── www/
│   ├── smartmorphic-loader.js        ← single extra_module_url entry
│   ├── smartmorphic-fonts.js
│   ├── smartmorphic-fonts-local.js
│   ├── smartmorphic-room-card.js
│   ├── smartmorphic-light-card.js
│   ├── smartmorphic-tile-card.js
│   ├── smartmorphic-sensor-tile.js
│   ├── smartmorphic-climate-tile.js
│   ├── smartmorphic-automation-row.js
│   ├── smartmorphic-scene-chip.js
│   ├── smartmorphic-status-pill.js
│   └── fonts/
│       ├── DMSans-VariableFont_opsz_wght.ttf
│       ├── DMSans-Italic-VariableFont_opsz_wght.ttf
│       ├── JetBrainsMono-VariableFont_wght.ttf
│       └── JetBrainsMono-Italic-VariableFont_wght.ttf
├── scripts/
│   ├── stamp-version.sh              ← run before each commit
│   └── sync-www.sh                   ← copy www/*.js into /config/www/
├── .githooks/
│   └── post-merge                    ← auto-runs sync-www.sh after git pull
└── dashboards/
    └── smartmorphic-starter.yaml
```

## Custom cards

### Room card

Neumorphic room tile. Watches entities for active-state, surfaces ambient
temp, navigates to a detail view on tap.

```yaml
- type: custom:smartmorphic-room-card
  name: Living Room
  icon: mdi:sofa
  entities:
    - light.living_room
    - light.living_room_lamp
    - media_player.living_room
  temperature: sensor.living_room_temp
  navigate: /smartmorphic/living-room
```

| Key | Required | Description |
|---|---|---|
| `name` | yes | Display name. |
| `icon` | no | MDI icon name. Defaults to `mdi:home`. |
| `entities` | yes | List of entity IDs watched for active-state. Ember lights when any are on/playing/open. |
| `temperature` | no | Sensor entity to display in the secondary line. |
| `navigate` | no | Path to navigate to on tap. |

### Light card

Replaces HA's tile for a light. **Tap** toggles. **Hold** (500ms) expands
the card to reveal brightness and color-temperature sliders inline (no
modal). Color temp row hides itself if the light doesn't support it.

```yaml
- type: custom:smartmorphic-light-card
  entity: light.living_room
  name: Living Room        # optional, defaults to friendly_name
  icon: mdi:floor-lamp     # optional, defaults to entity icon
```

| Key | Required | Description |
|---|---|---|
| `entity` | yes | A `light.*` entity. |
| `name` | no | Override display name. |
| `icon` | no | Override icon. |

### Status pill

Semantic chip in one of four variants (`ok` / `warning` / `alert` /
`info`). Static or entity-bound.

Static:

```yaml
- type: custom:smartmorphic-status-pill
  variant: ok
  label: All locked
  icon: mdi:lock-check
```

Entity-bound — pick a variant/label/icon per state:

```yaml
- type: custom:smartmorphic-status-pill
  entity: binary_sensor.front_door
  states:
    "on":  { variant: alert, label: Door open,   icon: mdi:door-open }
    "off": { variant: ok,    label: Door closed, icon: mdi:door }
  fallback: { variant: info, label: Unknown }
```

| Key | Required | Description |
|---|---|---|
| `variant` | one of `variant` / `entity` is required | `ok` / `warning` / `alert` / `info`. |
| `label` | no | Pill text (static mode). |
| `icon` | no | MDI icon name (static mode); defaults per variant. |
| `entity` | one of `variant` / `entity` is required | Entity whose state drives the pill. |
| `states` | no | Map of state value → `{ variant, label, icon }`. |
| `fallback` | no | Used when state isn't in `states`. |

## Phase 2

Remaining: more-info dialog redesign, Energy dashboard restyle, visual
editors for the custom cards. See `TODO.md`.
