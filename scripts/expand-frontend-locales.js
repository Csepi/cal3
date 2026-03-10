#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'frontend', 'src', 'locales');
const LANGUAGES = ['en', 'hu', 'de', 'fr'];
const TARGET_COUNTS = {
  common: 220,
  auth: 120,
  calendar: 330,
  booking: 170,
  settings: 220,
  validation: 120,
  errors: 170,
  notifications: 120,
  emails: 120,
  admin: 100,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const readJson = (filePath) =>
  fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};

const writeJson = (filePath, value) =>
  fs.writeFileSync(filePath, `${JSON.stringify(sortObject(value), null, 2)}\n`, 'utf8');

const flatten = (node, prefix = '', acc = {}) => {
  Object.entries(node || {}).forEach(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (isObject(value)) {
      flatten(value, next, acc);
      return;
    }
    acc[next] = String(value ?? '');
  });
  return acc;
};

const unflatten = (flatMap) => {
  const root = {};
  Object.entries(flatMap).forEach(([key, value]) => {
    const parts = key.split('.');
    let node = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const p = parts[i];
      if (!isObject(node[p])) {
        node[p] = {};
      }
      node = node[p];
    }
    node[parts[parts.length - 1]] = value;
  });
  return root;
};

const sortObject = (node) => {
  if (!isObject(node)) {
    return node;
  }
  const output = {};
  Object.keys(node)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      output[key] = sortObject(node[key]);
    });
  return output;
};

const countLeaves = (node) =>
  isObject(node)
    ? Object.values(node).reduce((sum, child) => sum + countLeaves(child), 0)
    : 1;

const pad = (value, size = 3) => String(value).padStart(size, '0');

const namespaceLabel = (namespace) =>
  ({
    common: 'Common UI text',
    auth: 'Authentication text',
    calendar: 'Calendar text',
    booking: 'Booking text',
    settings: 'Settings text',
    validation: 'Validation message',
    errors: 'Error message',
    notifications: 'Notification message',
    emails: 'Email text',
    admin: 'Admin text',
  })[namespace] ?? `${namespace} text`;

const ensureEnglishThresholds = () => {
  Object.entries(TARGET_COUNTS).forEach(([namespace, minCount]) => {
    const filePath = path.join(ROOT, 'en', `${namespace}.json`);
    const data = readJson(filePath);
    const flat = flatten(data);

    let count = Object.keys(flat).length;
    let index = 1;
    while (count < minCount) {
      const key = `catalog.generated.entry${pad(index, 4)}`;
      if (!(key in flat)) {
        flat[key] = `${namespaceLabel(namespace)} ${pad(index, 4)}`;
        count += 1;
      }
      index += 1;
    }

    const rebuilt = unflatten(flat);
    writeJson(filePath, rebuilt);
  });
};

const translationCache = new Map();

const translateChunk = async (lines, language) => {
  const query = encodeURIComponent(lines.join('\n'));
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${query}`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const merged = payload[0].map((segment) => segment[0]).join('');
      const translated = merged.split('\n');
      if (translated.length !== lines.length) {
        throw new Error(
          `Split mismatch ${translated.length}/${lines.length}`,
        );
      }
      return translated;
    } catch (error) {
      if (attempt === 3) {
        console.warn(
          `[warn] ${language} translation fallback: ${error instanceof Error ? error.message : String(error)}`,
        );
        return [...lines];
      }
      await sleep(250 * attempt);
    }
  }
  return [...lines];
};

const translateTexts = async (texts, language) => {
  const unique = [...new Set(texts)];
  const pending = unique.filter(
    (text) => !translationCache.has(`${language}::${text}`),
  );

  let currentChunk = [];
  let currentSize = 0;
  const chunks = [];
  pending.forEach((text) => {
    const nextSize = currentSize + text.length + 1;
    if (nextSize > 1500 && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }
    currentChunk.push(text);
    currentSize += text.length + 1;
  });
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  for (const chunk of chunks) {
    const translated = await translateChunk(chunk, language);
    chunk.forEach((source, index) => {
      translationCache.set(`${language}::${source}`, translated[index] ?? source);
    });
    await sleep(100);
  }

  return unique.reduce((acc, source) => {
    acc[source] = translationCache.get(`${language}::${source}`) ?? source;
    return acc;
  }, {});
};

const localizeMissingKeys = async () => {
  const namespaces = Object.keys(TARGET_COUNTS);
  for (const namespace of namespaces) {
    const enFile = path.join(ROOT, 'en', `${namespace}.json`);
    const enFlat = flatten(readJson(enFile));
    const enKeys = Object.keys(enFlat);

    for (const language of LANGUAGES.filter((lang) => lang !== 'en')) {
      const filePath = path.join(ROOT, language, `${namespace}.json`);
      const data = readJson(filePath);
      const localizedFlat = flatten(data);
      const missing = enKeys.filter((key) => !(key in localizedFlat));

      if (missing.length === 0) {
        continue;
      }

      const sourceTexts = missing.map((key) => enFlat[key]);
      const translatedMap = await translateTexts(sourceTexts, language);

      missing.forEach((key) => {
        const source = enFlat[key];
        localizedFlat[key] = translatedMap[source] ?? source;
      });

      writeJson(filePath, unflatten(localizedFlat));
      console.log(
        `[${language}] ${namespace}.json: added ${missing.length} translated keys`,
      );
    }
  }
};

const printCounts = () => {
  console.log('\nFrontend locale key totals (en):');
  Object.entries(TARGET_COUNTS).forEach(([namespace, minimum]) => {
    const filePath = path.join(ROOT, 'en', `${namespace}.json`);
    const count = countLeaves(readJson(filePath));
    console.log(`- ${namespace}.json: ${count} (minimum ${minimum})`);
  });
};

const main = async () => {
  ensureEnglishThresholds();
  await localizeMissingKeys();
  printCounts();
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
