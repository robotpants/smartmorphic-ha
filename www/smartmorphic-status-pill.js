// =============================================================================
// Smartmorphic — status pill
//
// Custom Lovelace card. Semantic pill (ok / warning / alert / info) with 18%
// background of the semantic color and darkened text. Static or entity-bound.
//
// Static:
//   type: custom:smartmorphic-status-pill
//   variant: ok           # ok | warning | alert | info
//   label: All locked
//   icon: mdi:lock-check  # optional, defaults per variant
//
// Entity-bound (variant + label come from the state map):
//   type: custom:smartmorphic-status-pill
//   entity: binary_sensor.front_door
//   states:
//     "on":  { variant: alert, label: Door open,   icon: mdi:door-open }
//     "off": { variant: ok,    label: Door closed, icon: mdi:door }
//   fallback: { variant: info, label: Unknown }
// =============================================================================

const VARIANTS = {
  ok:      { color: "var(--smartmorphic-color-green, #3abf7a)", icon: "mdi:check-circle" },
  warning: { color: "var(--smartmorphic-color-amber, #e8b83a)", icon: "mdi:alert" },
  alert:   { color: "var(--smartmorphic-color-pink, #e84a7a)",  icon: "mdi:alert-octagon" },
  info:    { color: "var(--smartmorphic-color-blue, #3a8ee8)",  icon: "mdi:information" },
};

class SmartmorphicStatusPill extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    if (!config.variant && !config.entity) {
      throw new Error("smartmorphic-status-pill: either 'variant' or 'entity' is required");
    }
    if (config.variant && !VARIANTS[config.variant]) {
      throw new Error(`smartmorphic-status-pill: unknown variant '${config.variant}'`);
    }
    this._config = { ...config };
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

  getCardSize() { return 1; }

  static getStubConfig() {
    return { variant: "ok", label: "All clear", icon: "mdi:check-circle" };
  }

  _resolved() {
    if (this._config.entity) {
      const state = this._hass?.states?.[this._config.entity]?.state;
      const entry = this._config.states?.[state] ?? this._config.fallback ?? { variant: "info", label: state ?? "Unknown" };
      return {
        variant: entry.variant ?? "info",
        label: entry.label ?? state ?? "",
        icon: entry.icon,
      };
    }
    return {
      variant: this._config.variant,
      label: this._config.label ?? "",
      icon: this._config.icon,
    };
  }

  _render() {
    const style = `
      :host { display: block; }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: var(--smartmorphic-radius-pill, 999px);
        font-family: 'DM Sans', var(--primary-font-family, sans-serif);
        font-weight: 600;
        font-size: 0.85rem;
        line-height: 1;
        max-width: 100%;
        background: var(--pill-bg, transparent);
        color: var(--pill-fg, var(--primary-text-color));
        box-sizing: border-box;
      }
      .pill ha-icon { --mdc-icon-size: 18px; flex-shrink: 0; }
      .label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="pill">
        <ha-icon class="icon"></ha-icon>
        <span class="label"></span>
      </div>
    `;
    this._update();
  }

  _update() {
    const { variant, label, icon } = this._resolved();
    const v = VARIANTS[variant] ?? VARIANTS.info;
    const pill = this.shadowRoot.querySelector(".pill");
    pill.style.setProperty("--pill-bg", `color-mix(in srgb, ${v.color} 18%, transparent)`);
    pill.style.setProperty("--pill-fg", `color-mix(in srgb, ${v.color} 70%, var(--primary-text-color))`);
    this.shadowRoot.querySelector(".label").textContent = label;
    const iconEl = this.shadowRoot.querySelector(".icon");
    iconEl.setAttribute("icon", icon ?? v.icon);
  }
}

customElements.define("smartmorphic-status-pill", SmartmorphicStatusPill);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-status-pill",
  name: "Smartmorphic Status Pill",
  description: "Semantic chip (ok / warning / alert / info). Static or entity-bound.",
  preview: false,
});

console.info(
  "%c SMARTMORPHIC-STATUS-PILL %c v0.1.0 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
