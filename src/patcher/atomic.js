'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const LOCK_MAX_AGE = 30_000;
const LOCK_WAIT = 5_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function withLock(lockRoot, operation) {
  await fs.mkdir(lockRoot, { recursive: true });
  const lockPath = path.join(lockRoot, '.cline-rtl.lock');
  const started = Date.now();
  let handle;
  while (!handle) {
    try {
      handle = await fs.open(lockPath, 'wx');
      await handle.writeFile(`${process.pid}\n`);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        const info = await fs.stat(lockPath);
        if (Date.now() - info.mtimeMs > LOCK_MAX_AGE) await fs.rm(lockPath, { force: true });
      } catch { /* lock disappeared; retry */ }
      if (Date.now() - started > LOCK_WAIT) throw new Error(`Timed out waiting for RTL lock: ${lockPath}`);
      await sleep(25);
    }
  }
  try { return await operation(); }
  finally { await handle.close().catch(() => {}); await fs.rm(lockPath, { force: true }).catch(() => {}); }
}

async function atomicWrite(file, content) {
  const temp = `${file}.cline-rtl.tmp-${process.pid}-${Date.now()}`;
  try {
    await fs.writeFile(temp, content, 'utf8');
    await fs.rename(temp, file);
  } catch (error) {
    await fs.rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

function endMarker(marker) {
  return `/* END ${marker} */`;
}

function removeMarkerBlock(content, marker) {
  const startMarker = `/* ${marker} */`;
  const start = content.indexOf(startMarker);
  if (start < 0) return content;
  const end = content.indexOf(endMarker(marker), start + startMarker.length);
  if (end < 0) return content;
  const after = end + endMarker(marker).length;
  return `${content.slice(0, start).replace(/\n$/, '')}${content.slice(after).replace(/^\n/, '')}`;
}

async function patchFile(file, marker, payload, lockRoot, options = {}) {
  return withLock(lockRoot || path.dirname(file), async () => {
    const backup = `${file}.cline-rtl.bak`;
    const startMarker = `/* ${marker} */`;
    if (await exists(backup)) {
      const current = await fs.readFile(file, 'utf8');
      const previousPristine = await fs.readFile(backup, 'utf8');
      // An upstream extension update replaces the target and removes our marker.
      // Adopt that unpatched target as the new pristine baseline.
      if (!current.includes(startMarker) && current !== previousPristine) await fs.copyFile(file, backup);
    } else {
      await fs.copyFile(file, backup);
    }
    const pristine = await fs.readFile(backup, 'utf8');
    const clean = removeMarkerBlock(pristine, marker);
    const candidate = options.forceResult ?? `${clean.replace(/\s*$/, '')}\n${payload}\n`;
    if (Buffer.byteLength(candidate) < Buffer.byteLength(pristine)) {
      return { changed: false, file, backup, reason: `Result is smaller than pristine backup (${Buffer.byteLength(candidate)} < ${Buffer.byteLength(pristine)})` };
    }
    await atomicWrite(file, candidate);
    return { changed: true, file, backup, bytes: Buffer.byteLength(candidate) };
  });
}

async function restoreFile(file, options = {}) {
  return withLock(path.dirname(file), async () => {
    const backup = `${file}.cline-rtl.bak`;
    if (!(await exists(backup))) return false;
    await atomicWrite(file, await fs.readFile(backup, 'utf8'));
    if (options.removeBackup) await fs.rm(backup, { force: true });
    return true;
  });
}

module.exports = { atomicWrite, patchFile, restoreFile, removeMarkerBlock, withLock };
