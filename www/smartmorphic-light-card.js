// =============================================================================
// Smartmorphic — light card (LightTileCard recipe)
//
// Tile + inline brightness control. Layout:
//   Top row: ActiveIconWell + name/sub + Toggle (44×26 pill)
//   Below (only when on): sun icon (12px) + thin slider (track 5, knob 11)
//                         + 10px mono % readout, right-aligned
//
// Interactions:
//   - Tap card body / icon / toggle → light.toggle
//   - Drag slider → light.turn_on with brightness_pct
//   - No hold-expand, no color-temp wedge — that lives in the more-info dialog.
//
// Config:
//   type: custom:smartmorphic-light-card
//   entity: light.living_room
//   name: Living Room       # optional, defaults to friendly_name
//   icon: mdi:floor-lamp    # optional, defaults to entity icon or mdi:lightbulb
//   sub: "Pendant"          # optional secondary label (defaults to area name)
//
// Style aligned to design_handoff_smartmorphic_theme (see style-guide branch).
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

class SmartmorphicLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._dragging = false;
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
    return 1;
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

  _sub() {
    if (this._config.sub != null) return this._config.sub;
    const s = this._stateObj();
    return s?.attributes?.area_id ?? "";
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
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--smartmorphic-space-4, 12px);
        cursor: pointer;
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
      .text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .name {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 600;
        font-size: 14px;
        line-height: 1.2;
        color: var(--primary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: color var(--smartmorphic-transition-base, 180ms ease);
      }
      .card.on .name { color: var(--smartmorphic-accent, #e8653a); }
      .sub {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 500;
        font-size: 11px;
        line-height: 1.4;
        color: var(--secondary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .sub:empty { display: none; }

      /* Toggle (44×26 pill, knob 22×22, 2px inset). */
      .toggle {
        position: relative;
        width: 44px;
        height: 26px;
        border-radius: 999px;
        background: var(--smartmorphic-toggle-off, #c4c7d4);
        flex-shrink: 0;
        cursor: pointer;
        transition:
          background var(--smartmorphic-transition-base, 180ms ease),
          box-shadow var(--smartmorphic-transition-base, 180ms ease);
      }
      .toggle::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0,0,0,0.20);
        transition: transform var(--smartmorphic-transition-base, 180ms ease);
      }
      .card.on .toggle {
        background: var(--smartmorphic-accent, #e8653a);
        box-shadow: 0 0 10px var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
      }
      .card.on .toggle::after { transform: translateX(18px); }

      /* Brightness row — only when on. */
      .bright {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--smartmorphic-space-3, 8px);
        margin-top: var(--smartmorphic-space-4, 12px);
      }
      .sun {
        --mdc-icon-size: 12px;
        color: var(--secondary-text-color);
        display: grid;
        place-items: center;
      }
      .bright-value {
        font-family: var(--smartmorphic-font-mono, 'JetBrains Mono', ui-monospace, monospace);
        font-size: 10px;
        line-height: 1;
        color: var(--secondary-text-color);
        min-width: 28px;
        text-align: right;
        font-feature-settings: "tnum";
      }

      /* Slider — 5px track, 11px knob. */
      input[type="range"].slider {
        -webkit-appearance: none; appearance: none;
        width: 100%;
        height: 18px;            /* hit target */
        background: transparent;
        cursor: pointer;
        margin: 0;
        padding: 0;
      }
      input[type="range"].slider::-webkit-slider-runnable-track {
        height: 5px;
        border-radius: 999px;
        background: var(--smartmorphic-surface, var(--ha-card-background));
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0,0,0,0.25),
          inset -2px -2px 4px rgba(255,255,255,0.05));
      }
      input[type="range"].slider::-moz-range-track {
        height: 5px;
        border-radius: 999px;
        background: var(--smartmorphic-surface, var(--ha-card-background));
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0,0,0,0.25),
          inset -2px -2px 4px rgba(255,255,255,0.05));
      }
      input[type="range"].slider::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 11px; height: 11px;
        border-radius: 50%;
        background: #fff;
        box-shadow:
          1px 1px 3px rgba(0,0,0,0.25),
          0 0 0 1px var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
        margin-top: -3px;  /* (5 - 11) / 2 */
        border: none;
        transition: transform 120ms ease;
      }
      input[type="range"].slider::-moz-range-thumb {
        width: 11px; height: 11px;
        border-radius: 50%;
        background: #fff;
        box-shadow:
          1px 1px 3px rgba(0,0,0,0.25),
          0 0 0 1px var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
        border: none;
        transition: transform 120ms ease;
      }
      input[type="range"].slider:active::-webkit-slider-thumb { transform: scale(1.25); }
      input[type="range"].slider:active::-moz-range-thumb { transform: scale(1.25); }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="card">
        <div class="header" role="button" tabindex="0">
          <div class="icon-well"><ha-icon icon="${this._icon()}"></ha-icon></div>
          <div class="text">
            <div class="name"></div>
            <div class="sub"></div>
          </div>
          <div class="toggle" role="switch" aria-checked="false"></div>
        </div>
        <div class="bright" hidden>
          <div class="sun"><ha-icon icon="mdi:white-balance-sunny"></ha-icon></div>
          <input class="slider" type="range" min="1" max="100" value="50"
                 aria-label="Brightness" />
          <div class="bright-value">0%</div>
        </div>
      </div>
    `;

    const header = this.shadowRoot.querySelector(".header");
    header.addEventListener("click", () => this._toggle());
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._toggle();
      }
    });

    const slider = this.shadowRoot.querySelector(".slider");
    slider.addEventListener("input", (e) => {
      this._dragging = true;
      this.shadowRoot.querySelector(".bright-value").textContent = `${e.target.value}%`;
    });
    slider.addEventListener("change", (e) => {
      this._dragging = false;
      this._setBrightness(Number(e.target.value));
    });

    this._update();
  }

  _update() {
    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;
    const on = this._isOn();
    card.classList.toggle("on", on);

    this.shadowRoot.querySelector(".name").textContent = this._name();
    this.shadowRoot.querySelector(".sub").textContent = this._sub();

    const iconEl = this.shadowRoot.querySelector(".icon-well ha-icon");
    if (iconEl) iconEl.setAttribute("icon", this._icon());

    const toggle = this.shadowRoot.querySelector(".toggle");
    toggle.setAttribute("aria-checked", on ? "true" : "false");

    const bright = this.shadowRoot.querySelector(".bright");
    bright.hidden = !on;

    if (on && !this._dragging) {
      const pct = this._brightnessPct() || 1;
      const slider = this.shadowRoot.querySelector(".slider");
      if (document.activeElement !== slider) slider.value = String(pct);
      this.shadowRoot.querySelector(".bright-value").textContent = `${pct}%`;
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
  sub: "Sub-label (optional)",
};

const LIGHT_EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "light" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "sub", selector: { text: {} } },
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
  description: "Light tile with inline brightness slider (LightTileCard recipe).",
  preview: false,
});

console.info(
  "%c SMARTMORPHIC-LIGHT-CARD %c v0.6.0 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
