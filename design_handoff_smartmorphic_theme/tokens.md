# Design Tokens — Smartmorphic for Home Assistant

Every visual value used in the prototype. Light + dark variants. Where a
token has a Home Assistant theme-variable equivalent, the mapping is shown
on the right — that's what goes in `starter-theme.yaml`.

> **Reference implementation:** `prototype/colors_and_type.css` (root tokens) +
> the `:root` override block at the top of `prototype/Home Assistant.html`
> (HA-specific tightenings).

---

## 1. Color

### Surfaces

| Token | Light | Dark | HA variable |
|---|---|---|---|
| `--bg` | `#e2e4ec` | `#14151b` | `primary-background-color`, `lovelace-background` |
| `--surface` | `#e2e4ec` | `#1d1f27` | `card-background-color`, `ha-card-background`, `secondary-background-color` |
| `--surface-gradient` _(dark only)_ | — | `linear-gradient(145deg, #21232c, #1a1c23)` | _custom — applied to `ha-card` ::before if you want extra depth on dark_ |

**Note:** in light mode `--bg` and `--surface` are deliberately identical —
the neumorphic illusion is broken if they differ. In dark mode, surface
lifts ~6 luminance points above bg so cards register against a darker page.

### Text

| Token | Light | Dark | HA variable |
|---|---|---|---|
| `--text-primary` | `#2c2e3a` | `#e4e5eb` | `primary-text-color` |
| `--text-secondary` | `#6b6e7d` | `#9a9caa` | `secondary-text-color` |
| `--text-muted` | `#7d8092` | `#5e6070` | `disabled-text-color`, label text |

### Accent (Ember — canonical)

| Token | Value | HA variable |
|---|---|---|
| `--accent` | `#e8653a` | `accent-color`, `primary-color`, `state-icon-active-color`, `paper-item-icon-active-color` |
| `--accent-glow` | `rgba(232, 101, 58, 0.35)` | _used directly in custom cards — no HA mapping_ |

### Alternate accents (available as tweaks; not canonical)

| Name | `--accent` | `--accent-glow` |
|---|---|---|
| Azure | `#3a8ee8` | `rgba(58, 142, 232, 0.35)` |
| Forest | `#3abf7a` | `rgba(58, 191, 122, 0.35)` |
| Plum | `#9b59b6` | `rgba(155, 89, 182, 0.35)` |

### Semantic

| Token | Value (both modes) | Used for |
|---|---|---|
| `--success` | `#3abf7a` | `state-on`, armed states, "all clear", solar production |
| `--warning` | `#e8b83a` | Setpoint differential, weather warning, EV-charging |
| `--danger` | `#e84a3a` | `state-alert`, leak detected, motion w/ alarm armed |

HA mappings: `--success` → `state-active-color`, `state-on-color`; `--warning`
→ `state-warning`; `--danger` → `error-color`, `state-error-color`.

---

## 2. Shadows (neumorphic recipes)

These are the **single most important tokens in the system**. Get these
right and 70% of the look is there. All shadows are dual — one light, one
dark — applied to the same opaque surface.

### Light mode

```css
--neu-raised:    3px 3px 8px  rgba(163,167,185,0.40),
                -3px -3px 8px rgba(255,255,255,0.85);

--neu-raised-sm: 2px 2px 5px  rgba(163,167,185,0.35),
                -2px -2px 5px rgba(255,255,255,0.75);

--neu-raised-lg: 5px 5px 14px rgba(163,167,185,0.42),
                -5px -5px 14px rgba(255,255,255,0.85);

--neu-pressed:   inset 2px 2px 4px  rgba(163,167,185,0.40),
                 inset -2px -2px 4px rgba(255,255,255,0.70);
```

### Dark mode

```css
--neu-raised:    3px 3px 8px  rgba(0,0,0,0.50),
                -1.5px -1.5px 5px rgba(255,255,255,0.025);

--neu-raised-sm: 2px 2px 5px  rgba(0,0,0,0.45),
                -1px -1px 3px   rgba(255,255,255,0.025);

--neu-raised-lg: 5px 5px 14px rgba(0,0,0,0.55),
                -2px -2px 9px   rgba(255,255,255,0.03);

--neu-pressed:   inset 1.5px 1.5px 4px rgba(0,0,0,0.55),
                 inset -1px -1px 3px   rgba(255,255,255,0.035);
```

### HA card mapping

HA exposes `--ha-card-box-shadow`. Set it to `--neu-raised`:

```yaml
ha-card-box-shadow: var(--neu-raised)
ha-card-border-radius: "16px"
ha-card-border-width: "0"
ha-card-background: var(--surface)
```

### When to use which

| Recipe | Use for |
|---|---|
| `--neu-raised` | Standard cards, default depth |
| `--neu-raised-sm` | Small chips, icon wells, inline tiles, sankey nodes |
| `--neu-raised-lg` | Hero cards, modal/dialog sheets, primary stat readouts |
| `--neu-pressed` | Active toggles, selected segmented-control segments, slider tracks, color wheel base |

### Forbidden patterns

- ❌ `filter: drop-shadow(0 0 Npx var(--accent-glow))` — bleeds halos. Use
  `box-shadow: 0 4px 12px var(--accent-glow)` or a tinted background instead.
- ❌ Raised inside raised — outer container should be transparent if its
  children are cards.
- ❌ Border + shadow on the same element — picks one, never both.

---

## 3. Radii

| Token | Value | Used for |
|---|---|---|
| `--radius-sm` | `8px` | Mode chips, inline tags, slider knob borders |
| `--radius-md` | `12px` | Icon wells, small sensors |
| `--radius` | `16px` | Standard tile / card |
| `--radius-lg` | `18px` | Section containers, weather hero |
| `--radius-xl` | `24px` | Modal sheets, light-control dialog |
| `--radius-pill` | `999px` | Pills, search bar, accent CTAs |

HA mapping: `ha-card-border-radius: "16px"`.

---

## 4. Typography

### Font families

| Token | Stack |
|---|---|
| `--font-sans` (`HA_FONT_SANS`) | `'DM Sans', system-ui, sans-serif` |
| `--font-display` (`HA_FONT_DISPLAY`) | `'Outfit', system-ui, sans-serif` _(falls back to DM Sans if Outfit unavailable; prototype uses DM Sans for both)_ |
| `--font-mono` (`HA_FONT_MONO`) | `'JetBrains Mono', ui-monospace, monospace` |

HA mapping: set `primary-font-family` and `paper-font-common-base_-_font-family`
to `--font-sans`. There's no theme variable for the mono — use it inline in
custom cards.

### Scale

| Role | Family | Size | Weight | Line | Tracking |
|---|---|---|---|---|---|
| Hero number | display | 56–64px | 600 | 1 | −1px |
| Display stat | display | 28–36px | 500 | 1 | −0.5px |
| Tile stat | display | 22–26px | 500 | 1 | −0.3px |
| Page title | display | 22–28px | 600 | 1.1 | −0.5px |
| Card title | sans | 13–14px | 600 | 1.2 | 0 |
| Body | sans | 12–13px | 500 | 1.4 | 0 |
| Sub-copy | sans | 11px | 500 | 1.4 | 0 |
| Eyebrow | display | 10px | 600 | 1 | 1.5px, UPPERCASE |
| Mono readout | mono | 10–11px | 400–500 | 1 | 0.5px |

### Eyebrow recipe

Section labels (`OUTSIDE`, `SCENES`, `ENERGY NOW`) use the eyebrow style.
Mini-component spec:

```jsx
<div style={{
  fontFamily: HA_FONT_DISPLAY,
  fontSize: 10, fontWeight: 600,
  letterSpacing: 1.5, textTransform: 'uppercase',
  color: 'var(--text-muted)',
}}>OUTSIDE</div>
```

---

## 5. Spacing & density

The system uses two density modes. Pick one per dashboard; don't mix.

| | Comfortable (default) | Dense |
|---|---|---|
| Card padding | 16px | 12px |
| Grid gap | 16px | 12px |
| Section gap | 16px | 12px |
| Icon-well size | 38px | 32px |
| Tile stat size | 22px | 18px |

HA mapping: `card-padding: "16px"` (custom var our cards can read).

The `.ha-scroll` utility — required on every dashboard's main scroll
container — has its own padding to keep card shadows from clipping at the
scroll-region edges:

```css
.ha-scroll {
  padding: 12px 14px 16px;
  box-sizing: border-box;
}
```

---

## 6. Sidebar / top bar

### Sidebar (left)

| Property | Value | HA variable |
|---|---|---|
| Width | `220px` | `sidebar-width` (unofficial) |
| Background | `var(--surface)` | `sidebar-background-color` |
| Right edge | `1px solid rgba(125,128,146,0.10)` | `divider-color` |
| Idle text | `var(--text-secondary)`, 13px, 500 weight | `sidebar-text-color` |
| Idle icon | `var(--text-secondary)`, 1.7 stroke | `sidebar-icon-color` |
| Active text | `var(--accent)`, 600 weight | `sidebar-selected-text-color` |
| Active icon | `var(--accent)`, 2.0 stroke | `sidebar-selected-icon-color` |
| Active background | `var(--neu-pressed)` on `var(--surface)` | _no equivalent — applied via custom-style_ |

### Top bar

Per-view greeting + page title + search pill + bell + avatar. The avatar
circle uses `--neu-raised-sm`; the search uses `--neu-pressed`; the bell
icon-well is flat tinted (`rgba(125,128,146,0.10)`).

---

## 7. Active states

A core grammar of the system — three visual stages for any toggleable
entity:

| State | Surface | Shadow | Icon color | Stroke |
|---|---|---|---|---|
| **Off** | `rgba(125,128,146,0.12)` (flat) | none | `var(--text-muted)` | 1.7 |
| **On (active)** | `var(--accent-glow)` (flat tinted) | `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px var(--accent-glow)` | `var(--accent)` | 2.0 |
| **Pressed (selected segmented)** | `var(--surface)` | `var(--neu-pressed)` | `var(--accent)` | 2.0 |

Never use the raised neumorphic recipe for "on" — that's the off-default for
icon wells. Use the tinted fill.

---

## 8. Full HA theme variable mapping

The complete mapping is in `starter-theme.yaml` — drop it in
`/config/themes/smartmorphic.yaml` and restart frontend. Diff it against
your current theme to spot gaps.
