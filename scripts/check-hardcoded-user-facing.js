#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');
const BACKEND_SRC = path.join(ROOT, 'backend-nestjs', 'src');
const OUTPUT_DIR = path.join(ROOT, 'reports', 'i18n');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'hardcoded-user-facing.csv');

const FRONTEND_EXTS = new Set(['.tsx', '.jsx', '.ts', '.js']);
const BACKEND_EXTS = new Set(['.ts', '.js']);
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'coverage',
  'generated',
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

const normalize = (value) => value.replace(/\s+/g, ' ').trim();

const shouldInclude = (value) => {
  const normalized = normalize(value);
  if (normalized.length < 2) return false;
  if (!/[A-Za-z]/.test(normalized)) return false;
  if (/^https?:\/\//i.test(normalized)) return false;
  if (/^[a-z0-9\-:/.[\]%_#]+$/i.test(normalized) && normalized.includes('-')) {
    return false;
  }
  if (normalized.startsWith('common:') || normalized.startsWith('errors.auto.')) {
    return false;
  }
  return true;
};

const walk = (directory, extensions, files = []) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      walk(path.join(directory, entry.name), extensions, files);
      continue;
    }
    if (extensions.has(path.extname(entry.name))) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
};

const locationOf = (sourceFile, node) => {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return line + 1;
};

const findings = [];

const scanFrontend = () => {
  const files = walk(FRONTEND_SRC, FRONTEND_EXTS);
  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const extension = path.extname(filePath);
    const isJsxFile = extension === '.tsx' || extension === '.jsx';
    const scriptKind =
      extension === '.tsx'
        ? ts.ScriptKind.TSX
        : extension === '.jsx'
          ? ts.ScriptKind.JSX
          : extension === '.ts'
            ? ts.ScriptKind.TS
            : ts.ScriptKind.JS;
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    );

    const visit = (node) => {
      if (isJsxFile && ts.isJsxText(node)) {
        const value = node.getText(sourceFile);
        if (shouldInclude(value)) {
          findings.push({
            file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
            line: locationOf(sourceFile, node),
            kind: 'frontend.jsx-text',
            text: normalize(value),
          });
        }
      }

      if (
        isJsxFile &&
        ts.isJsxAttribute(node) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      ) {
        const name = node.name.getText(sourceFile);
        const value = node.initializer.text;
        if (USER_FACING_ATTRS.has(name) && shouldInclude(value)) {
          findings.push({
            file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
            line: locationOf(sourceFile, node.initializer),
            kind: `frontend.attr.${name}`,
            text: normalize(value),
          });
        }
      }

      if (ts.isCallExpression(node) && node.arguments.length > 0) {
        const callee = node.expression.getText(sourceFile).split('.').pop();
        if (callee && MESSAGE_CALL_NAMES.has(callee)) {
          node.arguments.forEach((arg) => {
            if (
              (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) &&
              shouldInclude(arg.text)
            ) {
              findings.push({
                file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
                line: locationOf(sourceFile, arg),
                kind: `frontend.call.${callee}`,
                text: normalize(arg.text),
              });
            }
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  });
};

const scanBackend = () => {
  const files = walk(BACKEND_SRC, BACKEND_EXTS);
  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    const visit = (node) => {
      if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text.endsWith('Exception') &&
        node.arguments &&
        node.arguments.length > 0
      ) {
        const first = node.arguments[0];
        if (
          (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) &&
          shouldInclude(first.text)
        ) {
          findings.push({
            file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
            line: locationOf(sourceFile, first),
            kind: 'backend.exception',
            text: normalize(first.text),
          });
        }
      }

      if (
        ts.isPropertyAssignment(node) &&
        (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
        (ts.isStringLiteral(node.initializer) ||
          ts.isNoSubstitutionTemplateLiteral(node.initializer))
      ) {
        const name = node.name.getText(sourceFile).replace(/['"]/g, '');
        if ((name === 'message' || name === 'error' || name === 'detail') && shouldInclude(node.initializer.text)) {
          findings.push({
            file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
            line: locationOf(sourceFile, node.initializer),
            kind: `backend.property.${name}`,
            text: normalize(node.initializer.text),
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  });
};

scanFrontend();
scanBackend();

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const csvRows = findings.map(
  (f) =>
    `"${f.file}",${f.line},"${f.kind}","${f.text.replace(/"/g, '""')}"`,
);
fs.writeFileSync(
  OUTPUT_FILE,
  `file,line,kind,text\n${csvRows.join('\n')}${csvRows.length ? '\n' : ''}`,
  'utf8',
);

if (findings.length > 0) {
  console.error(
    `Found ${findings.length} hardcoded user-facing strings. See ${OUTPUT_FILE}`,
  );
  process.exit(1);
}

console.log('No hardcoded user-facing strings detected.');
