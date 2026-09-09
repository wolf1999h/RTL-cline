'use strict';

const vscode = require('vscode');
const { discoverClineInstallations } = require('./patcher/discovery');
const { applyMode, removeMode } = require('./patcher/injector');

let statusBar;
let output;
let contextRef;

function configuredMode() {
  const mode = vscode.workspace.getConfiguration('cline-rtl').get('mode', 'auto');
  return ['auto', 'always', 'ltr'].includes(mode) ? mode : 'auto';
}

function modeLabel(mode) {
  return mode === 'always' ? 'Always' : mode === 'ltr' ? 'LTR' : 'Auto';
}

function updateStatus(mode, count = 0) {
  if (!statusBar) return;
  statusBar.text = count ? `$(arrow-swap) Cline RTL: ${modeLabel(mode)}` : '$(arrow-swap) Cline RTL: N/A';
  statusBar.tooltip = count ? `${count} Cline installation(s) patched — click to manage` : 'No Cline installation found';
}

async function installations() {
  return discoverClineInstallations({ extensionRegistry: vscode.extensions.all.map((extension) => ({
    id: extension.id,
    extensionPath: extension.extensionPath,
    packageJSON: extension.packageJSON,
  })) });
}

async function activateMode(mode, reload = true) {
  const found = await installations();
  if (!found.length) {
    updateStatus(mode, 0);
    vscode.window.showWarningMessage('Cline RTL: No supported Cline or Roo Cline installation was found.');
    return false;
  }
  const settings = vscode.workspace.getConfiguration('cline-rtl');
  const results = [];
  for (const installation of found) {
    try {
      const result = await applyMode(installation, mode, { textFont: settings.get('textFont', '') });
      results.push(`${installation.id}: ${result.changed ? 'patched' : 'unchanged'}`);
      output?.appendLine(`${installation.id}@${installation.version}: ${result.changed ? 'patched' : 'unchanged'}`);
    } catch (error) {
      results.push(`${installation.id}: error (${error.message})`);
      output?.appendLine(`${installation.id}: ${error.stack || error.message}`);
    }
  }
  updateStatus(mode, found.length);
  vscode.window.showInformationMessage(`Cline RTL ${modeLabel(mode)}: ${results.join(' · ')}`);
  if (reload && settings.get('reloadAfterPatch', true) && results.some((item) => item.includes('patched'))) {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
  return true;
}

async function deactivateMode() {
  const found = await installations();
  if (!found.length) {
    updateStatus('auto', 0);
    vscode.window.showWarningMessage('Cline RTL: No supported Cline or Roo Cline installation was found.');
    return false;
  }
  let changed = false;
  for (const installation of found) {
    try {
      const result = await removeMode(installation);
      changed ||= result.changed;
      output?.appendLine(`${installation.id}@${installation.version}: ${result.changed ? 'restored' : 'no backup'}`);
    } catch (error) {
      output?.appendLine(`${installation.id}: ${error.stack || error.message}`);
    }
  }
  updateStatus('auto', 0);
  vscode.window.showInformationMessage(changed ? 'Cline RTL: Pristine Cline assets restored.' : 'Cline RTL: No active patch found.');
  if (changed && vscode.workspace.getConfiguration('cline-rtl').get('reloadAfterPatch', true)) await vscode.commands.executeCommand('workbench.action.reloadWindow');
  return changed;
}

async function showStatus() {
  const found = await installations();
  output.clear();
  output.appendLine(`Configured mode: ${configuredMode()}`);
  output.appendLine(`Found ${found.length} supported Cline installation(s).`);
  for (const item of found) output.appendLine(`${item.id}@${item.version}\n  CSS: ${item.cssPath}\n  JS: ${item.jsPath}`);
  output.show(true);
  updateStatus(configuredMode(), found.length);
}

function openMenu() {
  return vscode.window.showQuickPick([
    { label: '$(eye) Activate (Auto)', action: () => activateMode('auto') },
    { label: '$(pin) Activate (Always RTL)', action: () => activateMode('always') },
    { label: '$(arrow-right) Force LTR', action: () => activateMode('ltr') },
    { label: '$(close) Deactivate', action: () => deactivateMode() },
    { label: '$(info) Status', action: () => showStatus() },
  ], { placeHolder: 'Cline RTL Smart Support' }).then((choice) => choice?.action());
}

function activate(context) {
  contextRef = context;
  output = vscode.window.createOutputChannel('Cline RTL');
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = 'cline-rtl.menu';
  statusBar.show();
  context.subscriptions.push(output, statusBar);
  context.subscriptions.push(
    vscode.commands.registerCommand('cline-rtl.activateAuto', () => activateMode('auto')),
    vscode.commands.registerCommand('cline-rtl.activateAlways', () => activateMode('always')),
    vscode.commands.registerCommand('cline-rtl.activateLtr', () => activateMode('ltr')),
    vscode.commands.registerCommand('cline-rtl.deactivate', () => deactivateMode()),
    vscode.commands.registerCommand('cline-rtl.status', () => showStatus()),
    vscode.commands.registerCommand('cline-rtl.menu', openMenu),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('cline-rtl.mode')) void activateMode(configuredMode(), false);
    }),
  );
  void activateMode(configuredMode(), false);
}

function deactivate() { contextRef = undefined; }

module.exports = { activate, deactivate, _private: { activateMode, deactivateMode, showStatus } };
