# Component Recipes — Smartmorphic for Home Assistant

Card-by-card specs. Every recipe links to the JSX source in
`prototype/home-assistant/ha-screens.jsx` (line numbers approximate). When in
doubt, **the JSX is the source of truth** — every value is inline, every
component is small enough to copy.

Naming convention: HA custom-card tags are kebab-case, prefixed
`smartmorphic-`. Prototype components are PascalCase React.

---

## Universal primitives

These appear in nearly every card. Implement them once as Lit base classes /
mixins.

### `Raised` card

The default container.

```css
background: var(--surface);
border-radius: 16px;
box-shadow: var(--neu-raised);
padding: 16px;
border: 0;
```

### `Eyebrow` label

```css
font-family: var(--font-display);
font-size: 10px; font-weight: 600;
letter-spacing: 1.5px; text-transform: uppercase;
color: var(--text-muted);
```

### `Stat` readout

Big numeric display. The unit glyph behaviour matters:

- **Degree-style units** (`°`, `°F`, `°C`): superscript-positioned, ~38% of
  value font-size, sits high (top of digits), no left margin to speak of.
- **Other units** (`kW`, `kWh`, `%`, `K`): baseline-aligned, ~42% of value
  size, 3px left margin, `--text-muted` color.

JSX reference: `Stat()` in ha-screens.jsx ~line 290.

### `IconWell` (flat, default)

```css
width: 38px; height: 38px;
border-radius: 12px;
background: rgba(125,128,146,0.10);
display: flex; align-items: center; justify-content: center;
color: var(--text-secondary);
```

### `ActiveIconWell` (on/off toggleable)

**Off:** same as IconWell.

**On:**
```css
background: var(--accent-glow);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.18),
            0 0 0 1px var(--accent-glow);
color: var(--accent);
/* icon stroke 2.0 */
```

JSX reference: `ActiveIconWell()` ~line 195.

### `Slider`

```css
height: 6–10px (10 in detail dialogs);
border-radius: 999px;
background: var(--surface);
box-shadow: var(--neu-pressed);

/* fill */
background: var(--accent);
box-shadow: 0 0 10px var(--accent-glow);

/* knob */
width/height: 14–22px;
border-radius: 50%;
background: #fff;
box-shadow: 1px 1px 3px rgba(0,0,0,0.25), var(--neu-raised-sm);
```

### `Toggle` (switch)

44×26px pill. On → `--accent` bg + `0 0 10px var(--accent-glow)`. Off →
`#c4c7d4` solid, no shadow. White 22×22 knob, 2px inset.

### `Pill` (status tag)

```css
display: inline-flex; gap: 5px; align-items: center;
padding: 4px 9px; border-radius: 999px;
font-size: 10px; font-weight: 700;
letter-spacing: 0.6px; text-transform: uppercase;
```

Tones: neutral / accent / success / warning / danger. Each has a paired
`background` (0.14–0.16 alpha tint) + `color` (full saturation token).

---

## Tile cards

### `TileCard` → `smartmorphic-tile-card`

Generic entity tile. Icon-well + label + sub + state + optional sparkline.

- Container: `Raised`, padding 16px (12 in dense)
- Top row: `ActiveIconWell` (38px) on left, label + sub stacked on right
  - Label: 14px / 600 / `--text-primary` (or `--accent` when on)
  - Sub: 11px / `--text-muted`, optional
- Bottom row: `Stat` (22px) on left, optional `Spark` (70×22) on right
- Tile turns: label and state both shift to `--accent` color when entity is on

JSX: `TileCard()` ~line 542.

### `LightTileCard` → `smartmorphic-light-tile`

Tile + brightness slider built in.

- Same top row as TileCard but ends in a `Toggle` instead of stat
- Below: tiny sun icon (12px), inline `Slider` (height 5, knob 11), 10px
  mono percentage readout (`--text-muted`), right-aligned
- Slider only visible when light is on

JSX: `LightTileCard()` ~line 565.

### `SensorTile` → `smartmorphic-sensor-tile`

Big numeric display for sensors (temp, humidity, power).

- Top: 14px icon + Eyebrow label
- Middle: `Stat` size 32 (26 dense)
- Bottom: 140×28 sparkline (sparkline color matches stat color)
- Optional footer row for delta / trend annotation

### `ClimateTile` → `smartmorphic-climate-tile`

Per-zone thermostat tile.

- Compact mode: just icon + room name + target sub + 52px ring
- Full mode adds:
  - Mode segmented control: Heat / Cool / Auto / Off (4-wide grid, 6px gap)
    — active = `--neu-pressed`, inactive = `--neu-raised-sm`
  - Humidity + delta row below (12px drop, 11px text, mono delta)

#### `ClimateRing` (the dial)

Concentric SVG circles. Outer = light track at ~30% alpha of muted. Inner =
accent stroke, dash-offset by `(current - 60) / (80 - 60)`. Center label is
the current temp + `°` suffix at ~32% of ring size. Stroke 3px on both
circles. Add `filter: drop-shadow(0 0 4px var(--accent-glow))` on the accent
stroke only (small SVG inside a tile — safe, doesn't leak).

JSX: `ClimateRing()` ~line 615.

### `RoomCard` → `smartmorphic-room-card`

Cross-section of a room — used in the overview Rooms grid.

- Top: `ActiveIconWell` (40px, on if any light on) on left, `Stat` (24px,
  temp with °) on right
- Bottom: room name (14px / 600) + sub line `{N}/{T} lights · on` (accent
  highlight on the `on` word if any light is on)

---

## Section / layout

### `SectionHead`

Just `Eyebrow` + optional right-aligned action link in `--accent`. No outer
container — section heads sit on the page bg, between Raised tiles.

### `StatusBanner`

Full-width raised tile showing a single armed/clear status.

- Active icon-well (42px, on) + label (13/600) + sub (11/muted) + status
  pill on far right

---

## Sankey diagram (Energy)

The signature visual of the Energy view. Custom SVG component.

- Three node columns: sources (left), sinks (right). No center hub in this
  variant — sources flow directly to sinks.
- Nodes are 130px wide raised tiles (`--neu-raised-sm` via foreignObject; do
  NOT use SVG `filter`, breaks in dark mode). Height proportional to
  throughput, min 30px.
- Flows are filled bezier paths between node midpoints. Width proportional
  to flow value. Fill = source color at 0.35 opacity.
- Labels (`1.6kW`) centered on each flow at midpoint, mono font, color
  matches flow.

JSX: `EnergySankey()` / `SankeyNode()` ~lines 1230–1270.

---

## Charts

### Multi-line history (Climate, Energy 24h)

- SVG viewBox sized to container, `preserveAspectRatio="none"` is fine
- Horizontal grid lines at 0.25 / 0.5 / 0.75 of height, `rgba(125,128,146,0.15)`,
  `stroke-dasharray="2 4"`
- Each series: 2px stroke, round caps + joins
- Featured series (accent) gets `filter: drop-shadow(0 0 6px var(--accent-glow))`,
  others stay flat
- Time-axis labels in mono, 9px, `--text-muted`, evenly spaced
- Legend top-right: 8×2 colored bar + label per series

### Sparkline (`Spark`)

Tiny inline trend on Tile/Sensor cards.

- 70–140px wide, 22–28px tall
- 1.5px stroke, soft `0 0 4px ${color}55` drop-shadow filter
- 0.12-alpha fill polygon under the line for area emphasis

JSX: `Spark()` ~line 320.

---

## Light controls (more-info dialog)

### `ColorWheel`

- Outer container: `padding: 8px`, `border-radius: 50%`,
  `background: var(--surface)`, `box-shadow: var(--neu-pressed)` — gives the
  "set into the surface" look
- Inner circle: `border-radius: 50%`, background is the layered gradient:
  ```css
  background:
    radial-gradient(circle at center,
      rgba(255,255,255,0.96) 0%,
      rgba(255,255,255,0) 62%),
    conic-gradient(from 0deg,
      hsl(0,100%,55%)   0deg,
      hsl(60,100%,55%)  60deg,
      hsl(120,100%,52%) 120deg,
      hsl(180,100%,50%) 180deg,
      hsl(240,100%,60%) 240deg,
      hsl(300,100%,58%) 300deg,
      hsl(360,100%,55%) 360deg);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4);
  ```
- Handle: 30×30, `border-radius: 50%`, fill = selected color, `4px solid #fff`
  ring, drop-shadow `0 3px 10px rgba(0,0,0,0.30)`

Wheel size: 260px on desktop dialog, 240px on phone.

### `ColorTempSlider`

Horizontal kelvin slider.

- Track: 32×∞, `border-radius: 16px`, linear gradient warm → cool:
  ```css
  background: linear-gradient(90deg,
    #ff9a3c 0%, #ffc680 18%, #ffe2b8 38%,
    #fff3d6 55%, #f0f7ff 72%, #b3d1ff 90%, #6fa4ff 100%);
  box-shadow: var(--neu-pressed), inset 0 0 0 1px rgba(255,255,255,0.4);
  ```
- Tick marks at 0 / 12 / 27 / 42 / 65 / 100%, 1×8px black 18% alpha
- Thumb: 32×32 circle, fill = approximate color of current kelvin, 4px white
  ring, soft drop-shadow
- Below: axis labels (2200K / 3000K / 4000K / 5000K / 6500K) in mono, 10px,
  muted

Kelvin label mapping:
- <2700 → "Candle"
- 2700–3299 → "Warm white"
- 3300–4199 → "Soft white"
- 4200–5499 → "Daylight"
- ≥5500 → "Cool white"

### `WhitePresetRow`

5 cards in a grid: Candle 2200K · Warm 2700K · Soft 3500K · Daylight 5000K
· Cool 6500K.

- Card: 14px radius, `--neu-raised-sm` (inactive) or `--neu-pressed`
  (active), padding 12/6/10
- Inside: 34px circle of the preset color (with `0 0 14px ${color}99` when
  selected), name (11px / 600), kelvin (mono 9px muted)

---

## Lovelace view shells

### Sidebar nav

220px wide column with three sections (vertical gaps 24px between):

1. **Wordmark** — 30×30 icon-well (accent-tinted, no glow) + "Home" /
   "SMARTMORPHIC" mono tagline
2. **Dashboards nav** — eyebrow "DASHBOARDS" + rows. Each row: 16px icon +
   13px label, 9px 10px padding, 12px radius. Active = `--neu-pressed`,
   accent color, 600 weight, plus a 4×4 accent dot on the right with `0 0 6px
   var(--accent-glow)`. Inactive = no background, `--text-secondary`.
3. **Areas** — similar rows. If a room has any lights on, show the count in
   tiny mono accent text on the right.
4. **Footer** — 8×8 pulsing success dot + `core-2026.5.2` / `104 entities ·
   online` in mono 10px

### Top bar

- Left: eyebrow greeting (`Good evening · Nick`) + page title (display
  28/600)
- Right cluster, in order:
  1. Search pill (pressed, 220×38, search icon + "Search entities" + `⌘K`
     keycap badge)
  2. Bell IconWell (36×36, flat)
  3. Avatar — 36×36 raised circle, single-letter initial in accent, display
     font 600

### `.ha-scroll` utility

The main content scroller for every view:

```css
.ha-scroll {
  padding: 12px 14px 16px;
  box-sizing: border-box;
  overflow: auto;
}
```

Required — without it card shadows clip at the scroll edges.

---

## Scene / chip components

### `SceneChip`

```css
display: flex; flex-direction: column;
align-items: center; gap: 8px;
padding: 14px 10px;     /* 10px 8px in dense */
border-radius: 14px;
background: var(--surface);
box-shadow: var(--neu-raised-sm);   /* var(--neu-pressed) when active */
color: var(--text-secondary);       /* var(--accent) when active */
min-width: 86px;
```

Icon size 18 (16 dense), 1.8 stroke. Label 11/600.

### Mode chips (Heat/Cool/Auto/Off in climate tile)

Same neumorphic on/off treatment but laid out as a 4-wide grid with 6px gap,
shorter padding (6px 0), 8px radius.

---

## Camera tile

For security view. Dark video frame, not a neumorphic card.

```css
border-radius: 14px;
overflow: hidden;
background: #1a1b22;
box-shadow: var(--neu-raised-sm);
aspect-ratio: 16/9;
```

HUD overlays use `rgba(0,0,0,0.55)` pill backgrounds with `backdrop-filter:
blur(8px)`. LIVE indicator: animated pulse, `var(--accent)` dot, mono 9px
text, top-left. Camera name pill: white 600 10px, sans, top-left next to
LIVE. Motion timestamp: bottom-left, mono 9px, 80%-white.

JSX: `CameraTile()` ~line 1410.

---

## Automation row

Compact horizontal layout, `--neu-raised-sm`.

- 38px `ActiveIconWell` (on when enabled) — `bot` icon
- Label row: name (13/600) + blueprint tag (mono 9px in a tinted 1×6 pill)
- Sub: description (11/muted)
- Right cluster (in order): "LAST" eyebrow + timestamp (display 13/600,
  secondary), "Run" button (raised-sm pill with play icon), Toggle

JSX: `AutomationRow()` ~line 1583.

---

## Sizing reference

Standard artboard widths for visual reference (all 16:9 at 920 height
unless noted):

| Surface | Size |
|---|---|
| Dashboard (Overview / Climate / Energy / Security / Automations) | 1480 × 920 |
| Light-control sheet (RGB / White) | 560 × 780 |
| Phone (Companion app, light-control phone) | 420 × 900 |

The dashboard surface assumes ~220px sidebar + ~80px top bar + ~14px scroll
padding, so the content area is ~1206 × 770.

---

## Implementation order (suggested)

If you're picking off cards for incremental release:

1. **Theme YAML first** — gets the built-in cards aligned and gives you a
   visual baseline.
2. **TileCard** (universal) — unlocks `light`, `switch`, `binary_sensor`,
   `cover`, `script` entities all at once.
3. **SensorTile** — covers any numeric sensor.
4. **LightTileCard** — your most-used entity type, deserves its own card.
5. **ClimateTile** + ring — high-value, distinctive visual.
6. **More-info light dialog** with `ColorWheel` + `ColorTempSlider`.
7. **Energy Sankey + 24h chart** — biggest visual payoff, ship last.
8. **Camera tile** + **Automation row** in parallel — both straightforward.
