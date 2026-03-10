import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

const LANGUAGES = ['en', 'hu', 'de', 'fr'];
const FRONTEND_ROOT = path.join(process.cwd(), 'frontend', 'src', 'locales');
const BACKEND_ROOT = path.join(process.cwd(), 'backend-nestjs', 'src', 'i18n');
const MIN_FRONTEND_COUNTS: Record<string, number> = {
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

const flatten = (node: Record<string, unknown>, prefix = '', acc: Record<string, string> = {}) => {
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

const validateDirectory = (baseDir: string) => {
  const sourceDir = path.join(baseDir, 'en');
  const sourceFiles = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.json'));

  sourceFiles.forEach((fileName) => {
    const source = JSON.parse(fs.readFileSync(path.join(sourceDir, fileName), 'utf8')) as Record<string, unknown>;
    const sourceFlat = flatten(source);

    LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
      const localizedPath = path.join(baseDir, lang, fileName);
      expect(fs.existsSync(localizedPath)).toBe(true);
      const localized = JSON.parse(fs.readFileSync(localizedPath, 'utf8')) as Record<string, unknown>;
      const localizedFlat = flatten(localized);

      Object.keys(sourceFlat).forEach((key) => {
        expect(Object.prototype.hasOwnProperty.call(localizedFlat, key)).toBe(true);
        expect(localizedFlat[key]).not.toBe('');
      });
    });
  });
};

describe('i18n coverage', () => {
  test('frontend source locale meets minimum key counts', () => {
    Object.entries(MIN_FRONTEND_COUNTS).forEach(([namespace, minCount]) => {
      const filePath = path.join(FRONTEND_ROOT, 'en', `${namespace}.json`);
      expect(fs.existsSync(filePath)).toBe(true);
      const fileData = JSON.parse(
        fs.readFileSync(filePath, 'utf8'),
      ) as Record<string, unknown>;
      const leafCount = Object.keys(flatten(fileData)).length;
      expect(leafCount).toBeGreaterThanOrEqual(minCount);
    });
  });

  test('frontend locale files have complete key parity', () => {
    validateDirectory(FRONTEND_ROOT);
  });

  test('backend locale files have complete key parity', () => {
    validateDirectory(BACKEND_ROOT);
  });
});
