#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const BACKEND_SRC = path.join(ROOT, 'backend-nestjs', 'src');
const ERROR_LOCALES = path.join(BACKEND_SRC, 'i18n');
const LANGUAGES = ['hu', 'de', 'fr'];
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'coverage',
  'generated',
  'i18n',
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const walk = (directory, files = []) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      walk(path.join(directory, entry.name), files);
      continue;
    }
    if (entry.name.endsWith('.ts')) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
};

const normalize = (value) => value.replace(/\s+/g, ' ').trim();

const shouldExternalize = (value) => {
  const normalized = normalize(value);
  if (normalized.length < 3) return false;
  if (!/[A-Za-z]/.test(normalized)) return false;
  if (/^https?:\/\//i.test(normalized)) return false;
  if (normalized.includes('@nestjs/')) return false;
  return true;
};

const makeKey = (value) => {
  const hash = crypto
    .createHash('sha1')
    .update(normalize(value))
    .digest('hex')
    .slice(0, 12);
  return `k${hash}`;
};

const applyEdits = (content, edits) => {
  if (edits.length === 0) return content;
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let next = content;
  sorted.forEach((edit) => {
    next = `${next.slice(0, edit.start)}${edit.replacement}${next.slice(edit.end)}`;
  });
  return next;
};

const ensureImport = (content, filePath) => {
  if (!content.includes('bStatic(')) {
    return content;
  }
  if (/import\s+\{\s*bStatic\s*\}\s+from\s+['"][^'"]+['"]/.test(content)) {
    return content;
  }

  const rel = path
    .relative(path.dirname(filePath), path.join(BACKEND_SRC, 'i18n', 'runtime'))
    .replace(/\\/g, '/');
  const importPath = rel.startsWith('.') ? rel : `./${rel}`;
  const statement = `import { bStatic } from '${importPath}';\n`;

  const importRegex = /^import[\s\S]*?;\s*$/gm;
  let last = null;
  for (;;) {
    const match = importRegex.exec(content);
    if (!match) break;
    last = match;
  }

  if (!last) {
    return `${statement}${content}`;
  }
  const index = last.index + last[0].length;
  return `${content.slice(0, index)}\n${statement}${content.slice(index)}`;
};

const setDeep = (target, pathParts, value) => {
  let cursor = target;
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    const part = pathParts[i];
    if (
      cursor[part] === null ||
      typeof cursor[part] !== 'object' ||
      Array.isArray(cursor[part])
    ) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[pathParts[pathParts.length - 1]] = value;
};

const flatten = (node, prefix = '', acc = {}) => {
  Object.entries(node || {}).forEach(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
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
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (
        cursor[parts[i]] === null ||
        typeof cursor[parts[i]] !== 'object' ||
        Array.isArray(cursor[parts[i]])
      ) {
        cursor[parts[i]] = {};
      }
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
  });
  return root;
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
      if (translated.length === lines.length) {
        return translated;
      }
      throw new Error(`Split mismatch ${translated.length}/${lines.length}`);
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

  const chunks = [];
  let current = [];
  let size = 0;
  pending.forEach((text) => {
    const projected = size + text.length + 1;
    if (projected > 1400 && current.length > 0) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(text);
    size += text.length + 1;
  });
  if (current.length > 0) {
    chunks.push(current);
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

const main = async () => {
  const files = walk(BACKEND_SRC);
  const textMap = {};
  let modified = 0;

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const edits = [];

    const visit = (node) => {
      if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text.endsWith('Exception') &&
        node.arguments &&
        node.arguments.length > 0
      ) {
        const first = node.arguments[0];
        if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) {
          const raw = first.text;
          if (shouldExternalize(raw)) {
            const key = makeKey(raw);
            textMap[key] = normalize(raw);
            edits.push({
              start: first.getStart(sourceFile),
              end: first.getEnd(),
              replacement: `bStatic('errors.auto.backend.${key}')`,
            });
          }
        }
      }

      if (
        ts.isPropertyAssignment(node) &&
        (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
        (ts.isStringLiteral(node.initializer) ||
          ts.isNoSubstitutionTemplateLiteral(node.initializer))
      ) {
        const name = node.name.getText(sourceFile).replace(/['"]/g, '');
        if (name === 'message' || name === 'error' || name === 'detail') {
          const raw = node.initializer.text;
          if (shouldExternalize(raw)) {
            const key = makeKey(raw);
            textMap[key] = normalize(raw);
            edits.push({
              start: node.initializer.getStart(sourceFile),
              end: node.initializer.getEnd(),
              replacement: `bStatic('errors.auto.backend.${key}')`,
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    if (edits.length === 0) {
      return;
    }

    let next = applyEdits(content, edits);
    next = ensureImport(next, filePath);
    if (next !== content) {
      fs.writeFileSync(filePath, next, 'utf8');
      modified += 1;
    }
  });

  const enErrorsPath = path.join(ERROR_LOCALES, 'en', 'errors.json');
  const enErrors = JSON.parse(fs.readFileSync(enErrorsPath, 'utf8'));
  Object.entries(textMap).forEach(([key, value]) => {
    setDeep(enErrors, ['auto', 'backend', key], value);
  });
  fs.writeFileSync(enErrorsPath, `${JSON.stringify(enErrors, null, 2)}\n`, 'utf8');

  const enFlat = flatten(enErrors);
  const autoEntries = Object.entries(enFlat).filter(([key]) =>
    key.startsWith('auto.backend.'),
  );

  for (const language of LANGUAGES) {
    const targetPath = path.join(ERROR_LOCALES, language, 'errors.json');
    const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const targetFlat = flatten(targetData);

    const missing = autoEntries.filter(([key]) => !(key in targetFlat));
    if (missing.length === 0) {
      continue;
    }

    const sourceTexts = missing.map(([, value]) => value);
    const translated = await translateTexts(sourceTexts, language);
    missing.forEach(([key, source]) => {
      targetFlat[key] = translated[source] ?? source;
    });

    fs.writeFileSync(
      targetPath,
      `${JSON.stringify(unflatten(targetFlat), null, 2)}\n`,
      'utf8',
    );
    console.log(`[${language}] added ${missing.length} backend auto error translations`);
  }

  console.log(
    `Externalized ${Object.keys(textMap).length} backend exception messages across ${modified} files.`,
  );
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
