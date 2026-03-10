import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC_ROOT = join(__dirname, '..', '..', 'src');

const EXCLUDED_PATH_PARTS = [
  `${join('database', 'migrations')}`,
  `${join('database', 'seed')}`,
  `${join('database', 'extract-schema')}`,
];

const SQL_TEMPLATE_PATTERN = /\.query\(\s*`[\s\S]*?\$\{[\s\S]*?`/g;
const USER_CONTROLLED_INTERPOLATION_PATTERN =
  /\$\{[^}]*\b(req|request|dto|body|params?|query|input|search|filter)\b[^}]*\}/i;

const collectTsFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }
    if (fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
};

const isExcluded = (filePath: string): boolean => {
  const normalized = filePath.replace(/\//g, '\\');
  return EXCLUDED_PATH_PARTS.some((part) => normalized.includes(part));
};

const main = (): void => {
  const files = collectTsFiles(SRC_ROOT).filter((filePath) => !isExcluded(filePath));
  const findings: Array<{ file: string; snippet: string }> = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    const matches = content.match(SQL_TEMPLATE_PATTERN);
    if (!matches || matches.length === 0) {
      continue;
    }

    for (const match of matches) {
      if (!USER_CONTROLLED_INTERPOLATION_PATTERN.test(match)) {
        continue;
      }

      findings.push({
        file: relative(SRC_ROOT, filePath),
        snippet: match.slice(0, 180).replace(/\s+/g, ' '),
      });
    }
  }

  if (findings.length === 0) {
    console.log('No user-controlled SQL template interpolation detected.');
    return;
  }

  console.error('Potential SQL injection risks detected:');
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.snippet}`);
  }
  process.exit(1);
};

main();

