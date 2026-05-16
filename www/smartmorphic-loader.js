// =============================================================================
// Smartmorphic — single loader
//
// Becomes the ONLY entry in HA's `frontend.extra_module_url`. Dynamically
// imports every Smartmorphic card with a version query string baked in
// by scripts/stamp-version.sh on every commit, so each commit gets a
// guaranteed-fresh URL — browsers can no longer serve stale bytes.
//
// configuration.yaml:
//
//   frontend:
//     themes: !include_dir_merge_named themes
//     extra_module_url:
//       - /local/smartmorphic-loader.js
//
// Self-hosted fonts: swap `smartmorphic-fonts` for `smartmorphic-fonts-local`
// in the FILES list below.
//
// See HARDENING.md for the why; do not hand-edit VERSION — the stamp
// script rewrites that line on every commit.
// =============================================================================

const VERSION = "5d87dcc-20260516012529";

const FILES = [
  "smartmorphic-fonts",
  "smartmorphic-room-card",
  "smartmorphic-light-card",
  "smartmorphic-status-pill",
  "smartmorphic-sensor-tile",
  "smartmorphic-tile-card",
  "smartmorphic-climate-tile",
  "smartmorphic-automation-row",
  "smartmorphic-scene-chip",
  "smartmorphic-diagnostics-card",
];

window.smartmorphic = window.smartmorphic || {};
window.smartmorphic.loaderVersion = VERSION;
window.smartmorphic.versions = window.smartmorphic.versions || {};
window.smartmorphic.expectedCards = FILES.filter((f) => f !== "smartmorphic-fonts" && f !== "smartmorphic-fonts-local");
window.smartmorphic.loadedAt = new Date().toISOString();

// ---------------------------------------------------------------------------
// Registry-resilient card definer (Phase 3 of HARDENING.md).
//
// Mushroom's scoped-custom-element-registry polyfill REPLACES
// window.customElements after our cards register, orphaning the
// definitions. This helper:
//
//   1. Defines normally on first call.
//   2. Records every (tag, ctor) pair so we can re-define after any swap.
//   3. Watches the document with a MutationObserver and re-defines +
//      upgrades any <smartmorphic-*> element whose constructor doesn't
//      match the recorded one.
//   4. Runs a brief 5s poll as belt-and-braces for the most common race
//      (Mushroom loading shortly after the loader).
//
// Cards' own inline fallback (`if (!window.smartmorphicDefineCard) ...`)
// is left untouched — it's a no-op when this helper is already present.
// ---------------------------------------------------------------------------
(function installDefineCard() {
  if (window.smartmorphicDefineCard) return;

  const REGISTRY = new Map(); // tag -> ctor

  function tryDefine(tag, ctor) {
    const current = customElements.get(tag);
    if (current === ctor) return true;
    if (current) return false; // foreign definition holds the tag
    try {
      customElements.define(tag, ctor);
      return true;
    } catch (_) {
      return false;
    }
  }

  function recover() {
    for (const [tag, ctor] of REGISTRY) {
      if (customElements.get(tag) === ctor) continue;
      if (tryDefine(tag, ctor)) {
        console.info("[smartmorphic-register] " + tag + " re-registered (registry swap detected)");
        document.querySelectorAll(tag).forEach((el) => {
          if (!(el instanceof ctor)) {
            try { customElements.upgrade(el); } catch (_) {}
          }
        });
      }
    }
  }

  // Coalesce mutations into one check per frame.
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; recover(); });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Catch the typical post-load polyfill swap from Mushroom.
  let elapsed = 0;
  const poll = setInterval(() => {
    elapsed += 500;
    recover();
    if (elapsed >= 5000) clearInterval(poll);
  }, 500);

  window.smartmorphicDefineCard = function (tag, ctor) {
    REGISTRY.set(tag, ctor);
    if (tryDefine(tag, ctor)) {
      console.info("[smartmorphic-register] " + tag + " registered");
    } else if (customElements.get(tag) !== ctor) {
      console.warn("[smartmorphic-register] " + tag + " conflict with existing definition");
    }
  };

  window.smartmorphic.registry = REGISTRY;
})();

console.info(
  "%c SMARTMORPHIC %c loader v=" + VERSION + "  (importing " + FILES.length + " modules) ",
  "color: white; background: #e8653a; font-weight: 700; padding: 2px 6px;",
  "color: #e8653a; background: transparent;"
);

(async () => {
  const failures = [];
  for (const name of FILES) {
    const url = `/local/${name}.js?v=${VERSION}`;
    try {
      await import(url);
    } catch (err) {
      failures.push(name);
      console.error("[smartmorphic-loader] failed to import " + name, err);
    }
  }
  window.smartmorphic.loaderFailures = failures;
  if (failures.length) {
    console.warn(
      "[smartmorphic-loader] " + failures.length + " module(s) failed: " + failures.join(", ")
    );
  } else {
    console.info("[smartmorphic-loader] all modules loaded");
  }
})();
