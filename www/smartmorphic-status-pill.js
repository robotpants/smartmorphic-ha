// =============================================================================
// Smartmorphic — status pill
//
// Custom Lovelace card. Semantic pill (ok / warning / alert / info) with
// tinted background and full-saturation text per the style-guide Pill recipe.
// Static or entity-bound.
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
    const c = { ...(config || {}) };
    // Default to a neutral "ok" pill when no variant or entity is set.
    if (!c.variant && !c.entity) c.variant = "ok";
    // Fall back to "ok" for unknown variants (renders something usable
    // instead of throwing and breaking the picker preview).
    if (c.variant && !VARIANTS[c.variant]) c.variant = "ok";
    this._config = c;
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

  static getConfigElement() {
    return document.createElement("smartmorphic-status-pill-editor");
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
        gap: 5px;
        padding: 4px 9px;
        border-radius: var(--smartmorphic-radius-pill, 999px);
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 700;
        font-size: 10px;
        line-height: 1;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        max-width: 100%;
        background: var(--pill-bg, transparent);
        color: var(--pill-fg, var(--primary-text-color));
        box-sizing: border-box;
      }
      .pill ha-icon {
        --mdc-icon-size: 12px;
        flex-shrink: 0;
      }
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
    // Style guide: pill bg is 14-16% tinted, text is full saturation
    pill.style.setProperty("--pill-bg", `color-mix(in srgb, ${v.color} 15%, transparent)`);
    pill.style.setProperty("--pill-fg", v.color);
    this.shadowRoot.querySelector(".label").textContent = label;
    const iconEl = this.shadowRoot.querySelector(".icon");
    iconEl.setAttribute("icon", icon ?? v.icon);
  }
}

window.smartmorphicDefineCard("smartmorphic-status-pill", SmartmorphicStatusPill);

// =============================================================================
// Visual editor — supports both static and entity-bound modes.
// =============================================================================
const VARIANT_OPTIONS = [
  { value: "ok", label: "OK (green)" },
  { value: "warning", label: "Warning (amber)" },
  { value: "alert", label: "Alert (pink)" },
  { value: "info", label: "Info (blue)" },
];

const STATIC_SCHEMA = [
  { name: "variant", required: true, selector: { select: { options: VARIANT_OPTIONS, mode: "dropdown" } } },
  { name: "label", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
];

const ENTITY_PICKER_SCHEMA = [
  { name: "entity", required: true, selector: { entity: {} } },
];

const FALLBACK_SCHEMA = [
  { name: "variant", selector: { select: { options: VARIANT_OPTIONS, mode: "dropdown" } } },
  { name: "label", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
];

const LABELS = {
  variant: "Variant",
  label: "Label",
  icon: "Icon",
  entity: "Entity",
};

class SmartmorphicStatusPillEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    if (!this._mode) {
      this._mode = config.entity ? "entity" : "static";
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._propagateHass();
  }

  _propagateHass() {
    if (!this._hass) return;
    if (this._staticForm) this._staticForm.hass = this._hass;
    if (this._entityForm) this._entityForm.hass = this._hass;
    if (this._fallbackForm) this._fallbackForm.hass = this._hass;
    this.querySelectorAll("ha-form").forEach((f) => { f.hass = this._hass; });
  }

  _emit() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }

  _setMode(mode) {
    if (this._mode === mode) return;
    this._mode = mode;
    if (mode === "static") {
      this._config = { variant: this._config.variant ?? "ok", label: this._config.label, icon: this._config.icon };
    } else {
      this._config = {
        entity: this._config.entity ?? "",
        states: this._config.states ?? {},
        fallback: this._config.fallback ?? { variant: "info" },
      };
    }
    this._render();
    this._emit();
  }

  _render() {
    this._staticForm = null;
    this._entityForm = null;
    this._fallbackForm = null;
    this.innerHTML = `
      <style>
        .mode-toggle {
          display: flex;
          gap: 8px;
          margin: 0 0 16px;
          padding: 4px;
          background: var(--secondary-background-color, rgba(127,127,127,0.08));
          border-radius: 8px;
        }
        .mode-toggle button {
          flex: 1;
          padding: 8px 12px;
          background: transparent;
          color: var(--secondary-text-color);
          border: none;
          border-radius: 6px;
          font: inherit;
          cursor: pointer;
        }
        .mode-toggle button[aria-pressed="true"] {
          background: var(--primary-background-color, white);
          color: var(--primary-text-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .section { margin-top: 18px; }
        .section h4 {
          margin: 0 0 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--secondary-text-color);
        }
        .hint {
          font-size: 0.8rem;
          color: var(--secondary-text-color);
          margin: 0 0 8px;
        }
        .states-rows { display: flex; flex-direction: column; gap: 10px; }
        .states-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto auto;
          gap: 6px;
          align-items: end;
        }
        .states-row label {
          display: flex;
          flex-direction: column;
          font-size: 0.72rem;
          color: var(--secondary-text-color);
          gap: 2px;
        }
        .states-row input,
        .states-row select {
          padding: 6px 8px;
          background: var(--card-background-color, white);
          color: var(--primary-text-color);
          border: 1px solid var(--divider-color, rgba(127,127,127,0.2));
          border-radius: 6px;
          font: inherit;
          min-width: 0;
        }
        .icon-button {
          padding: 6px 8px;
          background: transparent;
          color: var(--secondary-text-color);
          border: 1px solid var(--divider-color, rgba(127,127,127,0.2));
          border-radius: 6px;
          cursor: pointer;
          height: 32px;
          align-self: end;
        }
        .icon-button:hover { color: var(--primary-text-color); }
        .add-state {
          align-self: flex-start;
          margin-top: 4px;
          padding: 6px 12px;
          background: var(--primary-color, #e8653a);
          color: white;
          border: none;
          border-radius: 6px;
          font: inherit;
          cursor: pointer;
        }
      </style>
      <div class="mode-toggle">
        <button type="button" data-mode="static" aria-pressed="${this._mode === "static"}">Static</button>
        <button type="button" data-mode="entity" aria-pressed="${this._mode === "entity"}">Entity-bound</button>
      </div>
      <div class="body"></div>
    `;
    this.querySelectorAll(".mode-toggle button").forEach((btn) => {
      btn.addEventListener("click", () => this._setMode(btn.dataset.mode));
    });
    const body = this.querySelector(".body");
    if (this._mode === "static") {
      this._renderStatic(body);
    } else {
      this._renderEntity(body);
    }
    this._propagateHass();
  }

  _renderStatic(parent) {
    this._staticForm = document.createElement("ha-form");
    this._staticForm.schema = STATIC_SCHEMA;
    this._staticForm.computeLabel = (s) => LABELS[s.name] ?? s.name;
    this._staticForm.data = this._config;
    this._staticForm.addEventListener("value-changed", (e) => {
      this._config = { ...this._config, ...e.detail.value };
      this._emit();
    });
    parent.appendChild(this._staticForm);
  }

  _renderEntity(parent) {
    this._entityForm = document.createElement("ha-form");
    this._entityForm.schema = ENTITY_PICKER_SCHEMA;
    this._entityForm.computeLabel = (s) => LABELS[s.name] ?? s.name;
    this._entityForm.data = { entity: this._config.entity ?? "" };
    this._entityForm.addEventListener("value-changed", (e) => {
      this._config = { ...this._config, entity: e.detail.value.entity ?? "" };
      this._emit();
    });
    parent.appendChild(this._entityForm);

    const statesSection = document.createElement("div");
    statesSection.className = "section";
    statesSection.innerHTML = `
      <h4>State mapping</h4>
      <p class="hint">One row per state value. Each row controls what the pill looks like when the entity is in that state.</p>
      <div class="states-rows"></div>
      <button type="button" class="add-state">+ Add state</button>
    `;
    parent.appendChild(statesSection);
    this._statesRowsContainer = statesSection.querySelector(".states-rows");
    statesSection.querySelector(".add-state").addEventListener("click", () => this._addState());
    this._renderStatesRows();

    const fallbackSection = document.createElement("div");
    fallbackSection.className = "section";
    fallbackSection.innerHTML = `
      <h4>Fallback</h4>
      <p class="hint">Shown when the current state isn't in the mapping above.</p>
    `;
    this._fallbackForm = document.createElement("ha-form");
    this._fallbackForm.schema = FALLBACK_SCHEMA;
    this._fallbackForm.computeLabel = (s) => LABELS[s.name] ?? s.name;
    this._fallbackForm.data = this._config.fallback ?? {};
    this._fallbackForm.addEventListener("value-changed", (e) => {
      this._config = { ...this._config, fallback: { ...this._config.fallback, ...e.detail.value } };
      this._emit();
    });
    fallbackSection.appendChild(this._fallbackForm);
    parent.appendChild(fallbackSection);
  }

  _addState() {
    const states = { ...(this._config.states ?? {}) };
    let key = "new_state";
    let i = 1;
    while (key in states) key = `new_state_${++i}`;
    states[key] = { variant: "info", label: "" };
    this._config = { ...this._config, states };
    this._renderStatesRows();
    this._emit();
  }

  _removeState(key) {
    const states = { ...(this._config.states ?? {}) };
    delete states[key];
    this._config = { ...this._config, states };
    this._renderStatesRows();
    this._emit();
  }

  _updateState(oldKey, patch) {
    const states = { ...(this._config.states ?? {}) };
    const entry = { ...(states[oldKey] ?? {}) };
    let key = oldKey;
    if ("state" in patch) {
      key = patch.state;
      delete states[oldKey];
      let collision = key;
      let i = 1;
      while (collision !== oldKey && collision in states) collision = `${key}_${++i}`;
      key = collision;
    }
    if ("variant" in patch) entry.variant = patch.variant;
    if ("label" in patch) entry.label = patch.label;
    if ("icon" in patch) entry.icon = patch.icon;
    states[key] = entry;
    this._config = { ...this._config, states };
    this._emit();
    if (key !== oldKey) this._renderStatesRows();
  }

  _renderStatesRows() {
    if (!this._statesRowsContainer) return;
    this._statesRowsContainer.innerHTML = "";
    const states = this._config.states ?? {};
    Object.entries(states).forEach(([stateKey, entry]) => {
      const row = document.createElement("div");
      row.className = "states-row";
      row.innerHTML = `
        <label>State<input type="text" class="state" value="${this._escapeAttr(stateKey)}" placeholder="e.g. on, locked"></label>
        <label>Variant<select class="variant">
          ${VARIANT_OPTIONS.map((o) => `<option value="${o.value}"${o.value === (entry.variant ?? "info") ? " selected" : ""}>${o.label}</option>`).join("")}
        </select></label>
        <label>Label<input type="text" class="label" value="${this._escapeAttr(entry.label ?? "")}"></label>
        <label>Icon<input type="text" class="icon" value="${this._escapeAttr(entry.icon ?? "")}" placeholder="mdi:…"></label>
        <button type="button" class="icon-button remove" title="Remove">×</button>
      `;
      row.querySelector(".state").addEventListener("change", (e) => this._updateState(stateKey, { state: e.target.value }));
      row.querySelector(".variant").addEventListener("change", (e) => this._updateState(stateKey, { variant: e.target.value }));
      row.querySelector(".label").addEventListener("input", (e) => this._updateState(stateKey, { label: e.target.value }));
      row.querySelector(".icon").addEventListener("input", (e) => this._updateState(stateKey, { icon: e.target.value }));
      row.querySelector(".remove").addEventListener("click", () => this._removeState(stateKey));
      this._statesRowsContainer.appendChild(row);
    });
  }

  _escapeAttr(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }
}

window.smartmorphicDefineCard("smartmorphic-status-pill-editor", SmartmorphicStatusPillEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-status-pill",
  name: "Smartmorphic Status Pill",
  description: "Semantic chip (ok / warning / alert / info). Static or entity-bound.",
  preview: false,
});

window.smartmorphic = window.smartmorphic || {};
window.smartmorphic.versions = window.smartmorphic.versions || {};
window.smartmorphic.versions["smartmorphic-status-pill"] = "0.6.2";

console.info(
  "%c SMARTMORPHIC-STATUS-PILL %c v0.6.2 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
