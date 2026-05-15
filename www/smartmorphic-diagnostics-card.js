// =============================================================================
// Smartmorphic — diagnostics card
//
// Drops onto any dashboard. Reports loader version, per-card version,
// registration health, and any module-load failures. Use this instead of
// digging through the dev console to answer "did my latest code load?"
//
// Config:
//   type: custom:smartmorphic-diagnostics-card
//   title: Smartmorphic Diagnostics       # optional
//   show_extras: true                      # optional, default true (registry info)
//
// See HARDENING.md (Phase 2) for the rationale.
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

const REFRESH_MS = 2000;

class SmartmorphicDiagnosticsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._timer = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = { title: "Smartmorphic Diagnostics", show_extras: true, ...config };
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

  connectedCallback() {
    this._timer = setInterval(() => this._update(), REFRESH_MS);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  getCardSize() {
    return 3;
  }

  static getStubConfig() {
    return {};
  }

  static getConfigElement() {
    return document.createElement("smartmorphic-diagnostics-card-editor");
  }

  _data() {
    const ns = window.smartmorphic || {};
    const expected = ns.expectedCards || [];
    const versions = ns.versions || {};
    const failures = ns.loaderFailures || [];

    const knownTags = new Set([
      ...expected,
      ...Object.keys(versions),
    ]);

    const rows = [...knownTags].sort().map((tag) => {
      const ver = versions[tag] || null;
      const registered = Boolean(customElements.get(tag));
      const failed = failures.includes(tag);
      let status = "ok";
      if (failed) status = "fail";
      else if (!registered) status = "missing";
      else if (!ver) status = "warn";
      return { tag, ver, registered, failed, status };
    });

    const loadedCount = rows.filter((r) => r.status === "ok").length;
    const totalCount = rows.length;

    const polyfillDetected =
      typeof customElements.get === "function" &&
      String(customElements.constructor).includes("ScopedCustomElementRegistry");

    let loadedAgo = null;
    if (ns.loadedAt) {
      const ms = Date.now() - new Date(ns.loadedAt).getTime();
      loadedAgo = this._fmtAgo(ms);
    }

    return {
      loaderVersion: ns.loaderVersion || "(no loader)",
      loadedAgo,
      rows,
      loadedCount,
      totalCount,
      failures,
      polyfillDetected,
    };
  }

  _fmtAgo(ms) {
    if (ms < 1000) return "just now";
    const s = Math.floor(ms / 1000);
    if (s < 60) return s + "s ago";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    return h + "h ago";
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
        font-family: var(--smartmorphic-font-body, 'DM Sans', system-ui, sans-serif);
        color: var(--primary-text-color);
      }
      .title {
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        margin-bottom: 4px;
      }
      .summary {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 12px;
      }
      .summary .count {
        font-family: var(--smartmorphic-font-display, var(--smartmorphic-font-body));
        font-weight: 600;
        font-size: 22px;
        line-height: 1;
      }
      .summary .count.ok    { color: var(--success-color, #4caf50); }
      .summary .count.warn  { color: var(--warning-color, #ff9800); }
      .summary .count.fail  { color: var(--error-color, #f44336); }
      .summary .loader {
        font-family: var(--smartmorphic-font-mono, 'JetBrains Mono', ui-monospace, monospace);
        font-size: 11px;
        color: var(--secondary-text-color);
      }
      ul.rows {
        margin: 0; padding: 0; list-style: none;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 4px 12px;
        font-size: 12px;
      }
      .tag {
        font-family: var(--smartmorphic-font-mono, 'JetBrains Mono', ui-monospace, monospace);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .ver {
        font-family: var(--smartmorphic-font-mono, 'JetBrains Mono', ui-monospace, monospace);
        font-size: 11px;
        text-align: right;
      }
      .row.ok      .tag::before { content: "✓ "; color: var(--success-color, #4caf50); }
      .row.warn    .tag::before { content: "⚠ "; color: var(--warning-color, #ff9800); }
      .row.missing .tag::before { content: "✗ "; color: var(--error-color, #f44336); }
      .row.fail    .tag::before { content: "✗ "; color: var(--error-color, #f44336); }
      .row.missing .ver, .row.fail .ver { color: var(--error-color, #f44336); }
      .row.warn    .ver                  { color: var(--warning-color, #ff9800); }
      .extras {
        margin-top: 12px; padding-top: 8px;
        border-top: 1px solid var(--divider-color, rgba(125,128,146,0.10));
        font-size: 11px;
        color: var(--secondary-text-color);
        display: grid; gap: 4px;
      }
      .extras .badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 999px;
        background: var(--smartmorphic-off-tint, rgba(125,128,146,0.10));
        font-family: var(--smartmorphic-font-mono, 'JetBrains Mono', ui-monospace, monospace);
        font-size: 10px;
      }
      .extras .badge.warn { background: rgba(255,152,0,0.15); color: var(--warning-color, #ff9800); }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="card">
        <div class="title"></div>
        <div class="summary">
          <span class="count"></span>
          <span class="loader"></span>
        </div>
        <ul class="rows"></ul>
        <div class="extras" hidden></div>
      </div>
    `;

    this._update();
  }

  _update() {
    const root = this.shadowRoot;
    if (!root) return;
    const d = this._data();

    root.querySelector(".title").textContent = this._config.title || "Smartmorphic Diagnostics";

    const countEl = root.querySelector(".count");
    countEl.textContent = `${d.loadedCount}/${d.totalCount} cards`;
    let cls = "ok";
    if (d.loadedCount === 0) cls = "fail";
    else if (d.loadedCount < d.totalCount) cls = "warn";
    countEl.className = "count " + cls;

    const loaderEl = root.querySelector(".loader");
    loaderEl.textContent =
      "loader " + d.loaderVersion + (d.loadedAgo ? " · " + d.loadedAgo : "");

    const list = root.querySelector(".rows");
    list.innerHTML = d.rows
      .map(
        (r) => `
          <li class="row ${r.status}">
            <span class="tag">${r.tag}</span>
            <span class="ver">${r.ver ? "v" + r.ver : r.status === "fail" ? "load failed" : "not registered"}</span>
          </li>
        `,
      )
      .join("");

    const extras = root.querySelector(".extras");
    if (this._config.show_extras !== false) {
      extras.hidden = false;
      const pill = d.polyfillDetected
        ? `<span class="badge warn">polyfilled registry (scoped-custom-element-registry)</span>`
        : `<span class="badge">native registry</span>`;
      const fails = d.failures.length
        ? `<div>load failures: <span class="badge warn">${d.failures.join(", ")}</span></div>`
        : "";
      extras.innerHTML = `
        <div>registry: ${pill}</div>
        ${fails}
      `;
    } else {
      extras.hidden = true;
    }
  }
}

window.smartmorphicDefineCard("smartmorphic-diagnostics-card", SmartmorphicDiagnosticsCard);

// =============================================================================
// Visual editor — single optional title field.
// =============================================================================
const DIAG_EDITOR_LABELS = {
  title: "Title (optional)",
  show_extras: "Show extras (registry info)",
};
const DIAG_EDITOR_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "show_extras", selector: { boolean: {} } },
];

class SmartmorphicDiagnosticsCardEditor extends HTMLElement {
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
    this._form.schema = DIAG_EDITOR_SCHEMA;
    this._form.computeLabel = (s) => DIAG_EDITOR_LABELS[s.name] ?? s.name;
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

window.smartmorphicDefineCard("smartmorphic-diagnostics-card-editor", SmartmorphicDiagnosticsCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "smartmorphic-diagnostics-card",
  name: "Smartmorphic Diagnostics",
  description: "Loader + per-card version + registration health.",
  preview: false,
});

window.smartmorphic = window.smartmorphic || {};
window.smartmorphic.versions = window.smartmorphic.versions || {};
window.smartmorphic.versions["smartmorphic-diagnostics-card"] = "0.1.0";

console.info(
  "%c SMARTMORPHIC-DIAGNOSTICS-CARD %c v0.1.0 ",
  "color: white; background: #e8653a; font-weight: 700;",
  "color: #e8653a; background: transparent;"
);
