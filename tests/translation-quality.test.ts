import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

const FRONTEND_ROOT = path.join(process.cwd(), 'frontend', 'src', 'locales');
const BACKEND_ROOT = path.join(process.cwd(), 'backend-nestjs', 'src', 'i18n');
const LANGUAGES = ['en', 'hu', 'de', 'fr'];
const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

const flatten = (
  node: Record<string, unknown>,
  prefix = '',
  acc: Record<string, string> = {},
) => {
  Object.entries(node).forEach(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value as Record<string, unknown>, next, acc);
      return;
    }
    acc[next] = String(value ?? '');
  });
  return acc;
};

const getPlaceholders = (value: string) => {
  const set = new Set<string>();
  let match = PLACEHOLDER_REGEX.exec(value);
  while (match) {
    set.add(match[1]);
    match = PLACEHOLDER_REGEX.exec(value);
  }
  PLACEHOLDER_REGEX.lastIndex = 0;
  return set;
};

const validatePlaceholders = (baseDir: string) => {
  const enDir = path.join(baseDir, 'en');
  const files = fs.readdirSync(enDir).filter((file) => file.endsWith('.json'));

  files.forEach((fileName) => {
    const sourceFlat = flatten(
      JSON.parse(fs.readFileSync(path.join(enDir, fileName), 'utf8')),
    );

    LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
      const localizedFlat = flatten(
        JSON.parse(fs.readFileSync(path.join(baseDir, lang, fileName), 'utf8')),
      );

      Object.entries(sourceFlat).forEach(([key, value]) => {
        const expected = getPlaceholders(value);
        const actual = getPlaceholders(localizedFlat[key]);
        expect(actual).toEqual(expected);
      });
    });
  });
};

describe('translation quality checks', () => {
  test('frontend placeholders are consistent across languages', () => {
    validatePlaceholders(FRONTEND_ROOT);
  });

  test('backend placeholders are consistent across languages', () => {
    validatePlaceholders(BACKEND_ROOT);
  });
});
