# Changelog

## 0.1.5

- Updated the extension publisher to `wolf1999h` and aligned the VSIX manifest metadata.
- Fixed the packaged license (`LICENSE.txt`), content types, and marketplace links.

## 0.1.4

- Improved the cross-platform installation and troubleshooting guidance for VS Code, VSCodium and Flatpak users.
- Clarified mixed RTL/LTR text behavior and which code/tool areas intentionally remain LTR.

## 0.1.3

- Added smart RTL handling for submitted user prompts and answer buttons.
- Replaced the extension icon with the project `icon.png` artwork.
- Added bilingual Persian/English documentation and troubleshooting guidance.

## 0.1.2

- Improved mixed-direction detection using dominant strong-script counts.
- Fixed paragraphs beginning with English words such as `Tomorrow` inside Persian text.
- Added explicit `dir`/isolation for opposite-direction inline phrases.

## 0.1.1

- Fixed discovery of the installed Cline `next` and `legacy` webview builds.
- Fixed RTL classification for Plan and semantic prose nodes without message classes.

## 0.1.0

- Initial Cline/Roo Cline smart RTL support.
- Auto, Always RTL, Force LTR, status, and restore commands.
- Flatpak VSCodium discovery and safe atomic webview patching.
