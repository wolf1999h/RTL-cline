const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { buildCss, applyMode, removeMode, CSS_MARKER } = require('../src/patcher/injector');

async function installFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cline-rtl-injector-'));
  const cssPath = path.join(root, 'index.css');
  const jsPath = path.join(root, 'index.js');
  await fs.writeFile(cssPath, 'body{color:red}\n');
  await fs.writeFile(jsPath, 'window.__cline = true;\n');
  return { id: 'fixture.cline', version: '0.0.0', root, cssPath, jsPath };
}

test('buildCss protects prose direction while isolating code and tools', () => {
  const css = buildCss('auto', 'Vazirmatn');
  assert.match(css, new RegExp(CSS_MARKER));
  assert.match(css, /unicode-bidi:\s*plaintext/);
  assert.match(css, /data-cline-rtl="rtl"\]\s*\{[^}]*unicode-bidi:\s*isolate/);
  assert.match(css, /data-cline-rtl-inline="ltr"[\s\S]*unicode-bidi:\s*isolate/);
  assert.match(css, /pre|code/);
  assert.match(css, /direction:\s*ltr/);
  assert.match(css, /Vazirmatn/);
});

test('applyMode patches both assets without stacking and removeMode restores them', async () => {
  const install = await installFixture();
  const first = await applyMode(install, 'auto', { textFont: '' });
  const second = await applyMode(install, 'auto', { textFont: '' });
  assert.equal(first.changed, true);
  assert.equal(second.changed, true);
  const css = await fs.readFile(install.cssPath, 'utf8');
  const js = await fs.readFile(install.jsPath, 'utf8');
  assert.equal(css.split(`/* ${CSS_MARKER} */`).length - 1, 1);
  assert.equal(js.split('CLINE RTL SMART DOM v1').length - 1, 2);
  assert.equal((await removeMode(install)).changed, true);
  assert.equal(await fs.readFile(install.cssPath, 'utf8'), 'body{color:red}\n');
  assert.equal(await fs.readFile(install.jsPath, 'utf8'), 'window.__cline = true;\n');
});
