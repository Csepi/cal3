const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');

function walk(dir) {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walk(p));
    else if (p.toLowerCase().endsWith('.md')) out.push(p);
  }
  return out;
}

const canonicalRoots = new Set([
  'GETTING-STARTED',
  'USER-GUIDE',
  'ADMIN-GUIDE',
  'DEVELOPER-GUIDE',
  'DEPLOYMENT-GUIDE',
  'TROUBLESHOOTING',
  'REFERENCE',
  'FAQ',
  'BEST-PRACTICES',
  'LEGAL',
  'RESOURCES',
]);

const rootFiles = new Set([
  'index.md',
  'README.md',
  'STYLE_GUIDE.md',
  'CONTRIBUTING_TO_DOCS.md',
  'AUDIT_REPORT.md',
  'MIGRATION_PLAN.md',
  'DEPRECATED_CONTENT.md',
  'QUALITY_ASSURANCE.md',
  'METRICS_KPIS.md',
  'SEARCH_OPTIMIZATION.md',
]);

const files = walk(DOCS).filter((abs) => {
  const rel = path.relative(DOCS, abs).replace(/\\/g, '/');
  const top = rel.split('/')[0];
  return canonicalRoots.has(top) || rootFiles.has(rel);
});
const issues = [];

for (const abs of files) {
  const rel = path.relative(DOCS, abs).replace(/\\/g, '/');
  const text = fs.readFileSync(abs, 'utf8');
  const regex = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('#')) continue;
    if (raw.startsWith('mailto:') || raw.startsWith('tel:')) continue;

    const cleaned = raw.split('#')[0].split('?')[0];
    if (!cleaned) continue;

    const target = path.resolve(path.dirname(abs), cleaned);
    const targetMd = target.endsWith('.md') ? target : `${target}.md`;
    const exists =
      fs.existsSync(target) ||
      fs.existsSync(targetMd) ||
      fs.existsSync(path.join(target, 'index.md'));

    if (!exists) {
      issues.push(`${rel} -> ${raw}`);
    }
  }
}

if (issues.length) {
  console.error('Broken markdown links found:');
  for (const i of issues) console.error(`- ${i}`);
  process.exit(1);
}

console.log(`Link check passed across ${files.length} markdown files.`);
