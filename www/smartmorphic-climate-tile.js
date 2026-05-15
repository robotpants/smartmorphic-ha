// =============================================================================
// Smartmorphic — climate tile
//
// Per-zone thermostat tile. Implements the export's ClimateTile + ClimateRing
// recipe:
//
//   - Raised card with two layout modes:
//       compact: 38px icon well + name + target sub + 64px SVG ring
//       full:    same top row + ring, plus mode segmented control row
//                (Heat / Cool / Auto / Off) and humidity/delta row
//   - Ring: concentric SVG circles, outer = muted track, inner = accent
//     stroke with dash-offset by (current - min) / (max - min). Center
//     label = current temp + ° suffix.
//   - Mode chips: 4-wide grid, raised-sm inactive, neu-pressed + accent
//     active.
//
// Config:
//   type: custom:smartmorphic-climate-tile
//   entity: climate.living_room
//   name: Living Room                  # optional
//   icon: mdi:sofa                     # optional
//   layout: full|compact               # default "full"
//   humidity: sensor.living_humidity   # optional
//   min: 60                            # ring range, default 60
//   max: 80                            # ring range, default 80
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

const CLIMATE_MODES = [
  { key: "heat", icon: "mdi:fire", label: "Heat" },
  { key: "cool", icon: "mdi:snowflake", label: "Cool" },
  { key: "auto", icon: "mdi:autorenew", label: "Auto" },
  { key: "off",  icon: "mdi:power",     label: "Off"  },
];

class SmartmorphicClimateTile extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = {
      layout: "full",
      min: 60,
      max: 80,
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

  getCardSize() { return this._config?.layout === "compact" ? 2 : 4; }

  static getStubConfig(hass) {
    const candidates = hass
      ? Object.keys(hass.states ?? {}).filter((eid) => eid.startsWith("climate."))
      : [];
    return { entity: candidates[0] ?? "", layout: "full" };
  }

  static getConfigElement() {
    return document.createElement("smartmorphic-climate-tile-editor");
  }

  _stateObj() { return this._hass?.states?.[this._config.entity] ?? null; }
  _humidityObj() {
    const eid = this._config.humidity;
    return eid && this._hass ? this._hass.states[eid] : null;
  }

  _name() {
    if (this._config.name) return this._config.name;
    return this._stateObj()?.attributes?.friendly_name ?? this._config.entity;
  }

  _icon() {
    if (this._config.icon) return this._config.icon;
    return this._stateObj()?.attributes?.icon ?? "mdi:thermostat";
  }

  _currentTemp() {
    const a = this._stateObj()?.attributes;
    return a?.current_temperature ?? null;
  }

  _targetTemp() {
    const a = this._stateObj()?.attributes;
    return a?.temperature ?? a?.target_temp_low ?? null;
  }

  _activeMode() {
    return this._stateObj()?.state ?? "off";
  }

  _setMode(mode) {
    if (!this._hass || !this._config.entity) return;
    this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this._config.entity,
      hvac_mode: mode,
    });
  }

  _bump(delta) {
    const target = this._targetTemp();
    if (target == null) return;
    this._hass.callService("climate", "set_temperature", {
      entity_id: this._config.entity,
      temperature: Math.round((target + delta) * 10) / 10,
    });
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
        gap: var(--smartmorphic-space-4, 12px);
        user-select: none;
      }

      .top {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--smartmorphic-space-4, 12px);
        min-width: 0;
      }
      .icon-well {
        width: 38px;
        height: 38px;
        border-radius: var(--smartmorphic-radius-md, 12px);
        background: var(--smartmorphic-off-tint, rgba(125,128,146,0.10));
        display: grid;
        place-items: center;
        color: var(--secondary-text-color);
        transition: all var(--smartmorphic-transition-base, 180ms ease);
      }
      .icon-well ha-icon { --mdc-icon-size: 20px; }
      .card.active .icon-well {
        background: var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
        color: var(--smartmorphic-accent, #e8653a);
        box-shadow:
          inset 0 2px 0 rgba(255,255,255,0.18),
          0 0 0 1px var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
      }
      .labels { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .name {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 600;
        font-size: 14px;
        line-height: 1.2;
        color: var(--primary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: color var(--smartmorphic-transition-base, 180ms ease);
      }
      .card.active .name { color: var(--smartmorphic-accent, #e8653a); }
      .target {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 500;
        font-size: 11px;
        color: var(--secondary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      .ring {
        position: relative;
        width: 56px;
        height: 56px;
        flex-shrink: 0;
      }
      .ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      .ring .track {
        fill: none;
        stroke: var(--smartmorphic-off-tint, rgba(125,128,146,0.30));
        stroke-width: 3;
      }
      .ring .arc {
        fill: none;
        stroke: var(--smartmorphic-accent, #e8653a);
        stroke-width: 3;
        stroke-linecap: round;
        filter: drop-shadow(0 0 4px var(--smartmorphic-accent-glow, rgba(232,101,58,0.50)));
        transition: stroke-dashoffset var(--smartmorphic-transition-base, 180ms ease);
      }
      .ring .center {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        font-family: var(--smartmorphic-font-display, 'Outfit', system-ui, sans-serif);
        font-weight: 500;
        font-size: 18px;
        letter-spacing: -0.3px;
        color: var(--primary-text-color);
      }
      .ring .center sup {
        font-size: 42%;
        vertical-align: top;
        line-height: 1;
        margin-left: 1px;
        color: var(--secondary-text-color);
      }

      .modes {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .mode {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 6px 8px;
        border-radius: 999px;
        background: var(--smartmorphic-surface, var(--ha-card-background));
        box-shadow: var(--smartmorphic-neu-raised-sm,
          2px 2px 4px rgba(0,0,0,0.18),
          -2px -2px 4px rgba(255,255,255,0.03));
        color: var(--secondary-text-color);
        cursor: pointer;
        transition: all var(--smartmorphic-transition-base, 180ms ease);
        user-select: none;
      }
      .mode ha-icon { --mdc-icon-size: 16px; }
      .mode .lbl {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 600;
        font-size: 10px;
        letter-spacing: 0.3px;
      }
      .mode.active {
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0,0,0,0.28),
          inset -2px -2px 4px rgba(255,255,255,0.03));
        color: var(--smartmorphic-accent, #e8653a);
      }

      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-size: 11px;
        color: var(--secondary-text-color);
      }
      .meta .humidity {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .meta .humidity ha-icon {
        --mdc-icon-size: 14px;
        color: var(--smartmorphic-info, #5aa9e6);
      }
      .meta .delta {
        font-family: var(--smartmorphic-font-mono, 'JetBrains Mono', monospace);
        font-size: 11px;
        font-weight: 600;
        color: var(--secondary-text-color);
      }
      .meta .delta.warm { color: var(--smartmorphic-warm, #e8653a); }
      .meta .delta.cool { color: var(--smartmorphic-info, #5aa9e6); }
      .bumps {
        display: flex; gap: 6px;
      }
      .bump {
        width: 26px; height: 26px;
        border-radius: 8px;
        background: var(--smartmorphic-surface, var(--ha-card-background));
        box-shadow: var(--smartmorphic-neu-raised-sm,
          2px 2px 4px rgba(0,0,0,0.18),
          -2px -2px 4px rgba(255,255,255,0.03));
        display: grid;
        place-items: center;
        cursor: pointer;
        color: var(--secondary-text-color);
        transition: all var(--smartmorphic-transition-base, 180ms ease);
      }
      .bump:active {
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0,0,0,0.28),
          inset -2px -2px 4px rgba(255,255,255,0.03));
      }
      .bump ha-icon { --mdc-icon-size: 14px; }

      .card.compact .modes,
      .card.compact .meta { display: none; }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="card">
        <div class="top">
          <div class="icon-well"><ha-icon class="icon"></ha-icon></div>
          <div class="labels">
            <div class="name"></div>
            <div class="target"></div>
          </div>
          <div class="ring">
            <svg viewBox="0 0 64 64">
              <circle class="track" cx="32" cy="32" r="28"></circle>
              <circle class="arc" cx="32" cy="32" r="28"
                stroke-dasharray="175.93" stroke-dashoffset="175.93"></circle>
            </svg>
            <div class="center"><span class="current">—</span><sup>°</sup></div>
          </div>
        </div>

        <div class="modes">
          ${CLIMATE_MODES.map(m => `
            <div class="mode" data-mode="${m.key}">
              <ha-icon icon="${m.icon}"></ha-icon>
              <div class="lbl">${m.label}</div>
            </div>
          `).join("")}
        </div>

        <div class="meta">
          <div class="humidity"></div>
          <div class="bumps">
            <div class="bump" data-bump="-1"><ha-icon icon="mdi:minus"></ha-icon></div>
            <div class="delta"></div>
            <div class="bump" data-bump="1"><ha-icon icon="mdi:plus"></ha-icon></div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll(".mode").forEach((el) => {
      el.addEventListener("click", () => this._setMode(el.dataset.mode));
    });
    this.shadowRoot.querySelectorAll(".bump").forEach((el) => {
      el.addEventListener("click", () => this._bump(parseFloat(el.dataset.bump)));
    });

    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;

    const so = this._stateObj();
    const mode = this._activeMode();
    const active = mode && mode !== "off" && mode !== "unavailable" && mode !== "unknown";
    card.classList.toggle("active", !!active);
    card.classList.toggle("compact", this._config.layout === "compact");

    this.shadowRoot.querySelector(".icon").setAttribute("icon", this._icon());
    this.shadowRoot.querySelector(".name").textContent = this._name();

    const target = this._targetTemp();
    this.shadowRoot.querySelector(".target").textContent =
      target != null ? `Target ${Math.round(target)}°` : "";

    const current = this._currentTemp();
    const centerEl = this.shadowRoot.querySelector(".current");
    if (centerEl) centerEl.textContent = current != null ? String(Math.round(current)) : "—";

    // Ring fill
    const circumference = 2 * Math.PI * 28; // r=28
    const { min, max } = this._config;
    const range = Math.max(0.0001, max - min);
    const pct = current != null ? Math.min(1, Math.max(0, (current - min) / range)) : 0;
    const arcEl = this.shadowRoot.querySelector(".arc");
    if (arcEl) {
      arcEl.setAttribute("stroke-dasharray", String(circumference));
      arcEl.setAttribute("stroke-dashoffset", String(circumference * (1 - pct)));
    }

    // Mode chips
    this.shadowRoot.querySelectorAll(".mode").forEach((el) => {
      el.classList.toggle("active", el.dataset.mode === mode);
    });

    // Humidity row
    const humEl = this.shadowRoot.querySelector(".humidity");
    const ho = this._humidityObj();
    if (ho && ho.state !== "unavailable" && ho.state !== "unknown") {
      const u = ho.attributes?.unit_of_measurement ?? "%";
      humEl.innerHTML = `<ha-icon icon="mdi:water-percent"></ha-icon><span>${ho.state}${u}</span>`;
    } else {
      humEl.textContent = "";
    }

    // Delta
    const deltaEl = this.shadowRoot.querySelector(".delta");
    if (deltaEl) {
      if (current != null && target != null) {
        const d = Math.round((current - target) * 10) / 10;
        const sign = d > 0 ? "+" : "";
        deltaEl.textContent = `${sign}${d}°`;
        deltaEl.classList.toggle("warm", d > 0.05);
        deltaEl.classList.toggle("cool", d < -0.05);
      } else {
        deltaEl.textContent = "";
        deltaEl.classList.remove("warm", "cool");
      }
    }
  }
}

window.smartmorphicDefineCard("smartmorphic-climate-tile", SmartmorphicClimateTile);

// =============================================================================
// Visual editor
// =============================================================================
const CLIMATE_EDITOR_LABELS = {
  entity: "Climate entity",
  name: "Name (optional)",
  icon: "Icon (optional)",
  layout: "Layout",
  humidity: "Humidity sensor (optional)",
  min: "Ring minimum temperature",
  max: "Ring maximum temperature",
};

const CLIMATE_EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "climate" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  {
    name: "layout",
    selector: { select: { options: [
      { value: "full", label: "Full (modes + delta)" },
      { value: "compact", label: "Compact (icon + ring only)" },
    ] } },
  },
  { name: "humidity", selector: { entity: { domain: "sensor", device_class: "humidity" } } },
  { name: "min", selector: { number: { min: 0, max: 200, step: 1, mode: "box" } } },
  { name: "max", selector: { number: { min: 0, max: 200, step: 1, mode: "box" } } },
];

class SmartmorphicClimateTileEditor extends HTMLElement {
  setConfig(config) {
    this._config = { layout: "full", min: 60, max: 80, ...config };
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
    this._form.schema = CLIMATE_EDITOR_SCHEMA;
    this._form.computeLabel = (s) => CLIMATE_EDITOR_LABELS[s.name] ?? s.name;
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

window.smartmorphicDefineCard("smartmorphic-climate-tile-editor", SmartmorphicClimateTileEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-climate-tile",
  name: "Smartmorphic Climate Tile",
  description: "Thermostat tile with SVG accent ring, mode chips, and ±1° bumps.",
  preview: false,
});

window.smartmorphic = window.smartmorphic || {};
window.smartmorphic.versions = window.smartmorphic.versions || {};
window.smartmorphic.versions["smartmorphic-climate-tile"] = "0.1.1";

console.info(
  "%c SMARTMORPHIC-CLIMATE-TILE %c v0.1.1 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
