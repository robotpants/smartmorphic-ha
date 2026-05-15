// =============================================================================
// Smartmorphic — sensor tile
//
// Custom Lovelace card for numeric sensor entities (temperature, humidity,
// battery, power, etc.). Implements the export's "SensorTile" + "Stat" recipe
// from design_handoff_smartmorphic_theme/components.md:
//
//   - Top row: 14px icon + 10px eyebrow label (display family, uppercase,
//     1.5px letter-spacing, muted color)
//   - Middle: large stat (32px display / 500 / -0.5px tracking)
//       * Degree units (°, °F, °C) → superscript, ~38% of value size,
//         top-aligned with no left margin
//       * Other units (%, kW, kWh, K, etc.) → baseline-aligned, ~42% of
//         value size, 3px left margin, muted color
//   - Bottom: sparkline placeholder (real history-driven sparkline is a
//     Phase 4 helper)
//
// Config:
//   type: custom:smartmorphic-sensor-tile
//   entity: sensor.outdoor_temperature
//   name: OUTSIDE                     # optional eyebrow label override
//   icon: mdi:weather-cloudy          # optional icon override
//   show_sparkline: true              # optional (default true)
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

const DEGREE_PATTERN = /^°[CF]?$|^°$/;

const isDegreeUnit = (unit) => {
  if (!unit) return false;
  return DEGREE_PATTERN.test(unit.trim());
};

class SmartmorphicSensorTile extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    if (config.entity && typeof config.entity !== "string") {
      throw new Error("smartmorphic-sensor-tile: 'entity' must be a string");
    }
    this._config = {
      show_sparkline: true,
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

  getCardSize() {
    return 2;
  }

  static getStubConfig(hass) {
    const candidates = hass
      ? Object.keys(hass.states ?? {}).filter((eid) => {
          if (!eid.startsWith("sensor.")) return false;
          const st = hass.states[eid];
          // Prefer sensors with a numeric state + unit
          return !isNaN(parseFloat(st?.state)) && st?.attributes?.unit_of_measurement;
        })
      : [];
    return { entity: candidates[0] ?? "" };
  }

  static getConfigElement() {
    return document.createElement("smartmorphic-sensor-tile-editor");
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
    return this._stateObj()?.attributes?.icon ?? "mdi:gauge";
  }

  _parsedValue() {
    const stateObj = this._stateObj();
    if (!stateObj) return { value: null, unit: null, isNumeric: false };
    const raw = stateObj.state;
    const unit = stateObj.attributes?.unit_of_measurement ?? null;
    if (raw === "unavailable") return { value: "—", unit: null, isNumeric: false };
    if (raw === "unknown") return { value: "?", unit: null, isNumeric: false };
    const n = parseFloat(raw);
    if (isNaN(n)) return { value: raw, unit, isNumeric: false };
    // Format: at most 1 decimal place
    const formatted = Number.isInteger(n) ? String(n) : n.toFixed(1);
    return { value: formatted, unit, isNumeric: true };
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
        display: flex;
        flex-direction: column;
        gap: var(--smartmorphic-space-3, 8px);
        transition: box-shadow var(--smartmorphic-transition-base, 180ms ease);
        user-select: none;
      }

      .top {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }
      .top ha-icon {
        --mdc-icon-size: 14px;
        color: var(--secondary-text-color);
        flex-shrink: 0;
      }
      .eyebrow {
        font-family: var(--smartmorphic-eyebrow-font-family, 'Outfit', 'DM Sans', system-ui, sans-serif);
        font-size: var(--smartmorphic-eyebrow-font-size, 10px);
        font-weight: var(--smartmorphic-eyebrow-font-weight, 600);
        letter-spacing: var(--smartmorphic-eyebrow-letter-spacing, 1.5px);
        text-transform: var(--smartmorphic-eyebrow-text-transform, uppercase);
        color: var(--smartmorphic-eyebrow-color, var(--secondary-text-color));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1;
      }

      .stat {
        font-family: var(--smartmorphic-font-display, 'Outfit', 'DM Sans', system-ui, sans-serif);
        font-weight: 500;
        font-size: 32px;
        line-height: 1;
        letter-spacing: -0.5px;
        color: var(--primary-text-color);
        display: flex;
        align-items: baseline;
        min-width: 0;
      }
      .stat .value {
        white-space: nowrap;
      }
      /* Degree units sit superscript at top of digits */
      .stat .unit-degree {
        font-size: 38%;
        align-self: flex-start;
        line-height: 1;
        margin-top: 2px;
        color: var(--primary-text-color);
      }
      /* Other units baseline aligned, muted, slight left margin */
      .stat .unit-baseline {
        font-size: 42%;
        margin-left: 3px;
        color: var(--secondary-text-color);
      }

      .sparkline-placeholder {
        height: 28px;
        border-radius: 6px;
        background: var(--smartmorphic-off-tint, rgba(125, 128, 146, 0.10));
        margin-top: var(--smartmorphic-space-2, 6px);
      }
      .card.no-sparkline .sparkline-placeholder {
        display: none;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="card">
        <div class="top">
          <ha-icon class="icon"></ha-icon>
          <div class="eyebrow"></div>
        </div>
        <div class="stat">
          <span class="value"></span><span class="unit"></span>
        </div>
        <div class="sparkline-placeholder"></div>
      </div>
    `;

    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const card = this.shadowRoot.querySelector(".card");
    if (!card) return;

    const iconEl = this.shadowRoot.querySelector(".icon");
    if (iconEl) iconEl.setAttribute("icon", this._icon());

    const eyebrowEl = this.shadowRoot.querySelector(".eyebrow");
    if (eyebrowEl) eyebrowEl.textContent = this._label();

    const { value, unit } = this._parsedValue();
    const valueEl = this.shadowRoot.querySelector(".value");
    const unitEl = this.shadowRoot.querySelector(".unit");
    if (valueEl) valueEl.textContent = value ?? "";

    if (unitEl) {
      if (unit) {
        unitEl.textContent = unit;
        unitEl.className = "unit " + (isDegreeUnit(unit) ? "unit-degree" : "unit-baseline");
      } else {
        unitEl.textContent = "";
        unitEl.className = "unit";
      }
    }

    card.classList.toggle("no-sparkline", !this._config.show_sparkline);
  }
}

window.smartmorphicDefineCard("smartmorphic-sensor-tile", SmartmorphicSensorTile);

// =============================================================================
// Visual editor
// =============================================================================
const SENSOR_EDITOR_LABELS = {
  entity: "Sensor entity",
  name: "Eyebrow label (optional — defaults to entity name)",
  icon: "Icon (optional)",
  show_sparkline: "Show sparkline placeholder",
};

const SENSOR_EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "sensor" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "show_sparkline", selector: { boolean: {} } },
];

class SmartmorphicSensorTileEditor extends HTMLElement {
  setConfig(config) {
    this._config = { show_sparkline: true, ...config };
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
    this._form.schema = SENSOR_EDITOR_SCHEMA;
    this._form.computeLabel = (s) => SENSOR_EDITOR_LABELS[s.name] ?? s.name;
    this._form.addEventListener("value-changed", (e) => this._valueChanged(e));
    if (this._hass) this._form.hass = this._hass;
    this.appendChild(this._form);
  }

  _valueChanged(e) {
    const next = { ...this._config, ...e.detail.value };
    this._config = next;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: next },
        bubbles: true,
        composed: true,
      })
    );
  }
}

window.smartmorphicDefineCard("smartmorphic-sensor-tile-editor", SmartmorphicSensorTileEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-sensor-tile",
  name: "Smartmorphic Sensor Tile",
  description:
    "Big-number sensor stat with eyebrow label and smart unit positioning (degree-superscript / baseline). Sparkline placeholder, real history-driven sparkline in Phase 4.",
  preview: false,
});

window.smartmorphic = window.smartmorphic || {};
window.smartmorphic.versions = window.smartmorphic.versions || {};
window.smartmorphic.versions["smartmorphic-sensor-tile"] = "0.1.3";

console.info(
  "%c SMARTMORPHIC-SENSOR-TILE %c v0.1.3 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
