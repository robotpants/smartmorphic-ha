# Smartmorphic HA — TODO

## Phase 2 — custom Lovelace cards

Build Lit web components for the highest-traffic surfaces, consuming the `--smartmorphic-*` CSS variables already defined in the theme.

- [x] **Room card** — room name, accessory count, ambient temp, ember dot when active. Tap → room detail view.
- [x] **Light card** — replace HA's default light tile. Tap toggles, hold expands to brightness + color-temp sliders. Full color picker still TODO.
- [ ] **Light card: color picker** — RGB / HS / XY color picking for lights that support it. Deferred from v1.
- [ ] **Scene chip** — pill that recedes when active. Lives in a horizontal scroll.
- [x] **Status pill** — semantic chip (`ok` / `warning` / `alert` / `info`) with 18% background + darkened semantic text. Static + entity-bound modes.
- [ ] **More-info dialog redesign** — replace HA's default expanded entity sheet.

## Polish backlog (theme-only, no custom cards required)

- [ ] **Markdown card subtitle treatment** — give the secondary text under headings a tighter eyebrow style without affecting all markdown.
- [ ] **Active-state detection on tile icons** — current glow is always-on; ideally fades off for `unavailable` / `unknown` states.
- [ ] **Energy dashboard restyle** — HA's energy view has its own quirks; needs targeted card-mod selectors.

## Tooling / packaging

- [x] **Visual editors for custom cards** — `getConfigElement()` on each card; uses `<ha-form>` schemas. Status pill editor covers the static mode only; entity-bound configs still need YAML for the `states` map.
- [ ] **HACS-installable** — register the repo as a HACS frontend integration so users can install via the store instead of `git clone`.
