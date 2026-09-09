'use strict';

const RTL_RANGES = [
  [0x0590, 0x05ff], // Hebrew
  [0x0600, 0x06ff], // Arabic (including Persian letters)
  [0x0700, 0x074f], // Syriac
  [0x0750, 0x077f], // Arabic Supplement
  [0x0780, 0x07bf], // Thaana
  [0x07c0, 0x07ff], // NKo
  [0x0800, 0x08ff], // Samaritan and Arabic Extended
  [0xfb1d, 0xfdff], // Hebrew/Arabic presentation forms
  [0xfe70, 0xfeff], // Arabic presentation forms-B
];

const LTR_RANGES = [
  [0x0041, 0x005a], [0x0061, 0x007a], // Latin ASCII
  [0x00c0, 0x02af], // Latin/IPA/Greek/Cyrillic-adjacent letters
  [0x0370, 0x052f], // Greek and Cyrillic
  [0x1e00, 0x1eff], // Latin extended
  [0x2c60, 0x2c7f],
  [0xa720, 0xa7ff],
];

function inRanges(codePoint, ranges) {
  return ranges.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function classifyText(text, minimumRtlLetters = 1) {
  const value = String(text ?? '');
  let first = 'neutral';
  let rtlLetters = 0;
  let ltrLetters = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0);
    let current = 'neutral';
    if (inRanges(codePoint, RTL_RANGES)) current = 'rtl';
    else if (inRanges(codePoint, LTR_RANGES)) current = 'ltr';
    if (current === 'neutral') continue;
    if (first === 'neutral') first = current;
    if (current === 'rtl') rtlLetters += 1;
    else ltrLetters += 1;
  }

  const minimum = Math.max(1, Number(minimumRtlLetters) || 1);
  let resolved = first;
  if (rtlLetters === 0 && ltrLetters === 0) resolved = 'neutral';
  else if (rtlLetters >= minimum && rtlLetters > ltrLetters) resolved = 'rtl';
  else if (ltrLetters > rtlLetters) resolved = 'ltr';
  else if (rtlLetters < minimum) resolved = 'ltr';
  return { direction: resolved, rtlLetters, ltrLetters };
}

function hasRtlStrongCharacter(text) {
  return classifyText(text, 1).rtlLetters > 0;
}

// These are literal six-character strings emitted by some models, not actual controls.
const VISIBLE_BIDI_ESCAPE = /\\u(?:200[ef]|202[a-e]|206[6-9])/gi;

function stripVisibleBidiEscapes(text) {
  return String(text ?? '').replace(VISIBLE_BIDI_ESCAPE, '');
}

module.exports = { RTL_RANGES, LTR_RANGES, classifyText, hasRtlStrongCharacter, stripVisibleBidiEscapes };
