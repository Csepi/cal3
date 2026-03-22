#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const REPO_ROOT = process.cwd();
const LOCALE_DIRS = [
  'frontend/src/locales/de',
  'frontend/src/locales/fr',
  'frontend/src/locales/hu',
  'backend-nestjs/src/i18n/de',
  'backend-nestjs/src/i18n/fr',
  'backend-nestjs/src/i18n/hu',
];

const mojibakeHint = /[ĂĹđÂ]/u;
const brokenWordPattern = /\p{L}\?\p{L}/u;
const placeholderPattern = /{{\s*[^}]+\s*}}/g;

const listJsonFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(dir, name));
};

const countMatches = (value, pattern) => (value.match(pattern) || []).length;

const corruptionScore = (value) =>
  countMatches(value, /[ĂĹđÂ]/g) * 5 +
  countMatches(value, /�/g) * 20 +
  countMatches(value, /\p{L}\?\p{L}/gu) * 15;

const decodeMojibakeCp1250 = (value) => {
  if (!mojibakeHint.test(value)) {
    return value;
  }

  try {
    const decoded = iconv.decode(iconv.encode(value, 'win1250'), 'utf8');
    return corruptionScore(decoded) < corruptionScore(value) ? decoded : value;
  } catch {
    return value;
  }
};

const traverseStrings = (node, pathParts, visitor) => {
  if (typeof node === 'string') {
    return visitor(node, pathParts);
  }

  if (Array.isArray(node)) {
    return node.map((item, index) => traverseStrings(item, [...pathParts, index], visitor));
  }

  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = traverseStrings(value, [...pathParts, key], visitor);
    }
    return out;
  }

  return node;
};

const getValueAtPath = (node, pathParts) => {
  let current = node;
  for (const part of pathParts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
};

const setValueAtPath = (node, pathParts, nextValue) => {
  let current = node;
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    current = current[pathParts[i]];
  }
  current[pathParts[pathParts.length - 1]] = nextValue;
};

const protectPlaceholders = (value) => {
  const placeholders = [];
  const protectedValue = value.replace(placeholderPattern, (match) => {
    const token = `__PH_${placeholders.length}__`;
    placeholders.push({ token, original: match });
    return token;
  });

  return { protectedValue, placeholders };
};

const restorePlaceholders = (value, placeholders) => {
  let output = value;
  for (const { token, original } of placeholders) {
    output = output.replace(new RegExp(token, 'g'), original);
  }
  return output;
};

const localeByPath = (filePath) => {
  if (/[\\/]de[\\/]/.test(filePath)) return 'de';
  if (/[\\/]fr[\\/]/.test(filePath)) return 'fr';
  if (/[\\/]hu[\\/]/.test(filePath)) return 'hu';
  return null;
};

const translateWithGoogle = async (text, targetLocale, cache) => {
  const cacheKey = `${targetLocale}::${text}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const { protectedValue, placeholders } = protectPlaceholders(text);
  const url =
    'https://translate.googleapis.com/translate_a/single' +
    `?client=gtx&sl=en&tl=${targetLocale}&dt=t&q=${encodeURIComponent(protectedValue)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Translation request failed: ${response.status}`);
  }

  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((part) => part?.[0] || '').join('')
    : text;

  const restored = restorePlaceholders(translated, placeholders);
  cache.set(cacheKey, restored);
  return restored;
};

const hasSupportedLocale = (filePath) => /[\\/](de|fr|hu)[\\/]/.test(filePath);
const englishCounterpartPath = (filePath) =>
  filePath.replace(/[\\/](de|fr|hu)[\\/]/, `${path.sep}en${path.sep}`);

const run = async () => {
  const files = LOCALE_DIRS.flatMap((dir) => listJsonFiles(path.join(REPO_ROOT, dir)));
  const translationCache = new Map();
  let updatedFiles = 0;
  let fixedStrings = 0;
  let translatedBrokenStrings = 0;

  for (const filePath of files) {
    const originalRaw = fs.readFileSync(filePath, 'utf8');
    let json;
    try {
      json = JSON.parse(originalRaw);
    } catch (error) {
      throw new Error(`Invalid JSON at ${filePath}: ${error.message}`);
    }

    const normalized = traverseStrings(json, [], (value) => {
      const fixed = decodeMojibakeCp1250(value);
      if (fixed !== value) {
        fixedStrings += 1;
      }
      return fixed;
    });

    if (hasSupportedLocale(filePath)) {
      const targetLocale = localeByPath(filePath);
      const enPath = englishCounterpartPath(filePath);
      if (targetLocale && fs.existsSync(enPath)) {
        const english = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        const pending = [];

        traverseStrings(normalized, [], (value, pathParts) => {
          if (brokenWordPattern.test(value)) {
            const source = getValueAtPath(english, pathParts);
            if (typeof source === 'string' && source.trim().length > 0) {
              pending.push({ pathParts, source });
            }
          }
          return value;
        });

        for (const item of pending) {
          try {
            const translated = await translateWithGoogle(
              item.source,
              targetLocale,
              translationCache,
            );
            setValueAtPath(normalized, item.pathParts, translated);
            translatedBrokenStrings += 1;
          } catch {
            // keep normalized string if translation fails
          }
        }
      }
    }

    const nextRaw = `${JSON.stringify(normalized, null, 2)}\n`;
    if (nextRaw !== originalRaw) {
      fs.writeFileSync(filePath, nextRaw, 'utf8');
      updatedFiles += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        scannedFiles: files.length,
        updatedFiles,
        fixedStrings,
        translatedBrokenStrings,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
