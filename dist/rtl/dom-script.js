'use strict';

const DOM_MARKER = '/* CLINE RTL SMART DOM v1 */';

function buildDomScript(mode) {
  if (!['auto', 'always', 'ltr'].includes(mode)) throw new Error(`Unsupported RTL mode: ${mode}`);
  return `${DOM_MARKER}
(function () {
  'use strict';
  var MODE = ${JSON.stringify(mode)};
  var ROOT = document.body;
  if (!ROOT) return;
  var RTL_RE = /[\\u0590-\\u05ff\\u0600-\\u06ff\\u0700-\\u074f\\u0750-\\u077f\\u0780-\\u07ff\\u0800-\\u08ff\\ufb1d-\\ufdff\\ufe70-\\ufeff]/;
  var LTR_RE = /[A-Za-z\\u00c0-\\u02af\\u0370-\\u052f\\u1e00-\\u1eff]/;
  var BIDI_LITERAL_RE = /\\\\u(?:200[ef]|202[a-e]|206[6-9])/gi;
  /* Cline renders submitted user prompts as generic break-words /
     whitespace-pre-wrap blocks (without a message/prompt test id). Keep
     those blocks in the same direction pipeline as assistant prose. */
  var BUBBLE_RE = '[data-testid*="message" i],[data-testid*="chat" i],[data-testid*="plan" i],[data-testid*="prompt" i],[data-testid*="user" i],[class*="message" i],[class*="markdown" i],[class*="plan" i],[class*="prompt" i],[class*="user" i],[class*="whitespace-pre-wrap" i][class*="break-words" i],article,p,li,h1,h2,h3,h4,h5,h6,blockquote';
  var EXCLUDED_RE = 'pre,code,[class*="tool" i],[class*="terminal" i],[class*="diff" i],[class*="thinking" i],[class*="command" i],button,input,textarea,select,[role="button"]';
  var INPUT_RE = 'textarea,[contenteditable="true"]';
  var INLINE_RE = 'a,strong,em,b,i,mark,kbd,samp';
  var queued = false;
  var scanRoot = document.querySelector('#root') || ROOT;

  function has(node, selector) {
    return !!(node && node.matches && node.matches(selector));
  }
  function inside(node, selector) {
    return !!(node && node.closest && node.closest(selector));
  }
  function direction(text) {
    var value = String(text || '');
    var rtlCount = 0;
    var ltrCount = 0;
    var first = 'neutral';
    for (var i = 0; i < value.length; i++) {
      var cp = value.codePointAt(i);
      if (cp > 0xffff) i++;
      var char = String.fromCodePoint(cp);
      if (RTL_RE.test(char)) { rtlCount++; if (first === 'neutral') first = 'rtl'; }
      else if (LTR_RE.test(char)) { ltrCount++; if (first === 'neutral') first = 'ltr'; }
    }
    if (!rtlCount && !ltrCount) return 'neutral';
    if (rtlCount > ltrCount && rtlCount >= 1) return 'rtl';
    if (ltrCount > rtlCount) return 'ltr';
    return first;
  }
  function proseText(el) {
    var clone = el.cloneNode(true);
    var excluded = clone.querySelectorAll(EXCLUDED_RE);
    for (var i = 0; i < excluded.length; i++) excluded[i].remove();
    return clone.textContent || '';
  }
  function mark(el) {
    if (!el || !el.matches || !has(el, BUBBLE_RE) || has(el, EXCLUDED_RE) || inside(el, EXCLUDED_RE)) return;
    var dir = direction(proseText(el));
    if (MODE === 'always') {
      el.setAttribute('data-cline-rtl', 'always');
      el.setAttribute('dir', 'rtl');
    } else if (MODE === 'ltr') {
      el.setAttribute('data-cline-rtl', 'ltr');
      el.setAttribute('dir', 'ltr');
    } else if (dir === 'rtl' || dir === 'ltr') {
      el.setAttribute('data-cline-rtl', dir);
      el.setAttribute('dir', dir);
    } else {
      el.removeAttribute('data-cline-rtl');
      el.removeAttribute('dir');
    }
    el.classList.add('cline-rtl-bubble');
    markInline(el, MODE === 'always' ? 'rtl' : MODE === 'ltr' ? 'ltr' : (dir === 'rtl' ? 'rtl' : 'ltr'));
  }
  function markInline(bubble, baseDir) {
    var inline = bubble.querySelectorAll(INLINE_RE);
    for (var i = 0; i < inline.length; i++) {
      var item = inline[i];
      if (inside(item, EXCLUDED_RE)) continue;
      var itemDir = direction(item.textContent || '');
      if ((itemDir === 'rtl' || itemDir === 'ltr') && itemDir !== baseDir) {
        item.setAttribute('data-cline-rtl-inline', itemDir);
        item.setAttribute('dir', itemDir);
        item.setAttribute('data-cline-rtl-owned-dir', '1');
      } else {
        item.removeAttribute('data-cline-rtl-inline');
        if (item.getAttribute('data-cline-rtl-owned-dir') === '1') {
          item.removeAttribute('dir');
          item.removeAttribute('data-cline-rtl-owned-dir');
        }
      }
    }
  }
  function markInputs() {
    var inputs = scanRoot.querySelectorAll(INPUT_RE);
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (inside(input, EXCLUDED_RE)) continue;
      var dir = MODE === 'always' ? 'rtl' : MODE === 'ltr' ? 'ltr' : direction(input.value || input.textContent);
      input.setAttribute('data-cline-rtl-input', dir === 'rtl' ? 'rtl' : 'ltr');
    }
  }
  function markControls() {
    var controls = scanRoot.querySelectorAll('button,[role="button"]');
    for (var i = 0; i < controls.length; i++) {
      var control = controls[i];
      if (inside(control, 'pre,code,[class*="tool" i],[class*="terminal" i],[class*="command" i]')) continue;
      var dir = MODE === 'always' ? 'rtl' : MODE === 'ltr' ? 'ltr' : direction(control.textContent || '');
      if (dir === 'rtl' || dir === 'ltr') {
        control.setAttribute('data-cline-rtl-control', dir);
        control.setAttribute('dir', dir);
      } else {
        control.removeAttribute('data-cline-rtl-control');
      }
    }
  }
  function stripVisibleLiterals(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || inside(node.parentElement, EXCLUDED_RE)) continue;
      if (node.nodeValue.indexOf('\\\\u') === -1) continue;
      node.nodeValue = node.nodeValue.replace(BIDI_LITERAL_RE, '');
    }
  }
  function scan() {
    queued = false;
    var bubbles = scanRoot.querySelectorAll(BUBBLE_RE);
    for (var i = 0; i < bubbles.length; i++) mark(bubbles[i]);
    markInputs();
    markControls();
    stripVisibleLiterals(scanRoot);
  }
  function queueScan() {
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 50); })(scan);
  }
  scan();
  new MutationObserver(queueScan).observe(scanRoot, { childList: true, subtree: true, characterData: true });
  scanRoot.addEventListener('input', queueScan, true);
})();
/* END CLINE RTL SMART DOM v1 */`;
}

module.exports = { DOM_MARKER, buildDomScript };
