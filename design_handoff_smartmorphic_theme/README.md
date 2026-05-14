# Handoff: Smartmorphic theme for Home Assistant

A premium neumorphic theme for Home Assistant Lovelace dashboards, plus design
specs for the custom cards that complete the look. Built around a single soft
surface, accent ember-orange highlights, and physically-modelled shadows that
adapt for light and dark mode.

---

## What's in this bundle

```
design_handoff_smartmorphic_theme/
├── README.md                 ← you are here
├── tokens.md                 ← full design-token reference + HA-var mapping
├── components.md             ← card-by-card recipes
├── starter-theme.yaml        ← drop-in /config/themes/smartmorphic.yaml
└── prototype/                ← working HTML mockups (open in any browser)
    ├── Home Assistant.html       ← entry point — opens design canvas
    ├── colors_and_type.css       ← source CSS variables
    ├── home-assistant/
    │   ├── ha-bundle.jsx         ← single-file React/JSX bundle (Babel-standalone)
    │   └── ha-screens.jsx        ← raw component source — best place to read recipes
    └── fonts/                    ← DM Sans + JetBrains Mono (TTF)
```

---

## About the design files

The files in `prototype/` are **design references** — HTML/React/JSX
prototypes showing intended look and behaviour. They are not production code
to copy verbatim. The HA Lovelace runtime is Lit-based custom elements with a
strict theme-variable contract; the prototypes use plain React inside Babel
standalone because that's the fastest way to iterate on visual design.

The task on the codebase side is to:

1. **Update / replace the existing `smartmorphic.yaml` HA theme** so it maps
   the design tokens documented in `tokens.md` onto the actual Home Assistant
   theme variables. `starter-theme.yaml` is a complete starting point — diff
   it against the running version and merge.
2. **Bring custom cards in line with the visual language** documented in
   `components.md`. Custom cards stay as Lit elements (or whatever the repo
   uses); only the styling/structure follows these recipes.
3. **Leave HA's built-in cards alone** — the theme YAML handles their styling
   through the variable system. Don't fork core cards.

---

## Fidelity

**High-fidelity.** Every value in `tokens.md` (colors, shadows, radii, font
sizes, line-heights, spacing) is final and pixel-accurate. Component layouts
in `components.md` give exact widths/heights/gaps in pixels. Use these values
directly; don't approximate.

If your existing HA theme has values that diverge from these — keep mine.
This bundle is the source of truth going forward.

---

## How to open the prototypes

Either:

- Open `prototype/Home Assistant.html` directly in Chrome — Babel-standalone
  compiles the bundle on load. First paint takes ~1 second.
- Or serve the `prototype/` folder over any static HTTP (e.g.
  `python3 -m http.server`) and visit `Home Assistant.html`.

The prototype is a **design canvas** — pan with two-finger scroll, zoom with
ctrl/cmd-scroll, click any artboard label to open it fullscreen, Esc to exit.
The **Tweaks** panel (toolbar toggle) lets you flip light/dark, swap accent
(Ember / Azure / Forest / Plum), toggle density, and toggle sparklines.

---

## Screens / views in the prototype

Eight sections on the canvas. Each maps to a Lovelace view or a more-info
dialog in the running theme.

| § | Section | Maps to | Purpose |
|---|---|---|---|
| 01 | Overview | Lovelace "Home" view | Three layout compositions of the same data — pick one as the canonical home |
| 02 | Climate | Lovelace "Climate" view | Multi-zone thermostat hub with shared history chart |
| 03 | Energy | HA Energy dashboard | Sankey flow + 24h history + device load |
| 04 | Security | Lovelace "Security" view | Camera grid, alarm panel, locks, sensors |
| 05 | Automations | `/config/automations` | List with last-triggered, blueprint sources, run-now |
| 06 | Light controls | `more-info` dialog for `light.*` | RGB wheel, white color-temperature, phone variant |
| 07 | _(reserved)_ | | |
| 08 | Mobile companion | HA Companion app | Phone-width versions of overview + climate |

Each artboard has a stable id (e.g. `ov-airy`, `lc-rgb`, `mb`) — referenced in
`components.md` when a recipe is specific to one variant.

---

## Design system at a glance

- **Aesthetic:** Soft neumorphism. Page background and card surface are the
  same flat color — depth comes entirely from twin drop-shadows (one light /
  one dark) on each card. No borders, no flat panels.
- **Accent:** Ember `#e8653a`. Used sparingly — active toggles, active nav,
  primary CTAs. Alternate palettes (Azure / Forest / Plum) ship as
  tweak options but Ember is canonical.
- **Typography:** _DM Sans_ for UI text, _JetBrains Mono_ for any tabular or
  technical readout (timestamps, kWh, entity_ids, K-values, hex colors).
- **Density:** Comfortable by default (16px card padding, 16px grid gap).
  Dense variant (12px / 12px) available for power users.
- **Iconography:** Lucide line icons at 1.7px stroke. Active icons go
  slightly thicker (2.0px) and pick up accent color.

Full token reference: `tokens.md`.

---

## Interactions & behaviour

These are the interaction patterns the prototypes communicate. The
implementation already exists for most of them in HA core — the theme just
needs to not fight it. Keep:

- **Tile press** → calls service or opens `more-info`. The accent halo on an
  active state is a `box-shadow` change only (no glow filter — see "Pitfalls"
  below).
- **Brightness slider** → drag changes `light.turn_on` brightness_pct.
- **Color wheel** → drag handle, debounced `light.turn_on` with `hs_color`.
- **Color-temp slider** → kelvin → mireds conversion on emit.
- **Scene chip** → calls `scene.turn_on`. Active state shown via pressed
  shadow recipe.
- **Sankey nodes** → tap any node opens its source entity's `more-info`.
- **Camera tile** → tap opens streaming dialog.

Animations are deliberately restrained — 200ms cubic-bezier(0.4,0,0.2,1) on
all shadow/color transitions, no springs, no bounces. The depth illusion
breaks under animated shadows.

---

## State management

The theme itself is stateless. Custom cards should:

- Read entity state from `hass.states[entity_id]` (standard custom-card
  contract).
- Use `hass.callService('light', 'turn_on', { entity_id, ... })` for actions.
- Persist nothing locally — HA's state machine is the single source of truth.

The prototypes use hard-coded mock data (search `HOUSE`, `ROOMS`, `LIGHTS_ALL`,
`AUTOMATIONS`, `CAMERAS` in `ha-screens.jsx`) — replace with real entity
reads in the custom cards.

---

## Assets

- **Fonts** — `DM Sans` (DM Sans Foundation, SIL OFL 1.1) and `JetBrains
  Mono` (JetBrains, SIL OFL 1.1). Bundled in `prototype/fonts/`. Both are
  freely redistributable under OFL — copy into `/config/www/fonts/` (or
  HACS resources) and reference in the theme YAML.
- **Icons** — Lucide-style line set. The prototype reimplements them as
  inline SVG paths in `HA_ICONS` (see `ha-screens.jsx` line ~80). For HA,
  prefer the built-in MDI icon set via `<ha-icon>` and pick the closest MDI
  equivalent — the visual difference is negligible at 16-24px.
- **Imagery** — All camera frames, album art, and weather illustrations in
  the prototypes are placeholders. Real cards pull from camera entities,
  `media_player` attributes, and the weather integration respectively.

---

## Pitfalls we already hit (don't repeat these)

Three real bugs surfaced during prototyping. Save yourself the round trip:

1. **`filter: drop-shadow(0 0 ... var(--accent-glow))` to add an accent halo
   bleeds fuzzy orange auras far beyond the element**, especially on icon
   wells. Use a tight `box-shadow` or a tinted `background: var(--accent-glow)`
   chip instead. Filter-based glows are forbidden in this system.

2. **Raised cards nested inside raised cards pool shadows into dark blobs
   between the surfaces.** The neumorphic recipe assumes a card sits on the
   page background. If you need to group raised tiles (e.g. a scene picker),
   the *outer* container has no shadow — just a section title.

3. **Scroll containers (`overflow: auto/hidden`) clip card shadows at their
   edges.** Every scrolling region needs internal padding equal to or
   greater than the shadow extent (~14px with the current recipe). The
   prototype solves this with a `.ha-scroll { padding: 12px 14px 16px }`
   utility class.

There's a fourth one specific to mobile WebKit: very large `box-shadow` blur
radii (>30px) tank scroll performance. Don't go past 24px blur.

---

## Files in the codebase that need to change

I don't have visibility into your repo, but based on the standard HA theme +
custom-card layout, expect to touch:

- `themes/smartmorphic.yaml` — the theme file, replace with `starter-theme.yaml`
- `www/community/smartmorphic-*-card/` — custom card source (Lit / TS),
  re-skin per `components.md`
- `www/fonts/` — drop in the bundled `.ttf` files
- `configuration.yaml` — confirm `frontend.themes` block points at the
  theme directory

Open both `tokens.md` and `components.md` before starting. Cross-reference
the prototype as you go.

---

## Questions during implementation?

The single source of truth for any visual decision is
`prototype/home-assistant/ha-screens.jsx`. Every component is named, every
value is inline, and every recipe is traceable through that one file. When
in doubt, search for the component name there.
