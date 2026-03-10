const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');

const required = [
  'title',
  'description',
  'category',
  'audience',
  'difficulty',
  'last_updated',
  'version',
  'tags',
];

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

function walk(dir) {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walk(p));
    else if (p.toLowerCase().endsWith('.md')) out.push(p);
  }
  return out;
}

const files = walk(DOCS).filter((abs) => canonicalRoots.has(path.relative(DOCS, abs).split(path.sep)[0]));
const issues = [];

for (const abs of files) {
  const rel = path.relative(DOCS, abs).replace(/\\/g, '/');
  const text = fs.readFileSync(abs, 'utf8');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) {
    issues.push(`${rel}: missing frontmatter`);
    continue;
  }
  for (const field of required) {
    const re = new RegExp(`^${field}\\s*:`, 'm');
    if (!re.test(frontmatter[1])) issues.push(`${rel}: missing \`${field}\``);
  }
}

if (issues.length) {
  console.error('Metadata check failed:');
  for (const i of issues) console.error(`- ${i}`);
  process.exit(1);
}

console.log(`Metadata check passed across ${files.length} canonical pages.`);
