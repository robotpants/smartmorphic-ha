// =============================================================================
// Smartmorphic — room card
//
// Custom Lovelace card. Renders a neumorphic well representing a room. Watches
// a list of entities to determine "active" state, surfaces an ambient temp,
// and navigates to a detail view on tap.
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
// =============================================================================

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
        border-radius: var(--smartmorphic-radius, 20px);
        box-shadow: var(--smartmorphic-neu-raised,
          8px 8px 16px rgba(0, 0, 0, 0.12),
          -8px -8px 16px rgba(255, 255, 255, 0.7));
        padding: 16px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-template-areas: "icon text dot";
        align-items: center;
        gap: 14px;
        cursor: pointer;
        transition: box-shadow 180ms ease, transform 180ms ease;
        user-select: none;
        position: relative;
      }
      .card:active {
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 4px 4px 8px rgba(0, 0, 0, 0.12),
          inset -4px -4px 8px rgba(255, 255, 255, 0.7));
        transform: scale(0.995);
      }
      .icon-well {
        grid-area: icon;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        box-shadow: var(--smartmorphic-neu-pressed,
          inset 3px 3px 6px rgba(0, 0, 0, 0.12),
          inset -3px -3px 6px rgba(255, 255, 255, 0.7));
        color: var(--primary-text-color);
      }
      .icon-well ha-icon, .icon-well ha-svg-icon {
        --mdc-icon-size: 22px;
      }
      .text {
        grid-area: text;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .name {
        font-family: 'DM Sans', var(--primary-font-family, sans-serif);
        font-weight: 600;
        font-size: 1rem;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .secondary {
        font-family: 'DM Sans', var(--primary-font-family, sans-serif);
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ember {
        grid-area: dot;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--smartmorphic-accent, #e8653a);
        box-shadow: 0 0 12px var(--smartmorphic-accent-glow-tight, rgba(232, 101, 58, 0.55));
        opacity: 0;
        transform: scale(0.6);
        transition: opacity 220ms ease, transform 220ms ease;
      }
      .card.active .ember {
        opacity: 1;
        transform: scale(1);
      }
      .card.active .icon-well {
        color: var(--smartmorphic-accent, #e8653a);
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
        <div class="ember"></div>
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

customElements.define("smartmorphic-room-card", SmartmorphicRoomCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-room-card",
  name: "Smartmorphic Room Card",
  description: "Neumorphic room tile with active-state ember and ambient temp.",
  preview: false,
});

console.info(
  "%c SMARTMORPHIC-ROOM-CARD %c v0.1.1 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
