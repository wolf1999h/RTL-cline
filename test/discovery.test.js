const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { discoverClineInstallations } = require('../src/patcher/discovery');

test('discovers Roo Cline and Cline asset layouts and ignores unsupported folders', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cline-rtl-discovery-'));
  const roo = path.join(root, 'rooveterinaryinc.roo-cline-3.54.0');
  const cline = path.join(root, 'saoudrizwan.claude-dev-4.1.17');
  for (const dir of [roo, cline]) {
    await fs.mkdir(path.join(dir, 'webview-ui', 'build', 'assets'), { recursive: true });
    await fs.writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: path.basename(dir).split('-')[0], version: '1.0.0' }));
    await fs.writeFile(path.join(dir, 'webview-ui', 'build', 'assets', 'index.css'), 'css');
    await fs.writeFile(path.join(dir, 'webview-ui', 'build', 'assets', 'index.js'), 'js');
  }
  await fs.mkdir(path.join(root, 'not-cline'), { recursive: true });
  const found = await discoverClineInstallations({ extensionRoots: [root] });
  assert.equal(found.length, 2);
  assert.deepEqual(found.map((item) => item.id).sort(), ['rooveterinaryinc.roo-cline', 'saoudrizwan.claude-dev'].sort());
  assert.ok(found.every((item) => item.cssPath.endsWith('index.css') && item.jsPath.endsWith('index.js')));
});

test('discovers nested next and legacy Cline webview builds', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cline-rtl-nested-'));
  const extension = path.join(root, 'saoudrizwan.claude-dev-4.1.17-universal');
  for (const channel of ['next', 'legacy']) {
    const assets = path.join(extension, channel, 'webview-ui', 'build', 'assets');
    await fs.mkdir(assets, { recursive: true });
    await fs.writeFile(path.join(assets, 'index.css'), `${channel}-css`);
    await fs.writeFile(path.join(assets, 'index.js'), `${channel}-js`);
  }
  const found = await discoverClineInstallations({ extensionRoots: [root] });
  assert.equal(found.length, 2);
  assert.deepEqual(found.map((item) => path.basename(path.dirname(path.dirname(path.dirname(path.dirname(item.cssPath)))))).sort(), ['next', 'legacy'].sort());
});
