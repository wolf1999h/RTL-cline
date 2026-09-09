const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDomScript, DOM_MARKER } = require('../src/rtl/dom-script');

test('emits a self-contained marked auto-mode observer', () => {
  const script = buildDomScript('auto');
  assert.match(script, new RegExp(DOM_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(script, /MutationObserver/);
  assert.match(script, /contenteditable|textarea/);
  assert.match(script, /requestAnimationFrame|setTimeout/);
  assert.match(script, /BIDI_LITERAL_RE/);
});

test('emits mode-specific direction classes and LTR exclusions', () => {
  for (const mode of ['always', 'ltr']) {
    const script = buildDomScript(mode);
    assert.match(script, /data-cline-rtl/);
    assert.match(script, /pre|code|terminal|tool/i);
    assert.match(script, /data-cline-rtl/);
  }
});

test('includes plan and semantic prose nodes that do not carry message classes', () => {
  const script = buildDomScript('auto');
  assert.match(script, /class\*="plan"/i);
  assert.match(script, /(?:^|,)p[,\]]/i);
});

test('includes Cline submitted prompt blocks rendered as generic pre-wrap text', () => {
  const script = buildDomScript('auto');
  assert.match(script, /whitespace-pre-wrap/);
  assert.match(script, /break-words/);
  assert.match(script, /prompt/);
});

test('uses dominant-script counts instead of returning on the first English word', () => {
  const script = buildDomScript('auto');
  assert.match(script, /rtlCount/);
  assert.match(script, /ltrCount/);
});

test('isolates opposite-direction inline phrases without rewriting their text', () => {
  const script = buildDomScript('auto');
  assert.match(script, /data-cline-rtl-inline/);
  assert.match(script, /strong|em|code|a/);
});

test('adds smart direction to Persian answer controls while retaining tool exclusions', () => {
  const script = buildDomScript('auto');
  assert.match(script, /markControls/);
  assert.match(script, /data-cline-rtl-control/);
  assert.match(script, /role="button"/);
});

test('rejects unknown mode', () => {
  assert.throws(() => buildDomScript('broken'), /Unsupported RTL mode/);
});
