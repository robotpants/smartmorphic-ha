// =============================================================================
// Smartmorphic — automation row
//
// Compact horizontal row for automations / scripts. Implements the export's
// AutomationRow recipe:
//
//   - Container: --neu-raised-sm
//   - 38px ActiveIconWell (on when enabled) — bot icon default
//   - Label: name (13/600) + optional blueprint tag (mono 9px tinted pill)
//   - Sub: description (11px / muted)
//   - Right cluster: "LAST" eyebrow + relative timestamp, Run button (raised
//     pill with play icon), Toggle
//
// Config:
//   type: custom:smartmorphic-automation-row
//   entity: automation.morning_lights
//   name: Morning lights            # optional, overrides friendly_name
//   icon: mdi:weather-sunset-up     # optional
//   description: "Turn on at sunrise"
//   blueprint: "Sunrise"            # optional tag shown next to name
//   show_run: true                  # optional, default true
//   show_toggle: true               # optional, default true (automation only)
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

const relativeTime = (iso) => {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "—";
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
};

class SmartmorphicAutomationRow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = {
      show_run: true,
      show_toggle: true,
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

  getCardSize() { return 1; }

  static getStubConfig(hass) {
    const candidates = hass
      ? Object.keys(hass.states ?? {}).filter((eid) =>
          eid.startsWith("automation.") || eid.startsWith("script."))
      : [];
    return { entity: candidates[0] ?? "" };
  }

  static getConfigElement() {
    return document.createElement("smartmorphic-automation-row-editor");
  }

  _stateObj() { return this._hass?.states?.[this._config.entity] ?? null; }
  _domain() { return (this._config.entity || "").split(".")[0]; }
  _isEnabled() {
    const so = this._stateObj();
    if (!so) return false;
    if (this._domain() === "automation") return so.state === "on";
    return so.state !== "unavailable" && so.state !== "unknown";
  }

  _name() {
    if (this._config.name) return this._config.name;
    return this._stateObj()?.attributes?.friendly_name ?? this._config.entity;
  }

  _icon() {
    if (this._config.icon) return this._config.icon;
    return this._stateObj()?.attributes?.icon ??
      (this._domain() === "script" ? "mdi:script-text-play" : "mdi:robot");
  }

  _last() {
    const a = this._stateObj()?.attributes;
    return a?.last_triggered ?? null;
  }

  _onRun(e) {
    e.stopPropagation();
    if (!this._hass || !this._config.entity) return;
    const domain = this._domain();
    if (domain === "automation") {
      this._hass.callService("automation", "trigger", { entity_id: this._config.entity });
    } else if (domain === "script") {
      this._hass.callService("script", "turn_on", { entity_id: this._config.entity });
    }
  }

  _onToggle(e) {
    e.stopPropagation();
    if (!this._hass || !this._config.entity) return;
    const domain = this._domain();
    if (domain === "automation") {
      this._hass.callService("automation", "toggle", { entity_id: this._config.entity });
    }
  }

  _onTap() {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: this._config.entity },
      bubbles: true, composed: true,
    }));
  }

  _render() {
    const style = `
      :host { display: block; }
      .row {
        background: var(--smartmorphic-surface, var(--ha-card-background, var(--card-background-color)));
        border-radius: var(--smartmorphic-radius-md, 12px);
        box-shadow: var(--smartmorphic-neu-raised-sm,
          2px 2px 4px rgba(0, 0, 0, 0.18),
          -2px -2px 4px rgba(255, 255, 255, 0.03));
        padding: 10px 12px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        user-select: none;
        transition: box-shadow var(--smartmorphic-transition-base, 180ms ease);
      }
      .row:active {
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0, 0, 0, 0.28),
          inset -2px -2px 4px rgba(255, 255, 255, 0.03));
      }
      .icon-well {
        width: 38px; height: 38px;
        border-radius: var(--smartmorphic-radius-md, 12px);
        background: var(--smartmorphic-off-tint, rgba(125,128,146,0.10));
        display: grid; place-items: center;
        color: var(--secondary-text-color);
        transition: all var(--smartmorphic-transition-base, 180ms ease);
      }
      .icon-well ha-icon { --mdc-icon-size: 18px; }
      .row.active .icon-well {
        background: var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
        color: var(--smartmorphic-accent, #e8653a);
        box-shadow:
          inset 0 2px 0 rgba(255,255,255,0.18),
          0 0 0 1px var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
      }

      .text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .name-row {
        display: flex; align-items: center; gap: 6px; min-width: 0;
      }
      .name {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 600; font-size: 13px; line-height: 1.2;
        color: var(--primary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: color var(--smartmorphic-transition-base, 180ms ease);
      }
      .row.active .name { color: var(--smartmorphic-accent, #e8653a); }
      .blueprint {
        font-family: var(--smartmorphic-font-mono, 'JetBrains Mono', monospace);
        font-size: 9px; font-weight: 600;
        padding: 1px 6px; border-radius: 999px;
        background: var(--smartmorphic-off-tint, rgba(125,128,146,0.18));
        color: var(--secondary-text-color);
        white-space: nowrap; flex-shrink: 0;
      }
      .blueprint:empty { display: none; }
      .sub {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-size: 11px; color: var(--secondary-text-color);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .sub:empty { display: none; }

      .right {
        display: flex; align-items: center; gap: 10px;
      }
      .last {
        display: flex; flex-direction: column; gap: 1px;
        text-align: right;
        min-width: 0;
      }
      .last .eyebrow {
        font-family: var(--smartmorphic-eyebrow-font-family, 'Outfit', system-ui, sans-serif);
        font-size: 9px; font-weight: 600;
        letter-spacing: 1.2px; text-transform: uppercase;
        color: var(--secondary-text-color);
        line-height: 1;
      }
      .last .ago {
        font-family: var(--smartmorphic-font-display, 'Outfit', system-ui, sans-serif);
        font-weight: 600; font-size: 12px;
        color: var(--secondary-text-color);
        line-height: 1.2;
      }
      .run {
        display: grid; place-items: center;
        width: 32px; height: 32px;
        border-radius: 999px;
        background: var(--smartmorphic-surface, var(--ha-card-background));
        box-shadow: var(--smartmorphic-neu-raised-sm,
          2px 2px 4px rgba(0,0,0,0.18),
          -2px -2px 4px rgba(255,255,255,0.03));
        color: var(--smartmorphic-accent, #e8653a);
        cursor: pointer;
      }
      .run:active {
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0,0,0,0.28),
          inset -2px -2px 4px rgba(255,255,255,0.03));
      }
      .run ha-icon { --mdc-icon-size: 16px; }

      .toggle {
        width: 40px; height: 24px;
        border-radius: 999px;
        background: #c4c7d4;
        position: relative;
        cursor: pointer;
        transition: background var(--smartmorphic-transition-base, 180ms ease);
        flex-shrink: 0;
      }
      .toggle .knob {
        position: absolute;
        top: 2px; left: 2px;
        width: 20px; height: 20px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0,0,0,0.25);
        transition: left var(--smartmorphic-transition-base, 180ms ease);
      }
      .row.active .toggle {
        background: var(--smartmorphic-accent, #e8653a);
        box-shadow: 0 0 10px var(--smartmorphic-accent-glow, rgba(232,101,58,0.35));
      }
      .row.active .toggle .knob { left: 18px; }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="row" role="button" tabindex="0">
        <div class="icon-well"><ha-icon class="icon"></ha-icon></div>
        <div class="text">
          <div class="name-row">
            <div class="name"></div>
            <div class="blueprint"></div>
          </div>
          <div class="sub"></div>
        </div>
        <div class="right">
          <div class="last">
            <div class="eyebrow">Last</div>
            <div class="ago">—</div>
          </div>
          <div class="run"><ha-icon icon="mdi:play"></ha-icon></div>
          <div class="toggle"><div class="knob"></div></div>
        </div>
      </div>
    `;

    const rowEl = this.shadowRoot.querySelector(".row");
    rowEl.addEventListener("click", () => this._onTap());
    rowEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._onTap();
      }
    });
    this.shadowRoot.querySelector(".run").addEventListener("click", (e) => this._onRun(e));
    this.shadowRoot.querySelector(".toggle").addEventListener("click", (e) => this._onToggle(e));

    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const row = this.shadowRoot.querySelector(".row");
    if (!row) return;

    row.classList.toggle("active", this._isEnabled());
    this.shadowRoot.querySelector(".icon").setAttribute("icon", this._icon());
    this.shadowRoot.querySelector(".name").textContent = this._name();
    this.shadowRoot.querySelector(".blueprint").textContent = this._config.blueprint ?? "";
    this.shadowRoot.querySelector(".sub").textContent = this._config.description ?? "";
    this.shadowRoot.querySelector(".ago").textContent = relativeTime(this._last());

    const runEl = this.shadowRoot.querySelector(".run");
    runEl.style.display = this._config.show_run ? "" : "none";

    const toggleEl = this.shadowRoot.querySelector(".toggle");
    const showToggle = this._config.show_toggle && this._domain() === "automation";
    toggleEl.style.display = showToggle ? "" : "none";
  }
}

window.smartmorphicDefineCard("smartmorphic-automation-row", SmartmorphicAutomationRow);

// =============================================================================
// Visual editor
// =============================================================================
const AR_EDITOR_LABELS = {
  entity: "Automation or script entity",
  name: "Name (optional)",
  icon: "Icon (optional)",
  description: "Description (optional)",
  blueprint: "Blueprint tag (optional)",
  show_run: "Show Run button",
  show_toggle: "Show enable toggle (automations only)",
};

const AR_EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: ["automation", "script"] } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "description", selector: { text: {} } },
  { name: "blueprint", selector: { text: {} } },
  { name: "show_run", selector: { boolean: {} } },
  { name: "show_toggle", selector: { boolean: {} } },
];

class SmartmorphicAutomationRowEditor extends HTMLElement {
  setConfig(config) {
    this._config = { show_run: true, show_toggle: true, ...config };
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
    this._form.schema = AR_EDITOR_SCHEMA;
    this._form.computeLabel = (s) => AR_EDITOR_LABELS[s.name] ?? s.name;
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

window.smartmorphicDefineCard("smartmorphic-automation-row-editor", SmartmorphicAutomationRowEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-automation-row",
  name: "Smartmorphic Automation Row",
  description: "Compact automation/script row with last-run timestamp, Run button, and toggle.",
  preview: false,
});

console.info(
  "%c SMARTMORPHIC-AUTOMATION-ROW %c v0.1.0 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
