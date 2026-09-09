const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { patchFile, restoreFile } = require('../src/patcher/atomic');

async function fixture() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'cline-rtl-atomic-'));
}

test('patchFile creates a pristine backup and is idempotent', async () => {
  const root = await fixture();
  const target = path.join(root, 'asset.css');
  await fs.writeFile(target, 'base\n', 'utf8');
  const first = await patchFile(target, 'TEST MARKER', '/* TEST MARKER */\nrtl{}\n/* END TEST MARKER */', root);
  const second = await patchFile(target, 'TEST MARKER', '/* TEST MARKER */\nrtl{}\n/* END TEST MARKER */', root);
  assert.equal(first.changed, true);
  assert.equal(second.changed, true);
  assert.equal((await fs.readFile(target, 'utf8')).match(/TEST MARKER/g).length, 2);
  assert.equal(await fs.readFile(`${target}.cline-rtl.bak`, 'utf8'), 'base\n');
});

test('restoreFile returns pristine content and removes backup when requested', async () => {
  const root = await fixture();
  const target = path.join(root, 'asset.js');
  await fs.writeFile(target, 'original', 'utf8');
  await patchFile(target, 'TEST MARKER', '/* TEST MARKER */patched/* END TEST MARKER */', root);
  assert.equal(await restoreFile(target, { removeBackup: true }), true);
  assert.equal(await fs.readFile(target, 'utf8'), 'original');
  await assert.rejects(fs.access(`${target}.cline-rtl.bak`));
});

test('patchFile rejects a result smaller than the pristine backup', async () => {
  const root = await fixture();
  const target = path.join(root, 'large.css');
  await fs.writeFile(target, '0123456789', 'utf8');
  const result = await patchFile(target, 'TEST MARKER', '/* TEST MARKER */x/* END TEST MARKER */', root, { forceResult: 'x' });
  assert.equal(result.changed, false);
  assert.match(result.reason, /smaller/i);
  assert.equal(await fs.readFile(target, 'utf8'), '0123456789');
});

test('adopts an upstream asset update as the new pristine baseline', async () => {
  const root = await fixture();
  const target = path.join(root, 'updated.css');
  await fs.writeFile(target, 'v1', 'utf8');
  await patchFile(target, 'TEST MARKER', '/* TEST MARKER */patch/* END TEST MARKER */', root);
  await fs.writeFile(target, 'v2-upstream', 'utf8');
  await patchFile(target, 'TEST MARKER', '/* TEST MARKER */patch/* END TEST MARKER */', root);
  assert.equal(await fs.readFile(`${target}.cline-rtl.bak`, 'utf8'), 'v2-upstream');
  assert.match(await fs.readFile(target, 'utf8'), /v2-upstream/);
});
