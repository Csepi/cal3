#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGETS = [
  path.join(ROOT, 'frontend', 'src'),
  path.join(ROOT, 'backend-nestjs', 'src'),
];
const OUTPUT_DIR = path.join(ROOT, 'reports', 'i18n');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'string-inventory.csv');

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'coverage',
  '__tests__',
  'generated',
]);

const STRING_LITERAL_REGEX = /(['"`])((?:\\.|(?!\1).){4,})\1/g;

const shouldInclude = (value) => {
  const trimmed = value.trim();
  if (trimmed.length < 4) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  if (/^https?:\/\//.test(trimmed)) return false;
  if (/^[a-zA-Z0-9_.:/-]+$/.test(trimmed)) return false;
  if (/^\{.*\}$/.test(trimmed)) return false;
  return true;
};

const walk = (directory, files = []) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
};

const inventory = [];

for (const target of TARGETS) {
  if (!fs.existsSync(target)) {
    continue;
  }

  const files = walk(target);
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, index) => {
      const lineNumber = index + 1;
      let match = STRING_LITERAL_REGEX.exec(lineText);
      while (match) {
        const value = match[2];
        if (shouldInclude(value)) {
          inventory.push({
            file: path.relative(ROOT, file).replace(/\\/g, '/'),
            line: lineNumber,
            text: value.replace(/"/g, '""'),
          });
        }
        match = STRING_LITERAL_REGEX.exec(lineText);
      }
      STRING_LITERAL_REGEX.lastIndex = 0;
    });
  });
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const header = 'file,line,text';
const rows = inventory.map((item) => `"${item.file}",${item.line},"${item.text}"`);
fs.writeFileSync(OUTPUT_FILE, `${header}\n${rows.join('\n')}\n`);

console.log(`Extracted ${inventory.length} potential strings to ${OUTPUT_FILE}`);

