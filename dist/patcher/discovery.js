'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SUPPORTED_IDS = new Set(['rooveterinaryinc.roo-cline', 'saoudrizwan.claude-dev']);

async function directory(file) {
  try { return (await fs.stat(file)).isDirectory(); } catch { return false; }
}

async function readJson(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return {}; }
}

async function candidateRoots() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const roots = [
    process.env.VSCODE_EXTENSIONS,
    path.join(home, '.vscode', 'extensions'),
    path.join(home, '.vscode-oss', 'extensions'),
    path.join(home, '.var', 'app', 'com.vscodium.codium', 'data', 'codium', 'extensions'),
    path.join(home, '.var', 'app', 'com.visualstudio.code', 'data', 'vscode', 'extensions'),
  ].filter(Boolean);
  return [...new Set(roots)];
}

async function discoverClineInstallations(options = {}) {
  const roots = options.extensionRoots || await candidateRoots();
  const installations = [];
  const seen = new Set();
  const registry = options.extensionRegistry || [];
  for (const entry of registry) {
    const id = String(entry.id || entry.packageJSON?.publisher + '.' + entry.packageJSON?.name || '');
    if (!SUPPORTED_IDS.has(id)) continue;
    const found = await inspectRoot(entry.extensionPath, id, entry.packageJSON?.version);
    for (const item of found) {
      const key = `${item.root}:${item.cssPath}`;
      if (!seen.has(key)) { installations.push(item); seen.add(key); }
    }
  }
  for (const root of roots) {
    if (!(await directory(root))) continue;
    let names = [];
    try { names = await fs.readdir(root); } catch { continue; }
    for (const name of names) {
      const id = [...SUPPORTED_IDS].find((supported) => name === supported || name.startsWith(`${supported}-`));
      if (!id) continue;
      const found = await inspectRoot(path.join(root, name), id);
      for (const item of found) {
        const key = `${item.root}:${item.cssPath}`;
        if (!seen.has(key)) { installations.push(item); seen.add(key); }
      }
    }
  }
  return installations;
}

async function inspectRoot(root, id, versionHint) {
  if (!(await directory(root))) return [];
  const packageJson = await readJson(path.join(root, 'package.json'));
  const version = String(versionHint || packageJson.version || 'unknown');
  const known = [
    [path.join(root, 'webview-ui', 'build', 'assets', 'index.css'), path.join(root, 'webview-ui', 'build', 'assets', 'index.js')],
    [path.join(root, 'webview', 'index.css'), path.join(root, 'webview', 'index.js')],
    [path.join(root, 'next', 'webview-ui', 'build', 'assets', 'index.css'), path.join(root, 'next', 'webview-ui', 'build', 'assets', 'index.js')],
    [path.join(root, 'legacy', 'webview-ui', 'build', 'assets', 'index.css'), path.join(root, 'legacy', 'webview-ui', 'build', 'assets', 'index.js')],
  ];
  const found = [];
  for (const [cssPath, jsPath] of known) {
    if (await file(cssPath) && await file(jsPath)) found.push({ id, version, root, cssPath, jsPath });
  }
  return found;
}

async function file(candidate) {
  try { return (await fs.stat(candidate)).isFile(); } catch { return false; }
}

module.exports = { SUPPORTED_IDS, discoverClineInstallations, candidateRoots };
