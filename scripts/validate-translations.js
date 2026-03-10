#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const FRONTEND_LOCALES = path.join(
  __dirname,
  '..',
  'frontend',
  'src',
  'locales',
);
const BACKEND_LOCALES = path.join(__dirname, '..', 'backend-nestjs', 'src', 'i18n');

const LANGUAGES = ['en', 'hu', 'de', 'fr'];
const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const FRONTEND_MIN_COUNTS = {
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

const flatten = (node, prefix = '', acc = {}) => {
  Object.entries(node || {}).forEach(([key, value]) => {
    const currentKey = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      flatten(value, currentKey, acc);
      return;
    }
    acc[currentKey] = String(value ?? '');
  });
  return acc;
};

const extractPlaceholders = (input) => {
  const list = new Set();
  const value = String(input ?? '');
  let match = PLACEHOLDER_REGEX.exec(value);
  while (match) {
    list.add(match[1]);
    match = PLACEHOLDER_REGEX.exec(value);
  }
  PLACEHOLDER_REGEX.lastIndex = 0;
  return list;
};

const validateDirectory = (baseDir, label) => {
  const issues = [];
  const englishDir = path.join(baseDir, 'en');
  if (!fs.existsSync(englishDir)) {
    issues.push(`[${label}] Missing source locale directory: ${englishDir}`);
    return issues;
  }

  const englishFiles = fs
    .readdirSync(englishDir)
    .filter((file) => file.endsWith('.json'));

  if (label === 'frontend') {
    Object.entries(FRONTEND_MIN_COUNTS).forEach(([namespace, minCount]) => {
      const filePath = path.join(englishDir, `${namespace}.json`);
      if (!fs.existsSync(filePath)) {
        issues.push(
          `[frontend] Missing required namespace file: ${namespace}.json`,
        );
        return;
      }
      const count = Object.keys(flatten(JSON.parse(fs.readFileSync(filePath, 'utf8')))).length;
      if (count < minCount) {
        issues.push(
          `[frontend] ${namespace}.json has ${count} keys, minimum required is ${minCount}`,
        );
      }
    });
  }

  englishFiles.forEach((fileName) => {
    const enPath = path.join(englishDir, fileName);
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const enFlat = flatten(enData);

    LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
      const localizedPath = path.join(baseDir, lang, fileName);
      if (!fs.existsSync(localizedPath)) {
        issues.push(`[${label}] Missing file: ${localizedPath}`);
        return;
      }

      const localizedData = JSON.parse(fs.readFileSync(localizedPath, 'utf8'));
      const localizedFlat = flatten(localizedData);

      Object.keys(enFlat).forEach((key) => {
        if (!(key in localizedFlat)) {
          issues.push(
            `[${label}] Missing key in ${lang}/${fileName}: ${key}`,
          );
          return;
        }

        if (!String(localizedFlat[key]).trim()) {
          issues.push(
            `[${label}] Empty value in ${lang}/${fileName}: ${key}`,
          );
        }

        const expected = extractPlaceholders(enFlat[key]);
        const actual = extractPlaceholders(localizedFlat[key]);
        if (expected.size !== actual.size) {
          issues.push(
            `[${label}] Placeholder mismatch in ${lang}/${fileName}: ${key}`,
          );
          return;
        }
        for (const token of expected) {
          if (!actual.has(token)) {
            issues.push(
              `[${label}] Missing placeholder \"${token}\" in ${lang}/${fileName}: ${key}`,
            );
          }
        }
      });
    });
  });

  return issues;
};

const allIssues = [
  ...validateDirectory(FRONTEND_LOCALES, 'frontend'),
  ...validateDirectory(BACKEND_LOCALES, 'backend'),
];

if (allIssues.length > 0) {
  console.error('Translation validation failed:');
  allIssues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('Translation validation passed.');
