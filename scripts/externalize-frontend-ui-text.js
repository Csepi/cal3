#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');
const COMMON_EN = path.join(FRONTEND_SRC, 'locales', 'en', 'common.json');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'coverage',
  'locales',
  'i18n',
]);

const USER_FACING_ATTRS = new Set([
  'title',
  'placeholder',
  'aria-label',
  'aria-description',
  'alt',
  'label',
  'helperText',
  'tooltip',
  'description',
  'emptyText',
  'confirmText',
  'cancelText',
]);

const MESSAGE_CALL_NAMES = new Set([
  'alert',
  'confirm',
  'prompt',
  'toast',
  'notify',
  'setError',
  'setSuccess',
  'setWarning',
  'setInfo',
]);

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
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
};

const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();

const shouldExternalize = (raw) => {
  const value = normalizeText(raw);
  if (value.length < 2) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (/^https?:\/\//i.test(value)) return false;
  if (/^[a-z0-9\-:/.[\]%_#]+$/i.test(value) && value.includes('-')) return false;
  if (value.startsWith('common:') || value.startsWith('auth:')) return false;
  return true;
};

const createKey = (text) => {
  const normalized = normalizeText(text);
  const hash = crypto
    .createHash('sha1')
    .update(normalized)
    .digest('hex')
    .slice(0, 12);
  return `k${hash}`;
};

const collectEdits = (sourceFile, textMap, isJsxFile) => {
  const edits = [];

  const addEdit = (start, end, replacement) => {
    edits.push({ start, end, replacement });
  };

  const visit = (node) => {
    if (isJsxFile && ts.isJsxText(node)) {
      const value = node.getText(sourceFile);
      if (shouldExternalize(value)) {
        const normalized = normalizeText(value);
        const key = createKey(normalized);
        textMap[key] = normalized;
        addEdit(
          node.getStart(sourceFile),
          node.getEnd(),
          `{tStatic('common:auto.frontend.${key}')}`,
        );
      }
    }

    if (isJsxFile && ts.isJsxAttribute(node)) {
      const attrName = node.name.getText(sourceFile);
      if (
        USER_FACING_ATTRS.has(attrName) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      ) {
        const value = node.initializer.text;
        if (shouldExternalize(value)) {
          const normalized = normalizeText(value);
          const key = createKey(normalized);
          textMap[key] = normalized;
          addEdit(
            node.initializer.getStart(sourceFile),
            node.initializer.getEnd(),
            `{tStatic('common:auto.frontend.${key}')}`,
          );
        }
      }
    }

    if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const callee = node.expression.getText(sourceFile).split('.').pop();
      if (callee && MESSAGE_CALL_NAMES.has(callee)) {
        node.arguments.forEach((arg) => {
          if (
            (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) &&
            shouldExternalize(arg.text)
          ) {
            const normalized = normalizeText(arg.text);
            const key = createKey(normalized);
            textMap[key] = normalized;
            addEdit(
              arg.getStart(sourceFile),
              arg.getEnd(),
              `tStatic('common:auto.frontend.${key}')`,
            );
          }
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return edits;
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

const ensureTStaticImport = (content, filePath) => {
  if (!content.includes('tStatic(')) {
    return content;
  }
  if (/import\s+\{\s*tStatic\s*\}\s+from\s+['"][^'"]+['"]/.test(content)) {
    return content;
  }

  const importTarget = path
    .relative(path.dirname(filePath), path.join(FRONTEND_SRC, 'i18n'))
    .replace(/\\/g, '/');
  const importPath = importTarget.startsWith('.') ? importTarget : `./${importTarget}`;
  const newImport = `import { tStatic } from '${importPath}';\n`;

  const importRegex = /^import[\s\S]*?;\s*$/gm;
  let lastMatch = null;
  for (;;) {
    const match = importRegex.exec(content);
    if (!match) break;
    lastMatch = match;
  }

  if (!lastMatch) {
    return `${newImport}${content}`;
  }

  const insertAt = lastMatch.index + lastMatch[0].length;
  return `${content.slice(0, insertAt)}\n${newImport}${content.slice(insertAt)}`;
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

const main = () => {
  const files = walk(FRONTEND_SRC);
  const textMap = {};
  let modifiedFiles = 0;

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx')
        ? ts.ScriptKind.TSX
        : filePath.endsWith('.jsx')
          ? ts.ScriptKind.JSX
          : filePath.endsWith('.ts')
            ? ts.ScriptKind.TS
            : ts.ScriptKind.JS,
    );

    const edits = collectEdits(
      sourceFile,
      textMap,
      filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
    );
    if (edits.length === 0) {
      return;
    }

    let next = applyEdits(content, edits);
    next = ensureTStaticImport(next, filePath);

    if (next !== content) {
      fs.writeFileSync(filePath, next, 'utf8');
      modifiedFiles += 1;
    }
  });

  const common = JSON.parse(fs.readFileSync(COMMON_EN, 'utf8'));
  Object.entries(textMap).forEach(([key, value]) => {
    setDeep(common, ['auto', 'frontend', key], value);
  });
  fs.writeFileSync(COMMON_EN, `${JSON.stringify(common, null, 2)}\n`, 'utf8');

  console.log(
    `Externalized ${Object.keys(textMap).length} frontend strings across ${modifiedFiles} files.`,
  );
};

main();
