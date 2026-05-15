// =============================================================================
// Smartmorphic — tile card
//
// Generic entity tile (light, switch, binary_sensor, cover, script, input_*).
// Implements the export's TileCard recipe:
//
//   - Raised container (16px padding, 16px radius)
//   - Top row: 38px ActiveIconWell + label/sub stack
//       * Label: 14px / 600. Shifts to --accent when active.
//       * Sub: 11px / muted (optional)
//   - Bottom row: 22px Stat (state text or formatted reading)
//
// Config:
//   type: custom:smartmorphic-tile-card
//   entity: light.kitchen
//   name: Kitchen                    # optional, overrides friendly_name
//   icon: mdi:ceiling-light          # optional, overrides entity icon
//   sub: "3 lights"                  # optional secondary label
//   show_state: true                 # optional, default true
//   tap_action: toggle|more-info|navigate|none   # default toggle
//   navigate: /lovelace/lights       # used when tap_action: navigate
// =============================================================================

if (!window.smartmorphicDefineCard) {
  window.smartmorphicDefineCard = function (tag, ctor) {
    const tryRegister = () => {
      const existing = customElements.get(tag);
      if (existing === ctor) return true;
      if (existing) return true;
      try { customElements.define(tag, ctor); return true; }
      catch (_) { return false; }
    };
    tryRegister();
    console.info("[" + tag + "] registered");
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 500;
      if (customElements.get(tag) !== ctor) {
        if (!customElements.get(tag)) {
          try {
            customElements.define(tag, ctor);
            console.info("[" + tag + "] re-registered (registry swap detected)");
          } catch (_) {}
        }
      }
      if (elapsed >= 30000) clearInterval(interval);
    }, 500);
  };
}

const TILE_ACTIVE_STATES = new Set([
  "on", "open", "playing", "home", "heat", "cool", "auto", "heat_cool", "dry", "fan_only",
]);
const TILE_INACTIVE_STATES = new Set([
  "off", "closed", "idle", "paused", "standby", "away", "not_home", "unavailable", "unknown",
]);

const isTileActive = (stateObj) => {
  if (!stateObj) return false;
  const s = stateObj.state;
  if (TILE_INACTIVE_STATES.has(s)) return false;
  if (TILE_ACTIVE_STATES.has(s)) return true;
  // Numeric sensors aren't really "active" — leave flat.
  if (!isNaN(parseFloat(s))) return false;
  return true;
};

const TILE_DOMAIN_ICONS = {
  light: "mdi:lightbulb",
  switch: "mdi:toggle-switch",
  binary_sensor: "mdi:radiobox-marked",
  cover: "mdi:window-shutter",
  script: "mdi:script-text-play",
  scene: "mdi:palette",
  input_boolean: "mdi:toggle-switch",
  fan: "mdi:fan",
  climate: "mdi:thermostat",
  media_player: "mdi:speaker",
  vacuum: "mdi:robot-vacuum",
  lock: "mdi:lock",
};

const TILE_DEGREE_PATTERN = /^°[CF]?$|^°$/;

const formatTileState = (stateObj) => {
  if (!stateObj) return "—";
  const raw = stateObj.state;
  if (raw === "unavailable") return "Unavailable";
  if (raw === "unknown") return "—";
  const unit = stateObj.attributes?.unit_of_measurement;
  const n = parseFloat(raw);
  if (!isNaN(n) && raw.trim() !== "") {
    const formatted = Number.isInteger(n) ? String(n) : n.toFixed(1);
    return unit ? `${formatted}${TILE_DEGREE_PATTERN.test(unit) ? "" : " "}${unit}` : formatted;
  }
  // Title-case the state
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, " ");
};

class SmartmorphicTileCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = {
      show_state: true,
      tap_action: "toggle",
      ...config,
      entity: config.entity ?? "",
    };
    this._rendered = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._render();
      this._rendered = true;
    } else {
      this._update();
    }
  }

  getCardSize() { return 2; }

  static getStubConfig(hass) {
    const candidates = hass
      ? Object.keys(hass.states ?? {}).filter((eid) =>
          ["light", "switch", "input_boolean"].includes(eid.split(".")[0]))
      : [];
    return { entity: candidates[0] ?? "" };
  }

  static getConfigElement() {
    return document.createElement("smartmorphic-tile-card-editor");
  }

  _stateObj() {
    return this._hass?.states?.[this._config.entity] ?? null;
  }

  _label() {
    if (this._config.name) return this._config.name;
    return this._stateObj()?.attributes?.friendly_name ?? this._config.entity;
  }

  _icon() {
    if (this._config.icon) return this._config.icon;
    const so = this._stateObj();
    if (so?.attributes?.icon) return so.attributes.icon;
    const domain = (this._config.entity || "").split(".")[0];
    return TILE_DOMAIN_ICONS[domain] ?? "mdi:circle-outline";
  }

  _onTap() {
    const action = this._config.tap_action;
    if (action === "none") return;
    if (action === "navigate" && this._config.navigate) {
      history.pushState(null, "", this._config.navigate);
      window.dispatchEvent(new Event("location-changed"));
      return;
    }
    if (action === "more-info") {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: this._config.entity },
        bubbles: true, composed: true,
      }));
      return;
    }
    // toggle (default)
    const entity = this._config.entity;
    if (!entity || !this._hass) return;
    const domain = entity.split(".")[0];
    const toggleDomains = new Set([
      "light", "switch", "fan", "input_boolean", "automation", "script", "media_player",
    ]);
    if (toggleDomains.has(domain)) {
      this._hass.callService(domain, "toggle", { entity_id: entity });
    } else if (domain === "cover") {
      const s = this._hass.states[entity]?.state;
      this._hass.callService("cover", s === "open" ? "close_cover" : "open_cover", { entity_id: entity });
    } else if (domain === "lock") {
      const s = this._hass.states[entity]?.state;
      this._hass.callService("lock", s === "locked" ? "unlock" : "lock", { entity_id: entity });
    } else {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: entity }, bubbles: true, composed: true,
      }));
    }
  }

  _render() {
    const style = `
      :host { display: block; }
      .card {
        background: var(--smartmorphic-surface, var(--ha-card-background, var(--card-background-color)));
        border-radius: var(--smartmorphic-radius, 16px);
        box-shadow: var(--smartmorphic-neu-raised,
          3px 3px 8px rgba(0, 0, 0, 0.22),
          -3px -3px 8px rgba(255, 255, 255, 0.04));
        padding: var(--smartmorphic-space-5, 16px);
        display: flex;
        flex-direction: column;
        gap: var(--smartmorphic-space-3, 8px);
        cursor: pointer;
        user-select: none;
        transition:
          box-shadow var(--smartmorphic-transition-base, 180ms ease),
          transform var(--smartmorphic-transition-base, 180ms ease);
      }
      .card:active {
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0, 0, 0, 0.30),
          inset -2px -2px 4px rgba(255, 255, 255, 0.04));
        transform: scale(0.995);
      }
      .top {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--smartmorphic-space-4, 12px);
        align-items: center;
        min-width: 0;
      }
      .icon-well {
        width: 38px;
        height: 38px;
        border-radius: var(--smartmorphic-radius-md, 12px);
        display: grid;
        place-items: center;
        background: var(--smartmorphic-off-tint, rgba(125,128,146,0.10));
        color: var(--secondary-text-color);
        transition:
          background var(--smartmorphic-transition-base, 180ms ease),
          color var(--smartmorphic-transition-base, 180ms ease),
          box-shadow var(--smartmorphic-transition-base, 180ms ease);
      }
      .icon-well ha-icon { --mdc-icon-size: 20px; }
      .card.active .icon-well {
        background: var(--smartmorphic-accent-glow, rgba(232, 101, 58, 0.35));
        color: var(--smartmorphic-accent, #e8653a);
        box-shadow:
          inset 0 2px 0 rgba(255, 255, 255, 0.18),
          0 0 0 1px var(--smartmorphic-accent-glow, rgba(232, 101, 58, 0.35));
      }
      .labels { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .name {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 600;
        font-size: 14px;
        line-height: 1.2;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color var(--smartmorphic-transition-base, 180ms ease);
      }
      .card.active .name { color: var(--smartmorphic-accent, #e8653a); }
      .sub {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 500;
        font-size: 11px;
        line-height: 1.3;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sub:empty { display: none; }
      .stat {
        font-family: var(--smartmorphic-font-display, 'Outfit', system-ui, sans-serif);
        font-weight: 500;
        font-size: 22px;
        line-height: 1;
        letter-spacing: -0.3px;
        color: var(--primary-text-color);
        transition: color var(--smartmorphic-transition-base, 180ms ease);
      }
      .card.active .stat { color: var(--smartmorphic-accent, #e8653a); }
      .stat:empty { display: none; }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="card" role="button" tabindex="0">
        <div class="top">
          <div class="icon-well"><ha-icon class="icon"></ha-icon></div>
          <div class="labels">
            <div class="name"></div>
            <div class="sub"></div>
          </div>
        </div>
        <div class="stat"></div>
      </div>
    `;

    const card = this.shadowRoot.querySelector(".card");
    card.addEventListener("click", () => this._onTap());
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._onTap();
      }
    });
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;
    const so = this._stateObj();
    card.classList.toggle("active", isTileActive(so));

    const iconEl = this.shadowRoot.querySelector(".icon");
    if (iconEl) iconEl.setAttribute("icon", this._icon());

    const nameEl = this.shadowRoot.querySelector(".name");
    if (nameEl) nameEl.textContent = this._label();

    const subEl = this.shadowRoot.querySelector(".sub");
    if (subEl) subEl.textContent = this._config.sub ?? "";

    const statEl = this.shadowRoot.querySelector(".stat");
    if (statEl) {
      statEl.textContent = this._config.show_state ? formatTileState(so) : "";
    }
  }
}

window.smartmorphicDefineCard("smartmorphic-tile-card", SmartmorphicTileCard);

// =============================================================================
// Visual editor
// =============================================================================
const TILE_EDITOR_LABELS = {
  entity: "Entity",
  name: "Name (optional)",
  icon: "Icon (optional)",
  sub: "Secondary label (optional)",
  show_state: "Show state value",
  tap_action: "Tap action",
  navigate: "Navigate path (used when tap action is Navigate)",
};

const TILE_EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: {} } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "sub", selector: { text: {} } },
  { name: "show_state", selector: { boolean: {} } },
  {
    name: "tap_action",
    selector: { select: { options: [
      { value: "toggle", label: "Toggle" },
      { value: "more-info", label: "More info" },
      { value: "navigate", label: "Navigate" },
      { value: "none", label: "None" },
    ] } },
  },
  { name: "navigate", selector: { text: {} } },
];

class SmartmorphicTileCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { show_state: true, tap_action: "toggle", ...config };
    this._ensureForm();
    this._form.data = this._config;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _ensureForm() {
    if (this._form) return;
    this._form = document.createElement("ha-form");
    this._form.schema = TILE_EDITOR_SCHEMA;
    this._form.computeLabel = (s) => TILE_EDITOR_LABELS[s.name] ?? s.name;
    this._form.addEventListener("value-changed", (e) => this._valueChanged(e));
    if (this._hass) this._form.hass = this._hass;
    this.appendChild(this._form);
  }

  _valueChanged(e) {
    const next = { ...this._config, ...e.detail.value };
    this._config = next;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: next }, bubbles: true, composed: true,
    }));
  }
}

window.smartmorphicDefineCard("smartmorphic-tile-card-editor", SmartmorphicTileCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-tile-card",
  name: "Smartmorphic Tile",
  description: "Universal entity tile with active-state icon well, label, and state stat.",
  preview: false,
});

console.info(
  "%c SMARTMORPHIC-TILE-CARD %c v0.1.0 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
