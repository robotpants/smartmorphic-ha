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

const VERSION = "f15d8d7-20260516011523";

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
