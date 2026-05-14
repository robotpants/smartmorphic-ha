# Smartmorphic HA — TODO

> Every new custom card on this list must ship with a functional visual
> editor that covers every config field — see *Custom card rules* in
> `CLAUDE.md`.

## Style alignment

- [x] **Match the Claude Design exports** — first pass complete. Theme and
  all three shipped cards consume the export's tokens, shadow values, radii,
  type scale, and active-state recipes (theme `v0.4`-aligned; room v0.4.0,
  light v0.4.0, status pill v0.5.0). Refinements expected as Phase 3 cards
  land and reveal gaps.

## Phase 2 — custom Lovelace cards (shipped)

Built as vanilla Web Components, consuming the `--smartmorphic-*` CSS variables defined in the theme.

- [x] **Room card** — flat-tinted icon well off-state, accent-glow on-state, name shifts to accent when active.
- [x] **Light card** — tap toggles; hold (500ms) expands to brightness + color-temp sliders. Slider thumb is a white circle with subtle raised shadow + 1px accent ring per export.
- [x] **Status pill** — pill recipe (4×9 padding, 10px / 700, letter-spacing 0.6, UPPERCASE). Static + entity-bound.

## Phase 2 — custom Lovelace cards (still queued)

- [ ] **Light card: color picker** — RGB / HS / XY color picking for lights that support it. Deferred from v1.
- [ ] **Scene chip** — pill that recedes (pressed inset) when its scene is the most-recently-activated. Lives in a horizontal scroll.
- [ ] **More-info dialog redesign** — start with card-mod CSS injection on the existing dialog; only build a custom component if injection can't reach what we need.

## Phase 3 — new card types from the Claude Design mockups

Each is a distinct card type, not a variant of an existing one. Recipes for every one of these live in `style-guide:design_handoff_smartmorphic_theme/components.md` — pull from there at implementation time.

- [ ] **Climate zone card** (`ClimateTile`) — round target dial, Heat/Cool/Auto/Off pill row, current temp + setpoint delta, humidity row.
- [ ] **House-average climate panel** — large stat + state badge, stats row (setpoint avg, humidity, runtime today, cost today), multi-line history chart, legend.
- [ ] **Outside weather panel** — large temp + condition, low/high/UV inline, 12-hour bar forecast strip, "Outside today" stats list, HVAC fan toggle.
- [ ] **Thermostat dial card (mobile)** — big circular setpoint dial with current temp in the center, mode pill row, "Other zones" list, optional sparkline.
- [ ] **Sensor tile** (`SensorTile`) — eyebrow + label + Stat (32px display) + 140×28 sparkline + optional delta footer.
- [ ] **Inside/outside temp tile pair** — two stacked compact tiles with low/high or humidity subtext.
- [ ] **Alarm/security status row** (`StatusBanner`) — wide raised tile, ActiveIconWell + label + sub + status pill on far right.
- [ ] **Media player card** — artwork well, track + artist, transport row, scrubber.
- [ ] **Automation row card** — trigger-type chip + name, description, last-triggered timestamp, Run button, enable toggle.
- [ ] **Automations sidebar panel** — Today stats + Activity last-24h log + Blueprints in use.

## Phase 4 — shared helpers + layout primitives

Pulled out of the mockups because they recur across multiple dashboards.

- [ ] **Sparkline component** (`Spark`) — 70–140px wide, 22–28px tall, 1.5px stroke, 0.12-alpha area fill, soft drop-shadow on accent series.
- [ ] **Multi-line history chart** — used by climate dashboard. Featured series gets accent-glow drop-shadow; others stay flat. 9px mono time axis labels.
- [ ] **Eyebrow text utility** — `--smartmorphic-eyebrow-*` tokens are in place; usage pattern documented for new cards.
- [ ] **Round dial widget** (`ClimateRing`) — concentric SVG circles, 3px stroke, accent stroke gets `drop-shadow(0 0 4px var(--accent-glow))`.
- [ ] **Mode pill row** — Heat / Cool / Auto / Off segmented control. Active = `--smartmorphic-neu-pressed`, inactive = `--smartmorphic-neu-raised-sm`.
- [ ] **Side-panel layout grouping** — documented Lovelace `sections`/`grid` recipe for the main-grid + right-rail pattern.
- [ ] **Header strip** — `GOOD EVENING · NICK` + page title + search pill + bell + avatar. Avatar uses `--neu-raised-sm`; search uses `--neu-pressed`.

## Polish backlog (theme + card-mod, no new card types)

- [ ] **Markdown card subtitle treatment** — tighter eyebrow style under headings without affecting all markdown.
- [ ] **Active-state detection on tile icons** — fades off for `unavailable` / `unknown` states.
- [ ] **Energy dashboard restyle** — theme already sets the energy color palette; verify it lands and tune card-mod selectors if not.
- [ ] **Sidebar restyle to match mockup** — Home / Smartmorphic header, dashboards list, areas list with counts, footer build/version stamp.

## Tooling / packaging

- [x] **Visual editors for custom cards** — `getConfigElement()` on each card; uses `<ha-form>` schemas plus inline custom widgets where the schema can't express the shape.
- [ ] **HACS-installable** — register the repo as a HACS frontend integration so users can install via the store instead of `git clone`.
- [ ] **Mobile Companion app verification** — the mocks include phone-width layouts. Verify the shipped theme + custom cards render correctly inside the iOS/Android Companion.
