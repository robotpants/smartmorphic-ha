// =============================================================================
// Smartmorphic — self-hosted font loader for Home Assistant
// Drop-in alternative to smartmorphic-fonts.js for users who want to avoid the
// Google Fonts CDN. Serves variable fonts from /local/fonts/ (symlinked to
// www/fonts/ in this repo).
//
// Note: Outfit is NOT bundled. If you use the theme's display font, either
// stick with smartmorphic-fonts.js (Google CDN) or add Outfit to www/fonts/
// and extend the @font-face block below.
// =============================================================================

(() => {
  const id = "smartmorphic-fonts-local";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @font-face {
      font-family: 'DM Sans';
      src: url('/local/fonts/DMSans-VariableFont_opsz_wght.ttf') format('truetype-variations');
      font-weight: 100 1000;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'DM Sans';
      src: url('/local/fonts/DMSans-Italic-VariableFont_opsz_wght.ttf') format('truetype-variations');
      font-weight: 100 1000;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: 'JetBrains Mono';
      src: url('/local/fonts/JetBrainsMono-VariableFont_wght.ttf') format('truetype-variations');
      font-weight: 100 800;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'JetBrains Mono';
      src: url('/local/fonts/JetBrainsMono-Italic-VariableFont_wght.ttf') format('truetype-variations');
      font-weight: 100 800;
      font-style: italic;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
})();
