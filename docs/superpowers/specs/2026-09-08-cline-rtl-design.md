# Cline RTL Smart Support — Design Specification

## Goal

Build a standalone VS Code/VSCodium extension that makes Persian, Arabic, and Hebrew text readable in the Cline/Roo Cline chat webview. The extension must select RTL only for content that needs it, preserve readable bidirectional text when English identifiers, URLs, numbers, or code appear inside RTL prose, and keep code/tool/UI regions LTR.

## Scope and compatibility

- Target VS Code-compatible hosts, including Flatpak VSCodium.
- Support both currently observed extension identifiers:
  - `rooveterinaryinc.roo-cline` (Roo Cline)
  - `saoudrizwan.claude-dev` (Cline)
- Discover installed versions from the active extension registry and known Linux/Flatpak extension roots. Never assume one fixed version or one fixed asset hash.
- Do not modify Cline source code or require a fork. Patch only the generated webview assets while preserving pristine backups.
- The first release is chat-focused. It may support every webview asset that can be safely identified, but must not patch unrelated editor/terminal UI.

## User-facing behavior

Commands:

- `Cline RTL: Activate (Auto)` — recommended per-message/per-field direction.
- `Cline RTL: Activate (Always RTL)` — RTL chat layout while code, tools, and controls stay LTR.
- `Cline RTL: Force LTR` — stable LTR layout even for RTL-language prose.
- `Cline RTL: Deactivate` — restore the exact pristine assets from backups.
- `Cline RTL: Status` — show discovered Cline installations, installed mode, backups, and patch health.

Activation must be safe to repeat. Re-activation restores from the pristine backup before applying the selected patch, so CSS/JS markers never stack. A status-bar item shows `Cline RTL: Auto`, `Always`, `LTR`, `Inactive`, or `N/A` and opens a small command menu.

The default mode on first activation is Auto. Activation and deactivation request a webview/window reload only after a patch actually changes an asset. If no supported installation is found, the extension reports a clear warning and does not write files.

## Bidirectional text model

### Strong-character detection

The shared detector operates on Unicode code points and returns `"rtl"`, `"ltr"`, or `"neutral"`:

- RTL strong ranges include Hebrew (`U+0590–05FF`), Arabic/Persian (`U+0600–06FF`), Arabic Supplement/Extended (`U+0750–077F`, `U+08A0–08FF`), Arabic Presentation Forms (`U+FB50–FDFF`, `U+FE70–FEFF`), and Syriac/Thaana/N'Ko ranges where appropriate.
- LTR strong characters include Latin and Greek/Cyrillic letters. Digits, punctuation, whitespace, emoji, isolated symbols, and markup are neutral.
- In Auto mode, the first strong character in prose determines direction. A configurable minimum RTL signal avoids treating one accidental Arabic punctuation mark as a Persian paragraph.
- Empty/neutral text remains LTR.

### CSS/DOM direction rules

- Text-bearing chat bubbles and markdown prose receive `direction: rtl`, `text-align: start/end` through logical properties, and `unicode-bidi: plaintext` when their classifier returns RTL.
- Mixed runs are not reversed or manually reordered. URLs, Latin identifiers, numbers, and inline code retain their natural LTR run ordering through `unicode-bidi: plaintext` and `bdi`/isolation where necessary.
- Code blocks (`pre`, `code`, syntax-highlight containers, diffs), terminal/command output, tool calls/results, thinking/debug blocks, file paths, and controls receive `direction: ltr !important`, `unicode-bidi: isolate`, and left alignment.
- CSS uses stable semantic hooks where available (`data-testid`, known Cline classes, `textarea`, `contenteditable`) and falls back to role/text classification. It must not depend solely on generated Tailwind class hashes.

### Dynamic behavior

- A root-level `MutationObserver` finds new or re-rendered bubbles and classifies each independently.
- Streaming replies are reclassified with a debounced queue (maximum one scan per animation frame or 50 ms, whichever is later) to avoid observer storms.
- The chat input direction follows the first strong character currently present. It changes only CSS direction, never the submitted string.
- Visible BiDi escape literals such as `\\u200F`, `\\u200E`, `\\u202A–\\u202E`, and `\\u2066–\\u2069` are removed from rendered text outside code blocks. Actual control characters are not stripped.
- User-supplied text and code content are never rewritten in the extension host.

## Patch safety and update resilience

For each candidate asset:

1. Acquire a per-extension-directory lock with stale-lock recovery.
2. If no pristine backup exists, create `<asset>.cline-rtl.bak`; otherwise restore the pristine backup.
3. Inject one marked CSS or JS layer.
4. Write to a same-directory temporary file and rename atomically.
5. Reject a patched result smaller than the pristine backup and leave the target untouched.
6. Record a small metadata file containing mode, extension version, asset path, and marker version.

On activation, if the installed extension version or asset hash changed, restore and reapply from the new pristine asset. Deactivation restores the backup and removes the backup only after a successful restore. Errors are reported per installation; one broken installation must not block another.

## Extension architecture

- `src/rtl/detector.ts`: pure Unicode strong-character detector and direction classification.
- `src/rtl/dom-script.ts`: browser-side observer, bubble classifier, input tracking, code/tool exclusions, and literal escape stripper. It is emitted as a self-contained script string for injection.
- `src/patcher/discovery.ts`: locate Cline/Roo installations and their webview assets.
- `src/patcher/atomic.ts`: lock, backup, restore, atomic write, marker replacement, and metadata helpers.
- `src/patcher/injector.ts`: build mode-specific CSS/JS payloads and patch candidate assets.
- `src/extension.ts`: activation, commands, status bar, configuration, and reload/status UX.
- `test/*.test.ts`: detector, DOM-script helpers, patcher, and discovery tests.

## Configuration

Settings under `cline-rtl`:

- `cline-rtl.mode`: `auto` (default), `always`, or `ltr`.
- `cline-rtl.rtlLanguages`: enabled RTL script families (default Persian/Arabic/Hebrew plus Arabic extensions).
- `cline-rtl.minimumRtlLetters`: minimum RTL strong-letter count for Auto classification (default `1`).
- `cline-rtl.textFont`: optional font family for prose/input; empty keeps the host font.
- `cline-rtl.reloadAfterPatch`: reload window after a successful patch (default `true`).

## Testing and acceptance criteria

Tests are written before implementation and must fail for the missing behavior first.

- Detector tests cover Persian-only, English-only, punctuation/numbers-only, mixed Persian + English identifier/URL, Hebrew/Arabic, and BiDi control literals.
- DOM-script tests run the classifier/stripper against a DOM-like fixture and verify code/tool regions remain LTR and escape literals are untouched in code.
- Patcher tests cover idempotent marker replacement, pristine backup preservation, atomic output, result-size corruption guard, stale-lock recovery, and restore.
- Discovery tests cover both extension IDs, Flatpak roots, multiple versions, missing assets, and unsupported layouts.
- Build/package checks must pass with TypeScript strict mode and `vsce package` (or equivalent) without including test fixtures or user backups.
- A smoke test runs the patcher against copied local fixtures derived from the installed Cline assets; it must not write to the installed extensions during automated tests.

## Non-goals

- Rewriting or transliterating Persian/Arabic text.
- Changing Cline's model prompts, API messages, task history, or persisted conversation data.
- Patching the VS Code editor, terminal, or unrelated extensions.
- Guaranteeing selector compatibility with future Cline releases without a status warning; the injector must fail closed when safe anchors are absent.

