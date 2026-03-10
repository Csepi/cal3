#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'reports', 'i18n');

const FRONTEND_EN = path.join(ROOT, 'frontend', 'src', 'locales', 'en');
const BACKEND_EN = path.join(ROOT, 'backend-nestjs', 'src', 'i18n', 'en');

const flatten = (node, prefix = '', acc = {}) => {
  Object.entries(node || {}).forEach(([key, value]) => {
    const current = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      flatten(value, current, acc);
      return;
    }
    acc[current] = String(value ?? '');
  });
  return acc;
};

const exportNamespaceDirectory = (sourceDir, outputFile) => {
  const rows = [];
  const files = fs
    .readdirSync(sourceDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  files.forEach((file) => {
    const namespace = path.basename(file, '.json');
    const data = JSON.parse(
      fs.readFileSync(path.join(sourceDir, file), 'utf8'),
    );
    const flat = flatten(data);
    Object.entries(flat).forEach(([key, value]) => {
      rows.push({
        namespace,
        key,
        value: value.replace(/"/g, '""'),
      });
    });
  });

  const csv = [
    'namespace,key,english',
    ...rows.map((row) => `"${row.namespace}","${row.key}","${row.value}"`),
  ].join('\n');

  fs.writeFileSync(outputFile, `${csv}\n`);
  return rows.length;
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const frontendRows = exportNamespaceDirectory(
  FRONTEND_EN,
  path.join(OUTPUT_DIR, 'frontend-en-keys.csv'),
);
const backendRows = exportNamespaceDirectory(
  BACKEND_EN,
  path.join(OUTPUT_DIR, 'backend-en-keys.csv'),
);

console.log(
  `Exported ${frontendRows} frontend keys and ${backendRows} backend keys to ${OUTPUT_DIR}`,
);

