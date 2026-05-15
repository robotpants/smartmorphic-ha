// =============================================================================
// Smartmorphic — scene chip
//
// Compact tappable chip for scenes / scripts. Implements the export's
// SceneChip recipe:
//
//   - flex column, centered, padding 14/10 (10/8 dense)
//   - radius 14px, --neu-raised-sm inactive, --neu-pressed when active
//   - icon 18 (16 dense), 1.8 stroke, --text-secondary (--accent when active)
//   - label 11/600
//
// Tap activates the scene/script. The "active" state pulses briefly on tap
// since scenes don't have a persistent on state.
//
// Config:
//   type: custom:smartmorphic-scene-chip
//   entity: scene.movie_night
//   name: Movie Night            # optional override
//   icon: mdi:movie-roll         # optional override
//   dense: false                 # optional, default false
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

class SmartmorphicSceneChip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._pulseTimer = null;
  }

  setConfig(config) {
    this._config = {
      dense: false,
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
          eid.startsWith("scene.") || eid.startsWith("script."))
      : [];
    return { entity: candidates[0] ?? "" };
  }

  static getConfigElement() {
    return document.createElement("smartmorphic-scene-chip-editor");
  }

  _stateObj() { return this._hass?.states?.[this._config.entity] ?? null; }

  _name() {
    if (this._config.name) return this._config.name;
    return this._stateObj()?.attributes?.friendly_name ?? this._config.entity;
  }

  _icon() {
    if (this._config.icon) return this._config.icon;
    const so = this._stateObj();
    if (so?.attributes?.icon) return so.attributes.icon;
    const domain = (this._config.entity || "").split(".")[0];
    return domain === "script" ? "mdi:script-text-play" : "mdi:palette";
  }

  _onTap() {
    if (!this._hass || !this._config.entity) return;
    const domain = (this._config.entity).split(".")[0];
    if (domain === "scene") {
      this._hass.callService("scene", "turn_on", { entity_id: this._config.entity });
    } else if (domain === "script") {
      this._hass.callService("script", "turn_on", { entity_id: this._config.entity });
    }
    // Visual pulse
    const chip = this.shadowRoot.querySelector(".chip");
    if (!chip) return;
    chip.classList.add("active");
    clearTimeout(this._pulseTimer);
    this._pulseTimer = setTimeout(() => chip.classList.remove("active"), 900);
  }

  _render() {
    const style = `
      :host { display: block; }
      .chip {
        background: var(--smartmorphic-surface, var(--ha-card-background, var(--card-background-color)));
        border-radius: var(--smartmorphic-radius-md, 14px);
        box-shadow: var(--smartmorphic-neu-raised-sm,
          2px 2px 4px rgba(0, 0, 0, 0.18),
          -2px -2px 4px rgba(255, 255, 255, 0.03));
        padding: 14px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-width: 86px;
        color: var(--secondary-text-color);
        cursor: pointer;
        user-select: none;
        transition:
          box-shadow var(--smartmorphic-transition-base, 180ms ease),
          color var(--smartmorphic-transition-base, 180ms ease),
          transform var(--smartmorphic-transition-base, 180ms ease);
      }
      .chip.dense {
        padding: 10px 8px;
        gap: 6px;
        min-width: 70px;
      }
      .chip:active {
        transform: scale(0.97);
      }
      .chip.active {
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 2px 2px 4px rgba(0, 0, 0, 0.28),
          inset -2px -2px 4px rgba(255, 255, 255, 0.03));
        color: var(--smartmorphic-accent, #e8653a);
      }
      .chip ha-icon { --mdc-icon-size: 18px; }
      .chip.dense ha-icon { --mdc-icon-size: 16px; }
      .label {
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        font-weight: 600;
        font-size: 11px;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="chip" role="button" tabindex="0">
        <ha-icon class="icon"></ha-icon>
        <div class="label"></div>
      </div>
    `;

    const chip = this.shadowRoot.querySelector(".chip");
    chip.addEventListener("click", () => this._onTap());
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._onTap();
      }
    });
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const chip = this.shadowRoot.querySelector(".chip");
    if (!chip) return;
    chip.classList.toggle("dense", !!this._config.dense);
    this.shadowRoot.querySelector(".icon").setAttribute("icon", this._icon());
    this.shadowRoot.querySelector(".label").textContent = this._name();
  }
}

window.smartmorphicDefineCard("smartmorphic-scene-chip", SmartmorphicSceneChip);

// =============================================================================
// Visual editor
// =============================================================================
const CHIP_EDITOR_LABELS = {
  entity: "Scene or script entity",
  name: "Label (optional)",
  icon: "Icon (optional)",
  dense: "Dense (smaller)",
};

const CHIP_EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: ["scene", "script"] } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "dense", selector: { boolean: {} } },
];

class SmartmorphicSceneChipEditor extends HTMLElement {
  setConfig(config) {
    this._config = { dense: false, ...config };
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
    this._form.schema = CHIP_EDITOR_SCHEMA;
    this._form.computeLabel = (s) => CHIP_EDITOR_LABELS[s.name] ?? s.name;
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

window.smartmorphicDefineCard("smartmorphic-scene-chip-editor", SmartmorphicSceneChipEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-scene-chip",
  name: "Smartmorphic Scene Chip",
  description: "Compact tappable chip for activating scenes or scripts.",
  preview: false,
});

window.smartmorphic = window.smartmorphic || {};
window.smartmorphic.versions = window.smartmorphic.versions || {};
window.smartmorphic.versions["smartmorphic-scene-chip"] = "0.1.0";

console.info(
  "%c SMARTMORPHIC-SCENE-CHIP %c v0.1.0 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
