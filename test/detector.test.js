const test = require('node:test');
const assert = require('node:assert/strict');
const detector = require('../src/rtl/detector');

test('classifies Persian prose as RTL', () => {
  assert.equal(detector.classifyText('این یک پیام فارسی است').direction, 'rtl');
});

test('classifies English prose as LTR', () => {
  assert.equal(detector.classifyText('Build the Cline extension').direction, 'ltr');
});

test('keeps punctuation and numbers neutral', () => {
  assert.equal(detector.classifyText('123 - …').direction, 'neutral');
});

test('mixed Persian and English follows the dominant strong script', () => {
  assert.equal(detector.classifyText('تنظیمات Cline v1 را باز کن').direction, 'rtl');
  assert.equal(detector.classifyText('Cline را برای پروژه تنظیم کن').direction, 'rtl');
  assert.equal(detector.classifyText('Tomorrow قرار بود اولین قراردادشان را با ناشر بزرگ ببندند').direction, 'rtl');
  assert.equal(detector.classifyText('Please باز کن the project settings').direction, 'ltr');
});

test('detects Arabic, Hebrew and Persian extended characters', () => {
  assert.equal(detector.hasRtlStrongCharacter('مرحبا'), true);
  assert.equal(detector.hasRtlStrongCharacter('שלום'), true);
  assert.equal(detector.hasRtlStrongCharacter('ی'), true);
});

test('strips visible BiDi escape literals without touching real controls', () => {
  assert.equal(detector.stripVisibleBidiEscapes(String.raw`backend\u200Fservice\u202E`), 'backendservice');
  assert.equal(detector.stripVisibleBidiEscapes(`a\u200Fb`), 'a\u200Fb');
});
