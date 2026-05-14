// =============================================================================
// Smartmorphic — room card
//
// Custom Lovelace card. Renders a room as a single soft surface with a paired
// icon well (flat tinted when idle, accent-glow when any of the watched
// entities are active). Tap navigates to a detail view.
//
// Config:
//   type: custom:smartmorphic-room-card
//   name: Living Room
//   icon: mdi:sofa
//   entities:                       # list watched for "active" state
//     - light.living_room
//     - media_player.living_room
//   temperature: sensor.living_room_temp   # optional, shown in secondary
//   navigate: /smartmorphic/living-room    # optional, tap target
//
// Reads --smartmorphic-* CSS variables from the active theme.
// Style aligned to design_handoff_smartmorphic_theme (see style-guide branch).
// =============================================================================

// =============================================================================
// Canonical register helper — installs on window so all cards share it.
//
// THE problem (diagnosed via live console state):
//   1. Our scripts load via extra_module_url and call customElements.define().
//   2. At that moment, customElements is the NATIVE CustomElementRegistry —
//      our class registers there fine.
//   3. Mushroom HACS loads AFTER us and brings the
//      scoped-custom-element-registry polyfill, which REPLACES
//      window.customElements with its own fresh, empty registry.
//   4. Polyfill does NOT adopt definitions that existed on the native registry.
//   5. HA's create-element-base uses the new (polyfilled) customElements and
//      sees no smartmorphic-* tags → "Custom element not found".
//
// Fix: poll customElements.get(tag) and re-define if missing. Idempotent —
// each call either succeeds, or no-ops if our class is already registered
// in the current registry. Stops polling after 30s.
// =============================================================================
if (!window.smartmorphicDefineCard) {
  window.smartmorphicDefineCard = function (tag, ctor) {
    const tryRegister = () => {
      const existing = customElements.get(tag);
      if (existing === ctor) return true;
      if (existing) {
        // Another class already claims this tag — leave it alone.
        return true;
      }
      try {
        customElements.define(tag, ctor);
        return true;
      } catch (_) {
        return false;
      }
    };
    tryRegister();
    console.info("[" + tag + "] registered");
    // Re-register if the registry gets replaced (e.g. by Mushroom's polyfill
    // loading after us). Cheap poll, stops after 30s.
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

const ACTIVE_STATES = new Set(["on", "open", "playing", "home", "heat", "cool", "auto"]);

const isActive = (stateObj) => {
  if (!stateObj) return false;
  const s = stateObj.state;
  if (s === "unavailable" || s === "unknown" || s === "off" || s === "closed" || s === "idle" || s === "paused" || s === "standby" || s === "away" || s === "not_home") {
    return false;
  }
  return ACTIVE_STATES.has(s) || s !== "off";
};

class SmartmorphicRoomCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    if (!config.name) throw new Error("smartmorphic-room-card: 'name' is required");
    this._config = {
      ...config,
      entities: Array.isArray(config.entities) ? config.entities : [],
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

  getCardSize() {
    return 2;
  }

  static getStubConfig() {
    return {
      name: "Living Room",
      icon: "mdi:sofa",
      entities: [],
    };
  }

  static getConfigElement() {
    return document.createElement("smartmorphic-room-card-editor");
  }

  _activeCount() {
    if (!this._hass || !this._config) return 0;
    return this._config.entities.filter((eid) => isActive(this._hass.states[eid])).length;
  }

  _temperatureText() {
    const eid = this._config.temperature;
    if (!eid || !this._hass) return null;
    const stateObj = this._hass.states[eid];
    if (!stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown") return null;
    const unit = stateObj.attributes?.unit_of_measurement ?? "°";
    return `${stateObj.state}${unit}`;
  }

  _secondaryText() {
    const total = this._config.entities.length;
    const temp = this._temperatureText();
    if (total === 0) return temp ?? "";
    const counts = `${this._activeCount()} of ${total} active`;
    return temp ? `${temp} · ${counts}` : counts;
  }

  _onTap() {
    if (this._config.navigate) {
      history.pushState(null, "", this._config.navigate);
      window.dispatchEvent(new Event("location-changed"));
    }
  }

  _render() {
    const style = `
      :host {
        display: block;
      }
      .card {
        background: var(--smartmorphic-surface, var(--ha-card-background, var(--card-background-color)));
        border-radius: var(--smartmorphic-radius, 16px);
        box-shadow: var(--smartmorphic-neu-raised,
          3px 3px 8px rgba(0, 0, 0, 0.22),
          -3px -3px 8px rgba(255, 255, 255, 0.04));
        padding: var(--smartmorphic-space-5, 16px);
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-areas: "icon text";
        align-items: center;
        gap: var(--smartmorphic-space-4, 12px);
        cursor: pointer;
        transition:
          box-shadow var(--smartmorphic-transition-base, 180ms ease),
          transform var(--smartmorphic-transition-base, 180ms ease);
        user-select: none;
        position: relative;
      }
      .card:active {
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0, 0, 0, 0.30),
          inset -2px -2px 4px rgba(255, 255, 255, 0.04));
        transform: scale(0.995);
      }
      .icon-well {
        grid-area: icon;
        width: 38px;
        height: 38px;
        border-radius: var(--smartmorphic-radius-md, 12px);
        display: grid;
        place-items: center;
        background: var(--smartmorphic-off-tint, rgba(125,128,146,0.10));
        color: var(--secondary-text-color);
        transition:
          background var(--smartmorphic-transition-base, 180ms ease),
          box-shadow var(--smartmorphic-transition-base, 180ms ease),
          color var(--smartmorphic-transition-base, 180ms ease);
      }
      .icon-well ha-icon, .icon-well ha-svg-icon {
        --mdc-icon-size: 20px;
      }
      .card.active .icon-well {
        background: var(--smartmorphic-accent-glow, rgba(232, 101, 58, 0.35));
        box-shadow:
          inset 0 2px 0 rgba(255, 255, 255, 0.55),
          inset 0 -2px 4px rgba(0, 0, 0, 0.30),
          0 0 0 1px var(--smartmorphic-accent-glow, rgba(232, 101, 58, 0.35));
        color: var(--smartmorphic-accent, #e8653a);
      }
      .text {
        grid-area: text;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
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
      .card.active .name {
        color: var(--smartmorphic-accent, #e8653a);
      }
      .secondary {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 500;
        font-size: 11px;
        line-height: 1.4;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="card" role="button" tabindex="0">
        <div class="icon-well">
          <ha-icon icon="${this._config.icon ?? "mdi:home"}"></ha-icon>
        </div>
        <div class="text">
          <div class="name">${this._escape(this._config.name)}</div>
          <div class="secondary"></div>
        </div>
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
    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;
    const active = this._activeCount() > 0;
    card.classList.toggle("active", active);
    const sec = this.shadowRoot.querySelector(".secondary");
    if (sec) sec.textContent = this._secondaryText();
  }

  _escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }
}

window.smartmorphicDefineCard("smartmorphic-room-card", SmartmorphicRoomCard);

// =============================================================================
// Visual editor
// =============================================================================
const ROOM_EDITOR_LABELS = {
  name: "Room name",
  icon: "Icon",
  entities: "Entities to watch (active when any is on/playing/open)",
  temperature: "Temperature sensor (optional)",
  navigate: "Tap navigates to (optional, e.g. /smartmorphic/living-room)",
};

const ROOM_EDITOR_SCHEMA = [
  { name: "name", required: true, selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "entities", selector: { entity: { multiple: true } } },
  { name: "temperature", selector: { entity: { filter: { device_class: "temperature" } } } },
  { name: "navigate", selector: { text: {} } },
];

class SmartmorphicRoomCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
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
    this._form.schema = ROOM_EDITOR_SCHEMA;
    this._form.computeLabel = (s) => ROOM_EDITOR_LABELS[s.name] ?? s.name;
    this._form.addEventListener("value-changed", (e) => this._valueChanged(e));
    if (this._hass) this._form.hass = this._hass;
    this.appendChild(this._form);
  }

  _valueChanged(e) {
    const next = { ...this._config, ...e.detail.value };
    this._config = next;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: next },
      bubbles: true,
      composed: true,
    }));
  }
}

window.smartmorphicDefineCard("smartmorphic-room-card-editor", SmartmorphicRoomCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-room-card",
  name: "Smartmorphic Room Card",
  description: "Neumorphic room tile with active-state icon well.",
  preview: false,
});

console.info(
  "%c SMARTMORPHIC-ROOM-CARD %c v0.5.2 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
