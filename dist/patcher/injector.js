'use strict';

const { patchFile, restoreFile } = require('./atomic');
const { buildDomScript } = require('../rtl/dom-script');

const CSS_MARKER = 'CLINE RTL SMART CSS v1';
const DOM_MARKER_NAME = 'CLINE RTL SMART DOM v1';

function safeFont(value) {
  const font = String(value || '').trim();
  return font && /^[\w\s,.'-]{1,120}$/.test(font) ? font : '';
}

function buildCss(mode, textFont = '') {
  if (!['auto', 'always', 'ltr'].includes(mode)) throw new Error(`Unsupported RTL mode: ${mode}`);
  const font = safeFont(textFont);
  const proseFont = font ? `\n.cline-rtl-bubble, textarea[data-cline-rtl-input], [contenteditable="true"][data-cline-rtl-input] { font-family: "${font}", var(--vscode-font-family, sans-serif); }` : '';
  return `/* ${CSS_MARKER} */
/* Smart direction is assigned per bubble by the companion DOM script. */
.cline-rtl-bubble[data-cline-rtl="rtl"] {
  direction: rtl;
  text-align: start;
  unicode-bidi: isolate;
}
.cline-rtl-bubble[data-cline-rtl="always"] {
  direction: rtl;
  text-align: start;
  unicode-bidi: isolate;
}
.cline-rtl-bubble[data-cline-rtl="ltr"],
.cline-rtl-bubble[data-cline-rtl="ltr"] :where(p, li, h1, h2, h3, h4, blockquote) {
  direction: ltr;
  text-align: start;
  unicode-bidi: isolate;
}
.cline-rtl-bubble :where(a, bdi, code, kbd, samp) { unicode-bidi: isolate; }
[data-cline-rtl-inline="ltr"] {
  direction: ltr !important;
  unicode-bidi: isolate !important;
}
[data-cline-rtl-inline="rtl"] {
  direction: rtl !important;
  unicode-bidi: isolate !important;
}

/* Never let prose direction leak into executable or chrome-like content. */
.cline-rtl-bubble :where(pre, code, [class*="tool" i], [class*="terminal" i], [class*="diff" i], [class*="thinking" i], [class*="command" i]),
.cline-rtl-bubble:where(pre, code, [class*="tool" i], [class*="terminal" i], [class*="diff" i], [class*="thinking" i], [class*="command" i]),
pre, code, [class*="tool" i], [class*="terminal" i], [class*="diff" i], [class*="thinking" i] {
  direction: ltr !important;
  text-align: left !important;
  unicode-bidi: isolate !important;
}
.cline-rtl-bubble :where(button, input, select, [role="button"]) { direction: ltr !important; unicode-bidi: isolate !important; }
[data-cline-rtl-control="rtl"] { direction: rtl !important; text-align: start; unicode-bidi: isolate !important; }
[data-cline-rtl-control="ltr"] { direction: ltr !important; text-align: start; unicode-bidi: isolate !important; }
textarea[data-cline-rtl-input="rtl"], [contenteditable="true"][data-cline-rtl-input="rtl"] {
  direction: rtl;
  text-align: start;
  unicode-bidi: plaintext;
}
textarea[data-cline-rtl-input="ltr"], [contenteditable="true"][data-cline-rtl-input="ltr"] {
  direction: ltr;
  text-align: start;
  unicode-bidi: plaintext;
}${proseFont}
/* END ${CSS_MARKER} */`;
}

async function applyMode(installation, mode, settings = {}) {
  const css = await patchFile(installation.cssPath, CSS_MARKER, buildCss(mode, settings.textFont), installation.root);
  const jsPayload = buildDomScript(mode);
  const js = await patchFile(installation.jsPath, DOM_MARKER_NAME, jsPayload, installation.root);
  return { changed: css.changed || js.changed, css, js, mode };
}

async function removeMode(installation) {
  const css = await restoreFile(installation.cssPath, { removeBackup: true });
  const js = await restoreFile(installation.jsPath, { removeBackup: true });
  return { changed: css || js, css, js };
}

module.exports = { CSS_MARKER, DOM_MARKER_NAME, buildCss, applyMode, removeMode };
