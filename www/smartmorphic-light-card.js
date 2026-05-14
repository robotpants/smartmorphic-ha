// =============================================================================
// Smartmorphic — light card
//
// Custom Lovelace card for a light entity. Collapsed: neumorphic well, icon,
// name, on/off + brightness secondary. Tap toggles. Hold-press (500ms)
// expands to reveal brightness and color-temp sliders inline (no modal).
//
// Config:
//   type: custom:smartmorphic-light-card
//   entity: light.living_room
//   name: Living Room       # optional, defaults to friendly_name
//   icon: mdi:floor-lamp    # optional, defaults to entity icon or mdi:lightbulb
//
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

const HOLD_MS = 500;

class SmartmorphicLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._expanded = false;
    this._holdTimer = null;
    this._suppressClick = false;
  }

  setConfig(config) {
    if (config.entity && !config.entity.startsWith("light.")) {
      throw new Error("smartmorphic-light-card: 'entity' must be a light");
    }
    this._config = { ...config, entity: config.entity ?? "" };
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
    return this._expanded ? 4 : 2;
  }

  static getStubConfig(hass) {
    const lights = hass ? Object.keys(hass.states ?? {}).filter((e) => e.startsWith("light.")) : [];
    return { entity: lights[0] ?? "" };
  }

  static getConfigElement() {
    return document.createElement("smartmorphic-light-card-editor");
  }

  _stateObj() {
    return this._hass?.states?.[this._config.entity] ?? null;
  }

  _isOn() {
    return this._stateObj()?.state === "on";
  }

  _name() {
    if (this._config.name) return this._config.name;
    return this._stateObj()?.attributes?.friendly_name ?? this._config.entity;
  }

  _icon() {
    if (this._config.icon) return this._config.icon;
    return this._stateObj()?.attributes?.icon ?? "mdi:lightbulb";
  }

  _brightnessPct() {
    const b = this._stateObj()?.attributes?.brightness;
    if (b == null) return 0;
    return Math.round((b / 255) * 100);
  }

  _supportsColorTemp() {
    const modes = this._stateObj()?.attributes?.supported_color_modes ?? [];
    return modes.includes("color_temp");
  }

  _colorTempKelvin() {
    return this._stateObj()?.attributes?.color_temp_kelvin ?? null;
  }

  _kelvinRange() {
    const s = this._stateObj();
    return {
      min: s?.attributes?.min_color_temp_kelvin ?? 2000,
      max: s?.attributes?.max_color_temp_kelvin ?? 6500,
    };
  }

  _secondaryText() {
    if (!this._config.entity) return "No entity";
    if (!this._stateObj()) return "Unavailable";
    if (!this._isOn()) return "Off";
    const pct = this._brightnessPct();
    return pct > 0 ? `On · ${pct}%` : "On";
  }

  _toggle() {
    if (!this._hass || !this._config.entity) return;
    this._hass.callService("light", "toggle", { entity_id: this._config.entity });
  }

  _setBrightness(pct) {
    if (!this._hass || !this._config.entity) return;
    this._hass.callService("light", "turn_on", {
      entity_id: this._config.entity,
      brightness_pct: pct,
    });
  }

  _setKelvin(k) {
    if (!this._hass || !this._config.entity) return;
    this._hass.callService("light", "turn_on", {
      entity_id: this._config.entity,
      kelvin: k,
    });
  }

  _onPointerDown() {
    this._suppressClick = false;
    clearTimeout(this._holdTimer);
    this._holdTimer = setTimeout(() => {
      this._suppressClick = true;
      this._setExpanded(!this._expanded);
    }, HOLD_MS);
  }

  _onPointerUp() {
    clearTimeout(this._holdTimer);
  }

  _onPointerCancel() {
    clearTimeout(this._holdTimer);
  }

  _onClick(e) {
    if (this._suppressClick) {
      this._suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this._toggle();
  }

  _setExpanded(value) {
    this._expanded = value;
    const card = this.shadowRoot.querySelector(".card");
    if (card) card.classList.toggle("expanded", value);
    const panel = this.shadowRoot.querySelector(".panel");
    if (panel) panel.hidden = !value;
    this._update();
  }

  _render() {
    const style = `
      :host { display: block; }
      .card {
        background: var(--smartmorphic-surface, var(--ha-card-background, var(--card-background-color)));
        border-radius: var(--smartmorphic-radius, 16px);
        box-shadow: var(--smartmorphic-neu-raised,
          3px 3px 8px rgba(0,0,0,0.22),
          -3px -3px 8px rgba(255,255,255,0.04));
        padding: var(--smartmorphic-space-5, 16px);
        transition: box-shadow var(--smartmorphic-transition-base, 180ms ease);
        user-select: none;
      }
      .header {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-areas: "icon text";
        align-items: center;
        gap: var(--smartmorphic-space-4, 12px);
        cursor: pointer;
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
      .icon-well ha-icon { --mdc-icon-size: 20px; }
      .card.on .icon-well {
        background: var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
        box-shadow:
          inset 0 2px 0 rgba(255,255,255,0.55),
          inset 0 -2px 4px rgba(0,0,0,0.30),
          0 0 0 1px var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
        color: var(--smartmorphic-accent, #e8653a);
      }
      .text { grid-area: text; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .name {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 600; font-size: 14px; line-height: 1.2;
        color: var(--primary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: color var(--smartmorphic-transition-base, 180ms ease);
      }
      .card.on .name { color: var(--smartmorphic-accent, #e8653a); }
      .secondary {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 500; font-size: 11px; line-height: 1.4;
        color: var(--secondary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      .panel {
        margin-top: var(--smartmorphic-space-4, 12px);
        padding-top: var(--smartmorphic-space-4, 12px);
        border-top: 1px solid var(--divider-color, rgba(125,128,146,0.10));
        display: flex; flex-direction: column; gap: var(--smartmorphic-space-4, 12px);
      }
      .row { display: flex; flex-direction: column; gap: var(--smartmorphic-space-2, 6px); }
      .row-label {
        display: flex; justify-content: space-between;
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 500; font-size: 11px;
        color: var(--secondary-text-color);
      }
      .row-label .value {
        font-family: var(--smartmorphic-font-mono, 'JetBrains Mono', monospace);
        letter-spacing: 0.5px;
      }
      input[type="range"] {
        -webkit-appearance: none; appearance: none;
        width: 100%; height: 22px; background: transparent;
        cursor: pointer;
      }
      input[type="range"]::-webkit-slider-runnable-track {
        height: 8px; border-radius: 999px;
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0,0,0,0.25),
          inset -2px -2px 4px rgba(255,255,255,0.05));
        background: var(--smartmorphic-surface, var(--ha-card-background));
      }
      input[type="range"]::-moz-range-track {
        height: 8px; border-radius: 999px;
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0,0,0,0.25),
          inset -2px -2px 4px rgba(255,255,255,0.05));
        background: var(--smartmorphic-surface, var(--ha-card-background));
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 18px; height: 18px; border-radius: 50%;
        background: #ffffff;
        box-shadow:
          1px 1px 3px rgba(0,0,0,0.25),
          0 0 0 1px rgba(232,101,58,0.35);
        margin-top: -5px;
        border: none;
        transition: transform 120ms ease;
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px; height: 18px; border-radius: 50%;
        background: #ffffff;
        box-shadow:
          1px 1px 3px rgba(0,0,0,0.25),
          0 0 0 1px rgba(232,101,58,0.35);
        border: none;
        transition: transform 120ms ease;
      }
      input[type="range"]:active::-webkit-slider-thumb { transform: scale(1.15); }
      input[type="range"]:active::-moz-range-thumb { transform: scale(1.15); }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="card">
        <div class="header" role="button" tabindex="0">
          <div class="icon-well"><ha-icon icon="${this._icon()}"></ha-icon></div>
          <div class="text">
            <div class="name"></div>
            <div class="secondary"></div>
          </div>
        </div>
        <div class="panel" hidden>
          <div class="row brightness-row">
            <div class="row-label"><span>Brightness</span><span class="value brightness-value"></span></div>
            <input class="brightness" type="range" min="1" max="100" value="50" />
          </div>
          <div class="row temp-row" hidden>
            <div class="row-label"><span>Color temperature</span><span class="value temp-value"></span></div>
            <input class="temp" type="range" min="2000" max="6500" value="3000" />
          </div>
        </div>
      </div>
    `;

    const header = this.shadowRoot.querySelector(".header");
    header.addEventListener("pointerdown", () => this._onPointerDown());
    header.addEventListener("pointerup", () => this._onPointerUp());
    header.addEventListener("pointerleave", () => this._onPointerCancel());
    header.addEventListener("pointercancel", () => this._onPointerCancel());
    header.addEventListener("click", (e) => this._onClick(e));
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._toggle(); }
    });

    const bSlider = this.shadowRoot.querySelector(".brightness");
    bSlider.addEventListener("change", (e) => this._setBrightness(Number(e.target.value)));

    const tSlider = this.shadowRoot.querySelector(".temp");
    tSlider.addEventListener("change", (e) => this._setKelvin(Number(e.target.value)));

    this._update();
  }

  _update() {
    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;
    const on = this._isOn();
    card.classList.toggle("on", on);
    this.shadowRoot.querySelector(".name").textContent = this._name();
    this.shadowRoot.querySelector(".secondary").textContent = this._secondaryText();

    const iconEl = this.shadowRoot.querySelector(".icon-well ha-icon");
    if (iconEl) iconEl.setAttribute("icon", this._icon());

    if (this._expanded) {
      const pct = this._brightnessPct() || 50;
      const bSlider = this.shadowRoot.querySelector(".brightness");
      if (document.activeElement !== bSlider) bSlider.value = String(pct);
      this.shadowRoot.querySelector(".brightness-value").textContent = `${pct}%`;

      const tempRow = this.shadowRoot.querySelector(".temp-row");
      if (this._supportsColorTemp()) {
        tempRow.hidden = false;
        const range = this._kelvinRange();
        const tSlider = this.shadowRoot.querySelector(".temp");
        tSlider.min = String(range.min);
        tSlider.max = String(range.max);
        const k = this._colorTempKelvin() ?? Math.round((range.min + range.max) / 2);
        if (document.activeElement !== tSlider) tSlider.value = String(k);
        this.shadowRoot.querySelector(".temp-value").textContent = `${k}K`;
      } else {
        tempRow.hidden = true;
      }
    }
  }
}

window.smartmorphicDefineCard("smartmorphic-light-card", SmartmorphicLightCard);

// =============================================================================
// Visual editor — uses HA's built-in <ha-form> for entity + icon pickers.
// =============================================================================
const LIGHT_EDITOR_LABELS = {
  entity: "Light entity",
  name: "Name (optional)",
  icon: "Icon (optional)",
};

const LIGHT_EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "light" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
];

class SmartmorphicLightCardEditor extends HTMLElement {
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
    this._form.schema = LIGHT_EDITOR_SCHEMA;
    this._form.computeLabel = (s) => LIGHT_EDITOR_LABELS[s.name] ?? s.name;
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

window.smartmorphicDefineCard("smartmorphic-light-card-editor", SmartmorphicLightCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-light-card",
  name: "Smartmorphic Light Card",
  description: "Light tile. Tap toggles, hold expands to brightness + color temp.",
  preview: false,
});

console.info(
  "%c SMARTMORPHIC-LIGHT-CARD %c v0.5.2 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
