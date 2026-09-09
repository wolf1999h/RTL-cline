# Cline RTL Smart Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and package a standalone VS Code/VSCodium extension that safely patches Cline/Roo Cline webviews with smart Persian/Arabic/Hebrew RTL support.

**Architecture:** A small TypeScript extension host discovers installed Cline assets, applies idempotent atomic patches, and exposes commands/status. A pure RTL detector is shared with a self-contained browser script injected into Cline’s webview CSS/JS; code/tool/UI nodes remain isolated LTR while prose and inputs are classified dynamically.

**Tech Stack:** TypeScript, VS Code Extension API, Node.js `node:test`, esbuild, `@vscode/vsce`.

**Spec:** `docs/superpowers/specs/2026-09-08-cline-rtl-design.md`

## Global Constraints

- Support `rooveterinaryinc.roo-cline` and `saoudrizwan.claude-dev`.
- Use pristine backups, per-installation locks, atomic same-directory writes, marker replacement, and result-size corruption guards.
- Never rewrite user text or code; only classify DOM and remove visible BiDi escape literals outside code blocks.
- Default mode is `auto`; code/tool/UI stays LTR and isolated.
- Tests are written and observed failing before production implementation.

### Task 1: Scaffold extension and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `esbuild.mjs`, `.vscodeignore`
- Create: `src/extension.ts`, `src/rtl/detector.ts`, `src/rtl/dom-script.ts`, `src/patcher/discovery.ts`, `src/patcher/atomic.ts`, `src/patcher/injector.ts`
- Create: `test/*.test.ts`

**Steps:**

- [ ] Write package metadata, commands, settings, build/test scripts, and strict TypeScript config.
- [ ] Add test runner that compiles source/tests to a temporary `dist-test` directory and runs Node’s built-in test runner.
- [ ] Add the first detector tests before implementation and run them to confirm the missing-module failure.

### Task 2: Implement and verify Unicode detector

**Files:** `src/rtl/detector.ts`, `test/detector.test.ts`

**Interfaces:**

```ts
export type Direction = "rtl" | "ltr" | "neutral"
export interface DirectionStats { direction: Direction; rtlLetters: number; ltrLetters: number }
export function classifyText(text: string, minimumRtlLetters?: number): DirectionStats
export function hasRtlStrongCharacter(text: string): boolean
export function stripVisibleBidiEscapes(text: string): string
```

- [ ] Add failing tests for Persian/Arabic/Hebrew, Latin, neutral strings, mixed text, and visible escape sequences.
- [ ] Run the focused test and verify it fails for the expected missing exports.
- [ ] Implement Unicode code-point classification with the spec’s ranges and literal escape stripper.
- [ ] Run focused and full detector tests; refactor only while green.

### Task 3: Build self-contained DOM behavior script

**Files:** `src/rtl/dom-script.ts`, `test/dom-script.test.ts`

**Interfaces:**

```ts
export type WebviewMode = "auto" | "always" | "ltr"
export function buildDomScript(mode: WebviewMode): string
export const DOM_MARKER: string
```

- [ ] Add fixture-based tests proving generated script contains stable selectors, mode markers, code/tool LTR exclusions, MutationObserver, input tracking, and code-safe literal stripping.
- [ ] Run tests red.
- [ ] Implement an IIFE that discovers chat root, classifies bubbles by text, adds/removes `cline-rtl-*` classes, observes streaming changes with debounce, handles textarea/contenteditable direction, and strips only visible escape literals outside `pre`, `code`, diff, terminal, and tool nodes.
- [ ] Run DOM-script tests green and ensure generated payload has no unescaped extension-host dependencies.

### Task 4: Implement discovery and safe atomic patch primitives

**Files:** `src/patcher/discovery.ts`, `src/patcher/atomic.ts`, `test/discovery.test.ts`, `test/atomic.test.ts`

**Interfaces:**

```ts
export interface ClineInstallation { id: string; version: string; root: string; cssPath: string; jsPath: string; }
export async function discoverClineInstallations(options?: DiscoveryOptions): Promise<ClineInstallation[]>
export async function patchFile(path: string, marker: string, payload: string, lockRoot: string): Promise<PatchResult>
export async function restoreFile(path: string): Promise<boolean>
```

- [ ] Add temp-fixture tests for both extension IDs, multiple versions, missing assets, backup creation, repeated patching, stale locks, atomic writes, size guard, and restore.
- [ ] Run focused tests red.
- [ ] Implement discovery from `vscode.extensions.all`, `VSCODE_EXTENSIONS`, Flatpak VSCodium data roots, and standard Linux roots; return only assets that exist and are writable.
- [ ] Implement lock file with stale recovery, pristine `.cline-rtl.bak`, marker replacement, temp+rename, metadata, and per-file result reporting.
- [ ] Run focused tests green; never touch installed assets from tests.

### Task 5: Implement CSS payload and injector

**Files:** `src/patcher/injector.ts`, `test/injector.test.ts`

**Interfaces:**

```ts
export function buildCss(mode: WebviewMode, textFont?: string): string
export async function applyMode(installation: ClineInstallation, mode: WebviewMode, settings: InjectorSettings): Promise<PatchSummary>
export async function removeMode(installation: ClineInstallation): Promise<PatchSummary>
```

- [ ] Add tests for CSS markers, Auto/Always/LTR differences, logical alignment, `unicode-bidi: plaintext`, LTR exclusions, and idempotence.
- [ ] Run tests red.
- [ ] Implement CSS with stable hooks plus cautious Cline class fallbacks, code/tool isolation, input rules, and optional font escaping.
- [ ] Combine CSS + DOM script patching through atomic primitives and emit metadata for extension version/hash.
- [ ] Run injector tests green and smoke-test against copied installed Cline assets.

### Task 6: Wire extension commands, status, configuration, and packaging

**Files:** `src/extension.ts`, `README.md`, `CHANGELOG.md`, `icon.svg`

- [ ] Add command tests for mode dispatch/status formatting where VS Code API can be mocked minimally.
- [ ] Run tests red.
- [ ] Implement activation, status bar, quick-pick menu, configuration listeners, discovery, per-installation error aggregation, and optional reload after changed patches.
- [ ] Add Persian/English README with install/use/recovery instructions and explicit Flatpak paths.
- [ ] Run TypeScript build, tests, package validation, and `vsce package`.

### Task 7: Final verification

- [ ] Run the complete test/build/package command from a clean generated fixture directory.
- [ ] Inspect VSIX contents to confirm no tests, backups, or installed-extension files are included.
- [ ] Verify the workspace diff and report exact artifact path plus known limitations.

