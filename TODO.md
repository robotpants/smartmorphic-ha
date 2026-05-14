# Smartmorphic HA — TODO

> Every new custom card on this list must ship with a functional visual
> editor that covers every config field — see *Custom card rules* in
> `CLAUDE.md`.

## Style alignment (blocks everything else when assets land)

- [ ] **Match the Claude Design exports** — when the user provides the refined style guide (CSS / design tokens / screenshots), update `themes/smartmorphic.yaml` and every shipped card to align colors, type weights, spacing, shadow values, and component proportions. The shipped theme is structurally close but visibly off; do not invent new colors in the meantime.

## Phase 2 — custom Lovelace cards (shipped)

Built as vanilla Web Components, consuming the `--smartmorphic-*` CSS variables defined in the theme.

- [x] **Room card** — room name, accessory count, ambient temp, ember dot when active. Tap → room detail view.
- [x] **Light card** — replace HA's default light tile. Tap toggles, hold expands to brightness + color-temp sliders. Full color picker still TODO.
- [x] **Status pill** — semantic chip (`ok` / `warning` / `alert` / `info`) with 18% background + darkened semantic text. Static + entity-bound modes.

## Phase 2 — custom Lovelace cards (still queued)

- [ ] **Light card: color picker** — RGB / HS / XY color picking for lights that support it. Deferred from v1.
- [ ] **Scene chip** — pill that recedes (pressed inset) when its scene is the most-recently-activated. Lives in a horizontal scroll. Active state uses ember styling per the mobile mockup.
- [ ] **More-info dialog redesign** — replace HA's default expanded entity sheet. Start with card-mod CSS injection on the existing dialog; only build a custom component if injection can't reach what we need.

## Phase 3 — new card types from the Claude Design mockups

Each is a distinct card type, not a variant of an existing one.

- [ ] **Climate zone card** — round target dial, Heat/Cool/Auto/Off pill row, current temp + setpoint delta, humidity row. Used per-zone on the climate dashboard.
- [ ] **House-average climate panel** — large stat (`70.2°F` + state badge like `HEATING`), stats row (setpoint avg, humidity, runtime today, cost today), multi-line history chart over a 12h window, legend.
- [ ] **Outside weather panel** — large temp + condition, low/high/UV inline, 12-hour bar forecast strip, "Outside today" stats list (sunrise, sunset, wind, precipitation, dew point), plus an HVAC fan toggle row.
- [ ] **Thermostat dial card (mobile)** — big circular setpoint dial with current temp in the center, mode pill row underneath, "Other zones" list, optional history sparkline strip.
- [ ] **Inside/outside temp tile pair** — two stacked compact tiles with low/high or humidity subtext. Mobile overview pattern.
- [ ] **Alarm/security status row** — wide pill row showing shield state + "X sensors monitoring" subtitle + "ALL CLEAR" badge. Distinct from the existing status pill (this one is row-shaped, not pill-shaped).
- [ ] **Media player card** — Smartmorphic-styled now-playing tile (artwork well, track + artist, transport row, scrubber). Replaces `mushroom-media-player-card` in the starter dashboard once shipped.
- [ ] **Automation row card** — single-row card for the automations list view: trigger-type chip next to name, description subtitle, last-triggered timestamp, Run button, enable toggle. Built to be stacked into a list view.
- [ ] **Automations sidebar panel** — right-rail card combining: Today stats (triggers fired, most active, last triggered, failed runs), Activity last-24h log, Blueprints in use.

## Phase 4 — shared helpers + layout primitives

Pulled out of the mockups because they recur across multiple dashboards.

- [ ] **Sparkline component** — small inline history chart (single-line + multi-line). Used in climate cards and thermostat dial. Should accept entity ID + timespan + color, draw via SVG, no external chart lib.
- [ ] **Eyebrow text utility** — small-caps secondary label style (`SETPOINT AVG`, `OUTSIDE TODAY`). Either a `--smartmorphic-eyebrow-*` token set or a shared class injected via card-mod.
- [ ] **Round dial widget** — reusable circular setpoint/target ring used by climate-zone and thermostat-dial cards. Inputs: value, target, min/max, accent (ember when active).
- [ ] **Mode pill row** — generic Heat / Cool / Auto / Off (or any 3-5 options) horizontal segmented control with the Smartmorphic pressed-state for active. Used in climate cards.
- [ ] **Side-panel layout grouping** — convention/helper for the "main grid + right rail" pattern seen in Climate and Automations dashboards. Likely just a documented Lovelace `sections`/`grid` recipe rather than a card.
- [ ] **Header strip** — the `GOOD EVENING · NICK` + page title + search input + notification bell + avatar pattern seen across every dashboard. Could be a card; might be better as a card-mod injection on the app-header.

## Polish backlog (theme + card-mod, no new card types)

- [ ] **Markdown card subtitle treatment** — give the secondary text under headings a tighter eyebrow style without affecting all markdown.
- [ ] **Active-state detection on tile icons** — current glow is always-on; ideally fades off for `unavailable` / `unknown` states.
- [ ] **Energy dashboard restyle** — HA's energy view has its own quirks; needs targeted card-mod selectors.
- [ ] **Sidebar restyle to match mockup** — the left nav in the mockups (Home / Smartmorphic header, dashboards list, areas list with counts, footer build/version stamp) is more opinionated than HA's default. Likely a card-mod injection on `ha-sidebar`.

## Tooling / packaging

- [x] **Visual editors for custom cards** — `getConfigElement()` on each card; uses `<ha-form>` schemas plus inline custom widgets where the schema can't express the shape. Rule going forward: every new card ships with a functional editor (no "edit YAML for this part" gaps).
- [ ] **HACS-installable** — register the repo as a HACS frontend integration so users can install via the store instead of `git clone`.
- [ ] **Mobile Companion app verification** — the mocks include phone-width layouts. Verify the shipped theme + custom cards render correctly inside the iOS/Android Companion (which uses the HA frontend but in a webview with its own quirks).
