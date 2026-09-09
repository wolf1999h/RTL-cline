# Cline RTL Smart Support

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-wolf1999h%2FRTL--cline-blue?logo=github)](https://github.com/wolf1999h/RTL-cline)

| زبان / Language | راهنما |
|---|---|
| فارسی | [راهنمای فارسی](#راهنمای-فارسی) |
| English | [English guide](#english-guide) |
| مجوز / License | [مجوز و گیت‌هاب / License & GitHub](#license) |

## راهنمای فارسی

### این افزونه چیست؟

افزونه‌ای برای زبان‌های راست‌به‌چپ (RTL) در چت Cline و Roo Cline در VS Code/VSCodium است. متن هر پیام را جداگانه بررسی می‌کند، جهت غالب را تشخیص می‌دهد و کلمات انگلیسی، لینک‌ها، عددها، کد و خروجی ابزار را خراب نمی‌کند.

### چطور کار می‌کند؟

افزونه فقط رابط webview کلین را با CSS و JavaScript patch می‌کند و متن prompt یا پاسخ را تغییر نمی‌دهد. برای هر حباب، تعداد نویسه‌های قوی RTL و LTR مقایسه می‌شود؛ بخش‌های مخالف با `dir` و isolation جدا می‌شوند. فایل اصلی قبل از patch پشتیبان‌گیری می‌شود، قفل و نوشتن اتمی دارد و با به‌روزرسانی Cline دوباره از فایل اصلی ساخته می‌شود.

### حالت‌ها

- **Auto (پیشنهادی):** جهت هر پیام، prompt و گزینهٔ پاسخ را هوشمند تشخیص می‌دهد.
- **Always RTL:** متن معمولی RTL؛ کد، ترمینال، diff، ابزار و فرمان‌ها LTR باقی می‌مانند.
- **Force LTR:** همهٔ متن‌ها LTR.
- **Deactivate:** patchها را از backup سالم بازمی‌گرداند.

### نصب و رفع باگ

از Command Palette دستور `Extensions: Install from VSIX...` را اجرا کنید، سپس پنجره را Reload کنید و `Cline RTL: Activate (Auto)` را بزنید. اگر پس از آپدیت Cline جهت‌ها قدیمی بود، همین دستور را دوباره اجرا یا Reload Window کنید. برای بازگردانی کامل `Cline RTL: Deactivate` را اجرا کنید. اگر مشکل باقی ماند، ابتدا Auto را امتحان کنید، کد و خروجی ابزار را LTR نگه دارید و گزارش شامل نسخهٔ Cline/VSCodium، حالت افزونه و تصویر مشکل ارسال کنید.

### لایسنس و سورس‌کد

این پروژه با لایسنس MIT روی گیت‌هاب منتشر شده و در دسترس است:  
🔗 [https://github.com/wolf1999h/RTL-cline](https://github.com/wolf1999h/RTL-cline)

## English guide

### What is it?

Smart right-to-left (RTL) support for right-to-left languages in Cline and Roo Cline chat webviews for VS Code/VSCodium. Each message, user prompt and answer option is classified independently, while English words, URLs, numbers, code and tool output remain readable.

### How does it work?

The extension patches only Cline’s generated webview CSS/JavaScript; it never rewrites your prompt or stored text. It compares strong RTL/LTR script counts per block, assigns an explicit direction, and isolates opposite-direction inline phrases. Pristine backups, locks, atomic writes and corruption guards make patching recoverable and safe.

### Modes

- **Auto (recommended):** Detects the dominant direction for every message, prompt and answer control.
- **Always RTL:** Prose is RTL; code, terminal, diffs, tools and commands stay LTR.
- **Force LTR:** Keeps the entire chat LTR.
- **Deactivate:** Restores the pristine webview assets from backup.

### Install and troubleshoot

Run `Extensions: Install from VSIX...`, reload the window, then run `Cline RTL: Activate (Auto)`. After a Cline update, run the activate command again or use Reload Window. To undo all changes, run `Cline RTL: Deactivate`. If a bug remains, try Auto first and report your Cline/VSCodium versions, extension mode and a screenshot; executable code and tool output are intentionally kept LTR.

### License and Repository

This project is open-source, licensed under the MIT License, and available on GitHub:  
🔗 [https://github.com/wolf1999h/RTL-cline](https://github.com/wolf1999h/RTL-cline)

## RTL support

This extension is designed for right-to-left (RTL) languages and mixed RTL/LTR text.

## <a id="license"></a>مجوز و سورس‌کد / License & Source Code

- **فارسی:** این پروژه با لایسنس MIT روی گیت‌هاب قرار دارد:  
  👉 [https://github.com/wolf1999h/RTL-cline](https://github.com/wolf1999h/RTL-cline)
- **English:** This project is open source and available under the MIT License on GitHub:  
  👉 [https://github.com/wolf1999h/RTL-cline](https://github.com/wolf1999h/RTL-cline)

---

ساخته شده توسط **گرگ خسته**  
Built by **Tired Wolf**

